import React from "react";
import ZeroFourLayout from "../layouts/ZeroFourLayout";

export default function MovementMetrics() {
  return (
    <ZeroFourLayout showNav={false} showHeaderCtas={false}>
      <section className="container box">
        <header className="first major">
          <h2>Movement Metrics</h2>
          <p>Real-time anonymized participation and readiness.</p>
        </header>
        <p>Dashboards and charts will live here.</p>
      </section>
    </ZeroFourLayout>
  );
}