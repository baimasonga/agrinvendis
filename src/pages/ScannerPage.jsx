import { useState, useRef, useEffect } from "react";
import { S } from "../styles";
import { PageHead, BarcodeDisplay } from "../components/ui";

export default function ScannerPage({ inv, dists, pods, handleScan, scannerActive, scanLog, setScanLog }) {
  const [batchInput, setBatchInput] = useState("");
  const [mode, setMode] = useState("lookup");
  const bRef = useRef();
  useEffect(() => { setTimeout(() => bRef.current?.focus(), 100); }, []);
  const doScan = (code = batchInput) => { if (!code.trim()) return; handleScan(code.trim()); setBatchInput(""); bRef.current?.focus(); };
  const modeColor = { lookup: "#2563eb", receive: "#16a34a", issue: "#d97706", verify: "#7c3aed" };
  return (
    <div>
      <PageHead title="📷 Barcode Scanner" sub="Scan inventory, distributions, and PODs with hardware scanner or manually" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        {[["lookup", "🔍", "Lookup", "Find any item"], ["receive", "📥", "Receive Stock", "Add incoming inventory"], ["issue", "📤", "Issue Stock", "Deduct for distribution"], ["verify", "✅", "Verify POD", "Confirm delivery"]].map(([m, ic, l, sub]) => (
          <button key={m} onClick={() => setMode(m)} style={{ background: mode === m ? modeColor[m] : "#fff", border: `2px solid ${mode === m ? modeColor[m] : "#e2e8f0"}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer", textAlign: "left" }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{ic}</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: mode === m ? "#fff" : "#0f172a" }}>{l}</div>
            <div style={{ fontSize: 11, color: mode === m ? "rgba(255,255,255,.75)" : "#94a3b8", marginTop: 2 }}>{sub}</div>
          </button>
        ))}
      </div>
      <div style={{ background: "#0f172a", borderRadius: 16, padding: 28, marginBottom: 24, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, right: 0, height: 3, background: modeColor[mode], boxShadow: `0 0 12px ${modeColor[mode]}`, animation: "scanline 2s ease-in-out infinite", opacity: .8 }} />
        <style>{`@keyframes scanline{0%{top:15%}50%{top:80%}100%{top:15%}}`}</style>
        <div style={{ color: "rgba(255,255,255,.5)", fontSize: 12, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Mode: {mode.toUpperCase()} · {scannerActive ? "Active" : "Paused"}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <input ref={bRef} value={batchInput} onChange={e => setBatchInput(e.target.value)} onKeyDown={e => e.key === "Enter" && doScan()} placeholder="Point scanner at barcode or type and press Enter…" style={{ flex: 1, padding: "14px 16px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 10, fontSize: 15, color: "#fff", outline: "none", fontFamily: "monospace", letterSpacing: 1 }} />
          <button onClick={() => doScan()} style={{ ...S.btn, background: modeColor[mode], padding: "14px 20px" }}>→ Scan</button>
        </div>
        <div style={{ color: "rgba(255,255,255,.3)", fontSize: 11, marginTop: 10 }}>Hardware scanners send Enter automatically. Scanner is active globally on any page.</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={S.card}>
          <div style={S.ch}>📋 Scan Log <span style={{ marginLeft: "auto", background: "#f1f5f9", color: "#64748b", borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 600 }}>{scanLog.length}</span></div>
          {scanLog.length === 0 && <p style={{ color: "#94a3b8", fontSize: 13, padding: "16px 20px" }}>No scans yet.</p>}
          {scanLog.slice(0, 12).map((s, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 20px", borderBottom: "1px solid #f8fafc" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 14 }}>{s.type === "inventory" ? "📦" : s.type === "distribution" ? "🚜" : s.type === "pod" ? "📄" : "❓"}</span>
                <div><div style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace" }}>{s.code}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>{s.label}</div></div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>{s.time}</span>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.type === "unknown" ? "#dc2626" : "#16a34a" }} />
              </div>
            </div>
          ))}
          {scanLog.length > 0 && <button onClick={() => setScanLog([])} style={{ ...S.clr, width: "100%", textAlign: "center", padding: 10 }}>Clear log</button>}
        </div>
        <div style={S.card}>
          <div style={S.ch}>🏷 Test Barcodes</div>
          <div style={{ padding: "12px 20px" }}>
            {[...inv.slice(0, 4).map(i => ({ code: i.barcode, label: i.name, type: "inventory" })), ...dists.slice(0, 2).map(d => ({ code: d.ref, label: d.ref, type: "distribution" })), ...pods.slice(0, 2).map(p => ({ code: p.ref, label: p.ref, type: "pod" }))].map((t, i) => (
              <button key={i} onClick={() => handleScan(t.code)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "10px 12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, marginBottom: 6, cursor: "pointer", textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>{t.type === "inventory" ? "📦" : t.type === "distribution" ? "🚜" : "📄"}</span>
                  <div><div style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace" }}>{t.code}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>{t.label}</div></div>
                </div>
                <BarcodeDisplay code={t.code} width={70} height={22} showText={false} mini />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
