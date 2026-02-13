from fastapi import APIRouter
from weasyprint import HTML
import hashlib

router = APIRouter(prefix="/generate_motion")

@router.post("")
async def generate_motion(payload: dict):
    html = payload.get("html", "<p>Empty</p>")
    pdf_bytes = HTML(string=html).write_pdf()
    sha = hashlib.sha256(pdf_bytes).hexdigest()
    return {"sha256": sha, "pdf_hex": pdf_bytes.hex()}