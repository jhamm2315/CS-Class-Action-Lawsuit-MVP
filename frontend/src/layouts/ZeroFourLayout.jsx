import { NavLink, Link } from "react-router-dom";
import React from "react";

function NavButton({ to, children, variant = "ghost" }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `btn btn-${variant} btn-sm ${isActive ? "is-active" : ""}`
      }
      aria-current={({ isActive }) => (isActive ? "page" : undefined)}
    >
      {children}
    </NavLink>
  );
}

export default function ZeroFourLayout({
  banner = null,
  children,
  showNav = false,
  showHeaderCtas = false,
}) {
  return (
    <div id="page-wrapper">
      {/* optional banner at top of page content */}
      {banner}

      {/* if you previously rendered a header/cta bar here,
          keep the code but only render when showHeaderCtas === true */}
    {showHeaderCtas ? (
      <div className="container flex flex-wrap gap-2 py-2">
        {/* (old CTA buttons could live here if you really want them in-layout) */}
      </div>
    ) : null}

    {/* Quick actions strip (buttons to key flows) */}
    <div className="quickbar">
      <div className="container-xl quickbar-row">
        <Link to="/case"   className="btn btn-outline btn-xs">Start a Case</Link>
        <Link to="/motion" className="btn btn-outline btn-xs">Generate Motion</Link>
        <Link to="/library" className="btn btn-outline btn-xs">Precedent Library</Link>
        <Link to="/metrics" className="btn btn-outline btn-xs">Movement Metrics</Link>
        <Link to="/library" className="btn btn-outline btn-xs">Precedent Library</Link>
        <Link to="/class-action" className="btn btn-outline btn-xs">Join Class Action</Link>
      </div>
    </div>

    {/* Banner slot (your hero headline/CTAs) */}
    {banner && (
      <section className="banner container-xl">
        {banner}
      </section>
    )}

      {/* Main content */}
      <main className="container-xl content">
        {children}
      </main>

      {/* Footer with button grid */}
      <footer className="footer">
        <div className="container-xl footer-grid">
          <div className="footer-col">
            <h4 className="footer-title">Project</h4>
            <p className="footer-copy">
              Anonymous, AI-powered motions grounded in winning §1983 and Due Process cases.
              This tool is informational only; not legal advice.
            </p>
          </div>
          <div className="footer-col">
            <h4 className="footer-title">Navigate</h4>
            <div className="footer-buttons">
              <Link to="/"         className="btn btn-muted btn-xs">Home</Link>
              <Link to="/case"     className="btn btn-muted btn-xs">Case Builder</Link>
              <Link to="/motion"   className="btn btn-muted btn-xs">Motions</Link>
              <Link to="/redact"   className="btn btn-muted btn-xs">Redaction</Link>
              <Link to="/settings" className="btn btn-muted btn-xs">Settings</Link>
              <Link to="/auth"     className="btn btn-muted btn-xs">Sign in</Link>
            </div>
          </div>
          <div className="footer-col">
            <h4 className="footer-title">Legal</h4>
            <a
              href="https://www.law.cornell.edu/uscode/text/42/1983"
              className="btn btn-outline btn-xs"
              target="_blank" rel="noreferrer"
            >
              42 U.S.C. § 1983
            </a>
          </div>
        </div>
        <div className="container-xl footer-bottom">
          © {new Date().getFullYear()} Operation: CODE 1983
        </div>
      </footer>
    </div>
  );
}