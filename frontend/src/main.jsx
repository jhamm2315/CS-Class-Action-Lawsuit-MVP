import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { enableDevBypassFromQuery } from "./utils/devBypass";
enableDevBypassFromQuery();
import { enableDemoFromQuery } from "./utils/demoMode";
enableDemoFromQuery();
import { BrowserRouter } from "react-router-dom";

// Keep your existing global styles/imports
import "./index.css";
import "./i18n";

// If you still import other CSS (e.g., components.css), you can keep it
// import "./styles/components.css";

function mount() {
  const rootEl = document.getElementById("root");
  if (!rootEl) return;

  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

    ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/\$/, "")}>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );

  // NEW: tell index.html to hide the preload shell once React has rendered
  document.documentElement.classList.add("hydrated");
  const pre = document.getElementById("preload");
  if (pre) pre.remove();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount, { once: true });
} else {
  mount();
}

// Optional debug
console.info("[CODE1983] App mounted");