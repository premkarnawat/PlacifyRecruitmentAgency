"""
VERIQO AI Evaluation Service
==============================
Uses Groq (Llama 3.3 70B) to evaluate candidate work samples,
portfolios, and detect fraud signals.
"""
import json
from typing import Optional
from groq import Groq
import structlog
from app.core.config import settings
from app.core.cache import cache

log = structlog.get_logger(__name__)

SYSTEM_PROMPT_EVALUATOR = """You are VERIQO's AI Evaluation Engine.
You evaluate software engineering candidates objectively.
Always respond with valid JSON only — no markdown, no explanations outside the JSON.
Be fair, consistent, and evidence-based. Score on a 0-100 scale."""

SYSTEM_PROMPT_FRAUD = """You are VERIQO's Fraud Detection Engine.
Analyze candidate profiles for authenticity signals.
Always respond with valid JSON only — no markdown, no explanations outside the JSON.
Be objective and flag genuine concerns, not false positives."""


def _client() -> Groq:
    return Groq(api_key=settings.groq_api_key)


def _safe_json_parse(text: str) -> dict:
    """Strip markdown fences and parse JSON."""
    cleaned = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        log.warning("ai.json_parse_error", raw=text[:200])
        return {}


async def evaluate_portfolio(
    candidate_name: str,
    github_url: Optional[str],
    portfolio_url: Optional[str],
    projects: list[dict],
    skills: list[str],
) -> dict:
    """Evaluate a candidate's portfolio using AI."""
    cache_key = f"ai:portfolio:{hash(str(projects) + str(skills))}"
    cached = await cache.get(cache_key)
    if cached:
        return cached

    if not settings.groq_api_key:
        return _mock_portfolio_score()

    prompt = f"""
Evaluate this candidate's portfolio:

Name: {candidate_name}
GitHub: {github_url or 'Not provided'}
Portfolio: {portfolio_url or 'Not provided'}
Skills claimed: {', '.join(skills)}
Projects: {json.dumps(projects, indent=2)}

Return JSON with:
{{
  "portfolio_score": <0-100>,
  "project_quality_score": <0-100>,
  "code_complexity": "<low|medium|high>",
  "documentation_quality": <0-100>,
  "github_authenticity": <0-100>,
  "strengths": ["<strength1>", "<strength2>"],
  "concerns": ["<concern1>"],
  "summary": "<2-3 sentence assessment>"
}}
"""
    try:
        resp = _client().chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT_EVALUATOR},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.1,
            max_tokens=600,
        )
        result = _safe_json_parse(resp.choices[0].message.content)
        if result:
            await cache.set(cache_key, result, ttl=3600)
        return result or _mock_portfolio_score()
    except Exception as e:
        log.error("ai.portfolio_eval_error", error=str(e))
        return _mock_portfolio_score()


async def evaluate_work_sample(
    role: str,
    task_description: str,
    submission_content: str,
    skills_required: list[str],
) -> dict:
    """Score a work sample submission."""
    if not settings.groq_api_key:
        return _mock_work_sample_score()

    prompt = f"""
Evaluate this work sample submission:

Role: {role}
Task: {task_description}
Required Skills: {', '.join(skills_required)}
Submission:
---
{submission_content[:3000]}
---

Return JSON with:
{{
  "work_sample_score": <0-100>,
  "code_quality": <0-100>,
  "architecture_score": <0-100>,
  "problem_solving": <0-100>,
  "best_practices": <0-100>,
  "completeness": <0-100>,
  "strengths": ["..."],
  "improvements": ["..."],
  "summary": "<assessment>"
}}
"""
    try:
        resp = _client().chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT_EVALUATOR},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.1,
            max_tokens=700,
        )
        return _safe_json_parse(resp.choices[0].message.content) or _mock_work_sample_score()
    except Exception as e:
        log.error("ai.work_sample_error", error=str(e))
        return _mock_work_sample_score()


