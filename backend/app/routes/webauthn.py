# backend/app/routes/webauthn.py
from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_user
from app.config import settings
from app.utils.mfa import issue_mfa_token
from supabase import create_client

from webauthn import (
    generate_registration_options,
    verify_registration_response,
    generate_authentication_options,
    verify_authentication_response,
)
from webauthn.helpers.structs import (
    PublicKeyCredentialCreationOptions,
    PublicKeyCredentialRequestOptions,
    PublicKeyCredentialRpEntity,
    PublicKeyCredentialUserEntity,
    PublicKeyCredentialParameters,
    PublicKeyCredentialDescriptor,
    AuthenticatorSelectionCriteria,
    AttestationConveyancePreference,
)

import os, base64

router = APIRouter(prefix="/webauthn", tags=["webauthn"])
sb = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

RP_ID = os.environ.get("RP_ID", "localhost")              # set to your apex domain in prod
RP_NAME = os.environ.get("RP_NAME", "Operation CODE 1983")

# In-memory challenge store for MVP (single-process). Replace with Redis/DB in prod.
_challenges: dict[str, str] = {}

def _b64url(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).decode().rstrip("=")

def _b64urldecode(s: str) -> bytes:
    pad = "=" * ((4 - (len(s) % 4)) % 4)
    return base64.urlsafe_b64decode(s + pad)

@router.post("/register/start")
async def start_registration(user=Depends(get_user)):
    uid = user["user_id"]
    user_entity = PublicKeyCredentialUserEntity(
        id=uid.encode(),
        name=uid,
        display_name=uid,
    )
    rp = PublicKeyCredentialRpEntity(id=RP_ID, name=RP_NAME)
    pub_key_cred_params = [PublicKeyCredentialParameters(alg=-7, type="public-key")]  # ES256

    options: PublicKeyCredentialCreationOptions = generate_registration_options(
        rp=rp,
        user=user_entity,
        authenticator_selection=AuthenticatorSelectionCriteria(
            resident_key="preferred",
            user_verification="preferred",
        ),
        attestation=AttestationConveyancePreference.NONE,
        pub_key_cred_params=pub_key_cred_params,
    )
    _challenges[uid] = _b64url(options.challenge)
    return {
        # serialize needed fields (avoid options_to_json to keep deps minimal)
        "rp": {"id": options.rp.id, "name": options.rp.name},
        "user": {"id": uid, "name": uid, "displayName": uid},
        "challenge": _challenges[uid],
        "attestation": "none",
        "pubKeyCredParams": [{"type": "public-key", "alg": -7}],
        "authenticatorSelection": {
            "residentKey": "preferred",
            "userVerification": "preferred",
        },
    }

@router.post("/register/finish")
async def finish_registration(payload: dict, user=Depends(get_user)):
    uid = user["user_id"]
    expected_challenge = _challenges.get(uid)
    if not expected_challenge:
        raise HTTPException(400, "Missing registration challenge")

    expected_origin = payload.get("origin") or f"https://{RP_ID}"

    verification = verify_registration_response(
        credential=payload,
        expected_challenge=expected_challenge,
        expected_rp_id=RP_ID,
        expected_origin=expected_origin,
        require_user_verification=False,
    )

    cred_id = verification.credential_id  # base64url str
    # credential_public_key is bytes in recent py-webauthn; store as base64url for portability
    public_key_bytes = verification.credential_public_key
    public_key_b64 = _b64url(public_key_bytes)

    # Persist credential
    sb.table("webauthn_credentials").insert({
        "user_id": uid,
        "credential_id": cred_id,
        "public_key": public_key_b64,
        "sign_count": 0,
    }).execute()

    _challenges.pop(uid, None)

    token = issue_mfa_token(uid)  # allow immediate sensitive actions post-enroll
    return {"ok": True, "mfa_token": token}

@router.post("/authenticate/start")
async def start_authentication(user=Depends(get_user)):
    uid = user["user_id"]

    # Build allowCredentials list so the browser can pick the right authenticator
    creds = sb.table("webauthn_credentials").select("*").eq("user_id", uid).execute().data or []
    allow: list[PublicKeyCredentialDescriptor] = []
    for c in creds:
        try:
            allow.append(
                PublicKeyCredentialDescriptor(
                    id=_b64urldecode(c["credential_id"]),
                    type="public-key",
                    transports=c.get("transports") or [],
                )
            )
        except Exception:
            # if stored id isn't base64url, try raw bytes fallback
            continue

    options: PublicKeyCredentialRequestOptions = generate_authentication_options(
        rp_id=RP_ID,
        user_verification="preferred",
        allow_credentials=allow if allow else None,
    )
    _challenges[uid] = _b64url(options.challenge)

    out = {
        "challenge": _challenges[uid],
        "rpId": RP_ID,
        "userVerification": "preferred",
    }
    if allow:
        out["allowCredentials"] = [
            {"type": "public-key", "id": _b64url(d.id), "transports": d.transports or []}
            for d in allow
        ]
    return out

@router.post("/authenticate/finish")
async def finish_authentication(payload: dict, user=Depends(get_user)):
    uid = user["user_id"]
    expected_challenge = _challenges.get(uid)
    if not expected_challenge:
        raise HTTPException(400, "Missing authentication challenge")

    creds = sb.table("webauthn_credentials").select("*").eq("user_id", uid).execute().data or []
    if not creds:
        raise HTTPException(400, "No credentials")

    cred = creds[0]
    expected_origin = payload.get("origin") or f"https://{RP_ID}"
    public_key = _b64urldecode(cred["public_key"]) if isinstance(cred["public_key"], str) else cred["public_key"]
    current_sign_count = int(cred.get("sign_count") or 0)

    verification = verify_authentication_response(
        credential=payload,
        expected_challenge=expected_challenge,
        expected_rp_id=RP_ID,
        expected_origin=expected_origin,
        credential_public_key=public_key,
        credential_current_sign_count=current_sign_count,
        require_user_verification=False,
    )

    # Update sign count if provided
    try:
        new_cnt = getattr(verification, "new_sign_count", None)
        if isinstance(new_cnt, int):
            sb.table("webauthn_credentials").update({"sign_count": new_cnt}).eq("id", cred["id"]).execute()
    except Exception:
        pass

    _challenges.pop(uid, None)
    mfa_token = issue_mfa_token(uid)
    return {"ok": True, "mfa_token": mfa_token}