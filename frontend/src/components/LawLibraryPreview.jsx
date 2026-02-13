// frontend/src/components/LawLibraryPreview.jsx
import React from "react";

/**
 * Simple, self-contained preview grid.
 * - No "Sample:" prefixes
 * - Each card is its own block (CSS grid, no overlap/stacking)
 * - Uses your existing "box"/"btn" utility classes
 */
const CASE_CARDS = [
  {
    year: "2019",
    title: "Due Process Violation in Support Enforcement",
    court: "U.S. District Court",
    docket: "No. 1:19-cv-00000",
    summary:
      "Court found defendant agency failed to provide adequate notice and an opportunity to be heard before taking adverse action. Relief granted under §1983.",
    tags: ["due_process", "§1983", "child_support"],
    href: "/library/case/1",
  },
  {
    year: "2021",
    title: "Extrinsic Fraud & Default Judgment",
    court: "U.S. Court of Appeals",
    docket: "No. 21-0000",
    summary:
      "Default judgment vacated where extrinsic fraud prevented a fair adversarial hearing; remanded for proceedings consistent with due process.",
    tags: ["extrinsic_fraud", "appeal", "remand"],
    href: "/library/case/2",
  },
  {
    year: "2016",
    title: "Lack of Jurisdiction — Void Orders",
    court: "U.S. District Court",
    docket: "No. 2:16-cv-00000",
    summary:
      "Orders were void where tribunal lacked subject-matter jurisdiction; §1983 damages and declaratory relief allowed.",
    tags: ["jurisdiction", "void_orders", "§1983"],
    href: "/library/case/3",
  },
];

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: 16,
};

const card = {
  position: "relative",
  height: "100%",
  padding: 18,
  borderRadius: 12,
};

const metaRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  marginBottom: 6,
  opacity: 0.8,
  fontSize: 14,
};

const pills = { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 };

const pill = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: 9999,
  fontSize: 12,
  border: "1px solid rgba(255,255,255,0.15)",
  opacity: 0.8,
};

const actions = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 12,
  alignItems: "center",
};

export default function LawLibraryPreview() {
  return (
    <section className="container box">
      <header className="major">
        <h2>Winning precedents rooted in Federal Case-Law</h2>
        <p>
          We ground motions in verified, plaintiff-winning cases no matter how niche. Each case is tagged with relevant topics and includes links to the full text and key
          citations.
        </p>
      </header>

      {/* Non-overlapping grid of cards */}
      <div style={grid}>
        {CASE_CARDS.map((c, i) => (
          <article key={i} className="box" style={card}>
            <div style={metaRow}>
              <span>{c.court}</span>
              <strong>{c.year}</strong>
            </div>

            <h3 style={{ margin: "6px 0 6px" }}>{c.title}</h3>
            <p style={{ opacity: 0.8, marginTop: 0 }}>{c.docket}</p>

            <p style={{ marginTop: 8 }}>{c.summary}</p>

            <div style={pills}>
              {c.tags.map((t) => (
                <span key={t} style={pill}>
                  {t}
                </span>
              ))}
            </div>

            <div style={actions}>
              <a href={c.href} className="btn btn-outline btn-sm">
                Read case
              </a>
              <span className="btn btn-secondary btn-sm">Plaintiff won</span>
            </div>
          </article>
        ))}
      </div>

      {/* Footer actions */}
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "space-between",
          marginTop: 16,
          flexWrap: "wrap",
        }}
      >
        <a className="btn btn-outline" href="/library">
          Open full library
        </a>
        <a className="btn btn-primary" href="/case?step=matches">
          Match my facts →
        </a>
      </div>
    </section>
  );
}