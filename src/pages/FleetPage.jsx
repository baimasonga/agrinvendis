import { useState } from "react";
import { S, statusStyle } from "../styles";
import { StatusPill, Avatar, PageHead } from "../components/ui";
import { healthClr } from "../utils/helpers";

export default function FleetPage({ fleet, setFleet, openPanel, openModal, showToast, deleteRecord }) {
  const avail = fleet.filter(f => f.status === "Available").length;
  const inUse = fleet.filter(f => f.status === "In Use").length;
  const maint = fleet.filter(f => f.status === "Maintenance").length;
  const avgH = Math.round(fleet.reduce((a, f) => a + f.health, 0) / fleet.length);
  return (
    <div>
      <PageHead title="Fleet" sub={`${fleet.length} registered vehicles`}>
        <button onClick={() => showToast("Import feature coming soon")} style={S.btnO}>↓ Import</button>
        <button onClick={() => showToast("Maintenance scheduler coming soon")} style={S.btnO}>🔧 Schedule Maintenance</button>
        <button onClick={() => openModal("fleet")} style={S.btn}>+ Add Vehicle</button>
      </PageHead>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 20 }}>
        {[{ l: "Total", v: fleet.length, bg: "#eff6ff" }, { l: "Available", v: avail, bg: "#f0fdf4" }, { l: "In Use", v: inUse, bg: "#fef9c3" }, { l: "Maintenance", v: maint, bg: "#fee2e2" }, { l: "Avg Health", v: `${avgH}%`, bg: "#f0fdf4" }].map((c, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div style={{ fontSize: 26, fontWeight: 800, color: "#0f172a" }}>{c.v}</div><div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{c.l}</div></div>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🚛</div>
          </div>
        ))}
      </div>
      <div style={S.card}>
        <table style={S.tbl}>
          <thead><tr style={S.thead}>{["Vehicle", "Type", "Status", "Officer", "Location", "Last Ping", "Health", "Actions"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {fleet.map((v, i) => (
              <tr key={v.id} style={S.tr} onClick={() => openPanel(v, "fleet")} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = ""}>
                <td style={S.td}><div style={{ fontWeight: 700 }}>{v.plate}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>{v.model}</div></td>
                <td style={{ ...S.td, fontSize: 12, color: "#64748b" }}>{v.type}</td>
                <td style={S.td}><StatusPill s={v.status} /></td>
                <td style={S.td}>{v.driver ? <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Avatar label={v.driver.split(" ").map(x => x[0]).join("")} idx={i} size={28} /><span style={{ fontSize: 12 }}>{v.driver}</span></div> : <span style={{ color: "#94a3b8", fontSize: 12 }}>Unassigned</span>}</td>
                <td style={{ ...S.td, fontSize: 12 }}>{v.loc}</td>
                <td style={{ ...S.td, fontSize: 12, color: "#64748b" }}>{v.lastPing}</td>
                <td style={S.td}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 60, height: 6, borderRadius: 3, background: "#e2e8f0", overflow: "hidden" }}><div style={{ height: "100%", width: `${v.health}%`, background: healthClr(v.health), borderRadius: 3 }} /></div><span style={{ fontSize: 12, fontWeight: 700, color: healthClr(v.health) }}>{v.health}%</span></div></td>
                <td style={S.td}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={e => { e.stopPropagation(); openModal("editFleet", v); }} style={S.icnBtn} title="Edit">✏️</button>
                    <button onClick={e => { e.stopPropagation(); if (window.confirm(`Delete ${v.plate}?`)) { deleteRecord("fleet", v.id); setFleet(p => p.filter(x => x.id !== v.id)); showToast("Vehicle removed"); } }} style={{ ...S.icnBtn, color: "#dc2626" }} title="Delete">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
