import React from "react";
import ZeroFourLayout from "../layouts/ZeroFourLayout";

export default function PrecedentLibrary() {
  return (
    <ZeroFourLayout showNav={false} showHeaderCtas={false}>
      <section className="container box">
        <header className="first major">
          <h2>Precedent Library</h2>
          <p>Verified, plaintiff-winning §1983 and Due Process cases.</p>
        </header>
        <p>Coming soon: searchable, filterable library with cites and parentheticals.</p>
      </section>
    </ZeroFourLayout>
  );
}