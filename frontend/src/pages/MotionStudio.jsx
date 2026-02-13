import React, { useEffect, useMemo, useState } from "react";
import ZeroFourLayout from "../layouts/ZeroFourLayout";
import { api } from "../lib/api";

// quick local PDF export using a new window
function downloadAsHtmlPdf(html, filename = "motion.html") {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const TEMPLATES = [
  { id: "dismiss", title: "Motion to Dismiss / Quash – Due Process & Extrinsic Fraud" },
  { id: "stay",    title: "Motion to Stay Enforcement Pending Federal Review" },
  { id: "1983",    title: "§1983 Complaint (short form) – Deprivation of Rights" },
];

export default function MotionStudio() {
  const draft = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem("draft_case") || "{}"); }
    catch { return {}; }
  }, []);

  const [tpl, setTpl] = useState(TEMPLATES[0].id);
  const [generating, setGenerating] = useState(false);
  const [motion, setMotion] = useState("");
  const [status, setStatus] = useState("");

  async function generate() {
    setStatus(""); setGenerating(true);
    try {
      const payload = {
        template: tpl,
        facts: draft.facts || "",
        cases: (draft.matches || []).map(m => ({
          case_name: m.case_name || m.title,
          citation: m.citation,
          holding: m.holding || m.summary,
          jurisdiction: m.jurisdiction || m.court,
          source_link: m.source_link
        })),
      };
      const res = await api.generateMotion(payload);
      setMotion(res.motion || res.text || JSON.stringify(res, null, 2));
      setStatus("✓ Draft generated");
    } catch (e) {
      setStatus(`⚠︎ ${e.message}`);
    } finally { setGenerating(false); }
  }

  useEffect(() => { if (!draft?.facts) setStatus("Tip: Build a draft in Case Builder for best results."); }, [draft]);

  const banner = (
    <>
      <h2>Motion Studio</h2>
      <p>Generate a court-ready draft from your facts and selected precedents.</p>
    </>
  );

  return (
    <ZeroFourLayout banner={banner}>
      <section className="container box" style={{ display:"grid", gap:12 }}>
        <div className="container box" style={{ background:"rgba(255,255,255,.03)" }}>
          <h4>Facts (read-only)</h4>
          <pre style={{ whiteSpace:"pre-wrap", margin:0 }}>{draft.facts || "No facts found in session."}</pre>
        </div>

        <div className="container box" style={{ background:"rgba(255,255,255,.03)" }}>
          <h4>Selected precedents</h4>
          {(draft.matches || []).length === 0 && <p style={{ color:"var(--muted)" }}>None selected yet.</p>}
          {(draft.matches || []).map((m, i) => (
            <div key={m.id || i} style={{ marginBottom:8 }}>
              <strong>{m.case_name || m.title}</strong> — {m.citation}
              {m.source_link && <a className="btn btn-xs btn-outline" style={{ marginLeft:8 }} href={m.source_link} target="_blank" rel="noreferrer">CourtListener</a>}
            </div>
          ))}
        </div>

        <div className="container box" style={{ display:"grid", gap:8 }}>
          <label><strong>Template</strong></label>
          <select value={tpl} onChange={e=>setTpl(e.target.value)} style={{ padding:10, borderRadius:10, background:"rgba(255,255,255,.03)", color:"var(--text)", border:"1px solid var(--border)" }}>
            {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn btn-primary" onClick={generate} disabled={generating}>
              {generating ? "Generating…" : "Generate Motion"}
            </button>
            <button
              className="btn btn-outline"
              onClick={() => downloadAsHtmlPdf(`<pre style="white-space:pre-wrap;font-family:ui-monospace">${motion}</pre>`)}
              disabled={!motion}
            >
              Download HTML (print to PDF)
            </button>
            <button
              className="btn btn-outline"
              onClick={() => navigator.clipboard.writeText(motion)}
              disabled={!motion}
            >
              Copy to clipboard
            </button>
          </div>
          {!!status && <div style={{ color: status.startsWith("✓") ? "#74ffa6" : "#ffb4a9" }}>{status}</div>}
        </div>

        <div className="container box" style={{ color:"var(--muted)" }}>
          <strong>Note:</strong> We verify citations against CourtListener and format per Bluebook when the backend endpoints are available.
        </div>
      </section>
    </ZeroFourLayout>
  );
}