import { useEffect, useState } from "react";

export default function ClassActionTrigger({ threshold = 25 }) {
  const [state, setState] = useState("");       // 2-letter code if you have it
  const [count, setCount] = useState(null);

  useEffect(() => {
    // If you track state in localStorage or profile, read it here.
    const guess = localStorage.getItem("user_state") || "";
    setState(guess);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Hit your public metrics breakdown if available; otherwise show N/A.
        const r1 = await fetch("/api/metrics/public");
        const r = r1.ok ? r1 : await fetch("/metrics/public");
        if (!r.ok) throw new Error();
        const json = await r.json();
        // If your API returns per-state counts, map it here.
        const perState = json?.per_state || json?.states || {};
        const n = state && perState[state] ? perState[state] : null;
        if (!cancelled) setCount(n);
      } catch {
        if (!cancelled) setCount(null);
      }
    })();
    return () => { cancelled = true; };
  }, [state]);

  const ready = typeof count === "number" && count >= threshold;

  return (
    <div className="card">
      <div className="card-body">
        <h3 className="font-semibold">Class-action readiness</h3>
        <p className="text-sm opacity-80 mt-1">
          {state ? <>Your state: <b>{state}</b>.</> : "Select your state in Settings to see a local trigger."}
        </p>
        <div className="mt-2">
          {typeof count === "number" ? (
            <p>
              {count} opted-in participants in {state || "your state"}.
              {" "}{ready ? "✅ Threshold met." : `Need ${Math.max(threshold - count, 0)} more.`}
            </p>
          ) : (
            <p className="opacity-80">No state data yet. Invite more users or set your state in Settings.</p>
          )}
        </div>
      </div>
    </div>
  );
}