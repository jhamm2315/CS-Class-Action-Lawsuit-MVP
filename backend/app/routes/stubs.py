# backend/app/routers/stubs.py
from fastapi import APIRouter

router = APIRouter(tags=["stubs"])

@router.post("/analyze")
async def analyze():
    return {"summary": "(stub) summary", "issues": ["due_process", "1983"]}

@router.post("/match_cases")
async def match_cases():
    return {
        "cases": [
            {"case_name": "Stub v. State", "match": 0.82, "citation": "000 U.S. 000", "link": "#"}
        ]
    }

@router.get("/templates")
async def templates():
    return {"items": [{"id": "due_process_md", "title": "Due Process Motion"}]}

@router.post("/generate_motion")
async def generate_motion():
    return {"id": "stub-motion-1", "pdf_url": "/downloads/stub.pdf"}

@router.post("/redactions/detect")
async def redact_detect():
    return {"entities": [{"type": "SSN", "text": "***-**-1234"}]}

@router.post("/redactions/apply")
async def redact_apply():
    return {"file_hash": "abc123", "status": "ok"}

@router.get("/library/search")
async def lib_search(q: str = ""):
    return {
        "results": [
            {"case_name": "Smith v. Jones", "citation": "123 F.3d 456", "link": "#"}
        ]
    }

@router.get("/petition/stats")
async def petition_stats():
    return {"count": 12, "by_state": {"CA": 5, "TX": 3}}

@router.post("/petition/opt_in")
async def petition_opt_in():
    return {"ok": True}

@router.get("/me/settings")
async def get_settings():
    return {"retention_days": 30, "lang": "en"}

@router.put("/me/settings")
async def put_settings():
    return {"ok": True}