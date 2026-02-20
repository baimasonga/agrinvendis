import { useState } from "react";
import { S, statusStyle } from "../styles";
import { Avatar, PageHead } from "../components/ui";
import { catColor } from "../utils/helpers";
import { STATUSES, CATEGORIES } from "../data/seed";

export default function ReportsPage({ inv, dists, stats, showToast }) {
  const [period, setPeriod] = useState("30days");
  const distByStatus = STATUSES.map(s => ({ s, count: dists.filter(d => d.status === s).length }));
  const distByOfficer = [...new Set(dists.map(d => d.officer).filter(Boolean))].map(o => ({ officer: o, count: dists.filter(d => d.officer === o).length, delivered: dists.filter(d => d.officer === o && d.status === "Delivered").length }));
  const invByCat = CATEGORIES.map(c => ({ cat: c, items: inv.filter(i => i.cat === c).length, value: inv.filter(i => i.cat === c).reduce((a, i) => a + i.qty * i.cost, 0) })).filter(x => x.items > 0);
  return (
    <div>
      <PageHead title="Reports & Analytics" sub="Distribution and inventory performance summary">
        <select style={S.fsel} value={period} onChange={e => setPeriod(e.target.value)}><option value="7days">Last 7 days</option><option value="30days">Last 30 days</option><option value="all">All Time</option></select>
        <button onClick={() => showToast("PDF export coming soon")} style={S.btnO}>↓ Export PDF</button>
        <button onClick={() => showToast("Excel export coming soon")} style={S.btnO}>↓ Export Excel</button>
      </PageHead>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {[{ l: "Total Distributions", v: dists.length, c: "#2563eb", ic: "🚜" }, { l: "Delivered", v: dists.filter(d => d.status === "Delivered").length, c: "#16a34a", ic: "✅" }, { l: "Total Value Distributed", v: `$${stats.totalRevenue.toLocaleString()}`, c: "#7c3aed", ic: "💰" }, { l: "Inventory Value", v: `$${stats.totalValue.toLocaleString()}`, c: "#d97706", ic: "📦" }].map((c, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><span style={{ fontSize: 20 }}>{c.ic}</span></div>
            <div style={{ fontSize: 24, fontWeight: 800, color: c.c }}>{c.v}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>{c.l}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        <div style={S.card}>
          <div style={S.ch}>📊 Distribution by Status</div>
          <div style={{ padding: "12px 20px" }}>
            {distByStatus.filter(x => x.count > 0).map(({ s, count }) => { const st = statusStyle(s); const pct = Math.round((count / dists.length) * 100); return (
              <div key={s} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{s}</span><span style={{ fontSize: 13, fontWeight: 700, color: st.c }}>{count} ({pct}%)</span></div>
                <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: st.c, borderRadius: 4 }} /></div>
              </div>
            ); })}
          </div>
        </div>
        <div style={S.card}>
          <div style={S.ch}>📦 Inventory by Category</div>
          <div style={{ padding: "12px 20px" }}>
            {invByCat.map(({ cat, items, value }) => (
              <div key={cat} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><span style={{ fontSize: 13, fontWeight: 600 }}><span style={{ background: catColor(cat) + "1a", color: catColor(cat), padding: "1px 8px", borderRadius: 20, fontSize: 11, marginRight: 6 }}>{cat}</span></span><span style={{ fontSize: 13, fontWeight: 700 }}>{items} items · <span style={{ color: "#64748b" }}>$</span>{value.toFixed(0)}</span></div>
                <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.round((value / stats.totalValue) * 100)}%`, background: catColor(cat), borderRadius: 3 }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.ch}>👤 Performance by Field Officer</div>
        <table style={S.tbl}>
          <thead><tr style={S.thead}>{["Officer", "Total Loads", "Delivered", "Delivery Rate", "In Transit", "Problem"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {distByOfficer.map((o, i) => {
              const total = o.count, delivered = o.delivered, rate = Math.round((delivered / total) * 100);
              const inTransit = dists.filter(d => d.officer === o.officer && d.status === "In Transit").length;
              const problem = dists.filter(d => d.officer === o.officer && d.status === "Problem").length;
              return (
                <tr key={o.officer} style={S.tr} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = ""}>
                  <td style={S.td}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><Avatar label={o.officer.split(" ").map(x => x[0]).join("")} idx={i} size={30} /><span style={{ fontWeight: 600 }}>{o.officer}</span></div></td>
                  <td style={{ ...S.td, fontWeight: 700 }}>{total}</td>
                  <td style={{ ...S.td, color: "#16a34a", fontWeight: 700 }}>{delivered}</td>
                  <td style={S.td}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 60, height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", width: `${rate}%`, background: rate >= 80 ? "#16a34a" : rate >= 60 ? "#d97706" : "#dc2626", borderRadius: 3 }} /></div><span style={{ fontSize: 12, fontWeight: 700, color: rate >= 80 ? "#16a34a" : rate >= 60 ? "#d97706" : "#dc2626" }}>{rate}%</span></div></td>
                  <td style={{ ...S.td, color: "#d97706", fontWeight: 700 }}>{inTransit}</td>
                  <td style={{ ...S.td, color: "#dc2626", fontWeight: 700 }}>{problem || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
