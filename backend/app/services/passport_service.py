"""
VERIQO Candidate Passport Service
===================================
Aggregates all verification scores into a Candidate Passport
with Trust Score, Fraud Risk, and Final Recommendation.
"""
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional
import structlog
from app.core.database import get_supabase
from app.core.cache import cache
from app.schemas.schemas import PassportResponse, FinalRecommendation, FraudRisk, VerificationStatus

log = structlog.get_logger(__name__)

# ── Score weights (must sum to 1.0) ──────────────────────────
WEIGHTS = {
    "ats_score":            0.20,
    "portfolio_score":      0.20,
    "work_sample_score":    0.25,
    "technical_score":      0.20,
    "communication_score":  0.10,
    "reliability_score":    0.05,
}


def compute_trust_score(scores: dict[str, float]) -> float:
    """Weighted average of all verification scores."""
    total = 0.0
    weight_used = 0.0
    for key, weight in WEIGHTS.items():
        val = scores.get(key)
        if val is not None:
            total += val * weight
            weight_used += weight
    if weight_used == 0:
        return 0.0
    return round(total / weight_used, 1)


def compute_joining_probability(
    trust_score: float,
    fraud_score: float,
    reliability_score: Optional[float],
    interest_confirmed: bool,
    notice_period_days: int,
    has_other_offers: bool,
) -> float:
    """Estimate the probability a candidate will actually join if offered."""
    base = trust_score * 0.35

    # Interest confirmation adds a lot
    base += 20 if interest_confirmed else 0

    # Reliability
    if reliability_score:
        base += reliability_score * 0.20

    # Fraud penalty
    if fraud_score > 60:
        base -= 20
    elif fraud_score > 30:
        base -= 10

    # Other offers reduce probability
    if has_other_offers:
        base -= 15

    # Long notice period reduces probability
    if notice_period_days > 60:
        base -= 10
    elif notice_period_days > 30:
        base -= 5

    return round(min(max(base, 5), 99), 1)


def determine_recommendation(
    trust_score: float,
    fraud_risk: FraudRisk,
    joining_probability: float,
) -> FinalRecommendation:
    """Compute final recommendation from scores."""
    if fraud_risk == FraudRisk.high:
        return FinalRecommendation.not_recommended
    if trust_score >= 85 and fraud_risk == FraudRisk.low and joining_probability >= 75:
        return FinalRecommendation.highly_recommended
    if trust_score >= 70 and fraud_risk != FraudRisk.high:
        return FinalRecommendation.recommended
    if trust_score >= 55:
        return FinalRecommendation.conditional
    return FinalRecommendation.not_recommended


def determine_fraud_risk(fraud_score: float) -> FraudRisk:
    if fraud_score <= 30:
        return FraudRisk.low
    if fraud_score <= 60:
        return FraudRisk.medium
    return FraudRisk.high


async def generate_passport(
    candidate_id: str,
    scores: dict[str, float],
    fraud_score: float,
    interest_data: Optional[dict] = None,
) -> dict:
    """
    Generate or update a Candidate Passport.
    Returns the passport dict.
    """
    trust_score = compute_trust_score(scores)
    fraud_risk  = determine_fraud_risk(fraud_score)

    interest_data = interest_data or {}
    joining_prob = compute_joining_probability(
        trust_score=trust_score,
        fraud_score=fraud_score,
        reliability_score=scores.get("reliability_score"),
        interest_confirmed=interest_data.get("interested", False),
        notice_period_days=interest_data.get("notice_period_days", 30),
        has_other_offers=interest_data.get("has_other_offers", False),
    )

    recommendation = determine_recommendation(trust_score, fraud_risk, joining_prob)

    passport_id = f"VQ-{datetime.now(timezone.utc).strftime('%Y')}-{uuid.uuid4().hex[:6].upper()}"
    share_url   = f"https://veriqo.io/passport/{passport_id}"
    verified_at = datetime.now(timezone.utc).isoformat()

    passport = {
        "passport_id":           passport_id,
        "candidate_id":          candidate_id,
        "ats_score":             scores.get("ats_score", 0),
        "portfolio_score":       scores.get("portfolio_score", 0),
        "work_sample_score":     scores.get("work_sample_score", 0),
        "technical_score":       scores.get("technical_score", 0),
        "communication_score":   scores.get("communication_score", 0),
        "reliability_score":     scores.get("reliability_score", 0),
        "fraud_risk":            fraud_risk.value,
        "fraud_score":           fraud_score,
        "joining_probability":   joining_prob,
        "overall_trust_score":   trust_score,
        "verification_status":   VerificationStatus.verified.value,
        "final_recommendation":  recommendation.value,
        "verified_at":           verified_at,
        "share_url":             share_url,
    }

    # Persist to Supabase
    try:
        db = get_supabase()
        # Upsert passport
        db.table("candidate_passports").upsert({
            **passport,
            "created_at": verified_at,
            "updated_at": verified_at,
        }).execute()

        # Update candidate profile with trust score and passport id
        db.table("candidate_profiles").update({
            "trust_score":           trust_score,
            "fraud_risk":            fraud_risk.value,
            "fraud_score":           fraud_score,
            "joining_probability":   joining_prob,
            "verification_status":   VerificationStatus.verified.value,
            "passport_id":           passport_id,
            "updated_at":            verified_at,
            **{k: v for k, v in scores.items()},
        }).eq("id", candidate_id).execute()

        log.info("passport.generated", candidate_id=candidate_id, passport_id=passport_id, trust_score=trust_score)
    except Exception as e:
        log.error("passport.db_error", error=str(e))

    # Cache passport
    await cache.set(f"passport:{candidate_id}", passport, ttl=3600)
    await cache.set(f"passport:id:{passport_id}", passport, ttl=3600)

    return passport


async def get_passport(candidate_id: str) -> Optional[dict]:
    """Retrieve a passport by candidate ID."""
    cached = await cache.get(f"passport:{candidate_id}")
    if cached:
        return cached

    try:
        db = get_supabase()
        resp = db.table("candidate_passports").select("*").eq("candidate_id", candidate_id).single().execute()
        if resp.data:
            await cache.set(f"passport:{candidate_id}", resp.data, ttl=3600)
            return resp.data
    except Exception as e:
        log.warning("passport.get_error", candidate_id=candidate_id, error=str(e))

    return None


async def get_passport_by_id(passport_id: str) -> Optional[dict]:
    """Retrieve a passport by passport ID (public shareable lookup)."""
    cached = await cache.get(f"passport:id:{passport_id}")
    if cached:
        return cached

    try:
        db = get_supabase()
        resp = db.table("candidate_passports").select("*, candidate_profiles(*)").eq("passport_id", passport_id).single().execute()
        if resp.data:
            await cache.set(f"passport:id:{passport_id}", resp.data, ttl=3600)
            return resp.data
    except Exception as e:
        log.warning("passport.get_by_id_error", passport_id=passport_id, error=str(e))

    return None
