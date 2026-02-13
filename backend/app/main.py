from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.ingestion.supabase_insert import insert_signature
from app.routes import webauthn, upload, citations, analyze, match_cases, generate_motion
from app.config import settings
from app.middleware.rate_limit import RateLimitMiddleware
from app.routes import rag_motion
from app.routes import metrics
from app.routes import rag_motion, metrics
from app.routes import shares
from app.routes import admin
from app.routes import dev_auth
from app.routes import doh
from app.auth import require_mfa, get_user
import uvicorn
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

app = FastAPI(title="Operation CODE 1983 API")

# Allow frontend calls (adjust origin for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CORS_ORIGINS],  # Change to specific domain in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app = FastAPI(title="Operation CODE 1983 API")
app.include_router(analyze.router)
app.include_router(match_cases.router)
app.include_router(generate_motion.router)
app.include_router(rag_motion.router)
app.include_router(metrics.router)
app.include_router(rag_motion.router)
app.include_router(metrics.router)
app.include_router(shares.router)
app.include_router(admin.router)
app.include_router(dev_auth.router)
app.include_router(doh.router)

# Basic rate limit (per-IP sliding window)
app.add_middleware(RateLimitMiddleware, max_requests=60, window_seconds=60)

# Routers
app.include_router(webauthn.router)
app.include_router(upload.router)
app.include_router(citations.router)
app.include_router(analyze.router)
app.include_router(match_cases.router)
app.include_router(generate_motion.router)

# Define schema for incoming form data
class Signature(BaseModel):
    full_name: str
    email: str
    state: str
    zip_code: str
    has_experienced_unfairness: bool
    description: str
    consent_to_contact: bool

@app.post("/submit")
async def submit_signature(data: Signature):
    try:
        result = insert_signature(data)
        return {"status": "success", "message": "Signature submitted", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# For local dev
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)