"""
VERIQO Work Samples API — Phase 1.5
Feature 6: Work Sample Engine
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import structlog

from app.core.database import get_supabase
from app.core.security import get_current_user
from app.services.ai_service_additions import evaluate_work_sample

log = structlog.get_logger(__name__)
router = APIRouter(prefix="/work-samples", tags=["work-samples"])


class CreateChallengeRequest(BaseModel):
    candidate_id: str
    role_type: str
    task_description: str
    time_limit_hours: int = 48
    evaluation_rubric: Optional[dict] = None
    application_id: Optional[str] = None


class SubmitChallengeRequest(BaseModel):
    submission_url: Optional[str] = None
    submission_content: Optional[str] = None
    submission_files: Optional[list] = None


@router.post("/create")
async def create_challenge(
    body: CreateChallengeRequest,
    supabase=Depends(get_supabase),
    current_user=Depends(get_current_user),
):
    """Create a work sample challenge for a candidate."""
    from datetime import datetime, timedelta

    due_at = (datetime.utcnow() + timedelta(hours=body.time_limit_hours)).isoformat()

    created = await supabase.table("work_sample_challenges").insert({
        "candidate_id": body.candidate_id,
        "role_type": body.role_type,
        "task_description": body.task_description,
        "time_limit_hours": body.time_limit_hours,
        "evaluation_rubric": body.evaluation_rubric or {},
        "application_id": body.application_id,
        "due_at": due_at,
        "status": "pending",
    }).execute()

    return {"challenge": created.data[0]}


@router.post("/{challenge_id}/submit")
async def submit_challenge(
    challenge_id: str,
    body: SubmitChallengeRequest,
    supabase=Depends(get_supabase),
    current_user=Depends(get_current_user),
):
    """Candidate submits their work sample."""
    from datetime import datetime

    updated = await supabase.table("work_sample_challenges").update({
        "submission_url": body.submission_url,
        "submission_content": body.submission_content,
        "submission_files": body.submission_files or [],
        "submitted_at": datetime.utcnow().isoformat(),
        "status": "in_progress",
    }).eq("id", challenge_id).execute()

    return {"challenge": updated.data[0]}


@router.post("/{challenge_id}/evaluate")
async def ai_evaluate(
    challenge_id: str,
    supabase=Depends(get_supabase),
    current_user=Depends(get_current_user),
):
    """Run AI evaluation on a submitted work sample."""
    challenge_resp = await supabase.table("work_sample_challenges").select("*").eq(
        "id", challenge_id
    ).single().execute()
    c = challenge_resp.data

    if not c.get("submission_content") and not c.get("submission_url"):
        raise HTTPException(status_code=400, detail="No submission found")

    evaluation = await evaluate_work_sample(
        task_description=c["task_description"],
        submission_content=c.get("submission_content") or f"URL submission: {c.get('submission_url')}",
        role_type=c["role_type"],
        evaluation_rubric=c.get("evaluation_rubric"),
    )

    updated = await supabase.table("work_sample_challenges").update({
        "ai_score": evaluation.get("score"),
        "ai_feedback": evaluation,
        "status": "completed",
    }).eq("id", challenge_id).execute()

    # Update candidate's work_sample_score
    await supabase.table("candidate_profiles").update({
        "work_sample_score": evaluation.get("score"),
    }).eq("id", c["candidate_id"]).execute()

    return {"challenge": updated.data[0], "evaluation": evaluation}
