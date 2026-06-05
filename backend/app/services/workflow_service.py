"""
VERIQO Workflow Service — Phase 1.5
=====================================
End-to-end hiring workflow engine.

States: job_created → agency_review → ats_matching → candidate_interest_check
        → verification_pending → verification_complete → company_review
        → interview_scheduled → interview_completed → offer_released
        → offer_accepted → joined → invoice_generated
"""
import uuid
import structlog
from typing import Optional, Dict, Any, List
from datetime import datetime
from supabase import AsyncClient

from app.services.email_service import email_service

log = structlog.get_logger(__name__)

# Valid state machine transitions (mirrors database workflow_transitions table)
VALID_TRANSITIONS: Dict[str, List[str]] = {
    "job_created":               ["agency_review"],
    "agency_review":             ["ats_matching", "job_created"],
    "ats_matching":              ["candidate_interest_check"],
    "candidate_interest_check":  ["verification_pending", "ats_matching"],
    "verification_pending":      ["verification_complete"],
    "verification_complete":     ["company_review"],
    "company_review":            ["interview_scheduled", "ats_matching"],
    "interview_scheduled":       ["interview_completed"],
    "interview_completed":       ["offer_released", "ats_matching"],
    "offer_released":            ["offer_accepted", "ats_matching"],
    "offer_accepted":            ["joined"],
    "joined":                    ["invoice_generated"],
    "invoice_generated":         [],
}

# Notification triggers on state entry
STATE_NOTIFICATIONS: Dict[str, Dict[str, str]] = {
    "candidate_interest_check": {
        "title": "Interest Check Required",
        "body": "Please confirm your interest in a job opportunity.",
        "type": "interest_request",
    },
    "verification_pending": {
        "title": "Verification Started",
        "body": "Your profile verification has begun.",
        "type": "verification_started",
    },
    "interview_scheduled": {
        "title": "Interview Scheduled",
        "body": "Your interview has been scheduled. Check your email for details.",
        "type": "interview_scheduled",
    },
    "offer_released": {
        "title": "🎉 You Have an Offer!",
        "body": "A job offer has been released for you. Please review and respond.",
        "type": "offer_released",
    },
    "joined": {
        "title": "Welcome aboard!",
        "body": "You have been marked as joined. Congratulations!",
        "type": "candidate_joined",
    },
}


class WorkflowService:
    async def get_or_create(
        self,
        supabase: AsyncClient,
        application_id: str,
        job_id: str,
        candidate_id: str,
        company_id: str,
    ) -> Dict[str, Any]:
        """Get existing workflow or create one for a new application."""
        resp = await supabase.table("hiring_workflows").select("*").eq(
            "application_id", application_id
        ).maybe_single().execute()

        if resp.data:
            return resp.data

        new_workflow = {
            "id": str(uuid.uuid4()),
            "application_id": application_id,
            "job_id": job_id,
            "candidate_id": candidate_id,
            "company_id": company_id,
            "state": "job_created",
        }
        created = await supabase.table("hiring_workflows").insert(new_workflow).execute()
        workflow = created.data[0]

        # Log initial state to timeline
        await self._log_transition(
            supabase,
            workflow_id=workflow["id"],
            from_state=None,
            to_state="job_created",
            actor_role="system",
        )
        log.info("workflow.created", workflow_id=workflow["id"], application_id=application_id)
        return workflow

    async def transition(
        self,
        supabase: AsyncClient,
        workflow_id: str,
        to_state: str,
        actor_id: Optional[str] = None,
        actor_role: str = "employer",
        notes: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Transition a workflow to a new state.
        Validates the transition, logs it, fires notifications.
        """
        # Fetch current workflow
        resp = await supabase.table("hiring_workflows").select("*").eq(
            "id", workflow_id
        ).single().execute()
        workflow = resp.data
        current_state = workflow["state"]

        # Validate transition
        allowed_next = VALID_TRANSITIONS.get(current_state, [])
        if to_state not in allowed_next:
            raise ValueError(
                f"Invalid transition: {current_state} → {to_state}. "
                f"Allowed: {allowed_next}"
            )

        # Update workflow state
        updated = await supabase.table("hiring_workflows").update({
            "state": to_state,
            "previous_state": current_state,
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", workflow_id).execute()

        # Log to timeline
        await self._log_transition(
            supabase,
            workflow_id=workflow_id,
            from_state=current_state,
            to_state=to_state,
            actor_id=actor_id,
            actor_role=actor_role,
            notes=notes,
            metadata=metadata or {},
        )

        # In-app notification for candidate on key states
        notif_config = STATE_NOTIFICATIONS.get(to_state)
        if notif_config:
            candidate_user = await self._get_candidate_user_id(
                supabase, workflow["candidate_id"]
            )
            if candidate_user:
                await self._create_notification(
                    supabase,
                    user_id=candidate_user,
                    title=notif_config["title"],
                    body=notif_config["body"],
                    notif_type=notif_config["type"],
                )

        log.info(
            "workflow.transition",
            workflow_id=workflow_id,
            from_state=current_state,
            to_state=to_state,
            actor=actor_id,
        )
        return updated.data[0]

    async def get_timeline(
        self, supabase: AsyncClient, workflow_id: str
    ) -> List[Dict[str, Any]]:
        """Return full immutable audit timeline for a workflow."""
        resp = await supabase.table("workflow_timeline").select("*").eq(
            "workflow_id", workflow_id
        ).order("created_at", desc=False).execute()
        return resp.data or []

    async def get_company_workflows(
        self,
        supabase: AsyncClient,
        company_id: str,
        state: Optional[str] = None,
        job_id: Optional[str] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """List workflows for an employer, optionally filtered."""
        query = supabase.table("hiring_workflows").select(
            "*, candidate_profiles(full_name, avatar_url, trust_score), "
            "jobs(title), applications(ats_score)"
        ).eq("company_id", company_id)

        if state:
            query = query.eq("state", state)
        if job_id:
            query = query.eq("job_id", job_id)

        resp = await query.order("updated_at", desc=True).limit(limit).execute()
        return resp.data or []

    # ── Internal helpers ──────────────────────────────────────

    async def _log_transition(
        self,
        supabase: AsyncClient,
        workflow_id: str,
        to_state: str,
        from_state: Optional[str] = None,
        actor_id: Optional[str] = None,
        actor_role: str = "system",
        notes: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        await supabase.table("workflow_timeline").insert({
            "workflow_id": workflow_id,
            "from_state": from_state,
            "to_state": to_state,
            "actor_id": actor_id,
            "actor_role": actor_role,
            "notes": notes,
            "metadata": metadata or {},
        }).execute()

    async def _get_candidate_user_id(
        self, supabase: AsyncClient, candidate_id: str
    ) -> Optional[str]:
        resp = await supabase.table("candidate_profiles").select("user_id").eq(
            "id", candidate_id
        ).maybe_single().execute()
        return resp.data["user_id"] if resp.data else None

    async def _create_notification(
        self,
        supabase: AsyncClient,
        user_id: str,
        title: str,
        body: str,
        notif_type: str,
        action_url: Optional[str] = None,
    ) -> None:
        await supabase.table("notifications").insert({
            "user_id": user_id,
            "title": title,
            "body": body,
            "type": notif_type,
            "action_url": action_url,
        }).execute()


workflow_service = WorkflowService()
