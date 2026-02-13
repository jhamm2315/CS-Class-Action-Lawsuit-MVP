from fastapi import APIRouter
router = APIRouter(prefix="/analyze")

@router.post("")
async def analyze_facts(payload: dict):
    text = payload.get("text", "")
    return {"summary": text[:400], "sentiment": {"resolve": 0.8}}