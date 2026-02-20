import { useState } from "react";
import { S } from "../styles";
import { StatusPill } from "../components/ui";
import { catColor } from "../utils/helpers";

export default function WarehousesPage({ warehouses, showToast }) {
  const [selW, setSelW] = useState(null);
  const [stF2, setStF2] = useState("All");
  const avgUtil = Math.round(warehouses.reduce((a, w) => a + w.utilization, 0) / warehouses.length);
  const utilColor = u => u >= 90 ? "#dc2626" : u >= 70 ? "#d97706" : "#16a34a";
  const filtered = warehouses.filter(w => stF2 === "All" || w.status === stF2);
  return (
    <div style={{ display: "flex", height: "calc(100vh - 52px)", margin: "-24px -24px -32px -24px", overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div><h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a" }}>Warehouses / Hubs</h2><p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: 13 }}>{warehouses.length} distribution hubs across Sierra Leone</p></div>
          <div style={{ display: "flex", gap: 8 }}>
            <select style={S.fsel} value={stF2} onChange={e => setStF2(e.target.value)}><option value="All">All Status</option><option>Active</option><option>Maintenance</option></select>
            <button onClick={() => showToast("Analytics coming soon")} style={S.btnO}>📊 Analytics</button>
            <button onClick={() => showToast("Add warehouse form coming soon")} style={S.btn}>+ Add Warehouse</button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
          {[{ l: "Active", v: warehouses.filter(w => w.status === "Active").length, bg: "#eff6ff", c: "#2563eb" }, { l: "Avg Utilization", v: `${avgUtil}%`, bg: "#f0fdf4", c: "#16a34a" }, { l: "Critical Alerts", v: warehouses.filter(w => w.utilization > 90).length, bg: "#fee2e2", c: "#b91c1c" }, { l: "Throughput", v: `${warehouses.reduce((a, w) => a + w.inbound + w.outbound, 0).toLocaleString()}`, bg: "#faf5ff", c: "#7c3aed" }].map((c, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><div style={{ fontSize: 24, fontWeight: 800, color: c.c }}>{c.v}</div><div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{c.l}</div></div>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏭</div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
          {filtered.map((w) => (
            <div key={w.id} style={{ background: "#fff", border: `1px solid ${selW?.id === w.id ? "#16a34a" : "#e2e8f0"}`, borderRadius: 12, padding: 18, cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,.05)", transition: "all .15s" }} onClick={() => setSelW(selW?.id === w.id ? null : w)} onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,.1)"} onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,.05)"}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div><div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{w.name}</div><div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{w.address}</div></div>
                <StatusPill s={w.status} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginBottom: 4 }}><span>Utilization</span><span style={{ fontWeight: 700, color: utilColor(w.utilization) }}>{w.utilization}%</span></div>
                <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", width: `${w.utilization}%`, background: utilColor(w.utilization), borderRadius: 3 }} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[["On Hand", w.onHand.toLocaleString()], ["Inbound", w.inbound], ["Outbound", w.outbound]].map(([l, v]) => (
                  <div key={l} style={{ background: "#f8fafc", borderRadius: 8, padding: "7px 10px", textAlign: "center" }}><div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{v}</div><div style={{ fontSize: 10, color: "#94a3b8" }}>{l}</div></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {selW && (
        <div style={{ width: 340, background: "#fff", borderLeft: "1px solid #e2e8f0", overflowY: "auto", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", borderBottom: "1px solid #f1f5f9" }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{selW.name}</span>
            <button onClick={() => setSelW(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>✕</button>
          </div>
          <div style={{ padding: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              {[["Capacity", `${(selW.capacity / 1000).toFixed(0)}k units`], ["Utilization", `${selW.utilization}%`], ["Docks Total", selW.docks], ["Docks Free", selW.docksAvail], ["Yard Status", selW.yard]].map(([l, v]) => (
                <div key={l} style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 10px" }}><div style={{ fontSize: 10, color: "#94a3b8" }}>{l}</div><div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{v}</div></div>
              ))}
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 8 }}>INVENTORY BREAKDOWN</div>
              {selW.inventory.map(iv => (
                <div key={iv.cat} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}><span style={{ fontWeight: 600 }}>{iv.cat}</span><span style={{ color: "#64748b" }}>{iv.units.toLocaleString()} ({iv.pct}%)</span></div>
                  <div style={{ height: 5, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", width: `${iv.pct}%`, background: catColor(iv.cat), borderRadius: 3 }} /></div>
                </div>
              ))}
            </div>
            {selW.schedule.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 8 }}>TODAY'S SCHEDULE</div>
                {selW.schedule.slice(0, 5).map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f8fafc", fontSize: 11 }}>
                    <span style={{ fontWeight: 700, color: "#374151" }}>{s.time}</span>
                    <span style={{ background: s.dir === "IN" ? "#dbeafe" : "#dcfce7", color: s.dir === "IN" ? "#1d4ed8" : "#15803d", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>{s.dir} · {s.ref}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={() => showToast("Inventory management coming soon")} style={{ ...S.btn, width: "100%", textAlign: "center", padding: 10 }}>📦 Manage Inventory</button>
              <button onClick={() => showToast("Appointment scheduler coming soon")} style={{ ...S.btnO, width: "100%", textAlign: "center", padding: 10, borderColor: "#16a34a", color: "#15803d" }}>📅 Schedule Appointment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