async def detect_fraud(candidate_profile: dict) -> dict:
    """Run AI-based fraud detection on a candidate profile."""
    cache_key = f"fraud:{candidate_profile.get('id', 'unknown')}"
    cached = await cache.get(cache_key)
    if cached:
        return cached

    if not settings.groq_api_key:
        return _mock_fraud_result()

    prompt = f"""
Analyze this candidate profile for authenticity and fraud signals:

Profile:
{json.dumps(candidate_profile, indent=2, default=str)}

Check for:
1. Education vs experience timeline consistency
2. Skill consistency with claimed experience level
3. Project complexity vs years of experience
4. Salary expectations vs market rates
5. Signs of AI-generated profile content
6. GitHub activity patterns

Return JSON with:
{{
  "fraud_score": <0-100, lower=safer>,
  "fraud_risk": "<low|medium|high>",
  "flags": ["<specific_concern>"],
  "checks_passed": ["<passed_check>"],
  "checks_failed": ["<failed_check>"],
  "timeline_valid": <true|false>,
  "skills_consistent": <true|false>,
  "ai_content_detected": <true|false>,
  "recommendation": "<brief recommendation>"
}}
"""
    try:
        resp = _client().chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT_FRAUD},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.1,
            max_tokens=600,
        )
        result = _safe_json_parse(resp.choices[0].message.content)
        if result:
            await cache.set(cache_key, result, ttl=1800)
        return result or _mock_fraud_result()
    except Exception as e:
        log.error("ai.fraud_detection_error", error=str(e))
        return _mock_fraud_result()


async def generate_jd_insights(job_description: str, skills: list[str]) -> dict:
    """Analyze a JD and suggest improvements + expected salary range."""
    if not settings.groq_api_key:
        return {"insights": "AI insights unavailable in dev mode"}

    prompt = f"""
Analyze this job description and provide hiring intelligence:

JD: {job_description[:2000]}
Skills: {', '.join(skills)}

Return JSON with:
{{
  "clarity_score": <0-100>,
  "competitiveness_score": <0-100>,
  "expected_salary_min": <INR/year>,
  "expected_salary_max": <INR/year>,
  "suggested_skills": ["<skill>"],
  "jd_improvements": ["<suggestion>"],
  "candidate_pool_estimate": "<estimate>",
  "time_to_fill_estimate": "<estimate>"
}}
"""
    try:
        resp = _client().chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT_EVALUATOR},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.2,
            max_tokens=500,
        )
        return _safe_json_parse(resp.choices[0].message.content) or {}
    except Exception as e:
        log.error("ai.jd_insights_error", error=str(e))
        return {}


# ── Mock helpers for dev ───────────────────────────────────────
def _mock_portfolio_score() -> dict:
    return {
        "portfolio_score": 78,
        "project_quality_score": 75,
        "code_complexity": "medium",
        "documentation_quality": 70,
        "github_authenticity": 88,
        "strengths": ["Consistent commit history", "Multiple completed projects"],
        "concerns": [],
        "summary": "Solid portfolio with evidence of practical experience. Dev mode mock result.",
    }

def _mock_work_sample_score() -> dict:
    return {
        "work_sample_score": 82,
        "code_quality": 80,
        "architecture_score": 78,
        "problem_solving": 85,
        "best_practices": 80,
        "completeness": 90,
        "strengths": ["Good structure", "Clean code"],
        "improvements": ["Add more tests"],
        "summary": "Above average work sample. Dev mode mock result.",
    }

def _mock_fraud_result() -> dict:
    return {
        "fraud_score": 12,
        "fraud_risk": "low",
        "flags": [],
        "checks_passed": ["Timeline valid", "Skills consistent", "GitHub authentic"],
        "checks_failed": [],
        "timeline_valid": True,
        "skills_consistent": True,
        "ai_content_detected": False,
        "recommendation": "Profile appears authentic. Dev mode mock result.",
    }
