import React from "react";
import ZeroFourLayout from "../layouts/ZeroFourLayout";
import TrustedCases from "../components/TrustedCases";

export default function LawLibrary() {
  return (
    <ZeroFourLayout banner={<>
      <h2>Law Library</h2>
      <p>Verified, plaintiff-winning federal precedents used to ground motions. Links go to CourtListener.</p>
    </>}>
      <TrustedCases />
      <section className="container box">
        <p style={{ color:"var(--muted)", margin:0 }}>
          Tip: use our library to understand holdings & standards (e.g., <em>Mathews</em> balancing, due process notice & hearing, contempt standards in <em>Turner</em>).
        </p>
      </section>
    </ZeroFourLayout>
  );
}