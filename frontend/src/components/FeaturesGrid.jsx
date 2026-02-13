// frontend/src/components/FeaturesGrid.jsx
import React from "react";

const FEATURES = [
  { h: "Passkeys & WebAuthn", p: "Phishing-resistant sign-in with optional second factor." },
  { h: "Client-side redaction", p: "PII is removed in-browser before upload. SHA-256 for integrity." },
  { h: "Citation verifier", p: "Every cite checked against CourtListener; flags negative treatment." },
  { h: "Explainability", p: "See which facts matched which passages. Transparent similarity scores." },
  { h: "Jurisdiction packaging", p: "District-specific motion shells + non-advice filing checklists." },
  { h: "Accessibility", p: "WCAG 2.2 AA, Spanish UI, and read-aloud built in." },
];

export default function FeaturesGrid() {
  const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 16,
    alignItems: "stretch",
  };

  const card = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    padding: 16,
    borderRadius: 12,
    minHeight: 130,
    background: "rgba(255,255,255,.03)",
    border: "1px solid var(--border, rgba(255,255,255,.08))",
    boxShadow: "0 1px 0 rgba(255,255,255,.05) inset",
  };

  return (
    <section className="container box" style={{ display: "grid", gap: 16 }}>
      <header className="first major">
        <h2>What makes it different</h2>
        <p>No tracking. Federal law only. Motions grounded in real, winning cases.</p>
      </header>

      <div style={grid}>
        {FEATURES.map((f) => (
          <article key={f.h} style={card}>
            <h4 style={{ margin: "0 0 6px 0" }}>{f.h}</h4>
            <p style={{ margin: 0, color: "var(--muted)" }}>{f.p}</p>
          </article>
        ))}
      </div>
    </section>
  );
}