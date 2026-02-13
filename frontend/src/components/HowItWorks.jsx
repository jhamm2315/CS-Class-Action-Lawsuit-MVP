// frontend/src/components/HowItWorks.jsx
import React from "react";

const steps = [
  {
    title: "1) Tell us the facts",
    desc:
      "Anonymous intake. Optional document upload with client-side redaction before any bytes leave your device.",
  },
  {
    title: "2) We match your facts",
    desc:
      "AI + vector search over verified, plaintiff-winning federal cases (RAG). We return relevance scores and highlight matches.",
  },
  {
    title: "3) Generate a motion",
    desc:
      "Drafts are templated, cite-checked, and Bluebook-formatted. You review, edit, and export to PDF.",
  },
  {
    title: "4) File & track",
    desc:
      "We bundle district-specific filing instructions (non-advice), and your anonymized stats feed the movement dashboard.",
  },
];

export default function HowItWorks() {
  const gridStyle = {
    display: "grid",
    gap: 24, // more space so tiles never touch
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gridAutoFlow: "row",
    alignItems: "start",
  };

  const cardStyle = {
    position: "relative",
    zIndex: 0,
    background: "rgba(255,255,255,.035)",
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 1px 0 rgba(0,0,0,.15)",
    minHeight: 160,
  };

  const ctaRowStyle = {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 16,
    marginBottom: 32, // ← add space below the buttons
  };

  const sectionStyle = {
    display: "grid",
    gap: 16,
    paddingTop: 4,
    marginBottom: 32, // ← add space before the next section ("What makes it different")
  };

  return (
    <section className="container" style={sectionStyle}>
      <header className="first major" style={{ marginBottom: 4 }}>
        <h2 style={{ margin: 0 }}>How it works</h2>
        <p style={{ marginTop: 6 }}>
          Built for pro se litigants, anonymous, federal-law focused, and evidence-based.
        </p>
      </header>

      <div style={gridStyle}>
        {steps.map((s) => (
          <div key={s.title} style={cardStyle}>
            <h4 style={{ marginTop: 0, marginBottom: 6 }}>{s.title}</h4>
            <p style={{ margin: 0, color: "var(--muted, rgba(255,255,255,.72))" }}>{s.desc}</p>
          </div>
        ))}
      </div>

      <div style={ctaRowStyle}>
        <a href="/case" className="btn btn-primary btn-sm">Start a case</a>
        <a href="/motion" className="btn btn-outline btn-sm">Generate a motion</a>
      </div>
    </section>
  );
}