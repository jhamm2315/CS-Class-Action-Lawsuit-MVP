import sys
import os 

# Add the project root to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.ingestion.supabase_insert import insert_signature
print("✅ Import worked!")

# Sample dummy data
data = {
   "full_name": "Justynn Hammond",
    "email": "justynn@example.com",
    "is_parent_or_guardian": True,
    "experienced_unfairness": True,
    "description": "Testing Supabase insertion for class action petition.",
    "interested_in_joining": "yes",  # Could also be "maybe" or "no" depending on form
    "consent_to_contact": True,
    "state": "CO",
    "city": "Parker"
}

response = insert_signature(data)
print("Insert Response:", response)