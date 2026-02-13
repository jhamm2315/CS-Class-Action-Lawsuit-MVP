// frontend/src/pages/Onboarding.jsx
import React, { useState } from "react";
import ZeroFourLayout from "@/layouts/ZeroFourLayout";
import DocHygieneDropzone from "@/components/DocHygieneDropzone";
import { seedDemoIntake, isDemo } from "@/utils/demoMode";
import { useNavigate } from "react-router-dom";

export default function Onboarding() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    incident: "",
    relief: "",
    docs: [],
  });

  function next() { setStep((s) => Math.min(3, s + 1)); }
  function back() { setStep((s) => Math.max(1, s - 1)); }

  function startDemo() {
    seedDemoIntake();
    nav("/case?demo=1");
  }

  async function startBuilder() {
    const payload = {
      incident: form.incident,
      relief: form.relief,
      docs: form.docs.map(d => ({ name: d.name, size: d.size, type: d.type })),
    };
    sessionStorage.setItem("intake_draft", JSON.stringify(payload));
    nav("/case");
  }

  const banner = (
    <>
      <h2><strong>Quick start</strong>: 2–3 screens to prime your case</h2>
      <p>Tell us what happened, the relief you seek, and (optionally) add documents.</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {!isDemo() && (
          <a href="/onboarding?demo=1" className="btn btn-outline btn-sm">Try Demo</a>
        )}
      </div>
    </>
  );

  return (
    <ZeroFourLayout banner={banner}>
      <section className="container box" style={{ display: "grid", gap: 16 }}>
        <header className="first major">
          <h2>Onboarding</h2>
          <p>We’ll prep the Case Builder with your context.</p>
        </header>

        {/* Stepper */}
        <div className="steps">
          <div className={`step ${step>=1?'active':''}`}>Incident</div>
          <div className={`step ${step>=2?'active':''}`}>Relief</div>
          <div className={`step ${step>=3?'active':''}`}>Documents</div>
        </div>

        {step === 1 && (
          <div className="box">
            <label className="label">What happened?</label>
            <textarea
              className="input"
              rows={6}
              placeholder="Briefly describe lack of notice/hearing, admin actions, etc."
              value={form.incident}
              onChange={(e)=>setForm({...form, incident: e.target.value})}
            />
            <div style={{display:"flex", gap:8, marginTop:10}}>
              <button className="btn" onClick={next} disabled={!form.incident.trim()}>Next</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="box">
            <label className="label">What relief do you seek?</label>
            <textarea
              className="input"
              rows={4}
              placeholder="E.g., dismiss enforcement, vacate orders entered without due process…"
              value={form.relief}
              onChange={(e)=>setForm({...form, relief: e.target.value})}
            />
            <div style={{display:"flex", gap:8, marginTop:10}}>
              <button className="btn btn-outline" onClick={back}>Back</button>
              <button className="btn" onClick={next} disabled={!form.relief.trim()}>Next</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="box">
            <label className="label">Add documents (optional)</label>
            <DocHygieneDropzone
              onFiles={(cleanFiles)=> setForm({...form, docs: cleanFiles})}
            />
            <div style={{display:"flex", gap:8, marginTop:10, flexWrap:"wrap"}}>
              <button className="btn btn-outline" onClick={back}>Back</button>
              <button className="btn" onClick={startBuilder}>Start Case Builder</button>
              <button className="btn btn-secondary" onClick={startDemo}>Load Demo</button>
            </div>
          </div>
        )}
      </section>
    </ZeroFourLayout>
  );
}