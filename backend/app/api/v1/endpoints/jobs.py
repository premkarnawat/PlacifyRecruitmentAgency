from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
from datetime import datetime, timezone
import structlog

from app.core.security import get_current_user, require_employer
from app.core.database import get_supabase
from app.core.cache import cache
from app.schemas.schemas import JobCreate, JobResponse
from app.services.ats_service import compute_ats_score_for_candidate
from app.services.ai_service import generate_jd_insights

router = APIRouter(prefix="/jobs", tags=["Jobs"])
log    = structlog.get_logger(__name__)


@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(body: JobCreate, current_user: dict = Depends(require_employer)):
    """Create a new job posting."""
    db  = get_supabase()
    now = datetime.now(timezone.utc).isoformat()

    # Get employer's company
    comp = db.table("companies").select("id").eq("user_id", current_user["user_id"]).single().execute()
    if not comp.data:
        raise HTTPException(status_code=400, detail="Company profile not found. Please complete company setup.")

    data = {
        **body.model_dump(),
        "company_id":       comp.data["id"],
        "status":           "active",
        "applicant_count":  0,
        "shortlisted_count": 0,
        "created_at":       now,
        "updated_at":       now,
    }

    resp = db.table("jobs").insert(data).execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Failed to create job")

    job = resp.data[0]

    # Async: generate JD insights (non-blocking)
    try:
        insights = await generate_jd_insights(body.description, body.skills_required)
        if insights:
            db.table("job_insights").upsert({"job_id": job["id"], **insights}).execute()
    except Exception as e:
        log.warning("jobs.insights_error", error=str(e))

    await cache.delete_pattern(f"jobs:employer:{comp.data['id']}:*")
    log.info("job.created", job_id=job["id"], title=body.title)
    return job


@router.get("/")
async def list_jobs(
    page:     int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    status:   Optional[str] = None,
    search:   Optional[str] = None,
    current_user: dict = Depends(require_employer),
):
    """List jobs for the authenticated employer."""
    db   = get_supabase()
    comp = db.table("companies").select("id").eq("user_id", current_user["user_id"]).single().execute()
    if not comp.data:
        return {"data": [], "count": 0, "page": page, "per_page": per_page, "total_pages": 0}

    query = db.table("jobs").select("*", count="exact").eq("company_id", comp.data["id"])
    if status:
        query = query.eq("status", status)
    if search:
        query = query.ilike("title", f"%{search}%")

    offset = (page - 1) * per_page
    resp   = query.range(offset, offset + per_page - 1).order("created_at", desc=True).execute()

    return {
        "data":        resp.data or [],
        "count":       resp.count or 0,
        "page":        page,
        "per_page":    per_page,
        "total_pages": -(-(resp.count or 0) // per_page),
    }


@router.get("/{job_id}")
async def get_job(job_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single job by ID."""
    db   = get_supabase()
    resp = db.table("jobs").select("*, companies(name,logo_url)").eq("id", job_id).single().execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Job not found")
    return resp.data


@router.patch("/{job_id}")
async def update_job(
    job_id: str,
    body:   JobCreate,
    current_user: dict = Depends(require_employer),
):
    """Update a job posting."""
    db  = get_supabase()
    now = datetime.now(timezone.utc).isoformat()

    resp = db.table("jobs").update({
        **body.model_dump(exclude_none=True),
        "updated_at": now,
    }).eq("id", job_id).execute()

    if not resp.data:
        raise HTTPException(status_code=404, detail="Job not found")
    return resp.data[0]


@router.patch("/{job_id}/status")
async def update_job_status(
    job_id: str,
    new_status: str,
    current_user: dict = Depends(require_employer),
):
    """Pause, activate, or close a job."""
    if new_status not in ("active", "paused", "closed"):
        raise HTTPException(status_code=400, detail="Invalid status")

    db   = get_supabase()
    resp = db.table("jobs").update({
        "status":     new_status,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", job_id).execute()

    if not resp.data:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"message": f"Job status updated to {new_status}", "job": resp.data[0]}


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(job_id: str, current_user: dict = Depends(require_employer)):
    """Delete a job posting."""
    db = get_supabase()
    db.table("jobs").delete().eq("id", job_id).execute()


@router.post("/{job_id}/match")
async def match_job_to_candidates(
    job_id: str,
    top_k:  int = Query(default=10, ge=1, le=50),
    current_user: dict = Depends(require_employer),
):
    """Run ATS matching for a job against the candidate pool."""
    from app.services.ats_service import match_candidates_to_job

    db   = get_supabase()
    job  = db.table("jobs").select("*").eq("id", job_id).single().execute()
    if not job.data:
        raise HTTPException(status_code=404, detail="Job not found")

    # Fetch verified candidates
    candidates = db.table("candidate_profiles").select("id, full_name, skills, years_of_experience").eq(
        "verification_status", "verified"
    ).execute()

    results = await match_candidates_to_job(
        job_description=job.data["description"],
        job_skills=job.data["skills_required"],
        top_k=top_k,
        candidate_pool=candidates.data or [],
    )

    return {
        "job_id":  job_id,
        "results": [r.model_dump() for r in results],
        "total":   len(results),
    }


@router.get("/{job_id}/insights")
async def get_job_insights(job_id: str, current_user: dict = Depends(require_employer)):
    """Get AI insights for a job posting."""
    db   = get_supabase()
    resp = db.table("job_insights").select("*").eq("job_id", job_id).single().execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Insights not yet generated")
    return resp.data
