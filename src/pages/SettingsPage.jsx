import { useState } from "react";
import { S } from "../styles";
import { StatusPill, Avatar, PageHead } from "../components/ui";
import { USER_ROLES, ROLE_PERMISSIONS } from "../data/seed";

const RoleBadge = ({ roleId }) => {
  const r = USER_ROLES.find(x => x.id === roleId);
  if (!r) return null;
  return <span style={{ background: r.bg, color: r.color, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{r.icon} {r.label}</span>;
};

const NotificationsTab = ({ showToast }) => {
  const PREFS = [
    { key: "lowStock", title: "Low stock alerts", desc: "Notify when inventory falls below minimum level", def: true },
    { key: "expiry", title: "Expiry warnings", desc: "Alert 60 days before items expire", def: true },
    { key: "delivery", title: "Delivery confirmations", desc: "Notify when distributions are marked delivered", def: true },
    { key: "podReview", title: "POD pending reviews", desc: "Remind when PODs are awaiting verification", def: false },
    { key: "maintenance", title: "Fleet maintenance due", desc: "Notify when vehicle inspection is overdue", def: true },
    { key: "hos", title: "Officer HOS alerts", desc: "Alert for high Hours-of-Service risk officers", def: false },
  ];
  const initState = Object.fromEntries(PREFS.map(p => [p.key, p.def]));
  const [prefs, setPrefs] = useState(initState);
  const toggle = key => setPrefs(p => ({ ...p, [key]: !p[key] }));
  return (
    <div style={{ maxWidth: 560 }}>
      <div style={S.card}>
        <div style={S.ch}>🔔 Notification Preferences</div>
        <div style={{ padding: "18px 22px" }}>
          {PREFS.map(({ key, title, desc }) => (
            <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
              <div><div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>{title}</div><div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{desc}</div></div>
              <div onClick={() => toggle(key)} style={{ width: 44, height: 24, borderRadius: 12, background: prefs[key] ? "#15803d" : "#e2e8f0", cursor: "pointer", position: "relative", flexShrink: 0 }}>
                <div style={{ position: "absolute", width: 18, height: 18, borderRadius: "50%", background: "#fff", top: 3, left: prefs[key] ? 23 : 3, transition: "left .15s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
              </div>
            </div>
          ))}
          <button onClick={() => showToast("Notification settings saved!")} style={{ ...S.btn, marginTop: 16 }}>Save Preferences</button>
        </div>
      </div>
    </div>
  );
};

export default function SettingsPage({ users, setUsers, syncSetUsers, openModal, showToast, online, syncStatus, pendingCount, forceSync, deleteRecord }) {
  const [tab, setTab] = useState("users");
  const [userSrch, setUserSrch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredUsers = users.filter(u => {
    const txt = `${u.name} ${u.email} ${u.location}`.toLowerCase();
    const role = USER_ROLES.find(r => r.id === u.role);
    return (roleFilter === "All" || u.role === roleFilter) && (statusFilter === "All" || u.status === statusFilter) && (!userSrch || txt.includes(userSrch.toLowerCase()) || role?.label.toLowerCase().includes(userSrch.toLowerCase()));
  });

  const TABS = [{ id: "users", label: "👥 User Management" }, { id: "roles", label: "🔐 Roles & Permissions" }, { id: "general", label: "⚙ General" }, { id: "notifications", label: "🔔 Notifications" }, { id: "sync", label: "🔄 Sync & Database" }];

  return (
    <div>
      <PageHead title="Settings" sub="Manage your system configuration" />
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "2px solid #e2e8f0", paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "10px 18px", background: "none", border: "none", borderBottom: `2px solid ${tab === t.id ? "#15803d" : "transparent"}`, marginBottom: -2, cursor: "pointer", fontSize: 13, fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? "#15803d" : "#64748b", whiteSpace: "nowrap" }}>{t.label}</button>
        ))}
      </div>

      {tab === "users" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
            {USER_ROLES.map(r => { const count = users.filter(u => u.role === r.id && u.status === "Active").length; return (
              <div key={r.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", display: "flex", gap: 12, alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: r.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{r.icon}</div>
                <div><div style={{ fontSize: 22, fontWeight: 800, color: r.color }}>{count}</div><div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>{r.label}</div></div>
              </div>
            ); })}
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <input style={{ ...S.fsel, minWidth: 240 }} placeholder="🔍 Search users by name, email, role…" value={userSrch} onChange={e => setUserSrch(e.target.value)} />
            <span style={S.fl}>Role:</span>
            <select style={S.fsel} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="All">All Roles</option>
              {USER_ROLES.map(r => <option key={r.id} value={r.id}>{r.icon} {r.label}</option>)}
            </select>
            <span style={S.fl}>Status:</span>
            <select style={S.fsel} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="All">All</option><option>Active</option><option>Inactive</option><option>Suspended</option>
            </select>
            <button onClick={() => { setUserSrch(""); setRoleFilter("All"); setStatusFilter("All"); }} style={S.clr}>✕ Clear</button>
            <button onClick={() => openModal("user")} style={{ ...S.btn, marginLeft: "auto" }}>+ Add User</button>
          </div>
          <div style={S.card}>
            <table style={S.tbl}>
              <thead><tr style={S.thead}>{["User", "Role", "Status", "Location", "Last Login", "Joined", "Actions"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {filteredUsers.map((u, i) => (
                  <tr key={u.id} style={S.tr} onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = ""}>
                    <td style={S.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar label={u.avatar} idx={i} size={36} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{u.email}</div>
                          {u.phone && <div style={{ fontSize: 11, color: "#94a3b8" }}>📱 {u.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={S.td}><RoleBadge roleId={u.role} /></td>
                    <td style={S.td}><StatusPill s={u.status} /></td>
                    <td style={{ ...S.td, fontSize: 12, color: "#374151" }}>📍 {u.location}</td>
                    <td style={{ ...S.td, fontSize: 12, color: "#64748b" }}>{u.lastLogin}</td>
                    <td style={{ ...S.td, fontSize: 12, color: "#64748b" }}>{u.joined}</td>
                    <td style={S.td}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => openModal("user", u)} style={{ ...S.icnBtn, fontSize: 11 }} title="Edit">✏️ Edit</button>
                        <button onClick={() => { if (u.status === "Active") { syncSetUsers(us => us.map(x => x.id === u.id ? { ...x, status: "Inactive" } : x)); showToast(`${u.name} deactivated`); } else { syncSetUsers(us => us.map(x => x.id === u.id ? { ...x, status: "Active" } : x)); showToast(`${u.name} activated`); } }} style={{ ...S.icnBtn, fontSize: 11, color: u.status === "Active" ? "#d97706" : "#16a34a" }} title={u.status === "Active" ? "Deactivate" : "Activate"}>{u.status === "Active" ? "⏸ Disable" : "▶ Enable"}</button>
                        <button onClick={() => { if (window.confirm(`Delete ${u.name}?`)) { deleteRecord("users", u.id); setUsers(p => p.filter(x => x.id !== u.id)); showToast("User removed"); } }} style={{ ...S.icnBtn, color: "#dc2626", fontSize: 11 }} title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredUsers.length && <p style={{ textAlign: "center", color: "#94a3b8", padding: 32 }}>No users match your filters.</p>}
          </div>
        </div>
      )}

      {tab === "roles" && (
        <div>
          <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>Each role has a defined set of permissions controlling what actions users can perform in the system.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
            {USER_ROLES.map(r => (
              <div key={r.id} style={{ background: "#fff", border: `1px solid ${r.color}30`, borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: r.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{r.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: r.color }}>{r.label}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{r.desc}</div>
                  </div>
                  <span style={{ marginLeft: "auto", fontWeight: 700, fontSize: 14, color: r.color }}>{users.filter(u => u.role === r.id).length} users</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(ROLE_PERMISSIONS[r.id] || []).map(p => (
                    <span key={p} style={{ background: r.bg, color: r.color, border: `1px solid ${r.color}30`, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>✓ {p.replace(/_/g, " ")}</span>
                  ))}
                </div>
                {!(ROLE_PERMISSIONS[r.id]?.length) && <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>No permissions defined.</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "general" && (
        <div style={{ maxWidth: 560 }}>
          <div style={S.card}>
            <div style={S.ch}>🏢 Organisation Details</div>
            <div style={{ padding: "18px 22px" }}>
              {[["Organisation Name", "AgroFlow Sierra Leone"], ["Programme", "National Agricultural Distribution Programme"], ["Country", "Sierra Leone"], ["Reporting Year", "2025"]].map(([l, v]) => (
                <div key={l} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 5 }}>{l}</label>
                  <input defaultValue={v} style={S.fi} />
                </div>
              ))}
              <button onClick={() => showToast("Settings saved!")} style={S.btn}>Save Changes</button>
            </div>
          </div>
          <div style={S.card}>
            <div style={S.ch}>🗺 Regional Configuration</div>
            <div style={{ padding: "18px 22px" }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 5 }}>Timezone</label>
                <select style={S.fi} defaultValue="Africa/Freetown"><option>Africa/Freetown (GMT+0)</option><option>UTC</option></select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 5 }}>Date Format</label>
                <select style={S.fi} defaultValue="DD/MM/YYYY"><option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option></select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 5 }}>Currency</label>
                <select style={S.fi} defaultValue="USD"><option>USD ($)</option><option>SLL (Le)</option><option>GBP (£)</option></select>
              </div>
              <button onClick={() => showToast("Regional settings saved!")} style={S.btn}>Save</button>
            </div>
          </div>
        </div>
      )}

      {tab === "notifications" && <NotificationsTab showToast={showToast} />}

      {tab === "sync" && (
        <div style={{ maxWidth: 600 }}>
          <div style={S.card}>
            <div style={S.ch}>🔄 Sync Status</div>
            <div style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: online ? "#f0fdf4" : "#f1f5f9", borderRadius: 10, padding: 16, marginBottom: 16 }}>
                <span style={{ width: 14, height: 14, borderRadius: "50%", background: online ? "#16a34a" : "#94a3b8", flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, color: online ? "#15803d" : "#374151" }}>{online ? "Connected to Cloud" : "Offline Mode"}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{online ? "All changes sync automatically to Supabase" : "Changes are saved locally and will sync when connection is restored"}</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                {[["Sync Status", syncStatus.charAt(0).toUpperCase() + syncStatus.slice(1)], ["Pending Changes", pendingCount], ["Local DB", "IndexedDB (Browser)"], ["Cloud DB", "Supabase (PostgreSQL)"]].map(([l, v]) => (
                  <div key={l} style={{ background: "#f8fafc", borderRadius: 8, padding: 12 }}><div style={{ fontSize: 11, color: "#94a3b8" }}>{l}</div><div style={{ fontWeight: 700, fontSize: 14, marginTop: 2, color: l === "Pending Changes" && pendingCount > 0 ? "#d97706" : "#0f172a" }}>{v}</div></div>
                ))}
              </div>
              <button onClick={forceSync} style={{ ...S.btn, marginRight: 8 }}>🔄 Force Sync Now</button>
              <button onClick={() => showToast("Local database cleared — refresh to reload")} style={{ ...S.btnO, color: "#dc2626", borderColor: "#fca5a5" }}>🗑 Clear Local Cache</button>
            </div>
          </div>
          <div style={S.card}>
            <div style={S.ch}>☁ Supabase Configuration</div>
            <div style={{ padding: 20 }}>
              <div style={{ background: "#fef9c3", border: "1px solid #fde047", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: "#854d0e" }}>⚠ Replace the placeholder below with your actual Supabase anon key to enable cloud sync.</div>
              {[["Project URL", "https://your-project.supabase.co"], ["Anon Key", "YOUR_ANON_KEY_HERE — paste in configuration"]].map(([l, v]) => (
                <div key={l} style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: 4 }}>{l}</label>
                  <input defaultValue={v} readOnly style={{ ...S.fi, fontFamily: "monospace", fontSize: 11, color: "#374151", background: "#f8fafc" }} />
                </div>
              ))}
              <button onClick={() => showToast("Open the .jsx file and replace SUPABASE_ANON to connect")} style={S.btnO}>ℹ How to connect →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
