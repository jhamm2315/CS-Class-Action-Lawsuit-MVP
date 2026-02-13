// frontend/src/lib/api.js
import { supabase } from "./supabase";

/** get auth + mfa headers (dev token wins if set) */
async function authHeaders() {
  const h = { "Content-Type": "application/json" };
  const dev = localStorage.getItem("dev_access_token");
  if (dev) {
    h.Authorization = `Bearer ${dev}`;
  } else {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (token) h.Authorization = `Bearer ${token}`;
  }
  const mfa = localStorage.getItem("mfa_token");
  if (mfa) h["X-MFA"] = mfa;
  return h;
}

/** fetch wrapper with one retry on 5xx and unified error handling */
export async function apiFetch(path, { method = "GET", headers = {}, body } = {}) {
  const base = "/api"; // Vite proxy → backend
  const h = { ...(await authHeaders()), ...headers };
  const doFetch = async () => {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: h,
      body: body ? (h["Content-Type"]?.includes("json") ? JSON.stringify(body) : body) : undefined,
    });
    return res;
  };

  let res = await doFetch();
  if (res.status >= 500) {
    // simple one retry on server errors
    res = await doFetch();
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const message = text || `${res.status} ${res.statusText}`;
    // broadcast to toast if available
    window.dispatchEvent(new CustomEvent("toast", { detail: { type: "error", message } }));
    throw new Error(message);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

const BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

async function jpost(path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(text || r.statusText);
  try { return JSON.parse(text); } catch { return { ok: true, text }; }
}

export const api = {
  analyzeFacts: (text) => jpost("/analyze", { text }),
  matchCases: (text, top_k = 5) => jpost("/match_cases", { text, top_k }),
  generateMotion: (payload) => jpost("/generate_motion", payload),
  verifyCitations: (citations) => jpost("/verify_citations", { citations }),
};

export default api;