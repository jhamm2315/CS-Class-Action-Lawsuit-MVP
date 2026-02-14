// frontend/src/pages/Home.jsx
import React from "react";
import ZeroFourLayout from "../layouts/ZeroFourLayout";
import HeroCarousel from "../components/HeroCarousel";
import PublicMetrics from "../components/PublicMetrics";
import ReadinessWidget from "../components/widgets/ReadinessWidget";
import ReadAloud from "../components/ReadAloud";
import HowItWorks from "../components/HowItWorks";
import FeaturesGrid from "../components/FeaturesGrid";
import LawLibraryPreview from "../components/LawLibraryPreview";
import DOHWidget from "@/components/widgets/DOHWidget";

const GH_PAGES_BASENAME = "/CS-Class-Action-Lawsuit-MVP";

const imgs = [
  { src: `${GH_PAGES_BASENAME}/hero/father-1.jpg?v=3`, alt: "Father and child",        focus: [0.86, 0.52] },
  { src: `${GH_PAGES_BASENAME}/hero/father-2.jpg?v=3`, alt: "Father reading to child", focus: [0.62, 0.50] },
  { src: `${GH_PAGES_BASENAME}/hero/father-3.jpg?v=3`, alt: "Asian father with son",   focus: [0.55, 0.48] },
  { src: `${GH_PAGES_BASENAME}/hero/father-4.jpg?v=3`, alt: "Latino father at park",   focus: [0.58, 0.45] },
  { src: `${GH_PAGES_BASENAME}/hero/father-5.jpg?v=3`, alt: "Dad and child outdoors",  focus: [0.55, 0.50] },
  { src: `${GH_PAGES_BASENAME}/hero/mother-1.jpg?v=3`, alt: "Mother and child",        focus: [0.55, 0.48] },
  { src: `${GH_PAGES_BASENAME}/hero/mother-2.jpg?v=3`, alt: "Mom and child hugging",   focus: [0.55, 0.48] },
];

export default function Home() {
  return (
    <ZeroFourLayout>
      {/* Hero */}
      <section className="container box">
        <div className="image featured">
          <HeroCarousel images={imgs} aspect="photo" maxHeight={600} />
        </div>
      </section>

      {/* How it works */}
      <HowItWorks />

      {/* Features */}
      <FeaturesGrid />

      {/* Movement metrics */}
      <section className="container box" style={{ display: "grid", gap: 14 }}>
        <header className="first major">
          <h2>Movement status</h2>
          <p>Real-time, anonymized participation and readiness.</p>
        </header>
        <PublicMetrics />
      </section>

      {/* Public Oversight (HealthData.gov IV-D) */}
      <section className="container box" style={{ display: "grid", gap: 14 }}>
        <header className="major">
          <h2>Public Oversight: HealthData.gov (Child Support / IV-D)</h2>
          <p>Spot issues and trends across state child-support agencies.</p>
        </header>
        <DOHWidget />
      </section>

      {/* Class-action trigger */}
      <section className="container box">
        <ReadinessWidget minParticipants={250} threshold={0.92} />
      </section>

      {/* Law library preview */}
      <LawLibraryPreview />

      {/* Accessibility helper */}
      <section className="container">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ opacity: 0.75 }}>Need it read aloud?</span>
          <ReadAloud selector="#page-wrapper" />
        </div>
      </section>
    </ZeroFourLayout>
  );
}
