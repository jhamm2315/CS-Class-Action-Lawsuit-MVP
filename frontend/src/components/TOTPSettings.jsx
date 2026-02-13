import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function TOTPSettings(){
  const [status, setStatus] = useState("");
  const [uri, setUri] = useState("");
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");

  async function enroll(){
    setStatus("Starting TOTP enrollment…");
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    if (error) return setStatus("Error: " + error.message);
    setFactorId(data.id);
    setUri(data.totp.qr_code);
    setStatus("Scan the QR in your authenticator app, then enter the 6-digit code.");
  }

  async function verify(){
    if (!factorId || !code) return;
    const { error } = await supabase.auth.mfa.verify({ factorId, code });
    if (error) return setStatus("Verify failed: " + error.message);
    setStatus("✅ TOTP enrolled");
  }

  async function challenge(){
    // Use this during sign-in flows to require TOTP
    const { data, error } = await supabase.auth.mfa.challenge({ factorId });
    if (error) setStatus("Challenge failed: " + error.message);
    else setStatus("Enter your TOTP now.");
  }

  return (
    <div className="border p-4 rounded space-y-2">
      <h3 className="font-semibold">TOTP (Authenticator App)</h3>
      <div className="flex gap-2">
        <button className="btn" onClick={enroll}>Enroll TOTP</button>
        {uri && (
          <a className="btn" href={uri} target="_blank" rel="noreferrer">Open QR</a>
        )}
      </div>
      {factorId && (
        <div className="flex items-center gap-2">
          <input className="border px-2 py-1" placeholder="123456" value={code} onChange={e=>setCode(e.target.value)} />
          <button className="btn" onClick={verify}>Verify</button>
        </div>
      )}
      <p className="text-sm">{status}</p>
    </div>
  );
}