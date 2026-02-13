from fastapi import APIRouter, HTTPException
from jose import jwt
from datetime import datetime, timedelta, timezone
from app.config import settings
from app.utils.mfa import issue_mfa_token

router = APIRouter(prefix="/dev", tags=["dev"])

@router.post("/login")
async def dev_login(payload: dict):
    if not settings.DEV_AUTH_ENABLED:
        raise HTTPException(404, "Not found")

    username = (payload.get("username") or "").strip().lower()
    password = (payload.get("password") or "").strip().lower()
    if not (username == "ok" and password == "ok"):
        raise HTTPException(401, "Bad credentials")

    # Stable dev user id (doesn't need to exist in Supabase auth)
    user_id = "00000000-0000-0000-0000-000000000001"
    now = datetime.now(timezone.utc)
    exp = now + timedelta(hours=2)

    claims = {
        "sub": user_id,
        "aud": settings.SUPABASE_JWT_AUD or "authenticated",
        "iss": settings.SUPABASE_JWT_ISSUER or "dev-login",
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
        "email": "dev@local",
    }
    # Signature isn't verified by get_user (it reads unverified claims), but we sign anyway.
    access_token = jwt.encode(claims, settings.BACKEND_SECRET, algorithm="HS256")
    mfa_token = issue_mfa_token(user_id, minutes=30)
    return {"access_token": access_token, "mfa_token": mfa_token, "user_id": user_id, "exp": exp.isoformat()}