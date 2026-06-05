"""
VERIQO Search API — Phase 1.5
Features 12 & 13: Advanced Search + Advanced Filters
"""
from typing import Optional, List
from fastapi import APIRouter, Depends
from pydantic import BaseModel
import structlog

from app.core.database import get_supabase
from app.core.security import get_current_user
from app.services.ats_service import get_embedding

log = structlog.get_logger(__name__)
router = APIRouter(prefix="/search", tags=["search"])


class SearchFilters(BaseModel):
    ats_score_min: Optional[float] = None
    trust_score_min: Optional[float] = None
    experience_min: Optional[int] = None
    experience_max: Optional[int] = None
    salary_max: Optional[int] = None
    location: Optional[str] = None
    notice_period_max: Optional[int] = None
    open_to_relocation: Optional[bool] = None
    verification_status: Optional[str] = None
    skills: Optional[List[str]] = None


class SearchRequest(BaseModel):
    query: str
    search_type: str = "semantic"  # semantic | keyword | boolean
    filters: Optional[SearchFilters] = None
    limit: int = 20
    offset: int = 0


@router.post("/candidates")
async def search_candidates(
    body: SearchRequest,
    supabase=Depends(get_supabase),
    current_user=Depends(get_current_user),
):
    """
    Advanced candidate search.
    - semantic: vector similarity using query embedding
    - keyword: skill/text matching
    - boolean: AND/OR/NOT operators (e.g. "React AND AWS")
    """
    filters = body.filters or SearchFilters()

    if body.search_type == "semantic":
        # Embed query, then find similar candidates via pgvector
        query_embedding = await get_embedding(body.query)

        # Use Supabase RPC for vector search then apply filters
        # This calls a custom PostgreSQL function
        resp = await supabase.rpc("search_candidates_semantic", {
            "query_embedding": query_embedding,
            "p_limit": body.limit,
            "p_offset": body.offset,
            "p_ats_min": filters.ats_score_min,
            "p_trust_min": filters.trust_score_min,
            "p_location": filters.location,
            "p_verification_status": filters.verification_status,
        }).execute()
        candidates = resp.data or []

    elif body.search_type == "boolean":
        # Parse boolean operators: "React AND AWS NOT PHP"
        candidates = await _boolean_search(supabase, body.query, filters, body.limit, body.offset)

    else:  # keyword
        candidates = await _keyword_search(supabase, body.query, filters, body.limit, body.offset)

    return {
        "query": body.query,
        "search_type": body.search_type,
        "candidates": candidates,
        "count": len(candidates),
    }


async def _keyword_search(supabase, query: str, filters: SearchFilters, limit: int, offset: int):
    """Simple skill/text keyword search."""
    q = supabase.table("candidate_profiles").select(
        "id, full_name, headline, skills, trust_score, ats_score, "
        "years_of_experience, location, verification_status, avatar_url"
    )

    # Skills array contains
    if query:
        skills_list = [s.strip().lower() for s in query.replace(",", " ").split()]
        q = q.overlaps("skills", skills_list)

    q = _apply_filters(q, filters)
    resp = await q.range(offset, offset + limit - 1).execute()
    return resp.data or []


async def _boolean_search(supabase, query: str, filters: SearchFilters, limit: int, offset: int):
    """
    Parse simple boolean expressions.
    "React AND AWS" → requires both skills
    "React OR Vue" → requires either skill (handled as OR overlap)
    "React NOT PHP" → requires React, excludes PHP
    """
    import re

    # Very simple parser: split on AND/OR/NOT
    # For production, consider a proper query parser
    and_terms = []
    not_terms = []

    # Split by NOT first
    parts = re.split(r'\bNOT\b', query, flags=re.IGNORECASE)
    if len(parts) > 1:
        not_terms = [t.strip() for t in parts[1:] if t.strip()]
        query = parts[0]

    # Split remaining by AND/OR
    positive_terms = [
        t.strip() for t in re.split(r'\bAND\b|\bOR\b', query, flags=re.IGNORECASE)
        if t.strip()
    ]

    q = supabase.table("candidate_profiles").select(
        "id, full_name, headline, skills, trust_score, ats_score, "
        "years_of_experience, location, verification_status, avatar_url"
    )

    if positive_terms:
        q = q.overlaps("skills", [t.lower() for t in positive_terms])

    q = _apply_filters(q, filters)
    resp = await q.range(0, limit - 1).execute()
    results = resp.data or []

    # Client-side NOT filter
    if not_terms:
        not_lower = {t.lower() for t in not_terms}
        results = [
            c for c in results
            if not any(s.lower() in not_lower for s in (c.get("skills") or []))
        ]

    return results


def _apply_filters(query, filters: SearchFilters):
    if filters.ats_score_min is not None:
        query = query.gte("ats_score", filters.ats_score_min)
    if filters.trust_score_min is not None:
        query = query.gte("trust_score", filters.trust_score_min)
    if filters.experience_min is not None:
        query = query.gte("years_of_experience", filters.experience_min)
    if filters.experience_max is not None:
        query = query.lte("years_of_experience", filters.experience_max)
    if filters.salary_max is not None:
        query = query.lte("expected_salary", filters.salary_max)
    if filters.location:
        query = query.ilike("location", f"%{filters.location}%")
    if filters.notice_period_max is not None:
        query = query.lte("notice_period_days", filters.notice_period_max)
    if filters.open_to_relocation is not None:
        query = query.eq("open_to_relocation", filters.open_to_relocation)
    if filters.verification_status:
        query = query.eq("verification_status", filters.verification_status)
    return query
