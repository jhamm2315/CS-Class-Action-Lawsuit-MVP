from fastapi import APIRouter, Depends, HTTPException
from supabase import create_client
from app.config import settings
from app.auth import require_mfa
import time

router = APIRouter(prefix="/uploads", tags=["storage"])
sb = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

@router.post("/signed-url")
async def create_signed_upload(payload: dict, user=Depends(require_mfa)):
    """
    Client asks for a signed URL; we namespace by user_id to enforce isolation.
    payload = { "filename": "evidence.pdf", "content_type": "application/pdf" }
    """
    uid = user["user_id"]
    filename = payload.get("filename")
    if not filename:
        raise HTTPException(400, "filename required")
    key = f"{uid}/{int(time.time())}_{filename}"
    # Supabase Storage doesn't do PUT pre-signing like S3; we return a signed URL for GET and use upload via API.
    # For simplicity, use service role for server-side upload endpoint in MVP, or client can upload via supabase-js with user token.
    signed = sb.storage.from_(settings.STORAGE_UPLOADS_BUCKET).create_signed_url(key, 60 * 15)
    return {"path": key, "signed_url": signed.get("signedURL")}