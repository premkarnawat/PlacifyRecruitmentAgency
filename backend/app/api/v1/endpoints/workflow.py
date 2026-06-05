"""
VERIQO Workflow API — Phase 1.5
Feature 1: End-to-End Hiring Workflow Engine
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
import structlog

from app.core.database import get_supabase
from app.core.security import get_current_user
from app.services.workflow_service import workflow_service, VALID_TRANSITIONS

log = structlog.get_logger(__name__)
router = APIRouter(prefix="/workflow", tags=["workflow"])


# ── Schemas ───────────────────────────────────────────────────

class CreateWorkflowRequest(BaseModel):
    application_id: str
    job_id: str
    candidate_id: str
    company_id: str


class TransitionRequest(BaseModel):
    to_state: str
    notes: Optional[str] = None
    metadata: Optional[dict] = None


# ── Endpoints ─────────────────────────────────────────────────

@router.post("")
async def create_or_get_workflow(
    body: CreateWorkflowRequest,
    supabase=Depends(get_supabase),
    current_user=Depends(get_current_user),
):
    """Create workflow for an application (idempotent — safe to call multiple times)."""
    workflow = await workflow_service.get_or_create(
        supabase,
        application_id=body.application_id,
        job_id=body.job_id,
        candidate_id=body.candidate_id,
        company_id=body.company_id,
    )
    return {"workflow": workflow, "valid_transitions": VALID_TRANSITIONS.get(workflow["state"], [])}


@router.get("/{workflow_id}")
async def get_workflow(
    workflow_id: str,
    supabase=Depends(get_supabase),
    current_user=Depends(get_current_user),
):
    """Get a workflow by ID with valid next transitions."""
    resp = await supabase.table("hiring_workflows").select(
        "*, candidate_profiles(full_name, avatar_url, trust_score, ats_score), "
        "jobs(title, skills_required), applications(ats_score, status)"
    ).eq("id", workflow_id).maybe_single().execute()

    if not resp.data:
        raise HTTPException(status_code=404, detail="Workflow not found")

    workflow = resp.data
    return {
        "workflow": workflow,
        "valid_transitions": VALID_TRANSITIONS.get(workflow["state"], []),
    }


@router.post("/{workflow_id}/transition")
async def transition_workflow(
    workflow_id: str,
    body: TransitionRequest,
    supabase=Depends(get_supabase),
    current_user=Depends(get_current_user),
):
    """Move a workflow to the next state."""
    try:
        updated = await workflow_service.transition(
            supabase,
            workflow_id=workflow_id,
            to_state=body.to_state,
            actor_id=current_user["id"],
            actor_role=current_user.get("role", "employer"),
            notes=body.notes,
            metadata=body.metadata,
        )
        return {
            "workflow": updated,
            "valid_transitions": VALID_TRANSITIONS.get(updated["state"], []),
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/{workflow_id}/timeline")
async def get_workflow_timeline(
    workflow_id: str,
    supabase=Depends(get_supabase),
    current_user=Depends(get_current_user),
):
    """Full immutable audit timeline for a workflow."""
    timeline = await workflow_service.get_timeline(supabase, workflow_id)
    return {"workflow_id": workflow_id, "timeline": timeline, "count": len(timeline)}


@router.get("/company/{company_id}")
async def get_company_workflows(
    company_id: str,
    state: Optional[str] = Query(None),
    job_id: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    supabase=Depends(get_supabase),
    current_user=Depends(get_current_user),
):
    """List all hiring workflows for a company."""
    workflows = await workflow_service.get_company_workflows(
        supabase,
        company_id=company_id,
        state=state,
        job_id=job_id,
        limit=limit,
    )
    return {"workflows": workflows, "count": len(workflows)}


@router.get("/states/map")
async def get_state_map():
    """Return the full state machine map (useful for UI rendering)."""
    states = list(VALID_TRANSITIONS.keys())
    return {
        "states": states,
        "transitions": VALID_TRANSITIONS,
        "terminal_states": [s for s, t in VALID_TRANSITIONS.items() if not t],
    }
