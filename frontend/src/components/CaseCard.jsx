import React from "react";

export default function CaseCard({ c }) {
  return (
    <article className="container box" style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <h4 style={{ margin: 0 }}>{c.case_name}</h4>
        <span style={{ fontSize: ".85rem", opacity: .8 }}>{c.year}</span>
      </div>
      <div style={{ fontSize: ".9rem", opacity: .9 }}>
        <span>{c.court} • </span>
        <span>{c.citation}</span>
      </div>
      <p style={{ margin: "6px 0 0 0", color: "var(--muted)" }}>{c.summary}</p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
        {c.tags?.map((t) => (
          <span key={t} className="btn btn-xs btn-muted" style={{ cursor: "default" }}>
            {t}
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <a href={c.source_link} target="_blank" rel="noreferrer" className="btn btn-outline btn-xs">
          Read case
        </a>
        {c.outcome === "WON" && (
          <span className="btn btn-xs btn-primary" style={{ pointerEvents: "none" }}>Plaintiff won</span>
        )}
      </div>
    </article>
  );
}