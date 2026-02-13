# analytics/scrap_courtlistener.py
"""
Operation: CODE 1983 – Multi-Source Legal Scraper (API-only, ethics-aware)
---------------------------------------------------------------------------
Fetches recent opinions from multiple *API-permitted* sources, filters to
likely plaintiff wins or dismissals favorable to respondents in child support /
§1983 / due-process contexts, embeds, and upserts into Supabase table
`federal_case_library` (pgvector).

Providers:
- CourtListener (opinions API)   ← requires COURTLISTENER_TOKEN
- GovInfo USCOURTS (api.data.gov)← requires GOVINFO_API_KEY
- CAP (Harvard Case.law) optional← CAP_API_KEY (optional; often redirects/rate-limits)

Usage:
  python analytics/scrap_courtlistener.py \
    --providers courtlistener,govinfo \
    --topics "1983,due process,child support,title iv-d,fourteenth amendment" \
    --days 3650 --max 300 --include-unknown --page-size 50

Env vars (repo .env or analytics/.env):
  SUPABASE_URL=...
  SUPABASE_SERVICE_ROLE_KEY=...
  COURTLISTENER_TOKEN=...        (format: raw token, not "Token ...")
  GOVINFO_API_KEY=...            (api.data.gov key)
Optional:
  OPENAI_API_KEY=...
  CAP_API_KEY=...
"""

import os
import re
import sys
import math
import json
import time
import argparse
from pathlib import Path
import asyncio
import hashlib
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

import httpx

try:
    from supabase import create_client
except ImportError as e:
    raise SystemExit("Install supabase-py: pip install -U 'supabase>=2.6.0'") from e

# -------------------------
# .env loader (robust)
# -------------------------
_ENV_DEBUG = {"used": None, "candidates": [], "loaded": []}

def _parse_env_line(line: str):
    import re as _re
    m = _re.match(r'^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$', line)
    if not m:
        return None, None
    key, val = m.group(1), m.group(2)
    if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
        val = val[1:-1]
    else:
        hash_idx = val.find(" #")
        if hash_idx != -1:
            val = val[:hash_idx]
        if val.startswith("#"):
            val = ""
    return key.strip(), val.strip()

def _load_env():
    if os.environ.get("SUPABASE_URL") and os.environ.get("SUPABASE_SERVICE_ROLE_KEY"):
        return
    here = Path(__file__).resolve().parent
    candidates = [here / ".env", here.parent / ".env", here.parent.parent / ".env", Path.cwd() / ".env"]
    _ENV_DEBUG["candidates"] = [str(p) for p in candidates]
    for p in candidates:
        if not p.exists():
            continue
        try:
            loaded_any = False
            with p.open() as f:
                for raw in f:
                    line = raw.strip()
                    if not line or "=" not in line or line.startswith("#"): 
                        continue
                    k, v = _parse_env_line(line)
                    if k and (v is not None) and k not in os.environ:
                        os.environ[k] = v
                        _ENV_DEBUG["loaded"].append(k)
                        loaded_any = True
            if loaded_any:
                _ENV_DEBUG["used"] = str(p)
                break
        except Exception:
            continue

_load_env()

# -------------------------
# Configuration
# -------------------------
COURTLISTENER_BASE = os.getenv("COURTLISTENER_BASE", "https://www.courtlistener.com/api/rest/v3")
CAP_BASE            = os.getenv("CAP_BASE", "https://api.case.law/v1")
GOVINFO_API_KEY     = os.getenv("GOVINFO_API_KEY")
COURTLISTENER_TOKEN = os.getenv("COURTLISTENER_TOKEN") or os.getenv("COURTLISTENER_API_KEY")

SUPABASE_URL               = (os.getenv("SUPABASE_URL") or "").strip().strip('"').strip("'")
SUPABASE_SERVICE_ROLE_KEY  = (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "").strip().strip('"').strip("'")
OPENAI_API_KEY             = os.getenv("OPENAI_API_KEY")
CAP_API_KEY                = os.getenv("CAP_API_KEY")

EMBED_DIM = 1536  # matches text-embedding-3-small

