import React, { useState } from "react";
import ZeroFourLayout from "../layouts/ZeroFourLayout";
import { supabase } from "../lib/supabase";

export default function ClassAction() {
  const [form, setForm] = useState({
    email: "", zip_code: "", reason_description: "", class_action_opt_in: true
  });
  const [status, setStatus] = useState(null);

  async function submit(e){
    e.preventDefault();
    setStatus("Saving…");
    try{
      const payload = {
        email: form.email || null,
        zip_code: form.zip_code || null,
        reason_description: form.reason_description || null,
        class_action_opt_in: true
      };
      const { error } = await supabase.from("petition_signatures").insert(payload);
      if (error) throw error;
      setStatus("✓ Thanks — you’re counted. We’ll notify you when filing thresholds are met.");
      setForm({ email:"", zip_code:"", reason_description:"", class_action_opt_in:true });
    }catch(err){
      setStatus(`⚠︎ ${err.message}`);
    }
  }

  return (
    <ZeroFourLayout banner={<>
      <h2>Join the class-action intake</h2>
      <p>No spam. We track readiness, not identities. Email optional; zip helps show state readiness.</p>
    </>}>
      <section className="container box" style={{ display:"grid", gap:12 }}>
        <form onSubmit={submit} style={{ display:"grid", gap:10 }}>
          <label>Email (optional)</label>
          <input
            value={form.email}
            onChange={e=>setForm({...form, email:e.target.value})}
            placeholder="you@example.com"
            style={{ padding:10, borderRadius:10, border:"1px solid var(--border)", background:"rgba(255,255,255,.03)", color:"var(--text)" }}
          />
          <label>ZIP code (optional)</label>
          <input
            value={form.zip_code}
            onChange={e=>setForm({...form, zip_code:e.target.value})}
            placeholder="e.g., 30301"
            style={{ padding:10, borderRadius:10, border:"1px solid var(--border)", background:"rgba(255,255,255,.03)", color:"var(--text)" }}
          />
          <label>Why do you want to join? (optional)</label>
          <textarea
            rows={5}
            value={form.reason_description}
            onChange={e=>setForm({...form, reason_description:e.target.value})}
            placeholder="One or two lines is enough."
            style={{ padding:10, borderRadius:10, border:"1px solid var(--border)", background:"rgba(255,255,255,.03)", color:"var(--text)" }}
          />
          <button className="btn btn-primary" type="submit">Opt-in</button>
        </form>

        <div style={{ minHeight:24, color: status?.startsWith("✓") ? "#74ffa6" : "var(--muted)" }}>{status}</div>
      </section>

      {/* Optional: embed Google Form as an alternative */}
      <section className="container box" style={{ display:"grid", gap:10 }}>
        <h4>Prefer Google Forms?</h4>
        <p style={{ color:"var(--muted)" }}>Use our anonymous questionnaire — your choice.</p>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <a className="btn btn-outline btn-sm" href="https://docs.google.com/forms/d/1zRyKHIAB_1Gm5aSLFMYskqQ7nVj55KwKaMBGhOd9kAc/edit?pli=1" target="_blank" rel="noreferrer">
            Open Google Form
          </a>
          {/* Or embed: replace src with your live form URL */}
          {/* <iframe title="Class Action Form" src="https://docs.google.com/forms/d/1zRyKHIAB_1Gm5aSLFMYskqQ7nVj55KwKaMBGhOd9kAc/edit?pli=1" width="100%" height="720" frameBorder="0">Loading…</iframe> */}
        </div>
      </section>
    </ZeroFourLayout>
  );
}