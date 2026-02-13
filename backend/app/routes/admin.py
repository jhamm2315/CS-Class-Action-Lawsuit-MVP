from fastapi import APIRouter, Depends, HTTPException
from supabase import create_client
from app.config import settings
from app.auth import get_user

router = APIRouter(prefix="/admin", tags=["admin"])
sb = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

def _require_curator(user):
    if user.get("role") not in ("curator","admin"):
        raise HTTPException(403, "Curator/Admin role required")

@router.get("/cases")
async def list_cases(user=Depends(get_user)):
    _require_curator(user)
    res = sb.table("federal_case_library").select("*").limit(200).execute()
    return res.data or []

@router.post("/cases")
async def upsert_case(payload: dict, user=Depends(get_user)):
    _require_curator(user)
    # if id present -> update; else insert
    res = sb.table("federal_case_library").upsert(payload).execute()
    return {"ok": True, "count": len(res.data or [])}

@router.delete("/cases/{id}")
async def delete_case(id: str, user=Depends(get_user)):
    _require_curator(user)
    sb.table("federal_case_library").delete().eq("id", id).execute()
    return {"ok": True}

@router.get("/templates")
async def list_templates(user=Depends(get_user)):
    _require_curator(user)
    res = sb.table("motion_templates").select("*").limit(200).execute()
    return res.data or []

@router.post("/templates")
async def upsert_template(payload: dict, user=Depends(get_user)):
    _require_curator(user)
    res = sb.table("motion_templates").upsert(payload).execute()
    return {"ok": True, "count": len(res.data or [])}

@router.delete("/templates/{id}")
async def delete_template(id: str, user=Depends(get_user)):
    _require_curator(user)
    sb.table("motion_templates").delete().eq("id", id).execute()
    return {"ok": True}