import { useEffect, useState } from "react";

export default function ConsentBar(){
  const [show, setShow] = useState(false);
  useEffect(() => {
    const dnt = navigator.doNotTrack === "1" || window.doNotTrack === "1";
    const already = localStorage.getItem("ads_consent");
    if (!dnt && already === null) setShow(true);
  }, []);

  function allow(){
    localStorage.setItem("ads_consent", "true");
    setShow(false);
    location.reload();
  }
  function decline(){
    localStorage.setItem("ads_consent", "false");
    setShow(false);
  }

  if (!show) return null;
  return (
    <div className="fixed bottom-0 inset-x-0 z-50">
      <div className="mx-auto max-w-5xl m-3 rounded-lg border bg-white dark:bg-zinc-900 shadow p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <p className="text-sm">
          We fund the project with <b>privacy-respecting ads</b>. No tracking, ever. Allow anonymous ads to keep it free?
        </p>
        <div className="flex gap-2">
          <button className="px-3 py-1 rounded border bg-brand-600 text-white hover:bg-brand-700" onClick={allow}>Allow ads</button>
          <button className="px-3 py-1 rounded border hover:bg-gray-50 dark:hover:bg-zinc-800" onClick={decline}>No thanks</button>
        </div>
      </div>
    </div>
  );
}