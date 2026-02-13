from fastapi import APIRouter, Depends
from app.auth import get_user
from app.services.courtlistener import lookup_citation

router = APIRouter(prefix="/citations", tags=["citations"])

@router.post("/verify")
async def verify_citations(payload: dict, user=Depends(get_user)):
    cites = payload.get("citations", [])
    results = []
    for c in cites[:20]:
        res = await lookup_citation(c)
        results.append(res)
    return {"results": results}