// frontend/src/pages/RedactionTool.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ZeroFourLayout from "../layouts/ZeroFourLayout";
import { redactPII } from "../lib/redact";
import { toast } from "../components/Toast";

/**
 * Server endpoint configuration.
 * Set VITE_API_BASE and (optionally) VITE_REDACT_PATH in your .env
 *   VITE_API_BASE=http://localhost:8000
 *   VITE_REDACT_PATH=/redact
 */
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const REDACT_PATH = import.meta.env.VITE_REDACT_PATH || "/redact";

function prettySize(n) {
  if (!n && n !== 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function getFilenameFromResponse(res, fallback) {
  const cd = res.headers.get("content-disposition") || "";
  const m = cd.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
  return decodeURIComponent(m?.[1] || fallback || "redacted");
}

export default function RedactionTool() {
  // ---------- In-browser text redaction ----------
  const [raw, setRaw]   = useState("");
  const [out, setOut]   = useState("");
  const [hits, setHits] = useState([]);

  useEffect(() => {
    const { text, matches } = redactPII(raw || "");
    setOut(text);
    setHits(matches || []);
  }, [raw]);

  function copy(text) {
    navigator.clipboard.writeText(text).then(
      () => toast("Copied", "success"),
      () => toast("Copy failed", "error")
    );
  }

  function downloadText() {
    const blob = new Blob([out || ""], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "redacted.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  function onTextFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const okTypes = ["text/plain", "text/markdown", ""];
    if (!okTypes.includes(f.type)) {
      toast("Only plain text/markdown supported for in-browser preview.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setRaw(String(reader.result || ""));
    reader.readAsText(f);
  }

  // ---------- Server-side redaction for files ----------
  const [files, setFiles] = useState([]); // File[]
  const [selected, setSelected] = useState({}); // {index: boolean}
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({}); // {index: "queued" | "uploading" | "done" | "error"}
  const [downloads, setDownloads] = useState([]); // [{name, size, mime, url}]

  // Revoke created blob URLs on unmount
  const createdUrls = useRef([]);
  useEffect(() => () => createdUrls.current.forEach(URL.revokeObjectURL), []);

  function onPickFiles(e) {
    const list = Array.from(e.target.files || []);
    setFiles(list);
    setSelected({});
    setProgress({});
  }

  function toggle(i) {
    setSelected((s) => ({ ...s, [i]: !s[i] }));
  }

  const selectedFiles = useMemo(
    () => files.filter((_, i) => !!selected[i]),
    [files, selected]
  );

  async function serverRedactOne(file, idx) {
    setProgress((p) => ({ ...p, [idx]: "uploading" }));

    const fd = new FormData();
    fd.append("file", file, file.name);
    // Optional knobs the backend may accept; safe to send even if ignored:
    fd.append("strategy", "auto");     // auto | text | pdf | image | docx
    fd.append("burn", "true");         // burn annotations into pixels
    fd.append("mask_label", "[REDACTED]");

    const res = await fetch(`${API_BASE}${REDACT_PATH}`, { method: "POST", body: fd });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || res.statusText);
    }

    const blob = await res.blob();
    const mime = blob.type || "application/octet-stream";
    const name = getFilenameFromResponse(res, `redacted_${file.name}`);
    const url  = URL.createObjectURL(blob);
    createdUrls.current.push(url);

    setDownloads((d) => [{ name, size: blob.size, mime, url }, ...d]);
    setProgress((p) => ({ ...p, [idx]: "done" }));
  }

  async function serverRedactSelected() {
    if (selectedFiles.length === 0) {
      toast("Select at least one file to redact.", "error");
      return;
    }
    setBusy(true);
    setDownloads([]);
    try {
      for (let i = 0; i < files.length; i++) {
        if (!selected[i]) continue;
        try {
          await serverRedactOne(files[i], i);
        } catch (err) {
          console.error(err);
          toast(`Redaction failed for ${files[i].name}: ${err.message}`, "error");
          setProgress((p) => ({ ...p, [i]: "error" }));
        }
      }
      toast("Redaction complete", "success");
    } finally {
      setBusy(false);
    }
  }

  function downloadAll() {
    if (downloads.length === 0) return;
    downloads.forEach((d) => {
      const a = document.createElement("a");
      a.href = d.url;
      a.download = d.name;
      a.click();
    });
  }

  // ---------- Page layout ----------
  const banner = (
    <>
      <h2>Redaction</h2>
      <p>
        Client-side masking for text and <strong>server-side redaction</strong> for PDFs, images, and Office
        docs. Nothing is stored unless you explicitly upload for server redaction.
      </p>
    </>
  );

  return (
    <ZeroFourLayout banner={banner}>
      <section className="container box" style={{ display: "grid", gap: 16 }}>
        {/* Server-side redaction */}
        <div className="container box" style={{ background: "rgba(255,255,255,.03)", display: "grid", gap: 10 }}>
          <h3 style={{ margin: 0 }}>Server-side redaction (PDF / images / DOCX)</h3>

          <input
            type="file"
            multiple
            onChange={onPickFiles}
            accept=".pdf,.png,.jpg,.jpeg,.tif,.tiff,.bmp,.gif,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
          />

          {files.length > 0 && (
            <div style={{ display: "grid", gap: 8 }}>
              {files.map((f, i) => (
                <div key={`${f.name}-${i}`} className="container box" style={{ display: "grid", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={!!selected[i]}
                        onChange={() => toggle(i)}
                      />
                      <strong>{f.name}</strong>
                    </label>
                    <span style={{ color: "var(--muted)" }}>
                      {f.type || "unknown"} • {prettySize(f.size)}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span className="badge">
                      {progress[i] ? String(progress[i]) : "queued"}
                    </span>
                    {progress[i] === "done" && <span style={{ color: "#74ffa6" }}>Ready</span>}
                    {progress[i] === "error" && <span style={{ color: "#ffb4a9" }}>Error</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={serverRedactSelected} disabled={busy || selectedFiles.length === 0}>
              {busy ? "Redacting…" : "Server-redact selected"}
            </button>
            <button className="btn btn-outline" onClick={() => { setFiles([]); setSelected({}); setProgress({}); }}>
              Clear list
            </button>
          </div>

          {downloads.length > 0 && (
            <div className="container box" style={{ display: "grid", gap: 8 }}>
              <h4 style={{ margin: 0 }}>Redacted files</h4>
              {downloads.map((d, idx) => (
                <div key={`${d.url}-${idx}`} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <strong>{d.name}</strong>
                    <div style={{ color: "var(--muted)" }}>{d.mime} • {prettySize(d.size)}</div>
                  </div>
                  <a className="btn btn-outline btn-xs" href={d.url} download={d.name}>
                    Download
                  </a>
                </div>
              ))}
              <div>
                <button className="btn btn-secondary btn-sm" onClick={downloadAll}>Download all</button>
              </div>
            </div>
          )}
        </div>

        {/* In-browser text masking */}
        <div className="container box" style={{ display: "grid", gap: 10 }}>
          <h3 style={{ margin: 0 }}>In-browser text masking (no upload)</h3>
          <div className="grid md:grid-cols-2 gap-4" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* Original */}
            <div className="card">
              <div className="card-body space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Original</div>
                  <input type="file" accept=".txt,.md,.text" onChange={onTextFile} className="text-xs" />
                </div>
                <textarea
                  className="textarea"
                  placeholder="Paste text to redact…"
                  value={raw}
                  onChange={(e) => setRaw(e.target.value)}
                />
                <div className="flex gap-2">
                  <button className="btn btn-secondary" onClick={() => copy(raw)}>Copy</button>
                  <button className="btn btn-ghost" onClick={() => setRaw("")}>Clear</button>
                </div>
              </div>
            </div>

            {/* Redacted */}
            <div className="card">
              <div className="card-body space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Redacted</div>
                  <span className="text-xs text-gray-500">{hits.length} matches</span>
                </div>
                <textarea className="textarea" value={out} readOnly />
                <div className="flex gap-2">
                  <button className="btn btn-primary" onClick={downloadText}>Download .txt</button>
                  <button className="btn btn-secondary" onClick={() => copy(out)}>Copy</button>
                </div>
                {hits.length > 0 && (
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    <div className="font-semibold mb-1">Detected PII</div>
                    <ul className="grid sm:grid-cols-2 gap-1 max-h-28 overflow-auto">
                      {hits.map((h, idx) => (
                        <li key={idx} className="truncate">
                          <span className="badge mr-1">{h.label}</span> {h.value}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            This tool uses heuristics and may miss or over-redact content. Always review before sharing or filing.
          </p>
        </div>
      </section>
    </ZeroFourLayout>
  );
}