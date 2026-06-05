"""
VERIQO Candidate Interest API — Phase 1.5
Feature 4: Candidate Interest Confirmation Module
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import structlog

from app.core.database import get_supabase
from app.core.security import get_current_user

log = structlog.get_logger(__name__)
router = APIRouter(prefix="/interest", tags=["interest"])


class InterestSubmission(BaseModel):
    interested: bool
    current_salary: Optional[int] = None
    expected_salary: Optional[int] = None
    notice_period_days: Optional[int] = None
    open_to_relocation: Optional[bool] = None
    has_other_offers: bool = False
    other_offers_details: Optional[str] = None
    available_for_interview: Optional[str] = None  # date string


@router.post("/{application_id}")
async def submit_interest(
    application_id: str,
    body: InterestSubmission,
    supabase=Depends(get_supabase),
    current_user=Depends(get_current_user),
):
    """Candidate submits interest confirmation for an application."""
    # Verify application belongs to this candidate
    app_resp = await supabase.table("applications").select(
        "id, candidate_id, job_id, status"
    ).eq("id", application_id).single().execute()

    app = app_resp.data
    candidate_resp = await supabase.table("candidate_profiles").select("id").eq(
        "user_id", current_user["id"]
    ).single().execute()

    if app["candidate_id"] != candidate_resp.data["id"]:
        raise HTTPException(status_code=403, detail="Not authorised for this application")

    # Upsert interest confirmation
    confirmation = await supabase.table("interest_confirmations").upsert({
        "application_id": application_id,
        "candidate_user_id": current_user["id"],
        "interested": body.interested,
        "current_salary": body.current_salary,
        "expected_salary": body.expected_salary,
        "notice_period_days": body.notice_period_days,
        "open_to_relocation": body.open_to_relocation,
        "has_other_offers": body.has_other_offers,
        "other_offers_details": body.other_offers_details,
    }, on_conflict="application_id,candidate_user_id").execute()

    # Update application and candidate profile
    await supabase.table("applications").update({
        "interest_confirmed": body.interested,
        "current_salary": body.current_salary,
        "expected_salary": body.expected_salary,
        "notice_period_days": body.notice_period_days,
        "open_to_relocation": body.open_to_relocation,
        "status": "interest_confirmed" if body.interested else "rejected",
    }).eq("id", application_id).execute()

    return {"confirmation": confirmation.data[0], "interested": body.interested}


@router.get("/{application_id}")
async def get_interest(
    application_id: str,
    supabase=Depends(get_supabase),
    current_user=Depends(get_current_user),
):
    """Get interest confirmation for an application."""
    resp = await supabase.table("interest_confirmations").select("*").eq(
        "application_id", application_id
    ).maybe_single().execute()
    return {"confirmation": resp.data}
