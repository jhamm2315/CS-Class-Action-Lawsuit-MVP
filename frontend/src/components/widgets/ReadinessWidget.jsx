// frontend/src/components/widgets/ReadinessWidget.jsx
import React, { useEffect, useMemo, useState } from "react";
import supabase from "../../supabaseClient"; // <-- relative import; no @src alias required

export default function ReadinessWidget({
  thresholdPct = 92,
  minParticipants = 250,
}) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [n, setN] = useState(0);
  const [k, setK] = useState(0);
  const [tick, setTick] = useState(0);

  // Helpful early check so “Load failed” becomes actionable.
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Wilson 95% lower bound (z=1.96)
  const lower95 = useMemo(() => {
    if (!n) return 0;
    const z = 1.96;
    const phat = k / n;
    const denom = 1 + (z ** 2) / n;
    const centre = phat + (z ** 2) / (2 * n);
    const margin =
      z *
      Math.sqrt((phat * (1 - phat)) / n + (z ** 2) / (4 * n ** 2));
    return Math.max(0, (centre - margin) / denom) * 100;
  }, [n, k]);

  const ready = lower95 >= thresholdPct && n >= minParticipants;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr("");

      // Missing envs? Surface a clear message and stop.
      if (!url || !key) {
        setErr(
          "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. " +
          "Add them to .env, then restart your dev server."
        );
        setLoading(false);
        return;
      }

      try {
        // Query the view that returns one row with n (participants) and k (opt-ins)
        const { data, error } = await supabase
          .from("v_readiness_counts")
          .select("n,k")
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        const nn = Number(data?.n ?? 0);
        const kk = Number(data?.k ?? 0);

        if (!cancelled) {
          setN(Number.isFinite(nn) ? nn : 0);
          setK(Number.isFinite(kk) ? kk : 0);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setErr(
            (e && e.message) ||
              "Load failed. Check: RLS policy on v_readiness_counts " +
              "and that the view exists/returns n,k."
          );
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [tick, url, key]);

  const refresh = () => setTick((t) => t + 1);

  return (
    <section
      className="container box"
      style={{
        overflow: "hidden",
        borderRadius: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          marginBottom: 8,
        }}
      >
        <h3 style={{ margin: 0 }}>Class-action readiness</h3>
        <button
          className="btn btn-sm btn-outline"
          onClick={refresh}
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh Now"}
        </button>
      </div>

      <p style={{ marginTop: 0 }}>
        Trigger when the <strong>95% lower bound</strong> of opt-ins is{" "}
        <strong>≥ {thresholdPct}%</strong> with at least{" "}
        <strong>{minParticipants}</strong> participants.
      </p>

      {/* Status chip */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          borderRadius: 9999,
          border: `1px solid ${
            ready ? "rgba(0,255,170,.35)" : "rgba(255,70,70,.35)"
          }`,
          color: ready ? "rgb(0,255,170)" : "rgb(255,70,70)",
          marginBottom: 10,
        }}
        aria-live="polite"
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: ready ? "rgb(0,255,170)" : "rgb(255,70,70)",
            boxShadow: `0 0 0 3px ${
              ready ? "rgba(0,255,170,.2)" : "rgba(255,70,70,.2)"
            }`,
          }}
        />
        <strong>{ready ? "Ready" : "Not ready"}</strong>
      </div>

      {loading && <div className="muted">Loading…</div>}
      {err && <div className="callout warn">[{/* source */}participants] {err}</div>}

      {!loading && !err && (
        <div style={{ opacity: 0.9 }}>
          <div>
            n = <strong>{n}</strong> · k = <strong>{k}</strong> · lower95 ={" "}
            <strong>{lower95.toFixed(1)}%</strong>
          </div>
        </div>
      )}
    </section>
  );
}