from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_current_user, require_employer
from app.services.passport_service import get_passport, get_passport_by_id
import structlog

router = APIRouter(prefix="/passports", tags=["Passports"])
log    = structlog.get_logger(__name__)


@router.get("/verify/{passport_id}")
async def verify_passport_public(passport_id: str):
    """
    Public endpoint — verify a Candidate Passport by ID.
    Used by employers or external parties to validate authenticity.
    """
    passport = await get_passport_by_id(passport_id)
    if not passport:
        raise HTTPException(status_code=404, detail="Passport not found or has been revoked")

    # Return a sanitised public view
    return {
        "passport_id":          passport.get("passport_id"),
        "candidate_name":       passport.get("candidate_profiles", {}).get("full_name") if isinstance(passport.get("candidate_profiles"), dict) else None,
        "overall_trust_score":  passport.get("overall_trust_score"),
        "verification_status":  passport.get("verification_status"),
        "final_recommendation": passport.get("final_recommendation"),
        "fraud_risk":           passport.get("fraud_risk"),
        "verified_at":          passport.get("verified_at"),
        "valid":                passport.get("verification_status") == "verified",
    }


@router.get("/{candidate_id}", dependencies=[Depends(require_employer)])
async def get_candidate_passport(candidate_id: str):
    """Get full passport for a candidate (employer-facing)."""
    passport = await get_passport(candidate_id)
    if not passport:
        raise HTTPException(status_code=404, detail="Passport not available")
    return passport
