import React from "react";

// CourtListener search links (stable) – click opens real opinions/results
const CASES = [
  {
    name: "Mathews v. Eldridge (1976)",
    cite: "424 U.S. 319",
    topic: "Due Process (balancing test)",
    link: "https://www.courtlistener.com/?q=Mathews%20v.%20Eldridge%20424%20U.S.%20319",
    won: true,
  },
  {
    name: "Goldberg v. Kelly (1970)",
    cite: "397 U.S. 254",
    topic: "Due Process (notice + hearing)",
    link: "https://www.courtlistener.com/?q=Goldberg%20v.%20Kelly%20397%20U.S.%20254",
    won: true,
  },
  {
    name: "Turner v. Rogers (2011)",
    cite: "564 U.S. 431",
    topic: "Child support contempt; due process safeguards",
    link: "https://www.courtlistener.com/?q=Turner%20v.%20Rogers%20564%20U.S.%20431",
    won: true,
  },
  {
    name: "Santosky v. Kramer (1982)",
    cite: "455 U.S. 745",
    topic: "Parental rights; clear & convincing standard",
    link: "https://www.courtlistener.com/?q=Santosky%20v.%20Kramer%20455%20U.S.%20745",
    won: true,
  },
  {
    name: "Stanley v. Illinois (1972)",
    cite: "405 U.S. 645",
    topic: "Unwed fathers; due process/equal protection",
    link: "https://www.courtlistener.com/?q=Stanley%20v.%20Illinois%20405%20U.S.%20645",
    won: true,
  },
];

export default function TrustedCases() {
  return (
    <section className="container box" style={{ display:"grid", gap:14 }}>
      <header className="first major">
        <h2>Trusted cases (CourtListener)</h2>
        <p>Direct links to official opinions and citations. No hallucinations.</p>
      </header>

      <div style={{ display:"grid", gap:12, gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))" }}>
        {CASES.map((c)=>(
          <article key={c.name} className="container box" style={{ background:"rgba(255,255,255,.03)" }}>
            <h4 style={{ margin:"0 0 6px 0" }}>{c.name}</h4>
            <div style={{ fontSize:".9rem", opacity:.9 }}>{c.cite}</div>
            <div style={{ color:"var(--muted)", marginTop:4 }}>{c.topic}</div>
            <div style={{ display:"flex", gap:8, marginTop:10 }}>
              <a className="btn btn-outline btn-xs" href={c.link} target="_blank" rel="noreferrer">Open on CourtListener</a>
              {c.won && <span className="btn btn-xs btn-primary" style={{ pointerEvents:"none" }}>Plaintiff won</span>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}