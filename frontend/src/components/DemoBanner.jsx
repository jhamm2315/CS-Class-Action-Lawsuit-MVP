// frontend/src/components/DemoBanner.jsx
import React from "react";
import { isDemo, exitDemo } from "@/utils/demoMode";

export default function DemoBanner() {
  if (!isDemo()) return null;
  return (
    <div className="w-full bg-amber-100 text-amber-900 border-b border-amber-300 px-4 py-2 text-sm flex items-center justify-between">
      <span>Demo Mode: generated data only. No uploads are stored.</span>
      <button
        onClick={exitDemo}
        className="rounded-md bg-amber-900/90 text-white px-3 py-1 hover:bg-amber-900"
      >
        Exit demo
      </button>
    </div>
  );
}