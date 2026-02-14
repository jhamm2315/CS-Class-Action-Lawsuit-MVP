// frontend/src/components/HeroCarousel.jsx
import React, { useEffect, useState } from "react";

export default function HeroCarousel({
  images = [],
  aspect = "photo",
  maxHeight = 600,
  interval = 5000,
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!images.length) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images, interval]);

  if (!images.length) return null;

  const image = images[index];

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        borderRadius: 12,
        maxHeight,
      }}
    >
      <img
        src={image.src}
        alt={image.alt || ""}
        style={{
          width: "100%",
          height: "auto",
          objectFit: "cover",
          objectPosition: image.focus
            ? `${image.focus[0] * 100}% ${image.focus[1] * 100}%`
            : "center",
          display: "block",
        }}
      />

      {/* Optional navigation dots */}
      {images.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 8,
          }}
        >
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                border: "none",
                background: i === index ? "#fff" : "rgba(255,255,255,0.5)",
                cursor: "pointer",
                padding: 0,
              }}
              aria-label={`Show image ${i + 1}`}
              type="button"
            />
          ))}
        </div>
      )}
    </div>
  );
}