# backend/app/services/rag.py
from typing import List, Dict
from app.services.cost_router import llm_complete
from app.services.bluebook import normalize_citation, filter_to_allowed_citations

SYSTEM = (
  "You are generating a federal motion for a pro se litigant. "
  "ONLY use the provided facts and the provided winning federal cases. "
  "Citations must be real and drawn only from the provided list. "
  "If a needed citation is not in the list, write '[citation needed]'. "
  "Use numbered paragraphs and neutral tone; do not give legal advice."
)

TEMPLATE = """Draft a motion titled: {title}.
Facts (verbatim, lightly edited for clarity):
{facts}

Relevant winning federal cases (with holdings):
{cases}

Draft the motion sections: Introduction, Jurisdiction, Facts, Argument (with subsections tied to cases), Relief Requested, Signature block.
Use only these citations: {allowed_citations}
Return HTML (no CSS)."""

def build_cases_block(matches: List[Dict]) -> str:
    lines = []
    for m in matches:
        lines.append(f"- {m['case_name']} ({m['citation']}): {m['holding']}")
    return "\n".join(lines)

async def generate_motion_html(title: str, facts: str, matches: List[Dict]) -> Dict:
    if not matches:
        return {"ok": False, "reason": "No winning cases available"}

    allowed = [normalize_citation(m["citation"]) for m in matches if m.get("citation")]
    cases_block = build_cases_block(matches)
    user = TEMPLATE.format(
        title=title,
        facts=facts[:8000],
        cases=cases_block[:8000],
        allowed_citations=", ".join(allowed)
    )
    html = await llm_complete(SYSTEM, user)
    # Final pass: strip any non-allowed citations
    cleaned = filter_to_allowed_citations(html, allowed)
    return {"ok": True, "html": cleaned, "allowed": allowed}