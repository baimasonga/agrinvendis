import { useEffect, useMemo, useState } from "react";
import { PageHead } from "../components/ui";
import { S } from "../styles";
import { supabase } from "../lib/supabaseClient";

const ACTIONS = [
  "POD_CREATED",
  "POD_VERIFIED",
  "USER_ROLE_UPDATE",
  "INV_UPDATED",
  "DIST_CREATED",
  "DIST_UPDATED",
  "LOGIN",
];

export default function AuditDashboard({ showToast, hasPerm }) {
  const canView = hasPerm?.("view_audit") || hasPerm?.("view_all");
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [actionF, setActionF] = useState("All");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(200);

  const load = async () => {
    setLoading(true);
    try {
      let query = supabase.from("audit_logs").select("id, created_at, actor_id, action, entity, entity_id, payload").order("created_at", { ascending: false }).limit(limit);
      if (actionF !== "All") query = query.eq("action", actionF);
      const res = await query;
      if (res.error) throw res.error;
      setLogs(res.data || []);
    } catch (e) {
      console.error(e);
      showToast?.("Failed to load audit logs (check RLS)", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canView) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, actionF, limit]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return logs;
    return (logs || []).filter(l => {
      return (
        (l.action || "").toLowerCase().includes(qq) ||
        (l.entity || "").toLowerCase().includes(qq) ||
        (l.entity_id || "").toLowerCase().includes(qq) ||
        (l.actor_id || "").toLowerCase().includes(qq) ||
        JSON.stringify(l.payload || {}).toLowerCase().includes(qq)
      );
    });
  }, [logs, q]);

  const summary = useMemo(() => {
    const byAction = {};
    (logs || []).forEach(l => { byAction[l.action] = (byAction[l.action] || 0) + 1; });
    return Object.entries(byAction).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [logs]);

  if (!canView) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Access denied</div>
          <div style={{ color: "#64748b", fontSize: 13 }}>You don’t have permission to view audit logs.</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHead title="Activity & Audit Dashboard" sub="Trace system activity across inventory, distributions and POD">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search action, entity, ids, payload"
          style={{ ...S.fi, width: 280, height: 34 }}
        />
        <select style={S.fsel} value={actionF} onChange={(e) => setActionF(e.target.value)}>
          <option value="All">All actions</option>
          {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select style={S.fsel} value={String(limit)} onChange={(e) => setLimit(+e.target.value)}>
          {[50, 100, 200, 500].map(n => <option key={n} value={n}>{n} rows</option>)}
        </select>
        <button style={S.btnO} onClick={load}>⟳ Refresh</button>
      </PageHead>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
          <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>Rows loaded</div>
          <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6 }}>{logs.length}</div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
          <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>Top actions</div>
          <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {summary.length ? summary.map(([a, c]) => (
              <span key={a} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 999, padding: "4px 10px", fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{a} · {c}</span>
            )) : <span style={{ color: "#94a3b8", fontSize: 13 }}>—</span>}
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
          <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>Notes</div>
          <div style={{ color: "#64748b", fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>
            Audit logs are append-only. If you want strict enforcement (e.g., only M&E can verify POD), pair this dashboard with database RLS constraints.
          </div>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.ch}>🧾 Recent Activity</div>
        {loading ? (
          <div style={{ padding: 18, color: "#64748b" }}>Loading…</div>
        ) : (
          <table style={S.tbl}>
            <thead>
              <tr style={S.thead}>
                {["Time", "Action", "Entity", "Entity ID", "Actor", "Payload"].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} style={S.tr}>
                  <td style={{ ...S.td, whiteSpace: "nowrap", color: "#64748b" }}>{new Date(l.created_at).toLocaleString()}</td>
                  <td style={{ ...S.td, fontWeight: 800 }}>{l.action}</td>
                  <td style={S.td}>{l.entity || "—"}</td>
                  <td style={{ ...S.td, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12, color: "#64748b" }}>{l.entity_id || "—"}</td>
                  <td style={{ ...S.td, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12, color: "#64748b" }}>{l.actor_id || "—"}</td>
                  <td style={{ ...S.td, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12, color: "#64748b" }}>{JSON.stringify(l.payload || {})}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 18, color: "#64748b" }}>No logs match your filter.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
