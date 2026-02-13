import React from "react";
import ZeroFourLayout from "../layouts/ZeroFourLayout";

export default function JoinClassAction() {
  return (
    <ZeroFourLayout showNav={false} showHeaderCtas={false}>
      <section className="container box">
        <header className="first major">
          <h2>Join the Class Action</h2>
          <p>Opt-in anonymously; we publish only aggregate stats.</p>
        </header>
        <p>Intake form and eligibility flow will go here.</p>
      </section>
    </ZeroFourLayout>
  );
}