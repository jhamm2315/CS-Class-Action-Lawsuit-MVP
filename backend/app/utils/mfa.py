from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from app.config import settings

_ALG = "HS256"

def issue_mfa_token(user_id: str, minutes: int = 10) -> str:
    now = datetime.now(timezone.utc)
    payload = {"sub": user_id, "scope": "mfa", "iat": int(now.timestamp()), "exp": int((now + timedelta(minutes=minutes)).timestamp())}
    return jwt.encode(payload, settings.BACKEND_SECRET, algorithm=_ALG)

def verify_mfa_token(token: str, user_id: str) -> bool:
    try:
        data = jwt.decode(token, settings.BACKEND_SECRET, algorithms=[_ALG])
        return data.get("scope") == "mfa" and data.get("sub") == user_id
    except JWTError:
        return False