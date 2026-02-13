export function enableDevBypassFromQuery() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const val = params.get("dev");
  const isLocal =
    ["localhost", "127.0.0.1", "0.0.0.0"].includes(window.location.hostname);
  if (!isLocal) return;
  if (val === "ok") localStorage.setItem("dev_access_token", "ok");
  if (val === "off") localStorage.removeItem("dev_access_token");
}

export function isDevUnlocked() {
  if (typeof window === "undefined") return false;
  const isLocal =
    ["localhost", "127.0.0.1", "0.0.0.0"].includes(window.location.hostname);
  return isLocal && localStorage.getItem("dev_access_token") === "ok";
}