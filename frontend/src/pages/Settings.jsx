// frontend/src/pages/Settings.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import PasskeySettings from "../components/PasskeySettings";
import { useTranslation } from "react-i18next";
import TOTPSettings from "../components/TOTPSettings";

export default function Settings() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [lang, setLang]   = useState(localStorage.getItem("lang") || "en");
  const [retention, setRetention] = useState(localStorage.getItem("retention_days") || "30");
  const [dev, setDev] = useState(isDevUnlocked());

  // profile fields (persisted in app_user_profiles via RLS)
  const [locale, setLocale] = useState("en");
  const [retentionDays, setRetentionDays] = useState(30);

  // local-only toggles
  const [consentStore, setConsentStore] = useState(
    localStorage.getItem("consent_store") === "true"
  );

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data?.user || null;
      setUser(u);

      if (u) {
        const { data: prof } = await supabase
          .from("app_user_profiles")
          .select("locale, retention_days")
          .eq("id", u.id)
          .maybeSingle();

        if (prof) {
          setLocale(prof.locale || "en");
          setRetentionDays(prof.retention_days ?? 30);
          if (prof.locale && prof.locale !== i18n.resolvedLanguage) {
            i18n.changeLanguage(prof.locale);
          }
        }
      }
      setLoading(false);
    })();
  }, [i18n]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);
  useEffect(() => localStorage.setItem("lang", lang), [lang]);
  useEffect(() => localStorage.setItem("retention_days", retention), [retention]);

  function toggleDev() {
    if (dev) {
      localStorage.removeItem("dev_access_token");
      setDev(false);
    } else {
      localStorage.setItem("dev_access_token", "ok");
      setDev(true);
    }
  }

  async function saveProfile() {
    if (!user) return;
    setLoading(true);
    await supabase
      .from("app_user_profiles")
      .upsert({ id: user.id, locale, retention_days: retentionDays });
    // reflect language immediately
    i18n.changeLanguage(locale);
    setLoading(false);
  }

  function saveConsent(val) {
    setConsentStore(val);
    localStorage.setItem("consent_store", String(val));
  }

  async function exportMyData() {
    if (!user) return;
    const [cases, uploads, motions] = await Promise.all([
      supabase.from("user_cases").select("*").eq("user_id", user.id),
      supabase
        .from("user_uploads")
        .select("*")
        .in(
          "case_id",
          (
            await supabase
              .from("user_cases")
              .select("id")
              .eq("user_id", user.id)
          ).data?.map((x) => x.id) || []
        ),
      supabase
        .from("generated_motions")
        .select("*")
        .in(
          "case_id",
          (
            await supabase
              .from("user_cases")
              .select("id")
              .eq("user_id", user.id)
          ).data?.map((x) => x.id) || []
        ),
    ]);

    const payload = {
      exported_at: new Date().toISOString(),
      user_id: user.id,
      cases: cases.data || [],
      uploads: uploads.data || [],
      motions: motions.data || [],
      app_version: "mvp",
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "operation_code_1983_export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Account Settings</h1>

      {/* Profile */}
      <section className="border rounded p-4 space-y-3">
        <h2 className="font-semibold text-lg">Profile</h2>
        <div className="text-sm text-gray-600">
          <div>User ID: <span className="font-mono">{user?.id}</span></div>
          <div>Email: <span className="font-mono">{user?.email}</span></div>
        </div>

        <label className="block">
          <span className="text-sm">Language</span>
          <select
            className="border rounded px-2 py-1 mt-1"
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            {/* add more languages as you add i18n resources */}
          </select>
        </label>

        <label className="block">
          <span className="text-sm">Data Retention (days)</span>
          <input
            type="number"
            min={7}
            max={365}
            className="border rounded px-2 py-1 mt-1 w-28"
            value={retentionDays}
            onChange={(e) => setRetentionDays(parseInt(e.target.value || "30", 10))}
          />
          <p className="text-xs text-gray-600 mt-1">
            We keep your submissions for this period. Lower numbers minimize storage.
          </p>
        </label>

        <div className="flex gap-2">
          <button className="btn" onClick={saveProfile}>Save</button>
        </div>
      </section>

      {/* Security */}
      <section className="border rounded p-4 space-y-3">
        <h2 className="font-semibold text-lg">Security</h2>
        <PasskeySettings />
        <section className="border rounded p-4 space-y-3">
            <h2 className="font-semibold text-lg">Security</h2>
            <PasskeySettings />
            <TOTPSettings />
            <p className="text-xs text-gray-600">
                Passkeys and authenticator apps provide strong multi-factor security.
            </p>
        </section>

        <p className="text-xs text-gray-600">
          Passkeys (WebAuthn) provide phishing-resistant authentication in addition to your normal login.
        </p>
      </section>

      {/* Privacy */}
      <section className="border rounded p-4 space-y-3">
        <h2 className="font-semibold text-lg">Privacy</h2>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={consentStore}
            onChange={(e) => saveConsent(e.target.checked)}
          />
          <span>Allow storage of my submissions (text/docs) to improve the system</span>
        </label>
        <p className="text-xs text-gray-600">
          You can revoke this at any time. When off, uploads should be redacted and minimized.
        </p>
      </section>

      {/* Data controls */}
      <section className="border rounded p-4 space-y-3">
        <h2 className="font-semibold text-lg">Your Data</h2>
        <div className="flex gap-2">
          <button className="btn" onClick={exportMyData}>Export My Data (JSON)</button>
          <button
            className="btn"
            onClick={() => {
              localStorage.clear();
              alert("Local data cleared (cache, consent, UI flags).");
            }}
          >
            Clear Local Cache
          </button>
        </div>
        <p className="text-xs text-gray-600">
          Account deletion requires admin action in MVP. Use “Export” to download your data; contact support to delete.
        </p>
      </section>

      {/* Danger zone */}
      <section className="border rounded p-4 space-y-3">
        <h2 className="font-semibold text-lg">Danger Zone</h2>
        <button className="btn" onClick={logout}>Log Out</button>
      </section>
    </div>
  );
}
