# backend/app/services/bluebook.py
import re

_CITE_RE = re.compile(r'\b(\d+\s+[A-Za-z.]+?\s+\d+)\b(?:\s*\((\d{4})\))?')

def normalize_citation(cite: str) -> str:
    # Very light normalization (avoid hallucination acceptance).
    m = _CITE_RE.search(cite)
    if not m:
        return cite.strip()
    vol, reporter_pg = m.group(1).split(maxsplit=1)[0], m.group(1).split(maxsplit=1)[1]
    year = m.group(2)
    return f"{m.group(1)} ({year})" if year else m.group(1)

def filter_to_allowed_citations(text: str, allowed: list[str]) -> str:
    def repl(m):
        normalized = normalize_citation(m.group(0))
        return normalized if any(a in normalized for a in allowed) else "[omitted]"
    return _CITE_RE.sub(repl, text)