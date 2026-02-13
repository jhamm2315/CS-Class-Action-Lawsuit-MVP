// frontend/src/components/DocHygieneDropzone.jsx
import React, { useState } from "react";
import { scanTextPII } from "@/utils/pii";

/**
 * Client-side doc hygiene:
 * - Images: strips EXIF by drawing to canvas and re-encoding.
 * - PDFs: passes through but warns; (optional) filename scan for PII tokens.
 * - Text: scans content for common PII.
 */
export default function DocHygieneDropzone({ onFiles }) {
  const [report, setReport] = useState([]);

  async function handleSelect(e) {
    const files = Array.from(e.target.files || []);
    const out = [];
    const rep = [];

    for (const f of files) {
      if (f.type.startsWith("image/")) {
        const cleanBlob = await stripImageMetadata(f);
        const cleanFile = new File([cleanBlob], f.name.replace(/\.(jpg|jpeg|png|webp)$/i, ".$1"), { type: cleanBlob.type });
        rep.push({ name: f.name, type: "image", action: "stripped EXIF" });
        out.push(cleanFile);
      } else if (f.type === "text/plain") {
        const text = await f.text();
        const hits = scanTextPII(text);
        rep.push({ name: f.name, type: "text", pii: hits });
        out.push(f);
      } else if (f.type === "application/pdf") {
        // We’re not parsing PDF client-side; warn only.
        const filenameHits = scanTextPII(f.name);
        rep.push({ name: f.name, type: "pdf", warning: "PDF metadata not removed client-side", pii: filenameHits });
        out.push(f);
      } else {
        rep.push({ name: f.name, type: f.type || "unknown", note: "No hygiene actions applied" });
        out.push(f);
      }
    }
    setReport(rep);
    onFiles?.(out);
  }

  return (
    <div className="rounded-md border border-neutral-300 p-3">
      <input type="file" multiple onChange={handleSelect} />
      <ul className="mt-2 text-sm">
        {report.map((r, i) => (
          <li key={i} className="mb-1">
            <strong>{r.name}</strong> — {r.type} {r.action ? `(${r.action})` : ""}
            {r.warning ? <span className="text-amber-700"> · {r.warning}</span> : null}
            {r.pii?.length ? (
              <details className="ml-2 inline-block">
                <summary className="cursor-pointer">PII hits: {r.pii.length}</summary>
                <pre className="text-xs bg-neutral-100 p-2 rounded">{JSON.stringify(r.pii, null, 2)}</pre>
              </details>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-neutral-600">
        Tip: Use the in-app redactor before uploading sensitive PDFs. Images are re-encoded to remove EXIF.
      </p>
    </div>
  );
}

async function stripImageMetadata(file) {
  const img = await blobToImage(file);
  const canvas = document.createElement("canvas");
  const maxW = 2400; // limit size
  const scale = Math.min(1, maxW / img.width);
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise((res) => canvas.toBlob(res, mime, 0.92));
  return blob;
}

function blobToImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}