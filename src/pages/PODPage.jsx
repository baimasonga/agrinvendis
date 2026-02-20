import { useState } from "react";
import { S, conditionStyle } from "../styles";
import { StatusPill, Avatar, Pill, BarcodeDisplay, PageHead } from "../components/ui";
import { fmtDate } from "../utils/helpers";

export default function PODPage({ pods, benes, inv, dists, syncSetPods, showToast, setManualScanOpen, openModal, verifyPod }) {
  const [selPod, setSelPod] = useState(null);
  const [podSrch, setPodSrch] = useState("");
  const [podStF, setPodStF] = useState("All");
  const [condF, setCondF] = useState("All");

  const filtered = pods.filter(p => {
    const b = benes.find(x => x.id === p.beneId);
    const procCodes = [...new Set(p.items.map(it => it.procCode).filter(Boolean))].join(" ");
    const txt = `${p.ref} ${p.distRef} ${b?.name || ""} ${p.receivedBy} ${p.officer || ""} ${procCodes}`.toLowerCase();
    return (podStF === "All" || (podStF === "Verified" ? p.verified : !p.verified))
      && (condF === "All" || p.condition === condF)
      && (!podSrch || txt.includes(podSrch.toLowerCase()));
  });

  const totalOrdered = pods.reduce((a, p) => a + p.items.reduce((b, it) => b + (it.qtyOrdered || it.qty), 0), 0);
  const totalReceived = pods.reduce((a, p) => a + p.items.reduce((b, it) => b + it.qty, 0), 0);
  const totalVariance = totalReceived - totalOrdered;
  const podsDamaged = pods.filter(p => p.condition === "Damaged" || p.items.some(it => it.itemCondition === "Damaged")).length;

  const ics = c => ({ Good: { bg: "#dcfce7", c: "#15803d" }, Damaged: { bg: "#fee2e2", c: "#b91c1c" }, Partial: { bg: "#fef9c3", c: "#854d0e" } }[c] || { bg: "#f1f5f9", c: "#64748b" });

  return (
    <div>
      <PageHead title="Proof of Delivery" sub={`${pods.length} records · ${pods.filter(p => p.verified).length} verified`}>
        <button onClick={() => setManualScanOpen(true)} style={{ ...S.btnO, borderColor: "#86efac", color: "#15803d" }}>📷 Scan POD</button>
        <button onClick={() => showToast("Import coming soon")} style={S.btnO}>📥 Import</button>
        <button onClick={() => openModal?.("pod_form")} style={S.btn}>+ Record POD</button>
      </PageHead>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12, marginBottom: 18 }}>
        {[
          { l: "Total PODs", v: pods.length, bg: "#eff6ff", c: "#2563eb", ic: "📄" },
          { l: "Verified", v: pods.filter(p => p.verified).length, bg: "#f0fdf4", c: "#16a34a", ic: "✅" },
          { l: "Pending", v: pods.filter(p => !p.verified).length, bg: "#fef9c3", c: "#854d0e", ic: "⏳" },
          { l: "Damaged Reports", v: podsDamaged, bg: "#fee2e2", c: "#b91c1c", ic: "⚠" },
          { l: "Total Ordered", v: totalOrdered.toLocaleString(), bg: "#f8fafc", c: "#374151", ic: "📋" },
          { l: "Qty Variance",
            v: (totalVariance < 0 ? `−${Math.abs(totalVariance)}` : totalVariance > 0 ? `+${totalVariance}` : "="),
            bg: totalVariance < 0 ? "#fee2e2" : totalVariance > 0 ? "#fef9c3" : "#f0fdf4",
            c: totalVariance < 0 ? "#b91c1c" : totalVariance > 0 ? "#854d0e" : "#15803d", ic: "⚖" },
        ].map((c, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}>
            <div><div style={{ fontSize: 20, fontWeight: 800, color: c.c }}>{c.v}</div><div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{c.l}</div></div>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>{c.ic}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <input style={{ ...S.fsel, minWidth: 280 }} placeholder="🔍 Search ref, beneficiary, officer, proc. code…" value={podSrch} onChange={e => setPodSrch(e.target.value)} />
        <span style={S.fl}>Status:</span>
        <select style={S.fsel} value={podStF} onChange={e => setPodStF(e.target.value)}>
          <option value="All">All</option><option value="Verified">Verified</option><option value="Pending">Pending</option>
        </select>
        <span style={S.fl}>Condition:</span>
        <select style={S.fsel} value={condF} onChange={e => setCondF(e.target.value)}>
          <option value="All">All</option><option>Good</option><option>Damaged</option><option>Partial</option>
        </select>
        <button onClick={() => { setPodSrch(""); setPodStF("All"); setCondF("All"); }} style={S.clr}>✕ Clear</button>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8" }}>{filtered.length} records</span>
      </div>

      <div style={S.card}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ ...S.tbl, minWidth: 1000 }}>
            <thead>
              <tr style={S.thead}>
                {["POD Ref", "Dist. Ref", "Beneficiary", "Officer", "Vehicle", "Date & Time", "Items (Ordered → Received)", "Proc. Code", "Condition", "Verified", "Actions"].map(h => <th key={h} style={S.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const b = benes.find(x => x.id === p.beneId);
                const cs = conditionStyle(p.condition);
                const procCodes = [...new Set(p.items.map(it => it.procCode).filter(Boolean))];
                const hasDmg = p.items.some(it => it.itemCondition === "Damaged");
                return (
                  <tr key={p.id} style={S.tr} onClick={() => setSelPod(selPod?.id === p.id ? null : p)} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = ""}>
                    <td style={S.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {hasDmg && <span title="Damage reported" style={{ fontSize: 12 }}>⚠️</span>}
                        <span style={{ color: "#2563eb", fontWeight: 700, fontFamily: "monospace" }}>{p.ref}</span>
                      </div>
                    </td>
                    <td style={{ ...S.td, fontSize: 12, color: "#374151", fontFamily: "monospace" }}>{p.distRef}</td>
                    <td style={S.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar label={b?.avatar || "??"} idx={i} size={28} />
                        <div><div style={{ fontWeight: 600, fontSize: 13 }}>{p.receivedBy}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>{b?.group || ""}</div></div>
                      </div>
                    </td>
                    <td style={{ ...S.td, fontSize: 12 }}>
                      {p.officer
                        ? <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Avatar label={p.officer.split(" ").map(x => x[0]).join("")} idx={i + 3} size={24} /><span>{p.officer}</span></div>
                        : <span style={{ color: "#94a3b8" }}>—</span>}
                    </td>
                    <td style={{ ...S.td, fontSize: 12, color: "#64748b" }}>{p.vehicle || "—"}</td>
                    <td style={{ ...S.td, fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>{fmtDate(p.date)}<br /><span style={{ fontSize: 10, color: "#94a3b8" }}>{p.time}</span></td>
                    <td style={{ ...S.td, fontSize: 12, maxWidth: 220 }}>
                      {p.items.map((it, ii) => {
                        const variance = it.qtyOrdered !== undefined ? it.qty - it.qtyOrdered : 0;
                        return (
                          <div key={ii} style={{ marginBottom: ii < p.items.length - 1 ? 6 : 0 }}>
                            <span style={{ fontWeight: 600, color: "#0f172a" }}>{it.name}</span>
                            <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>
                              {it.qtyOrdered !== undefined && <span style={{ color: "#94a3b8" }}>{it.qtyOrdered} ordered → </span>}
                              <span style={{ fontWeight: 700, color: variance < 0 ? "#dc2626" : "#15803d" }}>{it.qty} {it.unit}</span>
                              {variance !== 0 && <span style={{ fontWeight: 700, color: variance < 0 ? "#dc2626" : "#d97706", marginLeft: 4 }}>{variance < 0 ? `(−${Math.abs(variance)})` : variance > 0 ? `(+${variance})` : ""}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </td>
                    <td style={S.td}>
                      {procCodes.map(pc => (
                        <span key={pc} style={{ background: "#f1f5f9", color: "#374151", border: "1px solid #e2e8f0", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontFamily: "monospace", display: "inline-block", marginBottom: 2 }}>{pc}</span>
                      ))}
                    </td>
                    <td style={S.td}><span style={{ background: cs.bg, color: cs.c, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{p.condition}</span></td>
                    <td style={S.td}>{p.verified ? <span style={{ color: "#15803d", fontWeight: 600, fontSize: 12 }}>✅ Verified</span> : <span style={{ color: "#d97706", fontWeight: 600, fontSize: 12 }}>⏳ Pending</span>}</td>
                    <td style={S.td}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {!p.verified && <button onClick={e => { e.stopPropagation(); verifyPod?.(p.id || p.ref); }} style={{ ...S.icnBtn, color: "#15803d", fontSize: 12 }}>✓ Verify</button>}
                        <button onClick={e => { e.stopPropagation(); setSelPod(selPod?.id === p.id ? null : p); }} style={S.icnBtn}>👁</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!filtered.length && <p style={{ textAlign: "center", color: "#94a3b8", padding: 32 }}>No POD records match.</p>}
      </div>

      {selPod && (
        <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 400, background: "#fff", boxShadow: "-4px 0 28px rgba(0,0,0,.13)", zIndex: 200, overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", borderBottom: "1px solid #f1f5f9" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{selPod.ref}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, fontFamily: "monospace" }}>{selPod.distRef}</div>
            </div>
            <button onClick={() => setSelPod(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>✕</button>
          </div>
          <div style={{ padding: 20 }}>
            <div style={{ background: selPod.verified ? "#f0fdf4" : "#fef9c3", borderRadius: 10, padding: 14, marginBottom: 16, display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 24 }}>{selPod.verified ? "✅" : "⏳"}</span>
              <div>
                <div style={{ fontWeight: 700, color: selPod.verified ? "#15803d" : "#854d0e" }}>{selPod.verified ? "Verified" : "Pending Verification"}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Signed at: {selPod.signedAt}</div>
              </div>
            </div>

            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: .5, marginBottom: 8 }}>Delivery Details</div>
            <Pill l="Date & Time" v={`${fmtDate(selPod.date)} at ${selPod.time}`} />
            <Pill l="Season" v={selPod.season || "—"} />
            <Pill l="Field Officer" v={selPod.officer || "—"} />
            <Pill l="Vehicle" v={selPod.vehicle || "—"} />
            <Pill l="Received By" v={selPod.receivedBy} />
            <Pill l="Overall Condition" v={<span style={{ color: conditionStyle(selPod.condition).c, fontWeight: 700 }}>{selPod.condition}</span>} />

            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: .5, margin: "16px 0 8px" }}>Items Received</div>
            {selPod.items.map((it, i) => {
              const variance = it.qtyOrdered !== undefined ? it.qty - it.qtyOrdered : null;
              const cs = ics(it.itemCondition || "Good");
              return (
                <div key={i} style={{ background: "#f8fafc", borderRadius: 10, padding: 14, marginBottom: 10, border: `1px solid ${it.itemCondition === "Damaged" ? "#fca5a5" : "#e2e8f0"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{it.name}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{it.cat} · {it.unit}</div>
                    </div>
                    <span style={{ background: cs.bg, color: cs.c, padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{it.itemCondition || "Good"}</span>
                  </div>

                  <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                    <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontFamily: "monospace", fontWeight: 700 }}>📋 {it.procCode}</span>
                    <span style={{ background: "#f1f5f9", color: "#374151", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontFamily: "monospace" }}>🏷 {it.barcode}</span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: it.damageNote ? 10 : 0 }}>
                    {[
                      ["Ordered", it.qtyOrdered !== undefined ? it.qtyOrdered : "—", "#374151"],
                      ["Received", it.qty, "#15803d"],
                      ["Variance", variance !== null ? (variance < 0 ? `−${Math.abs(variance)}` : variance > 0 ? `+${variance}` : "=") : "—",
                        variance === null ? "#94a3b8" : variance < 0 ? "#dc2626" : variance > 0 ? "#d97706" : "#16a34a"],
                    ].map(([l, v, c]) => (
                      <div key={l} style={{ background: "#fff", borderRadius: 6, padding: "8px 10px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: c }}>{v}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{l}</div>
                      </div>
                    ))}
                  </div>

                  {it.damageNote && (
                    <div style={{ background: "#fee2e2", borderRadius: 6, padding: "7px 10px", marginTop: 8, fontSize: 12, color: "#b91c1c", fontWeight: 600 }}>
                      ⚠ {it.damageNote}
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "center", marginTop: 10, padding: 8, background: "#fff", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                    <BarcodeDisplay code={it.barcode || selPod.ref} width={160} height={28} showText={true} />
                  </div>
                </div>
              );
            })}

            {selPod.notes && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: .5, marginBottom: 6 }}>Notes</div>
                <div style={{ background: "#f8fafc", borderRadius: 8, padding: 12, fontSize: 13, lineHeight: 1.6, color: "#374151" }}>{selPod.notes}</div>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: .5, marginBottom: 8 }}>POD Barcode</div>
              <div style={{ display: "flex", justifyContent: "center", background: "#f8fafc", borderRadius: 8, padding: 14 }}>
                <BarcodeDisplay code={selPod.ref} width={200} height={40} showText={true} />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: .5, marginBottom: 8 }}>Signature</div>
              <div style={{ background: "#f8fafc", borderRadius: 8, padding: 16, textAlign: "center", border: "2px dashed #e2e8f0" }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>✍️</div>
                <div style={{ fontSize: 13, fontStyle: "italic", fontWeight: 600 }}>{selPod.receivedBy}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{fmtDate(selPod.date)} · {selPod.signedAt}</div>
              </div>
            </div>

            {!selPod.verified && (
              <button
                onClick={() => verifyPod?.(selPod.id || selPod.ref)}
                style={{ ...S.btn, width: "100%", textAlign: "center", padding: 12 }}
              >
                ✅ Approve & Verify POD
              </button>
            )}
            {selPod.verified && (
              <div style={{ textAlign: "center", color: "#15803d", fontWeight: 600, padding: 12, background: "#f0fdf4", borderRadius: 8 }}>✅ Delivery verified</div>
            )}
          </div>
        </div>
      )}
      {selPod && <div onClick={() => setSelPod(null)} style={{ position: "fixed", inset: 0, zIndex: 199 }} />}
    </div>
  );
}