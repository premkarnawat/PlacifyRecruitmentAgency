"""
VERIQO Trust Score Engine V2 — Phase 1.5
==========================================
Weighted composite score:
  ATS Match            15%
  Portfolio Quality    20%
  Work Sample          25%
  Expert Verification  20%
  Communication        10%
  Reliability          10%
"""
import structlog
from typing import Dict, Optional, List, Any
from supabase import AsyncClient

log = structlog.get_logger(__name__)

WEIGHTS = {
    "ats":           0.15,
    "portfolio":     0.20,
    "work_sample":   0.25,
    "expert":        0.20,
    "communication": 0.10,
    "reliability":   0.10,
}


class TrustScoreService:
    async def calculate_and_store(
        self,
        supabase: AsyncClient,
        candidate_id: str,
        trigger_event: str = "manual_recalculate",
    ) -> Dict[str, Any]:
        """
        Fetch latest component scores, compute weighted trust score,
        persist to candidate_profiles and trust_score_history.
        """
        # Fetch candidate profile
        profile_resp = await supabase.table("candidate_profiles").select(
            "ats_score, portfolio_score, work_sample_score, "
            "technical_score, communication_score, reliability_score"
        ).eq("id", candidate_id).single().execute()
        p = profile_resp.data

        # Fetch expert evaluation score if available
        expert_resp = await supabase.table("expert_evaluations").select(
            "total_score"
        ).eq("candidate_id", candidate_id).order(
            "created_at", desc=True
        ).limit(1).maybe_single().execute()
        expert_raw = expert_resp.data["total_score"] if expert_resp.data else None
        # Expert total is out of 100 max per schema
        expert_score = min((expert_raw or 0), 100)

        components = {
            "ats":           min(float(p.get("ats_score") or 0), 100),
            "portfolio":     min(float(p.get("portfolio_score") or 0), 100),
            "work_sample":   min(float(p.get("work_sample_score") or 0), 100),
            "expert":        expert_score,
            "communication": min(float(p.get("communication_score") or 0), 100),
            "reliability":   min(float(p.get("reliability_score") or 0), 100),
        }

        overall = sum(components[k] * WEIGHTS[k] for k in WEIGHTS)
        overall = round(overall, 2)

        breakdown = {
            k: {
                "score": components[k],
                "weight": WEIGHTS[k],
                "contribution": round(components[k] * WEIGHTS[k], 2),
            }
            for k in WEIGHTS
        }

        # Persist overall trust score to candidate_profiles
        await supabase.table("candidate_profiles").update({
            "trust_score": overall,
        }).eq("id", candidate_id).execute()

        # Record in history
        await supabase.table("trust_score_history").insert({
            "candidate_id": candidate_id,
            "overall_score": overall,
            "ats_component":           components["ats"],
            "portfolio_component":     components["portfolio"],
            "work_sample_component":   components["work_sample"],
            "expert_component":        components["expert"],
            "communication_component": components["communication"],
            "reliability_component":   components["reliability"],
            "score_breakdown":         breakdown,
            "trigger_event":           trigger_event,
        }).execute()

        log.info("trust_score.calculated", candidate_id=candidate_id, score=overall)

        return {
            "candidate_id": candidate_id,
            "overall_score": overall,
            "components": components,
            "breakdown": breakdown,
            "weights": WEIGHTS,
        }

    async def get_history(
        self,
        supabase: AsyncClient,
        candidate_id: str,
        limit: int = 30,
    ) -> List[Dict[str, Any]]:
        resp = await supabase.table("trust_score_history").select(
            "overall_score, created_at, trigger_event, score_breakdown"
        ).eq("candidate_id", candidate_id).order(
            "created_at", desc=True
        ).limit(limit).execute()
        return resp.data or []


