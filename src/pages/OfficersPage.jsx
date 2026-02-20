import { useState } from "react";
import { S, statusStyle } from "../styles";
import { StatusPill, Avatar, PageHead } from "../components/ui";
import { hosColor } from "../utils/helpers";

export default function OfficersPage({ officers, setOfficers, dists, openPanel, openModal, showToast, deleteRecord }) {
  const [q, setQ] = useState("");
  const [stF2, setStF2] = useState("All");
  const rows = officers.filter(o => (stF2 === "All" || o.status === stF2) && (!q || o.name.toLowerCase().includes(q.toLowerCase())));
  return (
    <div>
      <PageHead title="Field Officers" sub={`${officers.length} active officers`}>
        <input style={{ ...S.fsel, minWidth: 200 }} placeholder="🔍 Search officers…" value={q} onChange={e => setQ(e.target.value)} />
        <select style={S.fsel} value={stF2} onChange={e => setStF2(e.target.value)}><option value="All">All Status</option>{["Available", "On Trip", "Off Duty"].map(s => <option key={s}>{s}</option>)}</select>
        <button onClick={() => showToast("Export feature coming soon")} style={S.btnO}>↓ Export</button>
        <button onClick={() => openModal("officer")} style={S.btn}>+ Add Officer</button>
      </PageHead>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {[{ l: "Total Officers", v: officers.length, bg: "#eff6ff" }, { l: "Available Now", v: officers.filter(o => o.status === "Available").length, bg: "#f0fdf4" }, { l: "HOS Risk Alerts", v: officers.filter(o => o.hosRisk === "High").length, bg: "#fee2e2" }, { l: "Avg Rating", v: `${(officers.reduce((a, o) => a + o.rating, 0) / officers.length).toFixed(1)} ★`, bg: "#fef9c3" }].map((c, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>{c.v}</div><div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{c.l}</div></div>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>👤</div>
          </div>
        ))}
      </div>
      <div style={S.card}>
        <table style={S.tbl}>
          <thead><tr style={S.thead}>{["Officer", "Status", "HOS Risk", "Rating", "Last Run", "Location", "Actions"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((o, i) => (
              <tr key={o.id} style={S.tr} onClick={() => openPanel(o, "officer")} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = ""}>
                <td style={S.td}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar label={o.avatar} idx={i} size={38} /><div><div style={{ fontWeight: 700, fontSize: 14 }}>{o.name}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>{o.id_no} · {o.lic} · {o.exp}</div></div></div></td>
                <td style={S.td}><StatusPill s={o.status} /></td>
                <td style={S.td}><span style={{ width: 10, height: 10, borderRadius: "50%", background: hosColor(o.hosRisk), display: "inline-block", marginRight: 6 }} /><span style={{ fontSize: 12, color: hosColor(o.hosRisk), fontWeight: 600 }}>{o.hosRisk}</span></td>
                <td style={S.td}><span style={{ fontWeight: 700 }}>{"★".repeat(Math.round(o.rating))}</span><span style={{ color: "#64748b", fontSize: 12 }}> {o.rating}</span></td>
                <td style={{ ...S.td, fontSize: 12 }}>{o.lastRun || "—"}</td>
                <td style={{ ...S.td, fontSize: 12 }}>{o.location}</td>
                <td style={S.td}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={e => { e.stopPropagation(); openModal("officer", o); }} style={S.icnBtn} title="Edit">✏️</button>
                    <button onClick={e => { e.stopPropagation(); if (window.confirm(`Remove ${o.name}?`)) { deleteRecord("field_officers", o.id); setOfficers(p => p.filter(x => x.id !== o.id)); showToast("Officer removed"); } }} style={{ ...S.icnBtn, color: "#dc2626" }} title="Delete">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p style={{ textAlign: "center", color: "#94a3b8", padding: 32 }}>No officers match.</p>}
      </div>
    </div>
  );
}
