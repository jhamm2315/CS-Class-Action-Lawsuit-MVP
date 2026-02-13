from fastapi import FastAPI, Request
from supabase import create_client, Client
import uuid
import datetime
import os

app = FastAPI()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")  # Use secret key for backend
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.post("/submit")
async def submit_petition(request: Request):
    data = await request.json()
    
    response = supabase.table("petition_signatures").insert({
        "id": str(uuid.uuid4()),
        "full_name": data["full_name"],
        "email": data["email"],
        "is_parent_or_guardian": data["is_parent_or_guardian"],
        "experienced_unfairness": data["experienced_unfairness"],
        "description": data.get("description"),
        "interested_in_joining": data.get("interested_in_joining"),
        "consent_to_contact": data["consent_to_contact"],
        "created_at": datetime.datetime.utcnow(),
        "state": data.get("state")
    }).execute()

    return {"message": "Submission successful", "response": response}