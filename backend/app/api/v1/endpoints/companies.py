from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from datetime import datetime, timezone
import structlog

from app.core.security import get_current_user, require_employer
from app.core.database import get_supabase
from app.schemas.schemas import CompanyCreate, CompanyResponse

router = APIRouter(prefix="/companies", tags=["Companies"])
log    = structlog.get_logger(__name__)


@router.get("/me", response_model=CompanyResponse)
async def get_my_company(current_user: dict = Depends(require_employer)):
    """Get the authenticated employer's company profile."""
    db   = get_supabase()
    resp = db.table("companies").select("*").eq("user_id", current_user["user_id"]).single().execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Company profile not found")
    return resp.data


@router.post("/me", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_company(body: CompanyCreate, current_user: dict = Depends(require_employer)):
    """Create employer company profile."""
    db  = get_supabase()
    now = datetime.now(timezone.utc).isoformat()

    data = {
        **body.model_dump(),
        "user_id":             current_user["user_id"],
        "verified":            False,
        "subscription_plan":   "trial",
        "subscription_status": "trial",
        "created_at":          now,
        "updated_at":          now,
    }

    resp = db.table("companies").upsert(data, on_conflict="user_id").execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Failed to create company")
    return resp.data[0]


@router.patch("/me", response_model=CompanyResponse)
async def update_company(body: CompanyCreate, current_user: dict = Depends(require_employer)):
    """Update company profile."""
    db   = get_supabase()
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    data["updated_at"] = datetime.now(timezone.utc).isoformat()

    resp = db.table("companies").update(data).eq("user_id", current_user["user_id"]).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Company not found")
    return resp.data[0]


@router.post("/me/logo")
async def upload_logo(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_employer),
):
    """Upload company logo."""
    if file.content_type not in ("image/png", "image/jpeg", "image/webp", "image/svg+xml"):
        raise HTTPException(status_code=400, detail="Only PNG, JPEG, WebP, or SVG files are accepted")

    db      = get_supabase()
    content = await file.read()
    path    = f"logos/{current_user['user_id']}/{file.filename}"

    db.storage.from_("company-assets").upload(path, content, {"content-type": file.content_type})
    public_url = db.storage.from_("company-assets").get_public_url(path)

    db.table("companies").update({
        "logo_url":   public_url,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("user_id", current_user["user_id"]).execute()

    return {"logo_url": public_url}


@router.get("/me/dashboard-stats")
async def get_dashboard_stats(current_user: dict = Depends(require_employer)):
    """Get aggregated dashboard statistics for the employer."""
    db   = get_supabase()
    comp = db.table("companies").select("id").eq("user_id", current_user["user_id"]).single().execute()
    if not comp.data:
        raise HTTPException(status_code=404, detail="Company not found")

    company_id = comp.data["id"]

    jobs_resp = db.table("jobs").select("id, status, applicant_count, shortlisted_count").eq(
        "company_id", company_id
    ).execute()
    jobs = jobs_resp.data or []

    active_jobs     = sum(1 for j in jobs if j["status"] == "active")
    total_applicants = sum(j.get("applicant_count", 0) for j in jobs)
    shortlisted      = sum(j.get("shortlisted_count", 0) for j in jobs)

    return {
        "total_jobs":          len(jobs),
        "active_jobs":         active_jobs,
        "total_applicants":    total_applicants,
        "total_shortlisted":   shortlisted,
        "subscription_status": "trial",
    }
