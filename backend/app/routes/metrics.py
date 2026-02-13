# backend/app/routes/metrics.py
from fastapi import APIRouter, Depends
from supabase import create_client
from app.config import settings
from app.auth import get_user

router = APIRouter(prefix="/metrics", tags=["metrics"])
sb = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

@router.get("/public")
async def public_metrics():
    v = sb.table("v_public_metrics").select("*").execute()
    heat = sb.table("v_state_activity").select("*").execute()
    return {"totals": v.data[0] if v.data else {}, "heatmap": heat.data or []}

@router.get("/private")
async def private_metrics(user=Depends(get_user)):
    # Example: user's own counts
    cases = sb.table("user_cases").select("id", count="exact").eq("user_id", user["user_id"]).execute()
    motions = sb.table("generated_motions").select("id", count="exact").execute()
    return {
        "my_cases": cases.count or 0,
        "my_motions": motions.count or 0
    }

@router.get("/class_action/{threshold}")
async def class_action(threshold: int, user=Depends(get_user)):
    # any authenticated user can see the states that reached the threshold
    res = sb.rpc("class_action_trigger_states", {"threshold": threshold}).execute()
    return {"triggered": res.data or []}