"""
VERIQO ATS Engine — Phase 1.5
==============================
Replaces Qdrant with pgvector inside Supabase.

Architecture:
  Resume text → Groq embedding → stored in candidate_embeddings table
  Job description → Groq embedding → stored in jobs.job_embedding
  Match → cosine similarity search via pgvector + skill overlap scoring

ATS Score formula:
  semantic_similarity * 0.60 + skill_overlap * 0.40
"""
import re
import hashlib
import structlog
from typing import List, Optional, Tuple
from groq import Groq
from supabase import AsyncClient
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.core.cache import cache
from app.schemas.schemas import ATSMatchResult

log = structlog.get_logger(__name__)

VECTOR_DIM = settings.embedding_dimension  # 1536


# ─── Embedding ────────────────────────────────────────────────

def _groq_client() -> Groq:
    return Groq(api_key=settings.groq_api_key)


def _text_hash(text: str) -> str:
    return hashlib.md5(text.encode()).hexdigest()


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
async def get_embedding(text: str) -> List[float]:
    """
    Generate a 1536-dimensional text embedding.
    Uses Groq API with text-embedding-3-small (OpenAI-compatible endpoint on Groq).
    Falls back to a deterministic pseudo-embedding in dev/no-key scenarios.
    Results are cached in Redis for 24 h.
    """
    cache_key = f"embed:{_text_hash(text[:500])}"
    cached = await cache.get(cache_key)
    if cached:
        return cached

    if not settings.groq_api_key:
        return _dev_embedding(text)

    try:
        client = _groq_client()
        resp = client.embeddings.create(
            model=settings.embedding_model,
            input=text[:8000],
        )
        embedding = resp.data[0].embedding
        await cache.set(cache_key, embedding, ttl=86400)
        return embedding
    except Exception as exc:
        log.error("embedding.error", error=str(exc))
        return _dev_embedding(text)


def _dev_embedding(text: str) -> List[float]:
    """Deterministic pseudo-embedding for local dev (no API key required)."""
    import struct
    seed = int(_text_hash(text), 16)
    return [((seed >> (i % 128)) & 0xFF) / 255.0 - 0.5 for i in range(VECTOR_DIM)]


# ─── Skill Extraction ─────────────────────────────────────────

_TECH_SKILLS = {
    "python", "javascript", "typescript", "react", "nextjs", "fastapi",
    "node", "nodejs", "django", "flask", "sql", "postgresql", "mongodb",
    "redis", "docker", "kubernetes", "aws", "gcp", "azure", "terraform",
    "git", "figma", "photoshop", "sketch", "vue", "angular", "golang",
    "rust", "java", "kotlin", "swift", "flutter", "dart", "c++", "c#",
    "machine learning", "deep learning", "nlp", "llm", "data science",
    "tableau", "power bi", "excel", "pandas", "numpy", "spark",
}


def extract_skills_from_text(text: str) -> List[str]:
    """Extract technology skills mentioned in text."""
    lower = text.lower()
    found = []
    for skill in _TECH_SKILLS:
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, lower):
            found.append(skill)
    return found


def skill_overlap_score(
    candidate_skills: List[str],
    job_skills: List[str],
) -> float:
    """
    Jaccard-like overlap: |intersection| / |job_skills|
    If job has no skills listed, return neutral 0.5.
    """
    if not job_skills:
        return 0.5
    c_set = {s.lower() for s in candidate_skills}
    j_set = {s.lower() for s in job_skills}
    overlap = len(c_set & j_set)
    return min(overlap / len(j_set), 1.0)


# ─── Embedding Storage ────────────────────────────────────────

async def store_candidate_embedding(
    supabase: AsyncClient,
    candidate_id: str,
    resume_text: str,
) -> None:
    """Upsert candidate embedding into candidate_embeddings table."""
    embedding = await get_embedding(resume_text)
    source_hash = _text_hash(resume_text)

    await supabase.table("candidate_embeddings").upsert({
        "candidate_id": candidate_id,
        "embedding": embedding,        # pgvector accepts list[float] via supabase-py
        "model": settings.embedding_model,
        "source_hash": source_hash,
    }, on_conflict="candidate_id").execute()

    log.info("candidate_embedding.stored", candidate_id=candidate_id)


