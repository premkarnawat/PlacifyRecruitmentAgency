from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
import structlog

from app.core.security import get_current_user, require_employer
from app.core.database import get_supabase
from app.schemas.schemas import InterestConfirmationCreate, VerificationStageUpdate
from app.services.ai_service import evaluate_portfolio, evaluate_work_sample, detect_fraud
from app.services.passport_service import generate_passport
from app.services.email_service import send_verification_complete

router = APIRouter(prefix="/verification", tags=["Verification"])
log    = structlog.get_logger(__name__)


@router.get("/stages/me")
async def get_my_verification_stages(current_user: dict = Depends(get_current_user)):
    """Get verification pipeline status for the authenticated candidate."""
    db   = get_supabase()
    prof = db.table("candidate_profiles").select("id").eq("user_id", current_user["user_id"]).single().execute()
    if not prof.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    stages = db.table("verification_stages").select("*").eq(
        "candidate_id", prof.data["id"]
    ).order("created_at").execute()

    return stages.data or []


@router.post("/portfolio/evaluate")
async def evaluate_my_portfolio(current_user: dict = Depends(get_current_user)):
    """Trigger portfolio evaluation for the authenticated candidate."""
    db   = get_supabase()
    prof = db.table("candidate_profiles").select("*").eq(
        "user_id", current_user["user_id"]
    ).single().execute()

    if not prof.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    candidate = prof.data
    result = await evaluate_portfolio(
        candidate_name=candidate.get("full_name", ""),
        github_url=candidate.get("github_url"),
        portfolio_url=candidate.get("portfolio_url"),
        projects=[],  # TODO: fetch from portfolio table
        skills=candidate.get("skills", []),
    )

    now = datetime.now(timezone.utc).isoformat()

    # Upsert stage record
    db.table("verification_stages").upsert({
        "candidate_id": candidate["id"],
        "stage":        "portfolio",
        "status":       "completed",
        "score":        result.get("portfolio_score", 0),
        "feedback":     result.get("summary", ""),
        "completed_at": now,
        "updated_at":   now,
    }, on_conflict="candidate_id,stage").execute()

    # Update profile score
    db.table("candidate_profiles").update({
        "portfolio_score": result.get("portfolio_score"),
        "updated_at":      now,
    }).eq("id", candidate["id"]).execute()

    return result


@router.post("/work-sample/submit")
async def submit_work_sample(
    body: dict,
    current_user: dict = Depends(get_current_user),
):
    """Submit and evaluate a work sample."""
    db   = get_supabase()
    prof = db.table("candidate_profiles").select("*").eq(
        "user_id", current_user["user_id"]
    ).single().execute()

    if not prof.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    candidate = prof.data
    result = await evaluate_work_sample(
        role=body.get("role", "Software Engineer"),
        task_description=body.get("task_description", ""),
        submission_content=body.get("submission", ""),
        skills_required=candidate.get("skills", []),
    )

    now = datetime.now(timezone.utc).isoformat()

    db.table("verification_stages").upsert({
        "candidate_id": candidate["id"],
        "stage":        "work_sample",
        "status":       "completed",
        "score":        result.get("work_sample_score", 0),
        "feedback":     result.get("summary", ""),
        "completed_at": now,
        "updated_at":   now,
    }, on_conflict="candidate_id,stage").execute()

    db.table("candidate_profiles").update({
        "work_sample_score": result.get("work_sample_score"),
        "updated_at":        now,
    }).eq("id", candidate["id"]).execute()

    return result


@router.post("/interest-confirmation")
async def confirm_interest(
    body: InterestConfirmationCreate,
    current_user: dict = Depends(get_current_user),
):
    """Candidate confirms or declines interest in a job."""
    db  = get_supabase()
    now = datetime.now(timezone.utc).isoformat()

    data = {
        **body.model_dump(),
        "candidate_user_id": current_user["user_id"],
        "confirmed_at":      now,
        "created_at":        now,
    }

    resp = db.table("interest_confirmations").upsert(
        data, on_conflict="application_id,candidate_user_id"
    ).execute()

    if body.interested:
        # Update application status
        db.table("applications").update({
            "status":             "interest_confirmed",
            "interest_confirmed": True,
            "current_salary":     body.current_salary,
            "expected_salary":    body.expected_salary,
            "notice_period_days": body.notice_period_days,
            "open_to_relocation": body.open_to_relocation,
            "has_other_offers":   body.has_other_offers,
            "updated_at":         now,
        }).eq("id", body.application_id).execute()
    else:
        db.table("applications").update({
            "status":     "withdrawn",
            "updated_at": now,
        }).eq("id", body.application_id).execute()

    return {"message": "Interest confirmation recorded", "interested": body.interested}


@router.post("/complete/{candidate_id}")
async def complete_verification(
    candidate_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Finalize the verification pipeline — generate passport.
    Called after all stages are complete.
    """
    db   = get_supabase()
    prof = db.table("candidate_profiles").select("*").eq("id", candidate_id).single().execute()
    if not prof.data:
        raise HTTPException(status_code=404, detail="Candidate not found")

    candidate = prof.data

    # Fetch all stage scores
    stages = db.table("verification_stages").select("stage,score").eq(
        "candidate_id", candidate_id
    ).eq("status", "completed").execute()

    scores = {}
    for stage in (stages.data or []):
        key_map = {
            "portfolio":    "portfolio_score",
            "work_sample":  "work_sample_score",
            "ai_evaluation":"technical_score",
            "expert_review": "communication_score",
            "reliability":  "reliability_score",
        }
        if stage["stage"] in key_map and stage.get("score"):
            scores[key_map[stage["stage"]]] = float(stage["score"])

    # Add ATS score if exists
    if candidate.get("ats_score"):
        scores["ats_score"] = float(candidate["ats_score"])

    # Run fraud detection
    fraud_result = await detect_fraud(candidate)
    fraud_score  = float(fraud_result.get("fraud_score", 20))

    # Generate passport
    passport = await generate_passport(
        candidate_id=candidate_id,
        scores=scores,
        fraud_score=fraud_score,
    )

    # Send email notification
    if candidate.get("email"):
        await send_verification_complete(
            to=candidate["email"],
            name=candidate.get("full_name", ""),
            passport_id=passport["passport_id"],
        )

    log.info("verification.complete", candidate_id=candidate_id, passport_id=passport["passport_id"])
    return passport
