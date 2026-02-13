import React, { useState } from "react";

// Compute SHA-256 with WebCrypto
async function sha256(file) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export default function DocDropzone({ onFiles }) {
  const [items, setItems] = useState([]);

  async function handle(e) {
    const list = Array.from(e.target.files || []);
    const enriched = await Promise.all(list.map(async f => ({
      name: f.name,
      size: f.size,
      type: f.type || "application/octet-stream",
      hash: await sha256(f),
      file: f,
    })));
    setItems(enriched);
    onFiles?.(enriched);
  }

  return (
    <div className="container box" style={{ display: "grid", gap: 10 }}>
      <input type="file" multiple onChange={handle} />
      {items.length > 0 && (
        <div style={{ display: "grid", gap: 6 }}>
          {items.map(x => (
            <div key={x.hash} style={{ display: "grid", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <strong>{x.name}</strong>
                <span style={{ color: "var(--muted)" }}>
                  {(x.size / 1024).toFixed(1)} KB • {x.type}
                </span>
              </div>
              <code style={{ opacity: .8, fontSize: ".8rem", wordBreak: "break-all" }}>
                {x.hash}
              </code>
              <hr style={{ borderColor: "var(--border)" }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}