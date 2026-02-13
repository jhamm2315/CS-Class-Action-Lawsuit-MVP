# backend/app/routes/rag_motion.py
from fastapi import APIRouter, Depends, HTTPException
from app.auth import require_mfa
from app.routes.match_cases import match_cases as match_rpc
from app.services.rag import generate_motion_html
from app.services.pdf import render_pdf  


router = APIRouter(prefix="/rag", tags=["motion"])

@router.post("/generate_motion")
async def rag_generate(payload: dict, user=Depends(require_mfa)):
    title = payload.get("title", "Motion to Dismiss")
    facts = payload.get("facts", "")
    n = int(payload.get("n", 3))
    # get matches (server path to reuse logic)
    result = await match_rpc({"text": facts, "n": n}, user)
    matches = result.get("matches", [])
    if not matches:
        raise HTTPException(400, "No matching winning cases found")
    motion = await generate_motion_html(title, facts, matches)
    if not motion["ok"]:
        raise HTTPException(400, motion["reason"])
    pdf_bytes, sha = render_pdf(motion["html"])
    return {
        "html": motion["html"],
        "allowed_citations": motion["allowed"],
        "pdf_hex": pdf_bytes.hex(),
        "sha256": sha,
    }