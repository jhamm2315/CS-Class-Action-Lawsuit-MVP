// src/utils/demoMode.js
const DEMO_KEY = "demo_mode";
const SESSION_KEY = "session";
const INTAKE_KEY = "intake_draft";
const DEMO_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function getLS() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}
function getSS() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

export function enableDemoFromQuery() {
  const ls = getLS();
  if (!ls || typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (params.get("demo") === "1") {
    ls.setItem(DEMO_KEY, "1");
    ensureDemoSession();
  }
}

export function isDemo() {
  const ls = getLS();
  return !!ls && ls.getItem(DEMO_KEY) === "1";
}

export function ensureDemoSession() {
  const ls = getLS();
  if (!ls) return;
  const raw = ls.getItem(SESSION_KEY);
  try {
    const obj = raw ? JSON.parse(raw) : null;
    const fresh = obj?.demo && obj?.ts && Date.now() - obj.ts < DEMO_TTL_MS;
    if (fresh) return;
  } catch {}
  ls.setItem(SESSION_KEY, JSON.stringify({ demo: true, ts: Date.now() }));
}

export function exitDemo() {
  const ls = getLS();
  if (!ls) return;
  ls.removeItem(DEMO_KEY);
  try {
    const raw = ls.getItem(SESSION_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    if (obj.demo) ls.removeItem(SESSION_KEY);
  } catch {}
}

export function seedDemoIntake() {
  const ss = getSS();
  if (!ss) return;
  if (!ss.getItem(INTAKE_KEY)) {
    const demo = {
      parties: { plaintiff: "John Doe", defendant: "Any County Child Support Agency" },
      facts: [
        "No meaningful notice of hearing on support modification (mailed after hearing date).",
        "No opportunity to present evidence or cross-examine.",
        "Administrative officer acted without proper judicial authority.",
      ],
      issues: ["Due Process (notice & hearing)", "42 U.S.C. § 1983"],
      relief: ["Dismiss enforcement; vacate orders entered without due process."],
      docs: [],
    };
    ss.setItem(INTAKE_KEY, JSON.stringify(demo));
  }
}

export function bootstrapDemo() {
  enableDemoFromQuery();
  if (isDemo()) {
    ensureDemoSession();
    seedDemoIntake();
  }
}