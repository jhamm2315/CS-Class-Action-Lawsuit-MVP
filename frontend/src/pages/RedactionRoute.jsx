// frontend/src/pages/RedactionRoute.jsx
import React from "react";
import LocalErrorBoundary from "../components/LocalErrorBoundary";

// IMPORTANT: this imports your existing 300-line page without modifying it
const RedactionImpl = React.lazy(() => import("./RedactionTool"));

export default function RedactionRoute() {
  return (
    <LocalErrorBoundary>
      <React.Suspense fallback={<div className="p-4">Loading redaction…</div>}>
        <RedactionImpl />
      </React.Suspense>
    </LocalErrorBoundary>
  );
}