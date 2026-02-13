# backend/app/auth.py
from typing import Optional

from fastapi import Depends, HTTPException, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt
import httpx

from .config import settings
from .utils.mfa import verify_mfa_token

bearer = HTTPBearer()

async def get_user(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    token = creds.credentials
    try:
        # Lightweight verification: check aud & iss (Supabase already signs)
        claims = jwt.get_unverified_claims(token)
        if claims.get("aud") != settings.SUPABASE_JWT_AUD:
            raise ValueError("bad aud")
        if settings.SUPABASE_JWT_ISSUER and claims.get("iss") != settings.SUPABASE_JWT_ISSUER:
            raise ValueError("bad iss")

        user_id = claims.get("sub")
        if not user_id:
            raise ValueError("no sub")

        # Fetch role from profiles (via Supabase RPC)
        async with httpx.AsyncClient() as c:
            r = await c.post(
                f"{settings.SUPABASE_URL}/rest/v1/rpc/get_role",
                headers={
                    "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                    "Content-Type": "application/json",
                },
                json={"uid": user_id},
            )
            if r.status_code == 404:
                role = "user"
            else:
                r.raise_for_status()
                data = r.json()
                role = data.get("role", "user") if isinstance(data, dict) else "user"

        return {"user_id": user_id, "role": role, "token": token}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or missing auth")


async def require_mfa(
    user: dict = Depends(get_user),
    x_mfa: Optional[str] = Header(default=None),  # expects 'X-MFA' header
):
    if not x_mfa or not verify_mfa_token(x_mfa, user["user_id"]):
        raise HTTPException(status_code=403, detail="MFA required")
    return user