import { useEffect, useState } from "react";
import i18n from "../i18n";

export default function LangSwitcher() {
  const [current, setCurrent] = useState(i18n.resolvedLanguage || i18n.language || "en");
  const langs = ["en", "es"];

  useEffect(() => {
    const handler = () => setCurrent(i18n.resolvedLanguage || i18n.language || "en");
    i18n.on("languageChanged", handler);
    return () => i18n.off("languageChanged", handler);
  }, []);

  function change(l) { i18n.changeLanguage(l); setCurrent(l); }

  return (
    <div className="flex gap-2 items-center" role="group" aria-label="Language">
      <span aria-hidden>🌐</span>
      {langs.map((l) => (
        <button key={l}
          className={`px-2 py-1 border rounded no-underline ${current === l ? "font-bold underline" : ""}`}
          onClick={() => change(l)} aria-pressed={current === l}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}