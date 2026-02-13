import { Link, NavLink } from "react-router-dom";

/**
 * React layout that mirrors the ZeroFour structure (header, nav, wrappers, footer).
 * Drop your page content as children. Pass an optional `banner` prop to show
 * the big hero banner used on the homepage.
 */
export default function ZeroFourLayout({ banner = null, children }) {
  return (
    <div id="page-wrapper">
      {/* Header Wrapper */}
      <div id="header-wrapper">
        <div className="container">
          <header id="header">
            <div className="inner">
              {/* Logo */}
              <h1>
                <Link to="/" id="logo">Operation: CODE 1983</Link>
              </h1>

              {/* Nav */}
              <nav id="nav" aria-label="Primary">
                <ul>
                  <li className="current_page_item"><NavLink to="/">Home</NavLink></li>
                  <li>
                    <a href="#">Tools</a>
                    <ul>
                      <li><NavLink to="/case">Case Builder</NavLink></li>
                      <li><NavLink to="/motion">Motions</NavLink></li>
                      <li><NavLink to="/redact">Redaction</NavLink></li>
                    </ul>
                  </li>
                  <li><NavLink to="/settings">Settings</NavLink></li>
                  <li><NavLink to="/auth">Sign in</NavLink></li>
                </ul>
              </nav>
            </div>
          </header>

          {/* Banner (only when provided) */}
          {banner && (
            <div id="banner">
              {banner}
            </div>
          )}
        </div>
      </div>

      {/* Main Wrapper */}
      <div id="main-wrapper">
        {/* You can use ZeroFour's wrapper styles: style1/style2/style3 */}
        <div className="wrapper style1">
          <div className="inner">
            {children}
          </div>
        </div>
      </div>

      {/* Footer Wrapper */}
      <div id="footer-wrapper">
        <footer id="footer" className="container">
          <div className="row">
            <div className="col-6 col-12-medium imp-medium">
              <section>
                <h2><strong>Operation: CODE 1983</strong></h2>
                <p>This tool is informational only; not legal advice.</p>
                <a href="https://www.law.cornell.edu/uscode/text/42/1983" className="button alt icon solid fa-arrow-circle-right" target="_blank" rel="noreferrer">
                  42 U.S.C. § 1983
                </a>
              </section>
            </div>
            <div className="col-6 col-12-medium">
              <section>
                <h2>Get in touch</h2>
                <ul className="divided">
                  <li><a href="/settings">Account &amp; Privacy</a></li>
                  <li><a href="/redact">Client-side Redaction</a></li>
                  <li><a href="/case">Case Matching</a></li>
                </ul>
              </section>
            </div>
            <div className="col-12">
              <div id="copyright">
                <ul className="menu">
                  <li>© {new Date().getFullYear()} Operation: CODE 1983</li>
                  <li>Design base: ZeroFour (HTML5 UP)</li>
                </ul>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}