LOG = logging.getLogger("scraper")
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO),
    format="%(asctime)s %(levelname)s | %(message)s",
    datefmt="%H:%M:%S",
)

def _looks_like_jwt(s: str) -> bool:
    parts = (s or "").split(".")
    return len(parts) == 3 and all(parts)

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise SystemExit("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
if not SUPABASE_URL.startswith("https://") or ".supabase.co" not in SUPABASE_URL:
    raise SystemExit("SUPABASE_URL looks wrong; expected https://<ref>.supabase.co")

sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# -------------------------
# Heuristics & helpers
# -------------------------
WIN_PATTERNS = [
    r"we\s+reverse\s+.*?district court.*?dismissal",
    r"reverse\s+and\s+remand",
    r"vacate\s+and\s+remand",
    r"summary judgment\s+for\s+the\s+plaintiff",
    r"grant(?:ed)?\s+the\s+plaintiff['’]s?\s+motion",
    r"judgment\s+in\s+favor\s+of\s+plaintiff",
    r"plaintiff['’]s?\s+claims\s+are\s+reinstated",
    r"violation\s+of\s+(?:due process|fourteenth amendment)",
    r"§?\s*1983\s+claim\s+(?:survives|allowed|proceeds)",
    r"claims?\s+may\s+proceed",
    r"dismiss(?:al)?\s+vacated",
]
LOSE_PATTERNS = [
    r"affirm(?:ed)?\s+the\s+dismissal",
    r"summary judgment\s+for\s+the\s+defendant",
    r"dismiss(?:ed|al)\s+for\s+failure\s+to\s+state",
    r"qualified immunity\s+applies",
    r"lack of jurisdiction",
    r"claims?\s+dismissed\s+with\s+prejudice",
]

TOPIC_PATTERNS_CACHE: Dict[str, re.Pattern] = {}

def compile_topics(topics: List[str]) -> List[re.Pattern]:
    pats: List[re.Pattern] = []
    for t in topics:
        t = t.strip()
        if not t: continue
        if t not in TOPIC_PATTERNS_CACHE:
            TOPIC_PATTERNS_CACHE[t] = re.compile(re.escape(t), re.IGNORECASE)
        pats.append(TOPIC_PATTERNS_CACHE[t])
    return pats

def text_matches_topics(text: str, topic_res: List[re.Pattern]) -> bool:
    return any(r.search(text) for r in topic_res)

def detect_outcome_plaintext(plain_text: str) -> str:
    txt = (plain_text or "").lower()
    won = any(re.search(p, txt) for p in WIN_PATTERNS)
    lost = any(re.search(p, txt) for p in LOSE_PATTERNS)
    if won and not lost: return "WON"
    if lost and not won: return "LOST"
    return "UNKNOWN"

def short(s: str, n: int) -> str:
    s = (s or "").strip()
    if len(s) <= n: return s
    return s[: n - 3] + "..."

def normalize_citation(citation: Optional[str]) -> Optional[str]:
    if not citation: return None
    c = re.sub(r"\s+", " ", citation).strip()
    return c

def stable_id(case_name: str, link: str) -> str:
    base = f"{case_name}|{link}"
    return hashlib.sha256(base.encode()).hexdigest()

def detect_tags(text: str) -> List[str]:
    tags = []
    if re.search(r"\b\d{0,2}\s*usc\s*§?\s*1983\b|\b§\s*1983\b|42\s*u\.?s\.?c\.?\s*§\s*1983", text, re.I):
        tags.append("section_1983")
    if re.search(r"due\s*process|fourteenth\s+amendment|14th\s+amendment", text, re.I):
        tags.append("due_process")
    if re.search(r"child\s*support|title\s*iv-d|iv[- ]?d", text, re.I):
        tags.append("child_support")
    if re.search(r"extrinsic\s+fraud|fraud\s+on\s+the\s+court", text, re.I):
        tags.append("extrinsic_fraud")
    return list(sorted(set(tags))) or ["misc"]

def holding_from_text(plain_text: str) -> str:
    txt = re.sub(r"\s+", " ", (plain_text or "")).strip()
    m = re.search(r"\b(we\s+(hold|conclude|determine)[^\.]{20,300}\.)", txt, re.I)
    if not m:
        m = re.search(r"\b(the\s+court\s+(holds|concludes|determines)[^\.]{20,300}\.)", txt, re.I)
    return m.group(1) if m else short(txt, 600)

# -------------------------
# Embeddings
# -------------------------
async def openai_embed_texts(texts: List[str]) -> List[List[float]]:
    async with httpx.AsyncClient(timeout=60) as c:
        r = await c.post(
            "https://api.openai.com/v1/embeddings",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
            json={"model": "text-embedding-3-small", "input": texts},
        )
        r.raise_for_status()
        data = r.json()
        return [d["embedding"] for d in data["data"]]

def local_hash_embedding(text: str, dim: int = EMBED_DIM) -> List[float]:
    vec = [0.0] * dim
    for tok in re.findall(r"[a-z0-9]+", text.lower()):
        h = int(hashlib.sha1(tok.encode()).hexdigest(), 16)
        idx = h % dim
        vec[idx] += 1.0
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]

