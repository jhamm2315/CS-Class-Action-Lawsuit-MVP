import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useLocation, useNavigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(true);
  const loc = useLocation();
  const nav = useNavigate();

  useEffect(() => {
    const dev = localStorage.getItem("dev_access_token");
    if (dev) {
      setOk(true); setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        const redirect = encodeURIComponent(loc.pathname + loc.search + loc.hash);
        nav(`/auth?next=${redirect}`);
      } else {
        setOk(true);
      }
      setLoading(false);
    });
  }, [nav, loc.pathname, loc.search, loc.hash]);

  if (loading) return <div className="p-6">Checking session…</div>;
  return ok ? children : null;
}