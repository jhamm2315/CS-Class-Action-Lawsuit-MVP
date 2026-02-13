// frontend/src/components/TopNav.jsx
import React from "react";
import { NavLink } from "react-router-dom";

// Reusable “chip” link (adds an active state)
function ChipLink({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `button small ${isActive ? "primary" : ""}`
      }
      style={{ marginRight: 8 }}
    >
      {children}
    </NavLink>
  );
}

export default function TopNav() {
  return (
    <nav className="container" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "8px 0" }}>
      <div style={{ fontWeight: 600, opacity: 0.85 }}>
        Operation: <span style={{ letterSpacing: 0.5 }}>CODE 1983</span>
      </div>

      <div style={{ flex: 1 }} />

      <ChipLink to="/">Home</ChipLink>
      <ChipLink to="/case-builder">Case Builder</ChipLink>
      <ChipLink to="/motions">Motions</ChipLink>
      <ChipLink to="/redaction">Redaction</ChipLink>
      <ChipLink to="/settings">Settings</ChipLink>

      {/* If you have a /signin page, link it; otherwise this can be a dummy button */}
      <NavLink to="/signin" className="button small primary">
        Sign in
      </NavLink>
    </nav>
  );
}