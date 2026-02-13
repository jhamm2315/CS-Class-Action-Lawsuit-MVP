from dotenv import load_dotenv
import os
from supabase import create_client, Client

# Load from .env
load_dotenv()

# Try env first, fallback to hardcoded
supabase_url = os.getenv("SUPABASE_URL") or "https://vpgtdgpgjibcnwouiwnz.supabase.co"
supabase_key = os.getenv("SUPABASE_KEY") or "sb_publishable_0tbor_gnmz5iSobWQsUvfQ_fU_Bfnrg"

if not supabase_url or not supabase_key:
    raise ValueError("Supabase URL or Key not found")

supabase: Client = create_client(supabase_url, supabase_key)

def insert_signature(data: dict):
    try:
        response = supabase.table("petition_signatures").insert(data).execute()
        return response
    except Exception as e:
        print(f"Error inserting signature: {e}")
        return None