async def embed_texts(texts: List[str]) -> List[List[float]]:
    if OPENAI_API_KEY:
        try:
            return await openai_embed_texts(texts)
        except Exception as e:
            LOG.warning("OpenAI embeddings failed, falling back to local: %s", e)
    return [local_hash_embedding(t) for t in texts]

# -------------------------
# Provider interface
# -------------------------
@dataclass
class Record:
    case_name: str
    jurisdiction: str
    court_level: str
    summary: str
    holding: str
    citation: str
    outcome: str
    tags: List[str]
    source_link: str
    provider: str

class Provider:
    name: str = "base"
    async def fetch(self, since: datetime, topics: List[str], max_results: int, page_size: int) -> List[Record]:
        raise NotImplementedError

class CourtListenerProvider(Provider):
    name = "courtlistener"

    async def fetch(self, since: datetime, topics: List[str], max_results: int, page_size: int) -> List[Record]:
        if not COURTLISTENER_TOKEN:
            LOG.error("[CL] COURTLISTENER_TOKEN missing; skipping provider.")
            return []

        collected: List[Record] = []

        # Keep page size small; heavy queries trigger throttling faster.
        page_size = max(10, min(page_size, 25))

        # IMPORTANT: drop full_text=1 to avoid heavy responses that trigger 403 quickly.
        params = {
            "order_by": "date_filed desc",
            "page_size": page_size,
            "q": " OR ".join(topics) if topics else "",
            "expand": "court",
        }
        url = f"{COURTLISTENER_BASE}/opinions/"

        headers = {
            "Authorization": f"Token {COURTLISTENER_TOKEN}",
            "Accept": "application/json",
            "User-Agent": "OperationCODE1983/1.0 (+local)",
        }

        limits = httpx.Limits(max_keepalive_connections=2, max_connections=4)

        async with httpx.AsyncClient(timeout=40, headers=headers, follow_redirects=True, limits=limits) as client:
            next_url: Optional[str] = url
            # Soft cap pages based on requested max
            max_pages = max(1, math.ceil(max_results / page_size))
            pages = 0

            while next_url and len(collected) < max_results and pages < max_pages:
                # gentle pacing between pages
                await asyncio.sleep(0.8)
                for attempt in range(6):
                    try:
                        r = await client.get(next_url, params=params if attempt == 0 else None)
                        if r.status_code in (403, 429):
                            ra = r.headers.get("Retry-After")
                            wait = int(ra) if (ra and ra.isdigit()) else max(2, 2 ** attempt)
                            LOG.warning("[CL] rate-limited (%s). Backing off %ss…", r.status_code, wait)
                            await asyncio.sleep(wait)
                            continue
                        r.raise_for_status()

                        # If close to limit, slow down a bit
                        rem = r.headers.get("X-RateLimit-Remaining")
                        try:
                            if rem is not None and int(rem) <= 1:
                                await asyncio.sleep(2.0)
                        except Exception:
                            pass

                        data = r.json()
                        break
                    except httpx.HTTPStatusError as e:
                        if e.response.status_code in (502, 503, 504):
                            wait = max(2, 2 ** attempt)
                            LOG.warning("[CL] HTTP %s; retry in %ss…", e.response.status_code, wait)
                            await asyncio.sleep(wait)
                            continue
                        raise
                    except httpx.RequestError as e:
                        wait = max(2, 2 ** attempt)
                        LOG.warning("[CL] network error, retry in %ss… (%s)", wait, e)
                        await asyncio.sleep(wait)
                else:
                    raise RuntimeError("[CL] exceeded retries")

                pages += 1
                results = data.get("results", [])
                for obj in results:
                    try:
                        date_str = obj.get("date_filed") or obj.get("dateFiled") or obj.get("date")
                        if not date_str:
                            continue
                        dt_filed = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                        if dt_filed < since:
                            continue

                        case_name = obj.get("case_name") or obj.get("caseName") or "Unknown case"

                        # Use html/html_with_citations (no full_text now). It's lighter and avoids 403.
                        plain = obj.get("html_with_citations") or obj.get("html") or ""

                        # Do not re-filter by topics; CL already applied q=
                        link = obj.get("absolute_url") or obj.get("absoluteUrl") or ""
                        source_link = f"https://www.courtlistener.com{link}" if link.startswith("/") else (link or "https://www.courtlistener.com/")

                        citation = None
                        if isinstance(obj.get("citations"), list):
                            for c in obj["citations"]:
                                for key in ("cite", "citation", "cite_string"):
                                    if c.get(key):
                                        citation = str(c[key]); break
                                if citation: break
                        for key in ("citation", "cite", "citation_string"):
                            if obj.get(key) and not citation:
                                citation = str(obj[key])
                        citation = normalize_citation(citation) or stable_id(case_name, source_link)

                        jurisdiction = "federal"
                        court_level = ""
                        court_val = obj.get("court")
                        if isinstance(court_val, dict):
                            jurisdiction = court_val.get("jurisdiction") or jurisdiction
                            court_level = court_val.get("name_abbreviation") or court_val.get("name") or court_level
                        elif isinstance(court_val, str):
                            court_level = court_val.rstrip("/").split("/")[-1] or court_level

                        outcome = detect_outcome_plaintext(plain)
                        tags = detect_tags(f"{case_name}\n{plain}")
                        summary = short(plain or case_name, 5000)
                        holding = short(holding_from_text(plain) or case_name, 1800)

                        rec = Record(
                            case_name=case_name,
                            jurisdiction=jurisdiction,
                            court_level=court_level,
                            summary=summary,
                            holding=holding,
                            citation=citation,
                            outcome=outcome,
                            tags=tags,
                            source_link=source_link,
                            provider=self.name,
                        )
                        collected.append(rec)
                        if len(collected) >= max_results:
                            break
                    except Exception as e:
                        LOG.debug("[CL] parse skip: %s | obj.keys=%s", e, list(obj.keys()))

                next_url = data.get("next")

        LOG.info("[CL] collected %d", len(collected))
        return collected

