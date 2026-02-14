import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { enableDevBypassFromQuery } from "./utils/devBypass";
import { enableDemoFromQuery } from "./utils/demoMode";

import "./index.css";
import "./i18n";

enableDevBypassFromQuery();
enableDemoFromQuery();

function mount() {
  const rootEl = document.getElementById("root");
  if (!rootEl) return;

  // GitHub Pages serves at /CS-Class-Action-Lawsuit-MVP/
  // React Router basename must NOT end with "/"
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");

  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <BrowserRouter basename={base}>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );

  // Optional: hide any preload shell if you use one
  document.documentElement.classList.add("hydrated");
  const pre = document.getElementById("preload");
  if (pre) pre.remove();

  console.info("[CODE1983] App mounted. BASE_URL =", import.meta.env.BASE_URL, "basename =", base);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount, { once: true });
} else {
  mount();
}
