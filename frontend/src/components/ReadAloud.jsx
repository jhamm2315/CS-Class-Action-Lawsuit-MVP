import { useEffect, useRef, useState } from "react";

export default function ReadAloud({ selector = "main" }) {
  const [speaking, setSpeaking] = useState(false);
  const textRef = useRef("");

  useEffect(() => {
    const el = document.querySelector(selector);
    textRef.current = el ? el.innerText : document.body.innerText;
    return () => window.speechSynthesis.cancel();
  }, [selector]);

  function toggle() {
    if (!("speechSynthesis" in window)) return alert("Read-aloud not supported in this browser.");
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const utter = new SpeechSynthesisUtterance(textRef.current);
    utter.onend = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(utter);
  }

  return (
    <button className="button" type="button" onClick={toggle} aria-pressed={speaking}>
      {speaking ? "⏹ Stop reading" : "🔊 Read this page"}
    </button>
  );
}