# -------------------------
# CAP provider (optional)
# -------------------------
class CAPProvider(Provider):
    name = "cap"

    async def fetch(self, since: datetime, topics: List[str], max_results: int, page_size: int) -> List[Record]:
        topic_res = compile_topics(topics)
        collected: List[Record] = []
        headers = {
            "User-Agent": "OperationCODE1983/1.0 (+local)",
            "Accept": "application/json",
        }
        if CAP_API_KEY:
            headers["Authorization"] = f"Token {CAP_API_KEY}"

        params = {
            "search": " OR ".join(topics) if topics else "",
            "decision_date_min": since.date().isoformat(),
            "page_size": min(page_size, 100),
            "full_case": "true",
        }
        url = f"{CAP_BASE}/cases/"

        async with httpx.AsyncClient(timeout=30, headers=headers, follow_redirects=True) as client:
            next_url: Optional[str] = url
            while next_url and len(collected) < max_results:
                for attempt in range(5):
                    try:
                        r = await client.get(next_url, params=params if attempt == 0 else None)
                        r.raise_for_status()
                        data = r.json()
                        break
                    except httpx.HTTPStatusError as e:
                        if e.response.status_code in (429, 502, 503, 504, 301, 302, 307, 308):
                            wait = 2 ** attempt
                            LOG.warning("[CAP] HTTP %s; retry in %ss…", e.response.status_code, wait)
                            await asyncio.sleep(wait)
                            continue
                        raise
                    except httpx.RequestError as e:
                        wait = 2 ** attempt
                        LOG.warning("[CAP] network error, retrying in %ss… (%s)", wait, e)
                        await asyncio.sleep(wait)
                else:
                    raise RuntimeError("[CAP] exceeded retries")

                results = data.get("results", [])
                for obj in results:
                    try:
                        date_str = obj.get("decision_date")
                        if not date_str: 
                            continue
                        dt_filed = datetime.fromisoformat(date_str)
                        if dt_filed.replace(tzinfo=timezone.utc) < since:
                            continue

                        case_name = obj.get("name") or obj.get("name_abbreviation") or "Unknown case"
                        citation = None
                        cits = obj.get("citations") or []
                        for c in cits:
                            if c.get("type") == "official" and c.get("cite"):
                                citation = c["cite"]; break
                        if not citation:
                            for c in cits:
                                if c.get("cite"):
                                    citation = c["cite"]; break
                        citation = normalize_citation(citation)

                        court = obj.get("court") or {}
                        court_level = court.get("name") or court.get("name_abbreviation") or ""
                        jurisdiction_obj = obj.get("jurisdiction") or {}
                        jurisdiction = jurisdiction_obj.get("name_long") or jurisdiction_obj.get("name") or "unknown"

                        body = ""
                        casebody = obj.get("casebody") or {}
                        if "data" in casebody:
                            data_body = casebody["data"]
                            if isinstance(data_body, dict):
                                body = " ".join(filter(None, [
                                    data_body.get("attorneys"),
                                    data_body.get("head_matter"),
                                    " ".join(sec.get("text","") for sec in (data_body.get("opinions") or []))
                                ]))
                            elif isinstance(data_body, list):
                                body = " ".join([sec.get("text","") for sec in data_body])
                        text = f"{case_name}\n{body}"

                        if topics and not text_matches_topics(text, topic_res):
                            continue

                        outcome = detect_outcome_plaintext(body)
                        tags = detect_tags(text)
                        summary = short(body, 5000)
                        holding = short(holding_from_text(body), 1800)
                        src = obj.get("frontend_url") or obj.get("url") or ""
                        if not src and citation:
                            src = f"https://api.case.law/v1/cases/?search={citation}"
                        if not citation:
                            citation = stable_id(case_name, src or f"cap:{obj.get('id')}")

                        rec = Record(
                            case_name=case_name,
                            jurisdiction=jurisdiction,
                            court_level=court_level,
                            summary=summary,
                            holding=holding,
                            citation=citation,
                            outcome=outcome,
                            tags=tags,
                            source_link=src,
                            provider=self.name,
                        )
                        collected.append(rec)
                        if len(collected) >= max_results: 
                            break
                    except Exception as e:
                        LOG.debug("[CAP] parse skip: %s", e)

                next_url = data.get("next")

        LOG.info("[CAP] collected %d", len(collected))
        return collected

