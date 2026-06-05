"""
VERIQO API Router — Phase 1.5
Adds all new feature endpoints while preserving existing ones.
"""
from fastapi import APIRouter
from app.api.v1.endpoints import (
    # Existing endpoints (unchanged)
    candidates,
    jobs,
    verification,
    passports,
    companies,
    # New Phase 1.5 endpoints
    workflow,
    pipeline,
    interest,
    work_samples,
    trust_score,
    bulk,
    search,
    interviews,
)

api_router = APIRouter()

# ── Existing endpoints ────────────────────────────────────────
api_router.include_router(candidates.router)
api_router.include_router(jobs.router)
api_router.include_router(verification.router)
api_router.include_router(passports.router)
api_router.include_router(companies.router)

# ── Phase 1.5 New endpoints ───────────────────────────────────
api_router.include_router(workflow.router)
api_router.include_router(pipeline.router)
api_router.include_router(interest.router)
api_router.include_router(work_samples.router)
api_router.include_router(trust_score.router)
api_router.include_router(bulk.router)
api_router.include_router(search.router)
api_router.include_router(interviews.router)
