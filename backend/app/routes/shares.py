from fastapi import APIRouter, Depends, HTTPException
from supabase import create_client
from app.config import settings
from app.auth import require_mfa, get_user
import secrets, datetime as dt

router = APIRouter(prefix="/shares", tags=["shares"])
sb = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

@router.post("/create")
async def create_share(payload: dict, user=Depends(require_mfa)):
    motion_id = payload.get("motion_id")
    ttl = int(payload.get("ttl_minutes", 60))
    if not motion_id: raise HTTPException(400, "motion_id required")
    secret = secrets.token_urlsafe(24)
    exp = (dt.datetime.utcnow() + dt.timedelta(minutes=ttl)).isoformat() + "Z"
    sb.table("secure_shares").insert({
        "motion_id": motion_id,
        "one_time_secret": secret,
        "expires_at": exp
    }).execute()
    return {"url": f"/share/{secret}"}  # frontend route

@router.get("/redeem/{secret}")
async def redeem(secret: str):
    row = sb.table("secure_shares").select("*").eq("one_time_secret", secret).maybe_single().execute().data
    if not row:
        raise HTTPException(404, "Not found")
    if row.get("redeemed"):
        raise HTTPException(410, "Already redeemed")
    exp = row["expires_at"]
    if exp and dt.datetime.fromisoformat(exp.replace("Z","+00:00")) < dt.datetime.now(dt.timezone.utc):
        raise HTTPException(410, "Expired")

    # look up the motion's pdf path
    mot = sb.table("generated_motions").select("pdf_path").eq("id", row["motion_id"]).maybe_single().execute().data
    if not mot or not mot.get("pdf_path"):
        raise HTTPException(404, "Missing PDF")

    # mark redeemed
    sb.table("secure_shares").update({"redeemed": True}).eq("id", row["id"]).execute()

    # generate a short signed URL for the PDF
    signed = sb.storage.from_(settings.STORAGE_PDF_BUCKET).create_signed_url(mot["pdf_path"], 60*10)
    return {"signed_url": signed.get("signedURL")}