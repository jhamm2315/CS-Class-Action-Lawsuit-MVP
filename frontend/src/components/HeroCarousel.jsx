import { useEffect, useRef, useState } from "react";

export default function HeroCarousel({
  images = [],
  intervalMs = 4500,
  aspect = "photo",   // 'video' (16/9) | 'photo' (4/3) | 'square' (1/1)
  maxHeight = 600
}) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loaded, setLoaded] = useState(() => images.map(() => false));
  const [errors, setErrors] = useState(() => images.map(() => "")); // <-- track failures
  const len = images.length;
  const timer = useRef(null);

  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  useEffect(() => {
    if (!len || paused || prefersReduced) return;
    timer.current = setInterval(() => setI(p => (p + 1) % len), intervalMs);
    return () => clearInterval(timer.current);
  }, [len, paused, prefersReduced, intervalMs]);

  const asp =
    aspect === "video"  ? "16 / 9" :
    aspect === "square" ? "1 / 1"  :
                          "4 / 3";

  return (
    <section
      className="hero-frame"
      aria-roledescription="carousel"
      aria-label="Family photos"
      tabIndex={0}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
      style={{ aspectRatio: asp, maxHeight }}
    >
      {images.map((img, idx) => {
        const [fx, fy] = img.focus || [0.5, 0.5];
        const pos = `${Math.round(fx * 100)}% ${Math.round(fy * 100)}%`;
        const active = idx === i && loaded[idx] && !errors[idx];

        return (
          <img
            key={idx}
            src={img.src}
            alt={img.alt || "Slide"}
            className="hero-slide"
            style={{ objectPosition: pos, opacity: active ? 1 : 0 }}
            onLoad={() =>
              setLoaded(prev => { const c = prev.slice(); c[idx] = true; return c; })
            }
            onError={() => {
              console.warn("[HeroCarousel] failed to load:", img.src);
              setErrors(prev => { const c = prev.slice(); c[idx] = img.src; return c; });
            }}
          />
        );
      })}

      {/* If current slide has an error, show a visible badge */}
      {errors[i] && (
        <div className="hero-error">
          Image not found: <code>{errors[i]}</code>
        </div>
      )}

      <button className="carousel-btn-left"  aria-label="Previous" onClick={() => setI(p => (p - 1 + len) % len)}>‹</button>
      <button className="carousel-btn-right" aria-label="Next"     onClick={() => setI(p => (p + 1) % len)}>›</button>

      <div className="hero-dots">
        {images.map((_, idx) => (
          <button
            key={idx}
            className={`h-2 w-2 rounded-full border ${idx === i ? "bg-white" : "bg-white/60"}`}
            aria-label={`Go to slide ${idx + 1}`}
            aria-current={idx === i ? "true" : "false"}
            onClick={() => setI(idx)}
          />
        ))}
      </div>
    </section>
  );
}