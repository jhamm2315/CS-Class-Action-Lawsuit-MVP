// frontend/src/components/Toast.jsx
import { useEffect, useState } from "react";

export default function ToastHost(){
  const [items, setItems] = useState([]);

  useEffect(() => {
    function onToast(e){
      const id = crypto.randomUUID();
      const { type = "info", message = "" } = e.detail || {};
      setItems((prev) => [...prev, { id, type, message }]);
      setTimeout(() => setItems((p) => p.filter((x) => x.id !== id)), 4000);
    }
    window.addEventListener("toast", onToast);
    return () => window.removeEventListener("toast", onToast);
  }, []);

  return (
    <div aria-live="polite" aria-atomic="true"
         className="fixed z-50 right-3 bottom-3 flex flex-col gap-2">
      {items.map(t => (
        <div key={t.id}
             className="max-w-sm rounded border px-3 py-2 shadow bg-white/95"
             role="status">
          <strong className="mr-2">{icon(t.type)}</strong>{t.message}
        </div>
      ))}
    </div>
  );
}

function icon(type){
  if (type === "error") return "⚠️";
  if (type === "success") return "✅";
  return "ℹ️";
}

/** helper to trigger toasts from code */
export function toast(message, type = "info"){
  window.dispatchEvent(new CustomEvent("toast", { detail: { type, message } }));
}