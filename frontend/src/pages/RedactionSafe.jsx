// src/pages/RedactionSafe.jsx
import React from "react";
import LocalErrorBoundary from "../components/LocalErrorBoundary";

const RedactionTool = React.lazy(() => import("./RedactionTool"));

export default function RedactionSafe() {
  return (
    <React.Suspense fallback={<div className="container box">Loading…</div>}>
      <LocalErrorBoundary
        fallback={
          <div className="container box">
            <h3 style={{ margin: 0 }}>Redaction tool failed to load</h3>
            <p style={{ color: "var(--muted)" }}>
              Please reload the page or try again in a moment.
            </p>
          </div>
        }
      >
        <RedactionTool />
      </LocalErrorBoundary>
    </React.Suspense>
  );
}