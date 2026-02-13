# Operation Code 1983
## Constitutional Compliance Analytics Platform

Operation Code 1983 is a full-stack legal analytics and case-building platform designed to analyze procedural irregularities, aggregate structured participation data, and support constitutional litigation workflows.

This project provides secure intake infrastructure, participation metrics, precedent aggregation, and readiness scoring for structured legal action analysis.

---

## Tech Stack

### Frontend
- React (Vite)
- TailwindCSS
- Supabase JS Client

### Backend
- Python
- Supabase (PostgreSQL + Row Level Security)
- CourtListener API integration
- CAP (CaseLaw Access Project) integration

### Infrastructure
- Supabase (Auth + Database)
- Environment-based configuration
- Git version control
- Deployment ready (Vercel / Render)

---

## Core System Modules

### Participation Engine
Structured intake collection:
- State
- Filing status
- Harm classification
- Sentiment tracking

### Readiness Scoring Engine
Aggregates:
- Participation volume
- Geographic distribution
- Sentiment metrics
- Pattern clustering

Triggers threshold-based messaging when criteria are met.

### Case Builder
Guided workflow that:
- Structures constitutional claims
- Aligns allegations to statutory references
- Generates motion-ready outlines

### Precedent Aggregator
Integrates with:
- CourtListener API
- CAP API

Normalizes and stores case metadata for structured review.

---

## Security Architecture

### Frontend
Uses Supabase publishable key only.
No administrative privileges exposed.

### Backend
Uses Supabase secret key.
Handles privileged operations securely.

### Environment Protection
All secrets stored in `.env`
`.env` is excluded from Git tracking.
`.env.example` included for reference.

---

## Project Structure

CS-Class-Action-Lawsuit-MVP/
│
├── frontend/
├── analytics/
├── supabase/
├── webscraper.py
├── README.md
└── .env.example

---

## Local Development

Clone:
git clone https://github.com/jhamm2315/CS-Class-Action-Lawsuit-MVP.git

Frontend:
cd frontend
npm install
npm run dev

Backend:
pip install -r requirements.txt
python webscraper.py

---

## Current MVP Capabilities

- Structured intake
- Supabase integration
- Sentiment tracking
- Readiness scoring
- CourtListener data ingestion
- Secure key separation
- GitHub deployment ready

---

## Roadmap

- AI-assisted drafting engine
- Jurisdiction classification automation
- Statistical anomaly detection
- Filing workflow integration
- Multi-state analytics dashboard

---

## Disclaimer

This software provides structured analytics tools and informational workflows.
It does not provide legal advice.

---

## License

MIT (update as appropriate)