# -------------------------
# GovInfo USCOURTS provider
# -------------------------
class GovInfoProvider(Provider):
    name = "govinfo"

    async def fetch(self, since: datetime, topics: List[str], max_results: int, page_size: int) -> List[Record]:
        api_key = GOVINFO_API_KEY
        if not api_key:
            LOG.warning("[GovInfo] GOVINFO_API_KEY not set; skipping.")
            return []

        collected: List[Record] = []
        def qterm(t: str) -> str:
            t = t.strip()
            if not t: return ""
            return f'"{t}"' if " " in t else t

        q = "collection:uscourts"
        if topics:
            q += " AND (" + " OR ".join(qterm(t) for t in topics if t) + ")"

        search_url = f"https://api.govinfo.gov/search?api_key={api_key}"
        offset_mark = "*"
        total_needed = max_results
        per_page = max(1, min(page_size, 100))

        headers = {
            "User-Agent": "OperationCODE1983/1.0 (+local)",
            "Accept": "application/json",
        }

        async with httpx.AsyncClient(timeout=45, headers=headers, follow_redirects=True) as client:
            while total_needed > 0 and offset_mark:
                body = {"query": q, "sort": "date desc", "pageSize": per_page, "offsetMark": offset_mark}
                try:
                    resp = await client.post(search_url, json=body)
                    resp.raise_for_status()
                except httpx.HTTPStatusError as e:
                    if e.response.status_code in (429, 502, 503, 504):
                        LOG.warning("[GovInfo] HTTP %s; backing off...", e.response.status_code)
                        await asyncio.sleep(2)
                        continue
                    raise

                data = resp.json()
                results = data.get("results", [])
                offset_mark = data.get("nextOffsetMark")

                for r in results:
                    try:
                        pkg_id = r.get("packageId") or ""
                        date_issued = r.get("dateIssued")
                        if not date_issued: 
                            continue
                        dt = datetime.fromisoformat(date_issued.replace("Z", "+00:00"))
                        if dt < since:
                            continue

                        summary_url = f"https://api.govinfo.gov/packages/{pkg_id}/summary?api_key={api_key}"
                        s = await client.get(summary_url)
                        s.raise_for_status()

                        candidate_txt = f"https://api.govinfo.gov/packages/{pkg_id}/txt?api_key={api_key}"
                        candidate_htm = f"https://api.govinfo.gov/packages/{pkg_id}/htm?api_key={api_key}"

                        txt_url = None
                        htm_url = None
                        try:
                            h = await client.head(candidate_txt)
                            if h.status_code == 200: txt_url = candidate_txt
                        except Exception:
                            pass
                        if not txt_url:
                            try:
                                h = await client.head(candidate_htm)
                                if h.status_code == 200: htm_url = candidate_htm
                            except Exception:
                                pass

                        plain = ""
                        if txt_url:
                            t = await client.get(txt_url)
                            if t.status_code == 200:
                                plain = t.text
                        elif htm_url:
                            h = await client.get(htm_url)
                            if h.status_code == 200:
                                plain = re.sub(r"<[^>]+>", " ", h.text)

                        title = r.get("title") or "Unknown opinion"
                        court_name = r.get("courtName") or ""
                        court_type = r.get("courtType") or ""
                        jurisdiction = "federal"

                        cat_text = f"{title}\n{plain}"
                        if topics and not text_matches_topics(cat_text, compile_topics(topics)):
                            continue

                        outcome = detect_outcome_plaintext(plain)
                        tags = detect_tags(cat_text)
                        summary = short(plain or title, 5000)
                        holding = short(holding_from_text(plain) if plain else title, 1800)
                        citation = normalize_citation(r.get("citation")) or pkg_id
                        details_page = f"https://www.govinfo.gov/app/details/{pkg_id}"

                        rec = Record(
                            case_name=title,
                            jurisdiction=jurisdiction,
                            court_level=court_name or court_type,
                            summary=summary,
                            holding=holding,
                            citation=citation,
                            outcome=outcome,
                            tags=tags,
                            source_link=details_page,
                            provider=self.name,
                        )
                        collected.append(rec)
                        total_needed -= 1
                        if total_needed <= 0:
                            break
                    except Exception as e:
                        LOG.debug("[GovInfo] parse skip: %s", e)

                await asyncio.sleep(0.4)

        LOG.info("[GovInfo] collected %d", len(collected))
        return collected