async def store_job_embedding(
    supabase: AsyncClient,
    job_id: str,
    jd_text: str,
) -> None:
    """Upsert job embedding into jobs.job_embedding."""
    embedding = await get_embedding(jd_text)
    jd_hash = _text_hash(jd_text)

    await supabase.table("jobs").update({
        "job_embedding": embedding,
        "jd_hash": jd_hash,
    }).eq("id", job_id).execute()

    log.info("job_embedding.stored", job_id=job_id)


# ─── ATS Matching ─────────────────────────────────────────────

async def match_candidate_to_job(
    supabase: AsyncClient,
    candidate_id: str,
    job_id: str,
) -> ATSMatchResult:
    """
    Compute ATS score for a (candidate, job) pair.
    Combines semantic cosine similarity (60%) with skill overlap (40%).
    """
    cache_key = f"ats:{candidate_id}:{job_id}"
    cached = await cache.get(cache_key)
    if cached:
        return ATSMatchResult(**cached)

    # Fetch job details
    job_resp = await supabase.table("jobs").select(
        "id, title, description, skills_required, job_embedding, jd_hash"
    ).eq("id", job_id).single().execute()
    job = job_resp.data

    # Fetch candidate
    candidate_resp = await supabase.table("candidate_profiles").select(
        "id, skills, resume_url"
    ).eq("id", candidate_id).single().execute()
    candidate = candidate_resp.data

    # Fetch candidate embedding
    emb_resp = await supabase.table("candidate_embeddings").select(
        "embedding"
    ).eq("candidate_id", candidate_id).maybe_single().execute()

    semantic_score = 0.0

    if emb_resp.data and job.get("job_embedding"):
        # Use pgvector cosine similarity via RPC
        sim_resp = await supabase.rpc("cosine_similarity", {
            "vec_a": emb_resp.data["embedding"],
            "vec_b": job["job_embedding"],
        }).execute()
        semantic_score = max(0.0, min(1.0, float(sim_resp.data or 0)))
    else:
        # Fallback: keyword overlap on description
        resume_skills = extract_skills_from_text(
            " ".join(candidate.get("skills") or [])
        )
        jd_skills = extract_skills_from_text(job.get("description", ""))
        semantic_score = skill_overlap_score(resume_skills, jd_skills)

    # Skill overlap score
    candidate_skills = candidate.get("skills") or []
    job_skills = job.get("skills_required") or []
    overlap = skill_overlap_score(candidate_skills, job_skills)

    # Weighted ATS score
    ats_score = (semantic_score * 0.60) + (overlap * 0.40)
    ats_score = round(ats_score * 100, 2)  # scale 0–100

    # Matched / missing skills
    c_set = {s.lower() for s in candidate_skills}
    j_set = {s.lower() for s in job_skills}
    matched_skills = list(c_set & j_set)
    missing_skills = list(j_set - c_set)

    result = ATSMatchResult(
        candidate_id=candidate_id,
        job_id=job_id,
        ats_score=ats_score,
        semantic_score=round(semantic_score * 100, 2),
        skill_overlap_score=round(overlap * 100, 2),
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        recommendation="shortlist" if ats_score >= 70 else (
            "consider" if ats_score >= 50 else "skip"
        ),
    )

    await cache.set(cache_key, result.model_dump(), ttl=3600)
    return result


async def search_top_candidates_for_job(
    supabase: AsyncClient,
    job_id: str,
    limit: int = 20,
    min_score: float = 0.5,
) -> List[Tuple[str, float]]:
    """
    Return (candidate_id, similarity) pairs for the top candidates
    matching a job, using pgvector cosine search.
    """
    resp = await supabase.rpc("search_candidates_by_job", {
        "p_job_id": job_id,
        "p_limit": limit,
        "p_min_score": min_score,
    }).execute()
    return [(row["candidate_id"], row["similarity"]) for row in (resp.data or [])]


async def bulk_match_candidates(
    supabase: AsyncClient,
    job_id: str,
    candidate_ids: List[str],
) -> List[ATSMatchResult]:
    """Run ATS matching for multiple candidates against a single job."""
    results = []
    for candidate_id in candidate_ids:
        try:
            result = await match_candidate_to_job(supabase, candidate_id, job_id)
            results.append(result)
        except Exception as exc:
            log.error("bulk_ats.error", candidate_id=candidate_id, error=str(exc))
    # Sort by score descending
    results.sort(key=lambda r: r.ats_score, reverse=True)
    return results
