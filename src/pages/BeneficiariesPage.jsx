import { useState } from "react";
import { S, statusStyle } from "../styles";
import { Avatar, PageHead } from "../components/ui";

export default function BeneficiariesPage({ benes, dists, showToast }) {
  const [q, setQ] = useState("");
  const [gf, setGf] = useState("All");
  const rows = benes.filter(b => (gf === "All" || b.gender === gf) && (!q || b.name.toLowerCase().includes(q.toLowerCase()) || b.group.toLowerCase().includes(q.toLowerCase()) || b.village.toLowerCase().includes(q.toLowerCase())));
  const totalBenes = benes.reduce((a, b) => a + b.count, 0);
  return (
    <div>
      <PageHead title="Beneficiaries" sub={`${benes.length} groups · ${totalBenes} total beneficiaries`}>
        <button onClick={() => showToast("Export coming soon")} style={S.btnO}>↓ Export List</button>
        <button onClick={() => showToast("Add beneficiary form coming soon")} style={S.btn}>+ Add Beneficiary</button>
      </PageHead>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        {[{ l: "Total Groups", v: benes.length, bg: "#eff6ff", c: "#2563eb" }, { l: "Total Beneficiaries", v: totalBenes, bg: "#f0fdf4", c: "#16a34a" }, { l: "Avg Rating", v: `${(benes.reduce((a, b) => a + b.rating, 0) / benes.length).toFixed(1)} ★`, bg: "#fef9c3", c: "#d97706" }].map((c, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div style={{ fontSize: 28, fontWeight: 800, color: c.c }}>{c.v}</div><div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{c.l}</div></div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>👥</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <input style={{ ...S.fsel, minWidth: 260 }} placeholder="🔍 Search by name, group, village…" value={q} onChange={e => setQ(e.target.value)} />
        <span style={S.fl}>Gender:</span>
        <select style={S.fsel} value={gf} onChange={e => setGf(e.target.value)}><option value="All">All</option><option value="M">Male</option><option value="F">Female</option></select>
        <button onClick={() => { setQ(""); setGf("All"); }} style={S.clr}>✕ Clear</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {rows.map((b, i) => {
          const bDists = dists.filter(d => d.beneId === b.id);
          return (
            <div key={b.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18, boxShadow: "0 1px 3px rgba(0,0,0,.05)", cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,.1)"} onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,.05)"}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <Avatar label={b.avatar} idx={i} size={44} />
                <div><div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{b.name}</div><div style={{ fontSize: 12, color: "#94a3b8" }}>{b.group}</div></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                {[["Village", b.village], ["Phone", b.phone], ["Members", b.count], ["Gender", b.gender === "F" ? "Female" : "Male"]].map(([l, v]) => (
                  <div key={l} style={{ background: "#f8fafc", borderRadius: 8, padding: "7px 10px" }}><div style={{ fontSize: 10, color: "#94a3b8" }}>{l}</div><div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginTop: 1 }}>{v}</div></div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{"★".repeat(Math.round(b.rating))}<span style={{ color: "#64748b", fontWeight: 400 }}> {b.rating}</span></span>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>{bDists.length} distributions</span>
              </div>
            </div>
          );
        })}
      </div>
      {!rows.length && <p style={{ textAlign: "center", color: "#94a3b8", padding: 32 }}>No beneficiaries match.</p>}
    </div>
  );
}
