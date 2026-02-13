// frontend/src/App.jsx
import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Layout + Top nav
import ZeroFourLayout from "./layouts/ZeroFourLayout";
import TopNav from "./components/TopNav";

// --- Safe lazy helper: falls back to Home if a page is missing ---
const safeLazy = (loader) =>
  lazy(async () => {
    try {
      return await loader();
    } catch (e) {
      // Fallback to Home so the app doesn't blank/crash while we iterate
      return await import("./pages/Home.jsx");
    }
  });

// Pages (keep these filenames exactly as your files use)
const Home          = safeLazy(() => import("./pages/Home.jsx"));
const CaseBuilder   = safeLazy(() => import("./pages/CaseBuilder.jsx"));   // if you don’t have it yet, it will fall back to Home
const MotionStudio  = safeLazy(() => import("./pages/MotionStudio.jsx"));  // note: “MotionStudio”, not “Motions”
const RedactionTool = safeLazy(() => import("./pages/RedactionTool.jsx"));
const SettingsSafe  = safeLazy(() => import("./pages/SettingsSafe.jsx"));

function NotFound() {
  return (
    <div className="container box">
      <h2>404 — Not found</h2>
      <p>The page you requested doesn’t exist.</p>
    </div>
  );
}

export default function App() {
  return (
    // IMPORTANT: turning the banner OFF here prevents the duplicate row of CTAs
    <ZeroFourLayout banner={false}>
      <TopNav />

      <Suspense fallback={<div className="container box">Loading…</div>}>
        <Routes>
          {/* Primary pages */}
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Navigate to="/" replace />} />

          <Route path="/case-builder" element={<CaseBuilder />} />
          <Route path="/motions" element={<MotionStudio />} />
          <Route path="/redaction" element={<RedactionTool />} />
          <Route path="/settings" element={<SettingsSafe />} />

          {/* If you already had a /signin route, keep it;
              otherwise remove this or point to your auth page */}
          {/* <Route path="/signin" element={<SignIn />} /> */}

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ZeroFourLayout>
  );
}