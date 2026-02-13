// src/pages/SettingsSafe.jsx
import React from "react";
import LocalErrorBoundary from "../components/LocalErrorBoundary"; // ← spelling fixed

const SettingsImpl = React.lazy(() => import("./Settings"));

export default function SettingsSafe() {
  return (
    <React.Suspense fallback={<div className="container box">Loading…</div>}>
      <LocalErrorBoundary
        fallback={
          <div className="container box">
            <h3 style={{ margin: 0 }}>Settings failed to load</h3>
            <p style={{ color: "var(--muted)" }}>
              Please reload the page or try again in a moment.
            </p>
          </div>
        }
      >
        <SettingsImpl />
      </LocalErrorBoundary>
    </React.Suspense>
  );
}