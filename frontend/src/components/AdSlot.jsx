import { useEffect, useRef, useState } from "react";
import HouseAd from "./HouseAd";

const provider = import.meta.env.VITE_ADS_PROVIDER || "none";
const showAds = (import.meta.env.VITE_SHOW_ADS || "false") === "true";
const dnt = typeof navigator !== "undefined" &&
            (navigator.doNotTrack === "1" || window.doNotTrack === "1");

function useConsent() {
  const [consent, setConsent] = useState(false);
  useEffect(() => setConsent(localStorage.getItem("ads_consent") === "true"), []);
  return consent;
}

export default function AdSlot({ className = "", variant = "inline" }) {
  const consent = useConsent();
  const ref = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!showAds || dnt || !consent || !ref.current) return;

    if (provider === "ethicalads") {
      if (!document.querySelector("#ea-script")) {
        const s = document.createElement("script");
        s.id = "ea-script";
        s.async = true;
        s.src = "https://media.ethicalads.io/media/client/ethicalads.min.js";
        document.body.appendChild(s);
        s.onload = () => window.ethicalads?.load();
      } else {
        window.ethicalads?.load();
      }
      setLoaded(true);
    }

    if (provider === "carbon") {
      if (!document.querySelector("#carbon-script")) {
        const s = document.createElement("script");
        s.id = "carbon-script";
        s.src = `https://cdn.carbonads.com/carbon.js?serve=${import.meta.env.VITE_CARBON_SERVE}&placement=${import.meta.env.VITE_CARBON_PLACEMENT}`;
        s.async = true; s.defer = true;
        ref.current.appendChild(s);
      }
      setLoaded(true);
    }

    if (provider === "adsense") {
      if (!document.querySelector("#adsense-script")) {
        const s = document.createElement("script");
        s.id = "adsense-script";
        s.async = true;
        s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
        s.setAttribute("data-ad-client", import.meta.env.VITE_ADSENSE_CLIENT || "");
        document.head.appendChild(s);
      }
      try {
        // Non-personalized dev mode
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.requestNonPersonalizedAds = 1;
        window.adsbygoogle.push({});
      } catch {}
      setLoaded(true);
    }
  }, [consent]);

  // Gate conditions
  if (!showAds || dnt || !consent || provider === "none") return <HouseAd className={className} />;

  return (
    <div className={`rounded-lg border bg-white dark:bg-zinc-900 p-2 ${className}`}>
      {provider === "ethicalads" && (
        <div ref={ref}>
          <div className="ea-placement"
               data-ea-publisher={import.meta.env.VITE_ETHICALADS_PUBLISHER || ""}
               data-ea-type={variant === "sidebar" ? "image" : "text"} />
        </div>
      )}
      {provider === "carbon" && <div ref={ref} id="carbonads" />}
      {provider === "adsense" && (
        <ins className="adsbygoogle block"
             style={{ display: "block" }}
             data-ad-client={import.meta.env.VITE_ADSENSE_CLIENT || ""}
             data-ad-slot="1234567890"
             data-ad-format="auto"
             data-full-width-responsive="true"
             data-adtest="on" />
      )}
      {!loaded && <HouseAd />}
    </div>
  );
}