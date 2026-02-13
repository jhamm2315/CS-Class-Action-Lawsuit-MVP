// frontend/src/components/widgets/DOHWidget.jsx
import React, { useEffect, useMemo, useState } from "react";

/**
 * Public Oversight (HealthData.gov / Socrata)
 * Dataset: dc3z-f97q
 *
 * Optional env: VITE_SOCRATA_APP_TOKEN for higher rate limits.
 * Props:
 *   stateFilter?: "CA" | "TX" | ...
 *   limit?: number
 */
export default function DOHWidget({ stateFilter = "", limit = 25 }) {
  if (import.meta.env.VITE_DOH_DISABLE === "1") return null;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [refreshTick, setRefreshTick] = useState(0); // triggers a re-fetch

  const token = import.meta.env.VITE_SOCRATA_APP_TOKEN;
  const base = "https://healthdata.gov/resource/dc3z-f97q.json";

  // Try a few reasonable orderings; fall back to no order if a column doesn't exist.
  const ORDER_TRIES = useMemo(
    () => [
      "report_year DESC, report_period DESC",
      "fiscal_year DESC",
      "year DESC",
      "updated_at DESC",
      "" // last resort: no order
    ],
    []
  );

  useEffect(() => {
    let cancelled = false;

    async function go() {
      setLoading(true);
      setErr("");

      try {
        let lastBody = "";

        for (const ord of ORDER_TRIES) {
          const params = new URLSearchParams();
          params.set("$limit", String(limit));
          if (stateFilter) params.set("state", stateFilter.toUpperCase());
          if (ord) params.set("$order", ord);

          const res = await fetch(`${base}?${params}`, {
            headers: token ? { "X-App-Token": token } : {},
            cache: "no-store", // avoid cached responses; refresh button will re-run this effect
          });

          if (res.ok) {
            const data = await res.json();
            if (!cancelled) {
              setRows(Array.isArray(data) ? data : []);
              setLoading(false);
            }
            return;
          }

          // Only keep trying on the common "no-such-column" 400; otherwise stop and surface the error.
          lastBody = await res.text();
          const maybeColumnError =
            res.status === 400 && /no-such-column|column|soql/i.test(lastBody);

          if (!maybeColumnError) {
            throw new Error(`${res.status} ${res.statusText} – ${lastBody}`);
          }
          // else: try next order string
        }

        // If we get here, every ORDER_TRIES attempt failed (shouldn’t happen since last one is blank).
        throw new Error(`Query failed. Last response: ${lastBody}`);
      } catch (e) {
        if (!cancelled) {
          setErr(e?.message || String(e));
          setRows([]);
          setLoading(false);
        }
      }
    }

    go();
    return () => {
      cancelled = true;
    };
  }, [stateFilter, limit, token, ORDER_TRIES, refreshTick]);

  const refresh = () => setRefreshTick((t) => t + 1);

  // Helpers – pick best-fitting fields dynamically
  const getState = (r) =>
    r.state || r.state_name || r.stateabbr || r.jurisdiction || r.agency || "—";

  const getYear = (r) =>
    r.report_year || r.fiscal_year || r.year || r.reporting_year || "";

  const getPeriod = (r) =>
    r.report_period || r.reporting_period || r.quarter || r.month || "";

  // Pick up to two numeric metrics that look useful
  const pickNumbers = (r) => {
    const entries = Object.entries(r).filter(([k, v]) => {
      if (v == null || v === "") return false;
      // avoid id/url/meta-like fields
      if (/id|uuid|url|link|user|update|column|row|meta/i.test(k)) return false;
      const n = Number(v);
      return Number.isFinite(n);
    });
    return entries.slice(0, 2);
  };

  return (
    <section>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <h3 style={{ margin: 0 }}>
          Public Oversight: HealthData.gov (Child Support / IV-D)
        </h3>
        <button
          className="btn btn-sm btn-outline"
          onClick={refresh}
          disabled={loading}
          title={loading ? "Refreshing…" : "Refresh now"}
        >
          {loading ? "Refreshing…" : "Refresh Now"}
        </button>
      </div>

      <p style={{ marginTop: 0, color: "var(--muted, rgba(255,255,255,.7))" }}>
        Spot issues and trends across state child-support agencies.
      </p>

      {loading && <div className="muted">Loading…</div>}

      {err && (
        <div className="callout warn" style={{ marginBottom: 12, whiteSpace: "pre-wrap" }}>
          Error: {err}
        </div>
      )}

      {!loading && !err && rows.length === 0 && (
        <div className="muted">No rows returned. Try Refresh.</div>
      )}

      {!loading && !err && rows.length > 0 && (
        <div
          style={{
            border: "1px solid rgba(255,255,255,.08)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "220px 1fr",
              fontSize: 13,
              opacity: 0.8,
              padding: "8px 10px",
              borderBottom: "1px solid rgba(255,255,255,.08)",
            }}
          >
            <div>Jurisdiction / Period</div>
            <div>Key metrics</div>
          </div>

          {rows.map((r, i) => {
            const nums = pickNumbers(r);
            return (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "220px 1fr",
                  padding: "10px",
                  borderBottom:
                    i === rows.length - 1
                      ? "none"
                      : "1px solid rgba(255,255,255,.06)",
                }}
              >
                <div style={{ whiteSpace: "nowrap" }}>
                  <strong>{getState(r)}</strong>
                  <div className="muted">
                    {getYear(r) || "—"}
                    {getPeriod(r) ? ` · ${getPeriod(r)}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {nums.length === 0 ? (
                    <span className="muted">No obvious numeric fields present</span>
                  ) : (
                    nums.map(([k, v]) => (
                      <span
                        key={k}
                        style={{
                          border: "1px solid rgba(255,255,255,.08)",
                          borderRadius: 6,
                          padding: "4px 8px",
                        }}
                        title={k}
                      >
                        <strong>{v}</strong>{" "}
                        <span className="muted">{String(k).replace(/_/g, " ")}</span>
                      </span>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
