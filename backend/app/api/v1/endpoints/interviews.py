"""
VERIQO Interviews API — Phase 1.5
Feature 16: AI Interview Question Generator + Schedule Management
"""
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import structlog

from app.core.database import get_supabase
from app.core.security import get_current_user
from app.services.ai_service_additions import generate_interview_questions

log = structlog.get_logger(__name__)
router = APIRouter(prefix="/interviews", tags=["interviews"])


class ScheduleInterviewRequest(BaseModel):
    workflow_id: str
    application_id: str
    scheduled_at: str          # ISO datetime string
    duration_mins: int = 60
    format: str = "video"       # video | phone | onsite
    meeting_url: Optional[str] = None
    interviewer_ids: Optional[List[str]] = None
    notes: Optional[str] = None


class UpdateInterviewRequest(BaseModel):
    scheduled_at: Optional[str] = None
    duration_mins: Optional[int] = None
    format: Optional[str] = None
    meeting_url: Optional[str] = None
    notes: Optional[str] = None


@router.post("/schedule")
async def schedule_interview(
    body: ScheduleInterviewRequest,
    supabase=Depends(get_supabase),
    current_user=Depends(get_current_user),
):
    """Schedule an interview and store in interview_schedules table."""
    created = await supabase.table("interview_schedules").insert({
        "workflow_id": body.workflow_id,
        "application_id": body.application_id,
        "scheduled_at": body.scheduled_at,
        "duration_mins": body.duration_mins,
        "format": body.format,
        "meeting_url": body.meeting_url,
        "interviewer_ids": body.interviewer_ids or [],
        "notes": body.notes,
    }).execute()

    # Transition workflow to interview_scheduled
    from app.services.workflow_service import workflow_service
    try:
        await workflow_service.transition(
            supabase,
            workflow_id=body.workflow_id,
            to_state="interview_scheduled",
            actor_id=current_user["id"],
            actor_role="employer",
            notes=f"Interview scheduled for {body.scheduled_at}",
        )
    except ValueError:
        pass  # Workflow may already be in this state

    schedule = created.data[0]

    # Send reminder email to candidate
    app_resp = await supabase.table("applications").select(
        "candidate_id, jobs(title, companies(name))"
    ).eq("id", body.application_id).single().execute()
    app = app_resp.data

    candidate_resp = await supabase.table("candidate_profiles").select(
        "full_name, email"
    ).eq("id", app["candidate_id"]).single().execute()
    candidate = candidate_resp.data

    from app.services.email_service import email_service
    await email_service.send_interview_reminder(
        to_email=candidate["email"],
        name=candidate["full_name"],
        job_title=app["jobs"]["title"],
        company_name=app["jobs"]["companies"]["name"],
        interview_time=body.scheduled_at,
        meeting_url=body.meeting_url,
    )

    return {"schedule": schedule}


@router.get("/{application_id}/schedule")
async def get_interview_schedule(
    application_id: str,
    supabase=Depends(get_supabase),
    current_user=Depends(get_current_user),
):
    """Get interview schedule for an application."""
    resp = await supabase.table("interview_schedules").select("*").eq(
        "application_id", application_id
    ).order("scheduled_at", desc=True).execute()
    return {"schedules": resp.data or []}


@router.patch("/{schedule_id}")
async def update_interview(
    schedule_id: str,
    body: UpdateInterviewRequest,
    supabase=Depends(get_supabase),
    current_user=Depends(get_current_user),
):
    """Update an existing interview schedule."""
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    updated = await supabase.table("interview_schedules").update(
        update_data
    ).eq("id", schedule_id).execute()
    return {"schedule": updated.data[0]}


@router.get("/{application_id}/questions")
async def get_interview_questions(
    application_id: str,
    supabase=Depends(get_supabase),
    current_user=Depends(get_current_user),
):
    """
    Generate AI-powered interview questions tailored to the candidate
    and the job description.
    Feature 16: AI Interview Question Generator
    """
    # Fetch application with candidate + job context
    app_resp = await supabase.table("applications").select(
        "candidate_id, job_id"
    ).eq("id", application_id).single().execute()
    app = app_resp.data

    candidate_resp = await supabase.table("candidate_profiles").select(
        "id, full_name, skills, years_of_experience, summary, trust_score, ats_score"
    ).eq("id", app["candidate_id"]).single().execute()
    candidate = candidate_resp.data

    job_resp = await supabase.table("jobs").select(
        "title, description, skills_required"
    ).eq("id", app["job_id"]).single().execute()
    job = job_resp.data

    questions = await generate_interview_questions(
        candidate_data=candidate,
        job_description=job["description"],
        job_title=job["title"],
    )

    return {
        "application_id": application_id,
        "candidate_name": candidate["full_name"],
        "job_title": job["title"],
        "questions": questions,
        "total_count": sum(len(v) for v in questions.values()),
    }


@router.post("/{application_id}/complete")
async def mark_interview_complete(
    application_id: str,
    workflow_id: str,
    supabase=Depends(get_supabase),
    current_user=Depends(get_current_user),
):
    """Mark interview as completed and transition workflow."""
    from app.services.workflow_service import workflow_service
    from app.services.trust_score_service import reliability_service

    # Get candidate_id
    app_resp = await supabase.table("applications").select("candidate_id").eq(
        "id", application_id
    ).single().execute()
    candidate_id = app_resp.data["candidate_id"]

    # Record reliability event: interview attended
    await reliability_service.record_event(
        supabase,
        candidate_id=candidate_id,
        event_type="interview_attended",
        application_id=application_id,
        created_by=current_user["id"],
    )

    # Transition workflow
    updated = await workflow_service.transition(
        supabase,
        workflow_id=workflow_id,
        to_state="interview_completed",
        actor_id=current_user["id"],
        actor_role="employer",
    )

    return {"workflow": updated, "reliability_event": "interview_attended"}
