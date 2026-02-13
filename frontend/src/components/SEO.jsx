import { useEffect } from "react";

export default function SEO({
  title = "Operation: CODE 1983",
  description = "Anonymous, AI-powered legal toolkit for §1983 & due-process violations.",
  url = "http://localhost:5173/",
  image = "/og.png",
}) {
  useEffect(() => {
    document.title = title;
    const set = (name, content) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    const setProp = (property, content) => {
      let el = document.querySelector(`meta[property="${property}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute("property", property); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    set("description", description);
    setProp("og:title", title); setProp("og:description", description);
    setProp("og:type", "website"); setProp("og:url", url); setProp("og:image", image);
    setProp("twitter:card", "summary_large_image"); setProp("twitter:title", title);
    setProp("twitter:description", description); setProp("twitter:image", image);
  }, [title, description, url, image]);
  return null;
}