# -------------------------
# Persistence
# -------------------------
async def upsert_records(records: List[Record]) -> Tuple[int, int]:
    if not records: return (0, 0)

    dedup: Dict[str, Record] = {}
    for r in records:
        key = normalize_citation(r.citation) or stable_id(r.case_name, r.source_link)
        dedup[key] = r
    items = list(dedup.values())

    texts = [(r.summary or "") + "\n" + (r.holding or "") for r in items]
    try:
        embs = await embed_texts(texts)
    except Exception as e:
        LOG.error("Embedding failed: %s", e)
        return (0, len(items))

    payload: List[Dict[str, Any]] = []
    for r, emb in zip(items, embs):
        payload.append({
            "case_name": r.case_name,
            "jurisdiction": r.jurisdiction,
            "court_level": r.court_level,
            "summary": r.summary,
            "holding": r.holding,
            "citation": r.citation,
            "outcome": r.outcome,
            "tags": r.tags,
            "vector_embedding": emb,
            "source_link": r.source_link,
            "provider": r.provider,
        })

    inserted = 0
    skipped = 0
    batch = 50
    for i in range(0, len(payload), batch):
        chunk = payload[i:i+batch]
        try:
            res = sb.table("federal_case_library").upsert(chunk).execute()
            cnt = len(res.data or [])
            inserted += cnt
            LOG.info("Upserted %d records", cnt)
        except Exception as e:
            LOG.error("Supabase upsert failed: %s", e)
            skipped += len(chunk)

    return inserted, skipped

