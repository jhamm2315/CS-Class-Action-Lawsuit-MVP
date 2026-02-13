import { useEffect, useState } from "react";

export default function PublicMetrics() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Try /api first, then fallback to /metrics
        const r1 = await fetch("/api/metrics/public");
        const r = r1.ok ? r1 : await fetch("/metrics/public");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const json = await r.json();
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setErr(String(e));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (err) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="badge badge-warn">Metrics unavailable</div>
          <p className="text-sm mt-2">{err}</p>
        </div>
      </div>
    );
  }

  const total = data?.total_submissions ?? data?.total ?? 0;
  const optIns = data?.opt_ins ?? 0;
  const readiness = data?.movement_readiness ?? data?.readiness ?? 0;

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
      <div className="kpi">
        <div className="text-3xl font-bold">{total}</div>
        <div className="text-sm mt-1 opacity-80">Total submissions</div>
      </div>
      <div className="kpi">
        <div className="text-3xl font-bold">{optIns}</div>
        <div className="text-sm mt-1 opacity-80">Class-action opt-ins</div>
      </div>
      <div className="kpi">
        <div className="text-3xl font-bold">{readiness}</div>
        <div className="text-sm mt-1 opacity-80">Movement readiness</div>
      </div>
    </div>
  );
}