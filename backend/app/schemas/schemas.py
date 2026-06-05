from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ── Enums ─────────────────────────────────────────────────────
class UserRole(str, Enum):
    candidate = "candidate"
    employer  = "employer"
    expert    = "expert"
    admin     = "admin"


class VerificationStatus(str, Enum):
    unverified  = "unverified"
    pending     = "pending"
    in_progress = "in_progress"
    verified    = "verified"
    failed      = "failed"
    expired     = "expired"


class FraudRisk(str, Enum):
    low    = "low"
    medium = "medium"
    high   = "high"


class JobStatus(str, Enum):
    draft  = "draft"
    active = "active"
    paused = "paused"
    closed = "closed"


class JobType(str, Enum):
    full_time  = "full_time"
    part_time  = "part_time"
    contract   = "contract"
    freelance  = "freelance"
    internship = "internship"


class WorkMode(str, Enum):
    onsite = "onsite"
    remote = "remote"
    hybrid = "hybrid"


class FinalRecommendation(str, Enum):
    highly_recommended = "highly_recommended"
    recommended        = "recommended"
    conditional        = "conditional"
    not_recommended    = "not_recommended"


# ── Base ───────────────────────────────────────────────────────
class BaseResponse(BaseModel):
    success: bool = True
    message: str  = "OK"


class PaginationParams(BaseModel):
    page:     int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)


class PaginatedResponse(BaseModel):
    data:        list
    count:       int
    page:        int
    per_page:    int
    total_pages: int


# ── Candidate Profile ─────────────────────────────────────────
class CandidateProfileCreate(BaseModel):
    full_name:           str
    phone:               Optional[str] = None
    location:            Optional[str] = None
    headline:            Optional[str] = Field(None, max_length=120)
    summary:             Optional[str] = Field(None, max_length=1000)
    github_url:          Optional[str] = None
    linkedin_url:        Optional[str] = None
    portfolio_url:       Optional[str] = None
    years_of_experience: Optional[int] = Field(None, ge=0, le=50)
    current_salary:      Optional[int] = Field(None, ge=0)
    expected_salary:     Optional[int] = Field(None, ge=0)
    notice_period_days:  Optional[int] = Field(None, ge=0, le=180)
    open_to_relocation:  bool = False
    skills:              List[str] = []


class CandidateProfileUpdate(CandidateProfileCreate):
    full_name: Optional[str] = None  # type: ignore[assignment]


class CandidateProfileResponse(CandidateProfileCreate):
    id:                  str
    user_id:             str
    email:               str
    verification_status: VerificationStatus = VerificationStatus.unverified
    trust_score:         Optional[float] = None
    ats_score:           Optional[float] = None
    portfolio_score:     Optional[float] = None
    work_sample_score:   Optional[float] = None
    technical_score:     Optional[float] = None
    communication_score: Optional[float] = None
    reliability_score:   Optional[float] = None
    fraud_risk:          Optional[FraudRisk] = None
    fraud_score:         Optional[float] = None
    joining_probability: Optional[float] = None
    passport_id:         Optional[str] = None
    created_at:          datetime
    updated_at:          datetime


# ── Interest Confirmation ─────────────────────────────────────
class InterestConfirmationCreate(BaseModel):
    application_id:      str
    interested:          bool
    current_salary:      int = Field(..., ge=0)
    expected_salary:     int = Field(..., ge=0)
    notice_period_days:  int = Field(..., ge=0, le=180)
    open_to_relocation:  bool
    has_other_offers:    bool
    other_offers_details: Optional[str] = None


# ── Job ───────────────────────────────────────────────────────
class JobCreate(BaseModel):
    title:            str = Field(..., min_length=2)
    description:      str = Field(..., min_length=50)
    requirements:     List[str] = []
    skills_required:  List[str] = []
    location:         Optional[str] = None
    job_type:         JobType = JobType.full_time
    work_mode:        WorkMode = WorkMode.hybrid
    salary_min:       Optional[int] = Field(None, ge=0)
    salary_max:       Optional[int] = Field(None, ge=0)
    experience_min:   Optional[int] = Field(None, ge=0)
    experience_max:   Optional[int] = Field(None, ge=50)


class JobResponse(JobCreate):
    id:               str
    company_id:       str
    status:           JobStatus = JobStatus.draft
    applicant_count:  int = 0
    shortlisted_count: int = 0
    created_at:       datetime
    updated_at:       datetime


# ── ATS ───────────────────────────────────────────────────────
class ATSMatchRequest(BaseModel):
    job_id:       str
    candidate_ids: Optional[List[str]] = None  # None = match all
    top_k:        int = Field(default=10, ge=1, le=100)


class ATSMatchResult(BaseModel):
    candidate_id:  str
    candidate_name: str
    ats_score:     float
    matched_skills: List[str]
    missing_skills: List[str]
    rank:          int


class ATSMatchResponse(BaseModel):
    job_id:   str
    results:  List[ATSMatchResult]
    total:    int
    duration_ms: float


# ── Candidate Passport ────────────────────────────────────────
class PassportResponse(BaseModel):
    id:                   str
    passport_id:          str
    candidate_id:         str
    ats_score:            float
    portfolio_score:      float
    work_sample_score:    float
    technical_score:      float
    communication_score:  float
    reliability_score:    float
    fraud_risk:           FraudRisk
    fraud_score:          float
    joining_probability:  float
    overall_trust_score:  float
    verification_status:  VerificationStatus
    final_recommendation: FinalRecommendation
    verified_at:          Optional[datetime]
    share_url:            Optional[str]
    created_at:           datetime


# ── Verification ──────────────────────────────────────────────
class VerificationStageUpdate(BaseModel):
    stage:    str
    status:   str
    score:    Optional[float] = None
    feedback: Optional[str] = None


# ── Fraud Detection ───────────────────────────────────────────
class FraudDetectionResult(BaseModel):
    candidate_id:     str
    fraud_score:      float  # 0-100, lower is safer
    fraud_risk:       FraudRisk
    flags:            List[str]
    checks_passed:    List[str]
    checks_failed:    List[str]
    recommendation:   str


# ── Company ───────────────────────────────────────────────────
class CompanyCreate(BaseModel):
    name:        str
    website:     Optional[str] = None
    industry:    Optional[str] = None
    size:        Optional[str] = None
    description: Optional[str] = Field(None, max_length=1000)


class CompanyResponse(CompanyCreate):
    id:                  str
    user_id:             str
    verified:            bool = False
    subscription_plan:   str = "free"
    subscription_status: str = "trial"
    created_at:          datetime
