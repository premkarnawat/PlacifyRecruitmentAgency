"""
VERIQO Pipeline API — Phase 1.5
Feature 2: Candidate Pipeline Management
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
import structlog

from app.core.database import get_supabase
from app.core.security import get_current_user

log = structlog.get_logger(__name__)
router = APIRouter(prefix="/pipeline", tags=["pipeline"])

PIPELINE_STATUSES = [
    "new", "ats_matched", "interested", "verification_pending",
    "verified", "interview_scheduled", "offer", "joined", "rejected",
]


class UpdateStatusRequest(BaseModel):
    pipeline_status: str
    reason: Optional[str] = None
    position: Optional[int] = None


class BulkActionRequest(BaseModel):
    candidate_ids: List[str]
    action: str  # "update_status", "star", "tag", "reject"
    pipeline_status: Optional[str] = None
    tags: Optional[List[str]] = None
    reason: Optional[str] = None


class AddToPipelineRequest(BaseModel):
    application_id: str
    job_id: str
    candidate_id: str
    company_id: str
    ats_score: Optional[float] = None
    trust_score: Optional[float] = None


@router.get("/{job_id}")
async def get_pipeline_board(
    job_id: str,
    supabase=Depends(get_supabase),
    current_user=Depends(get_current_user),
):
    """
    Get full pipeline board for a job, grouped by status columns.
    Returns a Kanban-ready structure.
    """
    resp = await supabase.table("pipeline_candidates").select(
        "*, candidate_profiles(id, full_name, avatar_url, headline, skills, "
        "trust_score, ats_score, verification_status, location, years_of_experience)"
    ).eq("job_id", job_id).order("position").execute()

    candidates = resp.data or []

    # Group by pipeline_status
    board: dict = {status: [] for status in PIPELINE_STATUSES}
    for c in candidates:
        status = c.get("pipeline_status", "new")
        if status in board:
            board[status].append(c)

    # Column metadata
    columns = [
        {"id": s, "label": s.replace("_", " ").title(), "candidates": board[s]}
        for s in PIPELINE_STATUSES
    ]

    return {
        "job_id": job_id,
        "columns": columns,
        "total": len(candidates),
    }


@router.post("/add")
async def add_to_pipeline(
    body: AddToPipelineRequest,
    supabase=Depends(get_supabase),
    current_user=Depends(get_current_user),
):
    """Add a candidate to a job's pipeline."""
    existing = await supabase.table("pipeline_candidates").select("id").eq(
        "application_id", body.application_id
    ).maybe_single().execute()

    if existing.data:
        return {"pipeline_candidate": existing.data, "created": False}

    created = await supabase.table("pipeline_candidates").insert({
        "application_id": body.application_id,
        "job_id": body.job_id,
        "candidate_id": body.candidate_id,
        "company_id": body.company_id,
        "ats_score": body.ats_score,
        "trust_score": body.trust_score,
        "pipeline_status": "new",
    }).execute()

    return {"pipeline_candidate": created.data[0], "created": True}


@router.patch("/candidate/{pipeline_id}/status")
async def update_candidate_status(
    pipeline_id: str,
    body: UpdateStatusRequest,
    supabase=Depends(get_supabase),
    current_user=Depends(get_current_user),
):
    """Update a candidate's pipeline status (single card move)."""
    if body.pipeline_status not in PIPELINE_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status: {body.pipeline_status}")

    # Fetch current
    current_resp = await supabase.table("pipeline_candidates").select(
        "pipeline_status"
    ).eq("id", pipeline_id).single().execute()
    old_status = current_resp.data["pipeline_status"]

    update_data = {"pipeline_status": body.pipeline_status}
    if body.position is not None:
        update_data["position"] = body.position

    updated = await supabase.table("pipeline_candidates").update(
        update_data
    ).eq("id", pipeline_id).execute()

    # Log status change
    await supabase.table("pipeline_status_history").insert({
        "pipeline_id": pipeline_id,
        "from_status": old_status,
        "to_status": body.pipeline_status,
        "changed_by": current_user["id"],
        "reason": body.reason,
    }).execute()

    return {"updated": updated.data[0]}


@router.post("/bulk-action")
async def bulk_pipeline_action(
    body: BulkActionRequest,
    supabase=Depends(get_supabase),
    current_user=Depends(get_current_user),
):
    """Perform bulk actions on multiple pipeline candidates."""
    if not body.candidate_ids:
        raise HTTPException(status_code=400, detail="No candidate IDs provided")

    results = {"updated": 0, "failed": 0}

    if body.action == "update_status":
        if not body.pipeline_status:
            raise HTTPException(status_code=400, detail="pipeline_status required for update_status action")
        await supabase.table("pipeline_candidates").update({
            "pipeline_status": body.pipeline_status,
        }).in_("id", body.candidate_ids).execute()
        results["updated"] = len(body.candidate_ids)

    elif body.action == "star":
        await supabase.table("pipeline_candidates").update({
            "starred": True,
        }).in_("id", body.candidate_ids).execute()
        results["updated"] = len(body.candidate_ids)

    elif body.action == "reject":
        await supabase.table("pipeline_candidates").update({
            "pipeline_status": "rejected",
        }).in_("id", body.candidate_ids).execute()
        results["updated"] = len(body.candidate_ids)

    elif body.action == "tag":
        if body.tags:
            for cid in body.candidate_ids:
                # Append tags (avoid duplicates via PostgreSQL array functions)
                await supabase.rpc("append_pipeline_tags", {
                    "p_pipeline_id": cid,
                    "p_tags": body.tags,
                }).execute()
            results["updated"] = len(body.candidate_ids)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {body.action}")

    return results


@router.get("/candidate/{pipeline_id}/history")
async def get_candidate_pipeline_history(
    pipeline_id: str,
    supabase=Depends(get_supabase),
    current_user=Depends(get_current_user),
):
    """Get status history for a pipeline candidate."""
    resp = await supabase.table("pipeline_status_history").select("*").eq(
        "pipeline_id", pipeline_id
    ).order("created_at", desc=False).execute()
    return {"history": resp.data or []}
