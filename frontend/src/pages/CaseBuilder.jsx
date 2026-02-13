import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ZeroFourLayout from "../layouts/ZeroFourLayout";
import Stepper from "../components/Stepper";
import DocDropzone from "../components/DocDropzone";
import { api } from "../lib/api";

const STEPS = ["Facts", "Evidence", "Matches"];

export default function CaseBuilder() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [facts, setFacts] = useState("");
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [matches, setMatches] = useState([]);
  const [selected, setSelected] = useState({});
  const [error, setError] = useState("");

  async function runAnalysis() {
    setError("");
    if (!facts.trim()) return setError("Please add your facts first.");
    try {
      setLoading(true);
      const [summary, similar] = await Promise.all([
        api.analyzeFacts(facts),
        api.matchCases(facts, 5),
      ]);
      setAnalysis(summary);
      setMatches(similar?.cases || similar || []);
      setStep(2);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  function proceedToMotion() {
    const picks = matches.filter((m, i) => selected[i]);
    const draft = { facts, docs: docs.map(d => ({ name: d.name, hash: d.hash })), matches: picks };
    sessionStorage.setItem("draft_case", JSON.stringify(draft));
    nav("/motion");
  }

  const banner = (
    <>
      <h2>Case Builder</h2>
      <p>Summarize your facts → attach evidence (optional) → preview winning precedents.</p>
    </>
  );

  return (
    <ZeroFourLayout banner={banner}>
      <section className="container box" style={{ display: "grid", gap: 12 }}>
        <Stepper steps={STEPS} current={step} onStep={setStep} />

        {step === 0 && (
          <div className="container box" style={{ background: "rgba(255,255,255,.03)" }}>
            <label htmlFor="facts"><strong>Your facts</strong></label>
            <textarea
              id="facts"
              rows={10}
              value={facts}
              onChange={e => setFacts(e.target.value)}
              placeholder="Who did what, when? What processes were denied? What harm resulted?"
              style={{ width: "100%", borderRadius: 10, border: "1px solid var(--border)", background: "rgba(255,255,255,.03)", color: "var(--text)", padding: 12 }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button className="btn btn-primary" onClick={() => setStep(1)}>Next: Evidence</button>
              <button className="btn btn-outline" onClick={runAnalysis} disabled={loading}>
                {loading ? "Analyzing…" : "Skip to Matches"}
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <>
            <DocDropzone onFiles={setDocs} />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-outline" onClick={() => setStep(0)}>Back</button>
              <button className="btn btn-primary" onClick={runAnalysis} disabled={loading}>
                {loading ? "Analyzing…" : "Analyze & Find Matches"}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="container box" style={{ background: "rgba(255,255,255,.03)", display:"grid", gap:10 }}>
              <h4>AI summary</h4>
              <pre style={{ margin:0, whiteSpace:"pre-wrap" }}>
                {analysis?.summary || analysis?.text || "Summary will appear here."}
              </pre>
            </div>

            <div className="container box" style={{ display: "grid", gap: 10 }}>
              <h4>Top matching, plaintiff-winning cases</h4>
              {(matches || []).map((m, i) => (
                <div key={m.id || i} className="container box" style={{ background:"rgba(255,255,255,.03)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <div>
                      <strong>{m.case_name || m.title}</strong>
                      <div style={{ color: "var(--muted)" }}>
                        {m.citation} • {m.jurisdiction || m.court} • {(m.score ?? m.confidence ?? 0).toFixed?.(2) ?? m.score}
                      </div>
                    </div>
                    <label className="btn btn-outline btn-xs" style={{ cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={!!selected[i]}
                        onChange={(e) => setSelected({ ...selected, [i]: e.target.checked })}
                        style={{ marginRight: 6 }}
                      />
                      Include
                    </label>
                  </div>
                  <p style={{ margin:"6px 0 0 0", color:"var(--muted)" }}>{m.summary || m.holding || ""}</p>
                  {m.source_link && (
                    <a className="btn btn-xs btn-outline" href={m.source_link} target="_blank" rel="noreferrer">Open on CourtListener</a>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-outline" onClick={() => setStep(1)}>Back</button>
              <button className="btn btn-primary" onClick={proceedToMotion} disabled={!facts}>
                Continue to Motion Studio →
              </button>
            </div>
          </>
        )}

        {error && <div style={{ color: "#ff9e99" }}>⚠︎ {error}</div>}
      </section>
    </ZeroFourLayout>
  );
}