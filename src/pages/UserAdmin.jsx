import { useEffect, useMemo, useState } from "react";
import { PageHead } from "../components/ui";
import { S } from "../styles";
import { supabase } from "../lib/supabaseClient";
import { USER_ROLES } from "../data/seed";

export default function UserAdmin({ showToast, hasPerm }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [roleF, setRoleF] = useState("All");

  const canManage = hasPerm?.("manage_users");

  const load = async () => {
    setLoading(true);
    try {
      const res = await supabase
        .from("profiles")
        .select("user_id, full_name, email, role, location, created_at")
        .order("created_at", { ascending: false });
      if (res.error) throw res.error;
      setRows(res.data || []);
    } catch (e) {
      console.error(e);
      showToast?.("Failed to load users (check RLS)", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canManage) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return (rows || []).filter(r => {
      if (roleF !== "All" && r.role !== roleF) return false;
      if (!qq) return true;
      return (
        (r.full_name || "").toLowerCase().includes(qq) ||
        (r.email || "").toLowerCase().includes(qq) ||
        (r.user_id || "").toLowerCase().includes(qq)
      );
    });
  }, [rows, q, roleF]);

  const updateRole = async (user_id, role) => {
    try {
      const res = await supabase.from("profiles").update({ role }).eq("user_id", user_id);
      if (res.error) throw res.error;
      setRows(prev => prev.map(r => r.user_id === user_id ? { ...r, role } : r));
      showToast?.("Role updated", "success");
      await supabase.from("audit_logs").insert([{ action: "USER_ROLE_UPDATE", entity: "profiles", entity_id: user_id, payload: { role } }]);
    } catch (e) {
      console.error(e);
      showToast?.("Failed to update role (check RLS)", "error");
    }
  };

  if (!canManage) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Access denied</div>
          <div style={{ color: "#64748b", fontSize: 13 }}>You don’t have permission to manage users.</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHead title="Users & Roles" sub="Manage system users and assign roles">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, or user id"
          style={{ ...S.fi, width: 260, height: 34 }}
        />
        <select style={S.fsel} value={roleF} onChange={(e) => setRoleF(e.target.value)}>
          <option value="All">All roles</option>
          {Object.keys(USER_ROLES).map(r => <option key={r} value={r}>{USER_ROLES[r]}</option>)}
        </select>
        <button style={S.btnO} onClick={load}>⟳ Refresh</button>
      </PageHead>

      <div style={S.card}>
        <div style={S.ch}>👥 User Directory</div>
        {loading ? (
          <div style={{ padding: 18, color: "#64748b" }}>Loading…</div>
        ) : (
          <table style={S.tbl}>
            <thead>
              <tr style={S.thead}>
                {["Full name", "Email", "Role", "User ID"].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.user_id} style={S.tr}>
                  <td style={{ ...S.td, fontWeight: 700 }}>{u.full_name || "—"}</td>
                  <td style={S.td}>{u.email || "—"}</td>
                  <td style={S.td}>
                    <select
                      style={{ ...S.fsel, height: 32 }}
                      value={u.role || "field_officer"}
                      onChange={(e) => updateRole(u.user_id, e.target.value)}
                    >
                      {Object.keys(USER_ROLES).map(r => (
                        <option key={r} value={r}>{USER_ROLES[r]}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ ...S.td, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12, color: "#64748b" }}>
                    {u.user_id}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} style={{ padding: 18, color: "#64748b" }}>No users match your filter.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
