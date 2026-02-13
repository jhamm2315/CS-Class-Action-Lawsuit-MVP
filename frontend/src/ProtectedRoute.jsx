// frontend/src/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";

/**
 * Minimal route guard.
 * - Treats any truthy localStorage "session" as authed (replace with your real check).
 * - Redirects to /auth and preserves where the user came from.
 * - Dev bypass is already handled in App.jsx via the Guard wrapper.
 */
export default function ProtectedRoute({ children }) {
  const loc = useLocation();

  // Replace this with your real auth check (e.g., Supabase session)
  const session =
    localStorage.getItem("session") ||
    localStorage.getItem("supabase.auth.token"); // optional: if you store supabase token

  const authed = !!session;

  if (!authed) {
    return <Navigate to="/auth" replace state={{ from: loc.pathname + loc.search }} />;
  }

  return children;
}