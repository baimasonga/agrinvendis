import { useState } from "react";
import { S } from "../styles";
import { StatusPill } from "../components/ui";

export default function RoutesPage({ routes, fleet, dists, inv, showToast }) {
  const [selRoute, setSelRoute] = useState(null);
  const [routeStF, setRouteStF] = useState("All");
  const statusClr = s => ({ OnTime: "#16a34a", "On Time": "#16a34a", Delayed: "#d97706", Critical: "#dc2626" }[s] || "#64748b");
  const PIN_POS = [[28, 38], [55, 60], [42, 25], [70, 45], [36, 68]];
  return (
    <div style={{ display: "flex", gap: 0, height: "calc(100vh - 52px)", margin: "-24px -24px -32px -24px", overflow: "hidden" }}>
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: selRoute ? 370 : 0, zIndex: 20, background: "rgba(255,255,255,.97)", borderBottom: "1px solid #e2e8f0", padding: "14px 20px", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a", marginRight: 4 }}>Routes & Tracking</h2>
          {[{ l: "Active", v: routes.filter(r => r.status !== "Delivered").length, bg: "#eff6ff", c: "#2563eb" }, { l: "On-Time", v: `${Math.round((routes.filter(r => r.status === "On Time").length / routes.length) * 100)}%`, bg: "#f0fdf4", c: "#16a34a" }, { l: "Critical", v: routes.filter(r => r.status === "Critical").length, bg: "#fee2e2", c: "#b91c1c" }, { l: "Fleet", v: `${fleet.filter(f => f.status !== "Maintenance").length}/${fleet.length}`, bg: "#faf5ff", c: "#7c3aed" }].map((s, i) => (
            <div key={i} style={{ background: s.bg, borderRadius: 10, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.c }}>{s.v}</div><div style={{ fontSize: 11, color: "#64748b" }}>{s.l}</div>
            </div>
          ))}
          <select style={{ ...S.fsel, marginLeft: "auto" }} value={routeStF} onChange={e => setRouteStF(e.target.value)}><option value="All">All Routes</option>{["On Time", "Delayed", "Critical"].map(s => <option key={s}>{s}</option>)}</select>
        </div>
        <div style={{ position: "absolute", inset: 0, background: "#e8f5e9", paddingTop: 64 }}>
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: .5 }} viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
            <rect width="800" height="600" fill="#d4edda" />
            <ellipse cx="300" cy="350" rx="200" ry="120" fill="#b8dfc5" opacity=".6" />
            <ellipse cx="580" cy="200" rx="120" ry="80" fill="#c5e8cc" opacity=".5" />
            <line x1="0" y1="300" x2="800" y2="300" stroke="#fff" strokeWidth="4" opacity=".6" />
            <line x1="400" y1="0" x2="400" y2="600" stroke="#fff" strokeWidth="4" opacity=".6" />
            <line x1="0" y1="150" x2="800" y2="450" stroke="#fff" strokeWidth="3" opacity=".4" />
            <polyline points="224,228 440,360 560,270" stroke="#16a34a" strokeWidth="3" fill="none" strokeDasharray="8,4" opacity=".7" />
            <polyline points="440,360 336,408" stroke="#d97706" strokeWidth="3" fill="none" strokeDasharray="8,4" opacity=".7" />
            <polyline points="336,150 336,408" stroke="#dc2626" strokeWidth="3" fill="none" strokeDasharray="8,4" opacity=".7" />
            {[["Freetown", 30, 55], ["Bo", 55, 60], ["Makeni", 42, 25], ["Kenema", 70, 45], ["Koidu", 72, 70], ["Lungi", 28, 42], ["Waterloo", 36, 62]].map(([n, x, y]) => (
              <g key={n}><circle cx={x * 8} cy={y * 6} r="5" fill="#15803d" opacity=".8" /><text x={x * 8 + 8} y={y * 6 + 4} fontSize="11" fill="#15803d" fontWeight="bold" opacity=".9">{n}</text></g>
            ))}
          </svg>
          {routes.filter(r => routeStF === "All" || r.status === routeStF).map((r, i) => {
            const [px, py] = PIN_POS[i] || [30 + i * 12, 40 + i * 10];
            return (
              <div key={r.id} onClick={() => setSelRoute(selRoute?.id === r.id ? null : r)} style={{ position: "absolute", left: `${px}%`, top: `${py}%`, transform: "translate(-50%,-50%)", cursor: "pointer", zIndex: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: statusClr(r.status), border: "3px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🚛</div>
                <div style={{ position: "absolute", top: 40, left: "50%", transform: "translateX(-50%)", background: "rgba(15,23,42,.85)", color: "#fff", padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>{r.truck}</div>
              </div>
            );
          })}
          <div style={{ position: "absolute", bottom: 20, left: 20, background: "rgba(255,255,255,.95)", borderRadius: 10, padding: "10px 14px", boxShadow: "0 2px 8px rgba(0,0,0,.12)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>STATUS</div>
            {[["On Time", "#16a34a"], ["Delayed", "#d97706"], ["Critical", "#dc2626"]].map(([l, c]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: c }} /><span style={{ fontSize: 12 }}>{l}</span></div>
            ))}
          </div>
          <div style={{ position: "absolute", bottom: 20, right: selRoute ? 390 : 20, background: "rgba(255,255,255,.97)", borderRadius: 12, padding: "12px 0", boxShadow: "0 4px 16px rgba(0,0,0,.12)", minWidth: 280, maxWidth: 320, maxHeight: 240, overflowY: "auto" }}>
            <div style={{ padding: "0 14px 8px", fontWeight: 700, fontSize: 13, borderBottom: "1px solid #f1f5f9" }}>Active Routes ({routes.length})</div>
            {routes.filter(r => routeStF === "All" || r.status === routeStF).map(r => (
              <div key={r.id} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f8fafc", background: selRoute?.id === r.id ? "#f0fdf4" : undefined }} onClick={() => setSelRoute(selRoute?.id === r.id ? null : r)}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb" }}>{r.truck}</span><span style={{ fontSize: 11, fontWeight: 700, background: statusClr(r.status) + "18", color: statusClr(r.status), padding: "1px 8px", borderRadius: 20 }}>{r.status}</span></div>
                <div style={{ fontSize: 11, color: "#374151" }}>{r.origin} → {r.dest}</div>
                <div style={{ marginTop: 6, height: 4, background: "#f1f5f9", borderRadius: 2 }}><div style={{ height: "100%", width: `${r.progress}%`, background: statusClr(r.status), borderRadius: 2 }} /></div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{r.progress}% · ETA {r.eta}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {selRoute && (
        <div style={{ width: 370, background: "#fff", borderLeft: "1px solid #e2e8f0", overflowY: "auto", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", borderBottom: "1px solid #f1f5f9" }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Route Details</span>
            <button onClick={() => setSelRoute(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>✕</button>
          </div>
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", background: "#f0fdf4", borderRadius: 10, padding: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: statusClr(selRoute.status), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🚛</div>
              <div><div style={{ fontWeight: 700, fontSize: 14 }}>{selRoute.ref}</div><div style={{ fontSize: 12, color: "#16a34a" }}>{selRoute.officer} · {selRoute.truck}</div></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[["Origin", selRoute.origin], ["Destination", selRoute.dest], ["Distance", selRoute.distance], ["Status", selRoute.status]].map(([l, v]) => (
                <div key={l} style={{ background: "#f8fafc", borderRadius: 8, padding: 10 }}><div style={{ fontSize: 11, color: "#94a3b8" }}>{l}</div><div style={{ fontWeight: 700, fontSize: 12, marginTop: 2 }}>{v}</div></div>
              ))}
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 8 }}>ETA & PROGRESS</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 12, color: "#64748b" }}>Arrival</span><span style={{ fontSize: 13, fontWeight: 700 }}>{selRoute.eta}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 12, color: "#64748b" }}>Confidence</span><span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>{selRoute.confidence}%</span></div>
              <div style={{ height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden", marginBottom: 4 }}><div style={{ height: "100%", width: `${selRoute.progress}%`, background: statusClr(selRoute.status), borderRadius: 4 }} /></div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>{selRoute.progress}% · Last update: {selRoute.lastUpdate}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 10 }}>STOPS</div>
              <div style={{ position: "relative", paddingLeft: 20 }}>
                <div style={{ position: "absolute", left: 8, top: 8, bottom: 8, width: 2, background: "#e2e8f0" }} />
                {selRoute.stops.map((stop, si) => { const st = selRoute.stopStatus[si]; const clr = st === "Completed" ? "#16a34a" : st === "In Transit" ? "#d97706" : "#cbd5e1"; return (
                  <div key={si} style={{ marginBottom: 14, position: "relative" }}>
                    <div style={{ position: "absolute", left: -15, top: 3, width: 12, height: 12, borderRadius: "50%", background: clr, border: "2px solid #fff", boxShadow: `0 0 0 2px ${clr}` }} />
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{stop}</div>
                    <div style={{ fontSize: 11, color: clr, fontWeight: 600, marginTop: 2 }}>{st}</div>
                  </div>
                ); })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 8 }}>LINKED LOADS</div>
              {selRoute.linkedLoads.map(ref => { const d = dists.find(x => x.ref === ref); return d ? <div key={ref} style={{ background: "#f8fafc", borderRadius: 8, padding: 10, marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontSize: 12, fontWeight: 700, color: "#2563eb" }}>{ref}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>{inv.find(x => x.id === d.itemId)?.name || "—"}</div></div><StatusPill s={d.status} /></div> : null; })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
