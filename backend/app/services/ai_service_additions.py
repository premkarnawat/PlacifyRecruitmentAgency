"""
VERIQO AI Service — Phase 1.5 Additions
=========================================
New AI features added on top of existing ai_service.py:
  - analyze_job_description()
  - generate_resume_summary()
  - rank_candidates()
  - generate_interview_questions()

Import these and add to the existing ai_service.py module.
"""
import json
import structlog
from typing import List, Dict, Any, Optional
from groq import Groq

from app.core.config import settings
from app.core.cache import cache

log = structlog.get_logger(__name__)


def _groq(model: Optional[str] = None) -> Groq:
    return Groq(api_key=settings.groq_api_key)


def _chat(system: str, user: str, json_mode: bool = False) -> str:
    """Call Groq LLM synchronously. Returns raw text or JSON string."""
    client = _groq()
    resp = client.chat.completions.create(
        model=settings.groq_model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        max_tokens=1500,
        temperature=0.2,
        response_format={"type": "json_object"} if json_mode else None,
    )
    return resp.choices[0].message.content or ""


# ─── Feature 5: AI Job Requirement Analyzer ──────────────────

async def analyze_job_description(
    job_description: str,
    job_title: str = "",
) -> Dict[str, Any]:
    """
    Parse a job description and extract structured requirements.
    Output matches job_requirements table schema.
    """
    cache_key = f"jd_analyze:{hash(job_description[:500])}"
    cached = await cache.get(cache_key)
    if cached:
        return cached

    system = """You are a senior talent acquisition expert. 
Extract structured requirements from job descriptions.
Always respond with valid JSON only — no preamble, no markdown.
JSON schema:
{
  "required_skills": ["skill1", "skill2"],
  "optional_skills": ["skill3"],
  "priority_skills": ["most_critical_skill"],
  "experience_min": 3,
  "experience_max": 7,
  "location": "Bangalore, India or Remote",
  "salary_min": 1500000,
  "salary_max": 2500000,
  "responsibilities": ["responsibility1", "responsibility2"],
  "role_category": "Backend Engineer",
  "seniority": "mid",
  "remote_friendly": true
}
Return numbers (not strings) for salary/experience. Salary in INR paisa or full rupees — just pick one unit consistently. Use null for unknown fields."""

    user = f"Job Title: {job_title}\n\nDescription:\n{job_description[:4000]}"

    try:
        raw = _chat(system, user, json_mode=True)
        result = json.loads(raw)
        await cache.set(cache_key, result, ttl=86400)
        return result
    except Exception as exc:
        log.error("jd_analyze.error", error=str(exc))
        return {
            "required_skills": [], "optional_skills": [], "priority_skills": [],
            "experience_min": None, "experience_max": None,
            "location": None, "salary_min": None, "salary_max": None,
            "responsibilities": [], "error": str(exc),
        }


# ─── Feature 14: AI Resume Summary ───────────────────────────

