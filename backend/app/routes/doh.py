# app/routes/doh.py
import os
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter, HTTPException, Query
from supabase import create_client

router = APIRouter(prefix="/doh", tags=["public-data"])

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")

sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

DOH_DATA_URL = os.getenv(
    "DOH_DATA_URL",
    "https://healthdata.gov/api/v3/views/dc3z-f97q/query.json",
)

def _first(d: Dict[str, Any], *keys: str) -> Optional[str]:
    for k in keys:
        if k in d and d[k] not in (None, ""):
            v = d[k]
            return str(v)
    return None

def _to_rows_from_socrata(obj: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Handle Socrata 'views/.../query.json' shape: meta.view.columns + data (array-of-arrays)."""
    rows: List[Dict[str, Any]] = []
    meta = obj.get("meta") or {}
    view = meta.get("view") or {}
    cols = view.get("columns") or meta.get("columns") or []
    # pick best column names
    names = []
    for i, c in enumerate(cols):
        names.append(c.get("name") or c.get("fieldName") or c.get("id") or f"col_{i}")
    for arr in obj.get("data", []):
        if isinstance(arr, list):
            row = {}
            for i in range(min(len(names), len(arr))):
                row[names[i]] = arr[i]
            rows.append(row)
        elif isinstance(arr, dict):
            rows.append(arr)
    return rows

def _normalize_to_records(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Extract dims (state/agency/period) if present; keep everything in 'raw' + 'metrics'."""
    out: List[Dict[str, Any]] = []
    for r in rows:
        # heuristics for common dimension names
        state = _first(r, "state", "State", "state_name", "STATE", "jurisdiction", "Location")
        agency = _first(r, "agency", "Agency", "Program", "Department", "Agencies")
        period = _first(r, "year", "Year", "reporting_period", "Reporting Period", "fiscal_year", "Fiscal Year", "Period")

        # metrics = numeric-ish fields (best-effort)
        metrics: Dict[str, Any] = {}
        for k, v in r.items():
            if k in ("state","State","state_name","STATE","jurisdiction","Location",
                     "agency","Agency","Program","Department","Agencies",
                     "year","Year","reporting_period","Reporting Period","fiscal_year","Fiscal Year","Period"):
                continue
            # keep small scalars; big blobs remain only in raw
            if isinstance(v, (int, float)):
                metrics[k] = v
            elif isinstance(v, str):
                # numeric strings
                if re.fullmatch(r"-?\d+(\.\d+)?", v.strip()):
                    try:
                        metrics[k] = float(v)
                    except Exception:
                        pass

        out.append({
            "source_url": DOH_DATA_URL,
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            "state": state,
            "agency": agency,
            "period": period,
            "metrics": metrics or {},
            "raw": r,
        })
    return out

async def _fetch_doh_json() -> Any:
    async with httpx.AsyncClient(timeout=45) as c:
        r = await c.get(DOH_DATA_URL)
        r.raise_for_status()
        return r.json()

@router.post("/refresh")
async def refresh(limit: int = Query(500, ge=1, le=5000)) -> Dict[str, int]:
    """
    Fetch the DOH dataset and persist normalized rows + raw into Supabase.
    Safe to run repeatedly (we do not dedupe strictly; this is a snapshot appender).
    """
    try:
        obj = await _fetch_doh_json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"DOH fetch failed: {e}") from e
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"DOH fetch error: {e}") from e

    # shape handling
    rows: List[Dict[str, Any]] = []
    if isinstance(obj, list):
        if obj and isinstance(obj[0], dict):
            rows = obj
    elif isinstance(obj, dict):
        if "data" in obj and ("meta" in obj or "columns" in obj):
            rows = _to_rows_from_socrata(obj)
        elif "records" in obj and isinstance(obj["records"], list):
            rows = obj["records"]
        else:
            # last resort: wrap the dict
            rows = [obj]
    else:
        rows = []

    norm = _normalize_to_records(rows)[:limit] if limit else _normalize_to_records(rows)

    inserted = 0
    batch = 200
    for i in range(0, len(norm), batch):
        chunk = norm[i:i+batch]
        try:
            res = sb.table("doh_child_support_metrics").insert(chunk).execute()
            inserted += len(res.data or [])
        except Exception as e:
            # non-fatal; continue inserting other chunks
            print("Upsert error:", e)

    return {"inserted": inserted, "seen": len(rows)}

@router.get("/metrics")
async def metrics(state: Optional[str] = None, limit: int = Query(12, ge=1, le=200)):
    """
    Return recent rows for quick UI cards. Filter by state if provided.
    """
    q = sb.table("doh_child_support_metrics").select("*").order("fetched_at", desc=True)
    if state:
        q = q.eq("state", state)
    q = q.limit(limit)
    try:
        res = q.execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase error: {e}") from e
    return {"items": res.data or []}