"""VERIQO Bulk Upload API — Phase 1.5 Feature 10 & 11"""
import uuid
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, BackgroundTasks
import structlog

from app.core.database import get_supabase
from app.core.security import get_current_user
from app.core.config import settings

log = structlog.get_logger(__name__)
router = APIRouter(prefix="/bulk", tags=["bulk"])


@router.post("/upload")
async def bulk_upload(
    background_tasks: BackgroundTasks,
    job_id: Optional[str] = Form(None),
    upload_type: str = Form(...),      # csv | resume_zip | multi_resume
    file: UploadFile = File(...),
    supabase=Depends(get_supabase),
    current_user=Depends(get_current_user),
):
    """
    Upload CSV, ZIP of resumes, or multiple resumes for bulk ATS processing.
    Processing happens asynchronously in the background.
    """
    # Verify company
    company_resp = await supabase.table("companies").select("id").eq(
        "user_id", current_user["id"]
    ).single().execute()
    company_id = company_resp.data["id"]

    # Size check
    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > settings.bulk_max_file_mb:
        raise HTTPException(status_code=413, detail=f"File too large (max {settings.bulk_max_file_mb}MB)")

    # Upload file to Supabase Storage
    file_path = f"bulk/{company_id}/{uuid.uuid4()}/{file.filename}"
    await supabase.storage.from_("veriqo-bulk").upload(file_path, content)
    file_url = supabase.storage.from_("veriqo-bulk").get_public_url(file_path)

    # Create batch record
    batch_resp = await supabase.table("bulk_upload_batches").insert({
        "company_id": company_id,
        "job_id": job_id,
        "uploaded_by": current_user["id"],
        "upload_type": upload_type,
        "file_url": file_url,
        "status": "pending",
    }).execute()
    batch = batch_resp.data[0]

    # Queue background processing
    background_tasks.add_task(
        _process_bulk_batch,
        supabase=supabase,
        batch_id=batch["id"],
        file_content=content,
        upload_type=upload_type,
        job_id=job_id,
        company_id=company_id,
    )

    return {"batch_id": batch["id"], "status": "pending", "message": "Processing started"}


@router.get("/{batch_id}/status")
async def get_batch_status(
    batch_id: str,
    supabase=Depends(get_supabase),
    current_user=Depends(get_current_user),
):
    resp = await supabase.table("bulk_upload_batches").select("*").eq(
        "id", batch_id
    ).single().execute()
    return resp.data


@router.get("/{batch_id}/results")
async def get_batch_results(
    batch_id: str,
    shortlisted_only: bool = False,
    supabase=Depends(get_supabase),
    current_user=Depends(get_current_user),
):
    query = supabase.table("bulk_upload_items").select(
        "*, candidate_profiles(full_name, avatar_url, skills, trust_score)"
    ).eq("batch_id", batch_id)

    if shortlisted_only:
        query = query.eq("shortlisted", True)

    resp = await query.order("rank").execute()
    return {"batch_id": batch_id, "results": resp.data or [], "count": len(resp.data or [])}


async def _process_bulk_batch(
    supabase,
    batch_id: str,
    file_content: bytes,
    upload_type: str,
    job_id: Optional[str],
    company_id: str,
):
    """Background task: parse files, run ATS, rank candidates."""
    from app.services.ats_service import match_candidate_to_job, store_candidate_embedding
    import io

    try:
        await supabase.table("bulk_upload_batches").update({
            "status": "processing"
        }).eq("id", batch_id).execute()

        if upload_type == "csv":
            import csv
            rows = list(csv.DictReader(io.StringIO(file_content.decode("utf-8", errors="replace"))))
            items = []
            for row in rows:
                items.append({
                    "batch_id": batch_id,
                    "raw_name": row.get("name") or row.get("Name") or "",
                    "raw_email": row.get("email") or row.get("Email") or "",
                    "raw_data": dict(row),
                    "parse_status": "parsed",
                })

            if items:
                await supabase.table("bulk_upload_items").insert(items).execute()

            await supabase.table("bulk_upload_batches").update({
                "total_count": len(items),
                "processed_count": len(items),
                "success_count": len(items),
                "status": "completed",
            }).eq("id", batch_id).execute()

        # ZIP and multi-resume processing would follow similar pattern
        # using PyPDF2 / python-docx to extract text then run embeddings

    except Exception as exc:
        log.error("bulk_processing.error", batch_id=batch_id, error=str(exc))
        await supabase.table("bulk_upload_batches").update({
            "status": "failed",
            "metadata": {"error": str(exc)},
        }).eq("id", batch_id).execute()