# -------------------------
# CLI
# -------------------------
def parse_args() -> argparse.Namespace:
    ap = argparse.ArgumentParser(description="Multi-source case scraper (API-only).")
    ap.add_argument("--providers", type=str, default="courtlistener,govinfo",
                    help="Comma-separated providers: courtlistener, govinfo, cap")
    ap.add_argument("--topics", type=str, default="1983,due process,child support,title iv-d,fourteenth amendment",
                    help="Comma-separated topic keywords.")
    ap.add_argument("--days", type=int, default=365, help="Look back this many days.")
    ap.add_argument("--max", type=int, default=600, help="Max opinions to process (total across providers).")
    ap.add_argument("--page-size", type=int, default=50, help="Page size per provider request.")
    ap.add_argument("--only-wins", action="store_true", help="Keep opinions classified as WON only.")
    ap.add_argument("--include-unknown", action="store_true", help="Also keep UNKNOWN outcomes (in addition to wins).")
    return ap.parse_args()

PROVIDER_MAP = {
    "courtlistener": CourtListenerProvider,
    "govinfo": GovInfoProvider,
    "cap": CAPProvider,
}

async def main_async():
    args = parse_args()
    topics = [t.strip() for t in args.topics.split(",") if t.strip()]
    since = datetime.now(timezone.utc) - timedelta(days=args.days)

    prov_names = [p.strip() for p in args.providers.split(",") if p.strip()]
    providers: List[Provider] = []
    for p in prov_names:
        cls = PROVIDER_MAP.get(p.lower())
        if not cls:
            LOG.warning("Unknown provider '%s' (skipping)", p)
            continue
        providers.append(cls())
    if not providers:
        raise SystemExit("No valid providers selected")

    LOG.info("Starting scrape: providers=%s topics=%s days=%s max=%s",
             [p.name for p in providers], topics, args.days, args.max)

    per_provider_max = max(1, args.max // max(1, len(providers)))
    all_records: List[Record] = []
    for prov in providers:
        try:
            batch = await prov.fetch(since=since, topics=topics, max_results=per_provider_max, page_size=args.page_size)
            all_records.extend(batch)
        except Exception as e:
            LOG.error("[%s] provider failed: %s", prov.name, e)

    LOG.info("Fetched %d records before filtering", len(all_records))

    filtered: List[Record] = []
    for r in all_records:
        if r.outcome == "WON":
            filtered.append(r)
        elif r.outcome == "UNKNOWN" and args.include_unknown:
            filtered.append(r)
        elif not args.only_wins and r.outcome == "LOST":
            pass

    LOG.info("Keeping %d records after outcome filter (WON%s)",
             len(filtered), " + UNKNOWN" if args.include_unknown else "")

    inserted, skipped = await upsert_records(filtered)
    LOG.info("Done. Inserted/updated=%d, skipped=%d", inserted, skipped)

def main():
    try:
        asyncio.run(main_async())
    except KeyboardInterrupt:
        LOG.warning("Interrupted.")

if __name__ == "__main__":
    main()