import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initial = (localStorage.getItem("theme") || (systemDark ? "dark" : "light")) === "dark";
  const [dark, setDark] = useState(initial);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) { root.classList.add("dark"); localStorage.setItem("theme","dark"); }
    else { root.classList.remove("dark"); localStorage.setItem("theme","light"); }
  }, [dark]);

  return (
    <button className="btn btn-ghost" onClick={() => setDark(d => !d)}
            aria-pressed={dark} aria-label="Toggle dark mode" title={dark ? "Switch to light" : "Switch to dark"}>
      {dark ? "🌙" : "☀️"}
    </button>
  );
}