// frontend/src/layouts/AppShell.jsx
import { useEffect, useState } from "react";
import TopNav from "../components/TopNav";
import ToastHost from "../components/Toast";
import { supabase } from "../lib/supabase";
import ConsentBar from "../components/ConsentBar";
import QuickActionsBar from "../components/QuickActionsBar";

export default function AppShell({ children }) {
  const [authed, setAuthed] = useState(!!localStorage.getItem("dev_access_token"));

  useEffect(() => {
    // best-effort sync with Supabase session
    supabase.auth.getSession().then(({ data }) => {
      setAuthed((prev) => prev || !!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session || !!localStorage.getItem("dev_access_token"));
    });
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  async function logout() {
    localStorage.removeItem("dev_access_token");
    localStorage.removeItem("mfa_token");
    try { await supabase.auth.signOut(); } catch {}
    window.location.href = "/auth";
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--surface))] text-[hsl(var(--foreground))]">
      <TopNav authed={authed} onLogout={logout} />
      <QuickActionsBar />

      <main id="main" role="main" className="max-w-6xl mx-auto p-4">
        {children}
      </main>

      <footer role="contentinfo" className="border-t mt-8 p-4 text-sm text-gray-600 dark:text-gray-300">
        <div className="max-w-6xl mx-auto">
          <p>
            © {new Date().getFullYear()} Operation: CODE 1983 ·
            <a className="underline ml-1" href="https://www.law.cornell.edu/uscode/text/42/1983" target="_blank" rel="noreferrer">
              42 U.S.C. § 1983
            </a>
          </p>
          <p className="mt-1">This tool does not constitute legal advice.</p>
        </div>
      </footer>

      <ToastHost />
      <ConsentBar />
    </div>
  );
}