// frontend/src/components/PasskeySettings.jsx
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { base64urlToBuf, bufToBase64url } from "../lib/base64url";

export default function PasskeySettings() {
  const [status, setStatus] = useState("");
  const supported = !!(window.PublicKeyCredential && navigator.credentials);

  async function enroll() {
    if (!supported) {
      setStatus("WebAuthn not supported in this browser.");
      return;
    }
    try {
      setStatus("Starting passkey registration…");
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return setStatus("Not signed in.");

      // 1) Get creation options from backend
      const startRes = await fetch("/api/webauthn/register/start", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!startRes.ok) {
        return setStatus(`Failed to start registration: ${await startRes.text()}`);
      }
      const options = await startRes.json();

      // 2) Convert options to ArrayBuffers
      // publicKey expects: challenge (ArrayBuffer) and user.id (ArrayBuffer)
      options.challenge = base64urlToBuf(options.challenge);
      options.user.id = new TextEncoder().encode(options.user.id);

      if (options.excludeCredentials) {
        options.excludeCredentials = options.excludeCredentials.map((c) => ({
          ...c,
          id: base64urlToBuf(c.id),
        }));
      }

      // 3) Create credential
      const cred = await navigator.credentials.create({ publicKey: options });
      if (!cred) return setStatus("Credential creation was cancelled.");

      // 4) Package attestation for server
      const credential = {
        id: cred.id,
        rawId: bufToBase64url(cred.rawId),
        type: cred.type,
        response: {
          attestationObject: bufToBase64url(cred.response.attestationObject),
          clientDataJSON: bufToBase64url(cred.response.clientDataJSON),
        },
        clientExtensionResults: cred.getClientExtensionResults?.() || {},
        origin: window.location.origin,
      };

      // 5) Finish registration
      const finishRes = await fetch("/api/webauthn/register/finish", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credential),
      });
      if (!finishRes.ok) {
        const t = await finishRes.text();
        return setStatus("Registration failed: " + t);
      }
      const out = await finishRes.json();
      if (out?.mfa_token) localStorage.setItem("mfa_token", out.mfa_token);

      setStatus("✅ Passkey enrolled");
    } catch (err) {
      console.error(err);
      setStatus("Error during registration: " + (err?.message || String(err)));
    }
  }

  async function verify() {
    if (!supported) {
      setStatus("WebAuthn not supported in this browser.");
      return;
    }
    try {
      setStatus("Starting passkey authentication…");
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return setStatus("Not signed in.");

      // 1) Get request options from backend
      const start = await fetch("/api/webauthn/authenticate/start", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!start.ok) {
        return setStatus(`Failed to start authentication: ${await start.text()}`);
      }
      const options = await start.json();

      // 2) Convert to ArrayBuffers
      options.challenge = base64urlToBuf(options.challenge);
      if (options.allowCredentials) {
        options.allowCredentials = options.allowCredentials.map((c) => ({
          ...c,
          id: base64urlToBuf(c.id),
        }));
      }

      // 3) Get assertion
      const assertion = await navigator.credentials.get({ publicKey: options });
      if (!assertion) return setStatus("Authentication cancelled.");

      const payload = {
        id: assertion.id,
        rawId: bufToBase64url(assertion.rawId),
        type: assertion.type,
        response: {
          authenticatorData: bufToBase64url(assertion.response.authenticatorData),
          clientDataJSON: bufToBase64url(assertion.response.clientDataJSON),
          signature: bufToBase64url(assertion.response.signature),
          userHandle: assertion.response.userHandle
            ? bufToBase64url(assertion.response.userHandle)
            : null,
        },
        clientExtensionResults: assertion.getClientExtensionResults?.() || {},
        origin: window.location.origin,
      };

      // 4) Finish authentication
      const finish = await fetch("/api/webauthn/authenticate/finish", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!finish.ok) {
        const t = await finish.text();
        return setStatus("Authentication failed: " + t);
      }

      // ✅ Store short-lived MFA token for sensitive endpoints (X-MFA header)
      const out = await finish.json();
      if (out?.mfa_token) localStorage.setItem("mfa_token", out.mfa_token);

      setStatus("✅ Passkey verified");
    } catch (err) {
      console.error(err);
      setStatus("Error during authentication: " + (err?.message || String(err)));
    }
  }

  return (
    <div className="border p-4 rounded">
      <h3 className="font-semibold mb-2">Passkeys</h3>
      {!supported && <p>Your browser doesn’t support WebAuthn.</p>}
      {supported && (
        <div className="flex gap-2">
          <button className="btn" onClick={enroll}>Enroll Passkey</button>
          <button className="btn" onClick={verify}>Verify Passkey</button>
        </div>
      )}
      <p className="text-sm mt-2">{status}</p>
    </div>
  );
}