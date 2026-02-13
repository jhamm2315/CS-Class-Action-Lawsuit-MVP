import React from "react";

export default function Stepper({ steps, current = 0, onStep }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
      {steps.map((s, i) => (
        <button
          key={s}
          className={`btn btn-xs ${i === current ? "btn-primary" : "btn-outline"}`}
          onClick={() => onStep?.(i)}
          type="button"
          aria-current={i === current ? "step" : undefined}
        >
          {i + 1}. {s}
        </button>
      ))}
    </div>
  );
}