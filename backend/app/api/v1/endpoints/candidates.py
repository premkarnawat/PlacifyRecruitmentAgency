from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from typing import Optional, List
import uuid
from datetime import datetime, timezone
import structlog

from app.core.security import get_current_user, require_employer
from app.core.database import get_supabase
from app.core.cache import cache
from app.schemas.schemas import (
    CandidateProfileCreate, CandidateProfileUpdate,
    CandidateProfileResponse, PaginationParams
)
from app.services.ai_service import detect_fraud
from app.services.passport_service import get_passport

router = APIRouter(prefix="/candidates", tags=["Candidates"])
log    = structlog.get_logger(__name__)


@router.get("/me", response_model=CandidateProfileResponse)
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    """Get the authenticated candidate's profile."""
    cache_key = f"candidate:profile:{current_user['user_id']}"
    cached = await cache.get(cache_key)
    if cached:
        return cached

    db   = get_supabase()
    resp = db.table("candidate_profiles").select("*").eq("user_id", current_user["user_id"]).single().execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Profile not found. Please complete onboarding.")

    await cache.set(cache_key, resp.data, ttl=300)
    return resp.data


@router.post("/me", response_model=CandidateProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_my_profile(
    body: CandidateProfileCreate,
    current_user: dict = Depends(get_current_user),
):
    """Create or update the authenticated candidate's profile."""
    db  = get_supabase()
    now = datetime.now(timezone.utc).isoformat()

    data = {
        **body.model_dump(),
        "user_id":    current_user["user_id"],
        "email":      current_user["email"],
        "created_at": now,
        "updated_at": now,
    }

    resp = db.table("candidate_profiles").upsert(data, on_conflict="user_id").execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Failed to create profile")

    # Invalidate cache
    await cache.delete(f"candidate:profile:{current_user['user_id']}")
    return resp.data[0]


@router.patch("/me", response_model=CandidateProfileResponse)
async def update_my_profile(
    body: CandidateProfileUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Partially update candidate profile."""
    db   = get_supabase()
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    data["updated_at"] = datetime.now(timezone.utc).isoformat()

    resp = db.table("candidate_profiles").update(data).eq("user_id", current_user["user_id"]).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    await cache.delete(f"candidate:profile:{current_user['user_id']}")
    return resp.data[0]


@router.get("/me/passport")
async def get_my_passport(current_user: dict = Depends(get_current_user)):
    """Get the candidate's Passport."""
    db   = get_supabase()
    resp = db.table("candidate_profiles").select("id").eq("user_id", current_user["user_id"]).single().execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    passport = await get_passport(resp.data["id"])
    if not passport:
        raise HTTPException(status_code=404, detail="Passport not yet generated. Complete verification first.")
    return passport


@router.post("/me/resume")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload a resume PDF."""
    if file.content_type not in ("application/pdf", "application/msword",
                                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are accepted")

    if file.size and file.size > 5 * 1024 * 1024:  # 5MB limit
        raise HTTPException(status_code=400, detail="File size must not exceed 5MB")

    db      = get_supabase()
    content = await file.read()
    path    = f"resumes/{current_user['user_id']}/{file.filename}"

    storage_resp = db.storage.from_("candidate-documents").upload(path, content, {"content-type": file.content_type})
    public_url   = db.storage.from_("candidate-documents").get_public_url(path)

    # Update profile with resume URL
    db.table("candidate_profiles").update({
        "resume_url": public_url,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("user_id", current_user["user_id"]).execute()

    return {"resume_url": public_url, "message": "Resume uploaded successfully"}


# ── Employer-facing endpoints ─────────────────────────────────

@router.get("/", dependencies=[Depends(require_employer)])
async def list_candidates(
    page:    int = Query(default=1,  ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    verified_only: bool = False,
    risk_filter:   Optional[str] = None,
    search:        Optional[str] = None,
):
    """List candidates for employers (verified shortlist)."""
    db    = get_supabase()
    query = db.table("candidate_profiles").select("*", count="exact")

    if verified_only:
        query = query.eq("verification_status", "verified")
    if risk_filter in ("low", "medium", "high"):
        query = query.eq("fraud_risk", risk_filter)
    if search:
        query = query.ilike("full_name", f"%{search}%")

    offset = (page - 1) * per_page
    resp   = query.range(offset, offset + per_page - 1).order("trust_score", desc=True).execute()

    return {
        "data":        resp.data or [],
        "count":       resp.count or 0,
        "page":        page,
        "per_page":    per_page,
        "total_pages": -(-( resp.count or 0) // per_page),
    }


@router.get("/{candidate_id}", dependencies=[Depends(require_employer)])
async def get_candidate(candidate_id: str):
    """Get a single candidate profile (employer view)."""
    db   = get_supabase()
    resp = db.table("candidate_profiles").select("*").eq("id", candidate_id).single().execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return resp.data


@router.get("/{candidate_id}/passport", dependencies=[Depends(require_employer)])
async def get_candidate_passport(candidate_id: str):
    """Get a candidate's passport (employer view)."""
    passport = await get_passport(candidate_id)
    if not passport:
        raise HTTPException(status_code=404, detail="Passport not available")
    return passport


@router.post("/{candidate_id}/fraud-check", dependencies=[Depends(require_employer)])
async def run_fraud_check(candidate_id: str):
    """Trigger fraud detection for a specific candidate."""
    db   = get_supabase()
    resp = db.table("candidate_profiles").select("*").eq("id", candidate_id).single().execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Candidate not found")

    result = await detect_fraud(resp.data)
    log.info("fraud_check.complete", candidate_id=candidate_id, risk=result.get("fraud_risk"))
    return result
