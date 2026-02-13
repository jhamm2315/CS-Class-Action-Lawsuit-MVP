# backend/app/routes/match_cases.py
from fastapi import APIRouter, Depends, HTTPException
from supabase import create_client
from app.config import settings
from app.auth import get_user
from app.services.embeddings import embed_texts

router = APIRouter(prefix="/match_cases", tags=["match"])
sb = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

@router.post("")
async def match_cases(payload: dict, user=Depends(get_user)):
    text = payload.get("text", "")
    embedding = payload.get("embedding")
    n = int(payload.get("n", 3))
    if not embedding:
        if not text:
            raise HTTPException(400, "Provide 'text' or precomputed 'embedding'")
        embedding = (await embed_texts([text]))[0]
    # Supabase RPC requires vector as array -> postgres vector literal
    # The supabase-py client converts JSON array fine.
    res = sb.rpc("match_federal_cases", {"query": embedding, "n": n}).execute()
    return {"matches": res.data or []}