class ReliabilityService:
    async def calculate(
        self, supabase: AsyncClient, candidate_id: str
    ) -> Dict[str, Any]:
        """
        Compute reliability score from reliability_events.
        Positive events add points; negative events subtract.
        """
        events_resp = await supabase.table("reliability_events").select("*").eq(
            "candidate_id", candidate_id
        ).execute()
        events = events_resp.data or []

        if not events:
            return self._empty_score(candidate_id)

        # Count by category
        counters = {
            "interview_attended": 0, "interview_no_show": 0,
            "offer_accepted": 0, "offer_declined": 0,
            "joined": 0, "ghosted": 0,
            "response_fast": 0, "response_slow": 0,
        }
        for ev in events:
            t = ev["event_type"]
            if t in counters:
                counters[t] += 1

        # Sub-scores (each 0–100)
        total_interviews = counters["interview_attended"] + counters["interview_no_show"]
        interview_score = (
            (counters["interview_attended"] / total_interviews * 100)
            if total_interviews else 50
        )

        total_offers = counters["offer_accepted"] + counters["offer_declined"]
        offer_score = (
            (counters["offer_accepted"] / total_offers * 100)
            if total_offers else 50
        )

        total_responses = counters["response_fast"] + counters["response_slow"]
        response_score = (
            (counters["response_fast"] / total_responses * 100)
            if total_responses else 50
        )

        ghosted_penalty = min(counters["ghosted"] * 20, 80)
        joining_score = max(0, 80 - ghosted_penalty) if counters["ghosted"] else (
            (counters["joined"] / max(counters["joined"] + counters["offer_accepted"], 1)) * 100
        )

        # Weighted overall reliability
        reliability_score = round(
            interview_score * 0.30 +
            offer_score * 0.25 +
            response_score * 0.20 +
            joining_score * 0.25,
            2
        )

        risk_flags = []
        if counters["interview_no_show"] >= 2:
            risk_flags.append("Multiple interview no-shows")
        if counters["ghosted"] >= 1:
            risk_flags.append("Ghosted after offer/joining")
        if offer_score < 30:
            risk_flags.append("Low offer acceptance rate")

        # Upsert to reliability_scores
        await supabase.table("reliability_scores").upsert({
            "candidate_id": candidate_id,
            "score": reliability_score,
            "interview_attendance": round(interview_score, 2),
            "response_time": round(response_score, 2),
            "offer_acceptance_rate": round(offer_score, 2),
            "joining_rate": round(joining_score, 2),
            "risk_flags": risk_flags,
        }, on_conflict="candidate_id").execute()

        # Update candidate_profiles.reliability_score
        await supabase.table("candidate_profiles").update({
            "reliability_score": reliability_score,
        }).eq("id", candidate_id).execute()

        return {
            "candidate_id": candidate_id,
            "score": reliability_score,
            "interview_attendance": round(interview_score, 2),
            "response_time": round(response_score, 2),
            "offer_acceptance_rate": round(offer_score, 2),
            "joining_rate": round(joining_score, 2),
            "risk_flags": risk_flags,
            "event_count": len(events),
        }

    def _empty_score(self, candidate_id: str) -> Dict[str, Any]:
        return {
            "candidate_id": candidate_id,
            "score": 50.0,
            "interview_attendance": 50.0,
            "response_time": 50.0,
            "offer_acceptance_rate": 50.0,
            "joining_rate": 50.0,
            "risk_flags": [],
            "event_count": 0,
        }

    async def record_event(
        self,
        supabase: AsyncClient,
        candidate_id: str,
        event_type: str,
        application_id: Optional[str] = None,
        notes: Optional[str] = None,
        created_by: Optional[str] = None,
    ) -> None:
        await supabase.table("reliability_events").insert({
            "candidate_id": candidate_id,
            "application_id": application_id,
            "event_type": event_type,
            "notes": notes,
            "created_by": created_by,
        }).execute()
        # Recalculate after event
        await self.calculate(supabase, candidate_id)


trust_score_service = TrustScoreService()
reliability_service = ReliabilityService()