async def generate_resume_summary(
    candidate_data: Dict[str, Any],
    job_context: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generate AI summary of a candidate including strengths, weaknesses,
    risk areas, and recommendation.
    """
    skills = ", ".join(candidate_data.get("skills") or [])
    experience = candidate_data.get("years_of_experience", 0)
    headline = candidate_data.get("headline", "")
    summary = candidate_data.get("summary", "")
    ats_score = candidate_data.get("ats_score", 0)
    trust_score = candidate_data.get("trust_score", 0)

    system = """You are an expert technical recruiter and career coach.
Analyze the candidate data and provide a structured assessment.
Respond ONLY with valid JSON, no markdown.
Schema:
{
  "summary": "2-3 sentence professional summary",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["area1", "area2"],
  "risk_areas": ["risk1"],
  "recommendation": "highly_recommended|recommended|conditional|not_recommended",
  "recommendation_reason": "brief explanation",
  "fit_score": 85
}"""

    user = f"""Candidate Profile:
Headline: {headline}
Summary: {summary}
Skills: {skills}
Experience: {experience} years
ATS Score: {ats_score}/100
Trust Score: {trust_score}/100
{"Job Context: " + job_context if job_context else ""}"""

    try:
        raw = _chat(system, user, json_mode=True)
        return json.loads(raw)
    except Exception as exc:
        log.error("resume_summary.error", error=str(exc))
        return {
            "summary": summary or "Profile data insufficient for AI summary.",
            "strengths": [], "weaknesses": [], "risk_areas": [],
            "recommendation": "conditional", "recommendation_reason": "Insufficient data",
            "fit_score": ats_score,
        }


# ─── Feature 15: AI Candidate Ranking ────────────────────────

async def rank_candidates(
    candidates: List[Dict[str, Any]],
    job_description: str,
    job_title: str = "",
) -> List[Dict[str, Any]]:
    """
    Rank a list of candidates for a job using composite AI scoring.
    Returns candidates sorted by rank with scores and justification.
    """
    if not candidates:
        return []

    candidates_text = "\n\n".join([
        f"Candidate {i+1} (ID: {c['id']}):\n"
        f"  Skills: {', '.join(c.get('skills') or [])}\n"
        f"  Experience: {c.get('years_of_experience', 0)} years\n"
        f"  ATS Score: {c.get('ats_score', 0)}\n"
        f"  Trust Score: {c.get('trust_score', 0)}\n"
        f"  Reliability: {c.get('reliability_score', 50)}"
        for i, c in enumerate(candidates)
    ])

    system = """You are an expert hiring manager. Rank candidates for a role.
Respond ONLY with valid JSON:
{
  "rankings": [
    {
      "candidate_id": "uuid",
      "rank": 1,
      "composite_score": 87,
      "justification": "Strong React experience and high trust score",
      "hire_recommendation": "strong_yes|yes|maybe|no"
    }
  ]
}
Consider: ATS match, trust score, reliability score, experience fit, skill alignment."""

    user = f"""Role: {job_title}
Job Description: {job_description[:2000]}

Candidates:
{candidates_text}

Rank from best fit to worst fit."""

    try:
        raw = _chat(system, user, json_mode=True)
        result = json.loads(raw)
        rankings_map = {r["candidate_id"]: r for r in result.get("rankings", [])}

        # Enrich original candidates with ranking data
        enriched = []
        for c in candidates:
            r = rankings_map.get(c["id"], {})
            enriched.append({
                **c,
                "rank": r.get("rank", 999),
                "composite_score": r.get("composite_score", 0),
                "hire_recommendation": r.get("hire_recommendation", "maybe"),
                "justification": r.get("justification", ""),
            })

        return sorted(enriched, key=lambda x: x["rank"])
    except Exception as exc:
        log.error("ranking.error", error=str(exc))
        # Fallback: sort by trust_score + ats_score
        return sorted(
            candidates,
            key=lambda c: (c.get("trust_score") or 0) + (c.get("ats_score") or 0),
            reverse=True,
        )


# ─── Feature 16: AI Interview Question Generator ─────────────

async def generate_interview_questions(
    candidate_data: Dict[str, Any],
    job_description: str,
    job_title: str = "",
    question_count: int = 15,
) -> Dict[str, List[str]]:
    """
    Generate tailored interview questions based on candidate profile and JD.
    Returns questions categorized by type.
    """
    cache_key = f"interview_qs:{hash(job_title + str(candidate_data.get('id', '')))}"
    cached = await cache.get(cache_key)
    if cached:
        return cached

    skills = ", ".join(candidate_data.get("skills") or [])
    experience = candidate_data.get("years_of_experience", 0)
    summary = candidate_data.get("summary", "")

    system = """You are a senior technical interviewer. Generate targeted interview questions.
Respond ONLY with valid JSON:
{
  "technical": ["Q1", "Q2", "Q3", "Q4", "Q5"],
  "project_deep_dive": ["Q1", "Q2", "Q3"],
  "behavioral": ["Q1", "Q2", "Q3"],
  "role_specific": ["Q1", "Q2"]
}
Make questions specific to the candidate's background and the role. No generic questions."""

    user = f"""Role: {job_title}
Candidate Skills: {skills}
Experience: {experience} years
Candidate Background: {summary[:500]}
Job Context: {job_description[:1500]}

Generate {question_count} total questions spread across categories."""

    try:
        raw = _chat(system, user, json_mode=True)
        result = json.loads(raw)
        await cache.set(cache_key, result, ttl=3600)
        return result
    except Exception as exc:
        log.error("interview_questions.error", error=str(exc))
        return {
            "technical": [f"Describe your experience with {skills.split(',')[0] if skills else 'your primary technology'}."],
            "project_deep_dive": ["Walk me through your most complex project."],
            "behavioral": ["Tell me about a time you faced a technical challenge and how you resolved it."],
            "role_specific": [f"How would you approach the main responsibilities of a {job_title}?"],
        }


# ─── Work Sample Evaluation ───────────────────────────────────

async def evaluate_work_sample(
    task_description: str,
    submission_content: str,
    role_type: str,
    evaluation_rubric: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    AI evaluation of a candidate's work sample submission.
    Returns score (0-100) and detailed feedback.
    """
    rubric_text = ""
    if evaluation_rubric:
        rubric_text = f"\nEvaluation Rubric:\n{json.dumps(evaluation_rubric, indent=2)}"

    system = f"""You are an expert {role_type} evaluating a technical work sample.
Be objective, thorough, and constructive.
Respond ONLY with valid JSON:
{{
  "score": 78,
  "grade": "B+",
  "technical_quality": 80,
  "completeness": 75,
  "code_quality": 85,
  "problem_solving": 70,
  "strengths": ["strength1", "strength2"],
  "improvements": ["area1", "area2"],
  "summary": "Overall assessment in 2 sentences.",
  "pass": true
}}"""

    user = f"""Task:
{task_description[:1000]}
{rubric_text}

Submission:
{submission_content[:3000]}"""

    try:
        raw = _chat(system, user, json_mode=True)
        return json.loads(raw)
    except Exception as exc:
        log.error("work_sample_eval.error", error=str(exc))
        return {
            "score": 50, "grade": "C", "pass": False,
            "summary": "Evaluation failed — please review manually.",
            "strengths": [], "improvements": ["Manual review required"],
            "error": str(exc),
        }
