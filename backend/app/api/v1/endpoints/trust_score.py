"""VERIQO Trust Score API — Phase 1.5"""
from fastapi import APIRouter, Depends
from app.core.database import get_supabase
from app.core.security import get_current_user
from app.services.trust_score_service import trust_score_service, reliability_service
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/trust-score", tags=["trust-score"])


class ReliabilityEventRequest(BaseModel):
    event_type: str
    application_id: Optional[str] = None
    notes: Optional[str] = None


@router.get("/{candidate_id}")
async def get_trust_score(
    candidate_id: str,
    supabase=Depends(get_supabase),
    current_user=Depends(get_current_user),
):
    result = await trust_score_service.calculate_and_store(
        supabase, candidate_id, trigger_event="api_request"
    )
    return result


@router.get("/{candidate_id}/history")
async def get_trust_history(
    candidate_id: str,
    supabase=Depends(get_supabase),
    current_user=Depends(get_current_user),
):
    history = await trust_score_service.get_history(supabase, candidate_id)
    return {"candidate_id": candidate_id, "history": history}


@router.get("/{candidate_id}/reliability")
async def get_reliability(
    candidate_id: str,
    supabase=Depends(get_supabase),
    current_user=Depends(get_current_user),
):
    return await reliability_service.calculate(supabase, candidate_id)


@router.post("/{candidate_id}/reliability/event")
async def record_reliability_event(
    candidate_id: str,
    body: ReliabilityEventRequest,
    supabase=Depends(get_supabase),
    current_user=Depends(get_current_user),
):
    await reliability_service.record_event(
        supabase,
        candidate_id=candidate_id,
        event_type=body.event_type,
        application_id=body.application_id,
        notes=body.notes,
        created_by=current_user["id"],
    )
    return {"recorded": True, "event_type": body.event_type}
