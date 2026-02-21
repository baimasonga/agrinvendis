import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { LayoutDashboard, ClipboardList, LayoutGrid, MapPin, Truck, Users, Warehouse as WarehouseIcon, Package, UsersRound, FileCheck, BarChart3, ScanBarcode, Settings, Search, Bell, Wifi, WifiOff, Menu, Activity } from "lucide-react";
import {
  INIT_INVENTORY, INIT_BENES, INIT_DISTS, INIT_OFFICERS, INIT_FLEET,
  INIT_ROUTES, INIT_WAREHOUSES, INIT_PODS, INIT_USERS,
  SEASONS, CATEGORIES, STATUSES, USER_ROLES, ROLE_PERMISSIONS, AV_COLORS
} from "./data/seed";
import { fmtDate, isExpired, isExpSoon, healthClr, hosColor, catColor } from "./utils/helpers";
import useSyncDB from "./hooks/useSyncDB";
import { supabase } from "./lib/supabaseClient";
import { StatusPill, PriorityTag, Avatar, Pill, BarcodeDisplay, PageHead, Overlay, FGrid, FG, FIn, FSel, Btn, ModalFooter } from "./components/ui";
import { S, statusStyle, conditionStyle } from "./styles";
import PODForm from "./components/PODForm";
import AuthPanel from "./components/AuthPanel";
import Dashboard from "./pages/Dashboard";
import OrdersPage from "./pages/OrdersPage";
import DispatchBoard from "./pages/DispatchBoard";
import RoutesPage from "./pages/RoutesPage";
import FleetPage from "./pages/FleetPage";
import OfficersPage from "./pages/OfficersPage";
import WarehousesPage from "./pages/WarehousesPage";
import InventoryPage from "./pages/InventoryPage";
import BeneficiariesPage from "./pages/BeneficiariesPage";
import PODPage from "./pages/PODPage";
import ReportsPage from "./pages/ReportsPage";
import ScannerPage from "./pages/ScannerPage";
import SettingsPage from "./pages/SettingsPage";
import UserAdmin from "./pages/UserAdmin";
import AuditDashboard from "./pages/AuditDashboard";

export default function App() {
  const [page, setPage] = useState("dashboard");
  // Supabase Auth
  const [session, setSession] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const BUILD = "2026-02-21-clean1";
  const displayName = authUser?.email || "Loading...";
  const displayInitial = (authUser?.email || "U").slice(0,1).toUpperCase();
  const displayRole = profile?.role || "—";
  // Start with empty state (no demo/seed records). Data is loaded from Supabase or local offline cache.
  const [inv, setInv] = useState([]);
  const [benes, setBenes] = useState([]);
  const [dists, setDists] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [pods, setPods] = useState([]);
  const [users, setUsers] = useState([]);
  const [panel, setPanel] = useState(null);
  const [modal, setModal] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [toast, setToast] = useState(null);
  const [panelTab, setPanelTab] = useState("overview");
  const [srch, setSrch] = useState("");
  const [catF, setCatF] = useState("All");
  const [stF, setStF] = useState("All");
  const [scanResult, setScanResult] = useState(null);
  const [scannerActive, setScannerActive] = useState(true);
  const [scanLog, setScanLog] = useState([]);
  const [manualScanOpen, setManualScanOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scanBuffer = useRef("");
  const scanTimer = useRef(null);

  // --- Auth bootstrap (session + user) ---
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session || null);
      setAuthUser(data.session?.user || null);
      setAuthReady(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
      setAuthUser(nextSession?.user || null);
      setAuthReady(true);

      // Best-effort login audit
      if (_event === "SIGNED_IN" && nextSession?.user?.id) {
        supabase.from("audit_logs").insert([{ action: "LOGIN", entity: "auth", entity_id: nextSession.user.id, payload: { email: nextSession.user.email } }]);
      }
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  const invRef = useRef(inv);
  const distsRef = useRef(dists);
  const podsRef = useRef(pods);
  useEffect(() => { invRef.current = inv; }, [inv]);
  useEffect(() => { distsRef.current = dists; }, [dists]);
  useEffect(() => { podsRef.current = pods; }, [pods]);

  const onDbLoad = useCallback((data) => {
    if (data.inventory?.length) setInv(data.inventory);
    if (data.distributions?.length) setDists(data.distributions);
    if (data.beneficiaries?.length) setBenes(data.beneficiaries);
    if (data.field_officers?.length) setOfficers(data.field_officers);
    if (data.fleet?.length) setFleet(data.fleet);
    if (data.pods?.length) setPods(data.pods);
    if (data.routes?.length) setRoutes(data.routes);
    if (data.warehouses?.length) setWarehouses(data.warehouses);
    if (data.users?.length) setUsers(data.users);
  }, []);
  const { dbReady, online, syncStatus, pendingCount, forceSync, saveRecord, deleteRecord } = useSyncDB({ onLoad: onDbLoad });

  const syncSet = useCallback((setter, store) => (updater) => {
    setter(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      next.forEach(r => saveRecord(store, r));
      return next;
    });
  }, [saveRecord]);
  const syncSetInv = useMemo(() => syncSet(setInv, "inventory"), [syncSet]);
  const syncSetDists = useMemo(() => syncSet(setDists, "distributions"), [syncSet]);
  const syncSetPods = useMemo(() => syncSet(setPods, "pods"), [syncSet]);
  const syncSetFleet = useMemo(() => syncSet(setFleet, "fleet"), [syncSet]);
  const syncSetUsers = useMemo(() => syncSet(setUsers, "users"), [syncSet]);

  const showToast = useCallback((msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); }, []);

  const roleId = profile?.role || "field_officer";
  const permissions = useMemo(() => new Set(ROLE_PERMISSIONS[roleId] || []), [roleId]);
  const hasPerm = useCallback((perm) => permissions.has("view_all") || permissions.has(perm), [permissions]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      showToast("Signed out", "success");
    } catch (e) {
      console.error(e);
      showToast("Sign out failed", "error");
    }
  }, [showToast]);

  // Ensure a profile row exists for the authenticated user (role defaults to field_officer)
  useEffect(() => {
    if (!authReady) return;
    if (!authUser) { setProfile(null); return; }

    (async () => {
      try {
        const res = await supabase
          .from("profiles")
          .select("user_id,email,role,full_name,created_at")
          .eq("user_id", authUser.id)
          .maybeSingle();
        if (res.error) throw res.error;

        if (!res.data) {
          const fullName = authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "User";
          const ins = await supabase.from("profiles").insert([{
            user_id: authUser.id,
            full_name: fullName,
            email: authUser.email,
            role: "field_officer",
          }]).select("*").single();
          if (ins.error) throw ins.error;
          setProfile(ins.data);
          showToast("Profile created (role: Field Officer)", "success");
        } else {
          setProfile(res.data);
        }
      } catch (e) {
        console.error("Profile load/create error:", e);
        const msg = (e && (e.message || e.details || e.hint)) ? (e.message || e.details || e.hint) : "Failed to load/create profile";
        showToast(`${msg} (check RLS)`, "error");
      }
    })();
  }, [authReady, authUser, showToast]);

  // Load core data from Supabase after sign-in (falls back to local seed if blocked)
  useEffect(() => {
    if (!session) return;

    (async () => {
      try {
        const [
          invRes, beneRes, distRes, distItemsRes, podRes, podItemsRes,
        ] = await Promise.all([
          supabase.from("inventory_items").select("*"),
          supabase.from("beneficiaries").select("*"),
          supabase.from("distributions").select("*"),
          supabase.from("distribution_items").select("*"),
          supabase.from("pods").select("*").order("created_at", { ascending: false }),
          supabase.from("pod_items").select("*"),
        ]);

        if (invRes.error) throw invRes.error;
        if (beneRes.error) throw beneRes.error;
        if (distRes.error) throw distRes.error;
        if (distItemsRes.error) throw distItemsRes.error;
        if (podRes.error) throw podRes.error;
        if (podItemsRes.error) throw podItemsRes.error;

        // Inventory mapping: normalize snake_case to existing UI fields
        const mappedInv = (invRes.data || []).map(x => ({
          ...x,
          qtyExpected: x.qty_expected ?? x.qtyExpected ?? 0,
          qtyDistributed: x.qty_distributed ?? x.qtyDistributed ?? 0,
          qtyReserved: x.qty_reserved ?? x.qtyReserved ?? 0,
          procCode: x.proc_code ?? x.procCode ?? "",
          procDate: x.proc_date ?? x.procDate ?? null,
          receivedDate: x.received_date ?? x.receivedDate ?? null,
        }));

        const mappedBenes = beneRes.data || [];

        // Distributions + line item mapping
        const distItemsByDist = new Map();
        (distItemsRes.data || []).forEach(di => distItemsByDist.set(di.distribution_id, di));

        const mappedDists = (distRes.data || []).map(d => {
          const di = distItemsByDist.get(d.id);
          return {
            ...d,
            beneId: d.bene_id,
            itemId: di?.inv_item_id ?? d.itemId ?? null,
            qty: di?.qty_ordered ?? d.qty ?? 0,
          };
        });

        // POD items map
        const podItemsByPod = new Map();
        (podItemsRes.data || []).forEach(pi => {
          const arr = podItemsByPod.get(pi.pod_id) || [];
          arr.push({
            invId: pi.inv_item_id,
            barcode: pi.barcode,
            name: pi.name,
            procCode: pi.proc_code,
            cat: pi.cat,
            unit: pi.unit,
            qtyOrdered: pi.qty_ordered,
            qty: pi.qty_received,
            itemCondition: pi.item_condition,
            damageNote: pi.damage_note,
          });
          podItemsByPod.set(pi.pod_id, arr);
        });

        const mappedPods = (podRes.data || []).map(p => ({
          ...p,
          beneId: p.bene_id,
          distRef: p.dist_ref,
          receivedBy: p.received_by,
          signedAt: p.signed_at,
          signatureDataUrl: p.signature_data_url,
          items: podItemsByPod.get(p.id) || [],
        }));

        setInv(mappedInv);
        setBenes(mappedBenes);
        setDists(mappedDists);
        setPods(mappedPods);

        showToast("Loaded data from Supabase", "success");
      } catch (e) {
        console.error(e);
        showToast("Supabase load blocked (check Auth/RLS). Using local data.", "error");
      }
    })();
  }, [session, showToast]);
const verifyPod = useCallback(async (podIdOrRef) => {
  const pod = podsRef.current.find(p => p.id === podIdOrRef || p.ref === podIdOrRef);
  if (!pod) return showToast("POD not found", "error");
    if (!hasPerm("update_pod")) return showToast("You don\'t have permission to verify POD", "error");
  if (pod.verified) return showToast("POD already verified", "error");

  // Local updates first (offline-first UX)
  syncSetPods(ps => ps.map(x => x.id === pod.id ? { ...x, verified: true, verifiedAt: new Date().toISOString() } : x));
  syncSetDists(ds => ds.map(d => d.ref === pod.distRef ? { ...d, status: "Delivered" } : d));
  syncSetInv(items => items.map(it => {
    const line = (pod.items || []).find(pi => String(pi.invId) === String(it.id) || (pi.barcode && pi.barcode === it.barcode));
    if (!line) return it;
    const qtyReceived = Number(line.qty || 0);
    return { ...it, qtyDistributed: Number(it.qtyDistributed || 0) + qtyReceived };
  }));

  // Supabase persistence (best-effort; RLS/auth may block)
  try {
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      return showToast("Verified locally (Supabase env not set)", "success");
    }

    const podUpd = await supabase
      .from("pods")
      .update({ verified: true, verified_at: new Date().toISOString(), verified_by: authUser?.id || null })
      .eq("ref", pod.ref);
    if (podUpd.error) throw podUpd.error;

    const distUpd = await supabase
      .from("distributions")
      .update({ status: "Delivered" })
      .eq("ref", pod.distRef);
    if (distUpd.error) throw distUpd.error;

    // Update inventory distributed (increment by received qty)
    for (const line of (pod.items || [])) {
      if (!line.barcode) continue;
      const invRow = await supabase
        .from("inventory_items")
        .select("id, qty_distributed")
        .eq("barcode", line.barcode)
        .single();
      if (invRow.error) continue;
      const newVal = Number(invRow.data.qty_distributed || 0) + Number(line.qty || 0);
      await supabase.from("inventory_items").update({ qty_distributed: newVal }).eq("id", invRow.data.id);
    }

    await supabase.from("audit_logs").insert([{
      action: "POD_VERIFIED",
      entity: "pods",
      entity_id: null,
      payload: { podRef: pod.ref, distRef: pod.distRef }
    }]);

    showToast("POD verified (Supabase updated)", "success");
  } catch (e) {
    console.error(e);
    showToast("Verified locally, but Supabase update failed (check auth/RLS)", "error");
  }
}, [syncSetPods, syncSetDists, syncSetInv, showToast]);
  const openPanel = useCallback((item, type) => { setPanel({ item, type }); setPanelTab("overview"); }, []);
  const closePanel = useCallback(() => setPanel(null), []);
  const openModal = useCallback((m, item = null) => { setModal(m); setEditItem(item); }, []);
  const closeModal = useCallback(() => { setModal(null); setEditItem(null); }, []);

  const handleScan = useCallback((code) => {
    if (!code || code.length < 3) return;
    const _inv = invRef.current, _dists = distsRef.current, _pods = podsRef.current;
    const invItem = _inv.find(i => i.barcode === code);
    if (invItem) { setScanResult({ type: "inventory", item: invItem, code }); setScanLog(l => [{ code, type: "inventory", label: invItem.name, time: new Date().toLocaleTimeString() }, ...l].slice(0, 50)); return; }
    const dist = _dists.find(d => d.ref === code);
    if (dist) { setScanResult({ type: "distribution", item: dist, code }); setScanLog(l => [{ code, type: "distribution", label: dist.ref, time: new Date().toLocaleTimeString() }, ...l].slice(0, 50)); return; }
    const pod = _pods.find(p => p.ref === code);
    if (pod) { setScanResult({ type: "pod", item: pod, code }); setScanLog(l => [{ code, type: "pod", label: pod.ref, time: new Date().toLocaleTimeString() }, ...l].slice(0, 50)); return; }
    setScanLog(l => [{ code, type: "unknown", label: "Not found", time: new Date().toLocaleTimeString() }, ...l].slice(0, 50));
    setScanResult({ type: "unknown", item: null, code });
  }, []);

  useEffect(() => {
    if (!scannerActive) return;
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "Enter") { const buf = scanBuffer.current.trim(); if (buf.length >= 3) handleScan(buf); scanBuffer.current = ""; clearTimeout(scanTimer.current); return; }
      if (e.key.length === 1) { scanBuffer.current += e.key; clearTimeout(scanTimer.current); scanTimer.current = setTimeout(() => { scanBuffer.current = ""; }, 80); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scannerActive, handleScan]);

  const stats = useMemo(() => {
    const lowStock = inv.filter(i => i.qty <= i.min), expiring = inv.filter(i => isExpSoon(i.expiry) && !isExpired(i.expiry)), expired = inv.filter(i => isExpired(i.expiry));
    return { activeDists: dists.filter(d => d.status === "In Transit" || d.status === "Assigned").length, onTimePct: Math.round((dists.filter(d => d.status === "Delivered").length / Math.max(dists.length, 1)) * 100), itemsAvail: inv.filter(i => i.qty > i.min).length, exceptions: lowStock.length + expiring.length + expired.length, totalValue: inv.reduce((a, i) => a + i.qty * i.cost, 0), totalRevenue: dists.reduce((a, d) => a + d.rate, 0), lowStock, expiring, expired };
  }, [inv, dists]);

  const NAV_GROUPS = [
    { id: "overview", label: null, items: [{ id: "dashboard", icon: LayoutDashboard, label: "Dashboard" }] },
    { id: "operations", label: "Operations", items: [{ id: "orders", icon: ClipboardList, label: "Orders / Loads" }, { id: "dispatch", icon: LayoutGrid, label: "Dispatch Board" }, { id: "routes", icon: MapPin, label: "Routes & Tracking" }] },
    { id: "assets", label: "Assets", items: [{ id: "fleet", icon: Truck, label: "Fleet" }, { id: "officers", icon: Users, label: "Field Officers" }, { id: "warehouses", icon: WarehouseIcon, label: "Warehouses / Hubs" }] },
    { id: "inputs", label: "Inputs & People", items: [{ id: "inventory", icon: Package, label: "Inventory" }, { id: "beneficiaries", icon: UsersRound, label: "Beneficiaries" }] },
    { id: "records", label: "Records", items: [{ id: "pod", icon: FileCheck, label: "Proof of Delivery" }, { id: "reports", icon: BarChart3, label: "Reports" }] },
    { id: "system", label: "System", items: [
      { id: "scanner", icon: ScanBarcode, label: "Barcode Scanner" },
      ...(hasPerm("manage_users") ? [{ id: "users_admin", icon: Users, label: "Users" }] : []),
      ...(hasPerm("view_audit") || hasPerm("manage_users") ? [{ id: "audit", icon: Activity, label: "Audit" }] : []),
      { id: "settings", icon: Settings, label: "Settings" },
    ] },
  ];
  const activeGroupId = NAV_GROUPS.find(g => g.items.some(i => i.id === page))?.id;
  const [openGroups, setOpenGroups] = useState(() => { const init = {}; NAV_GROUPS.forEach(g => { init[g.id] = g.id === "overview" || g.id === activeGroupId; }); return init; });
  const toggleGroup = id => setOpenGroups(p => ({ ...p, [id]: !p[id] }));

  const ctx = {
    inv, setInv, benes, setBenes, dists, setDists, fleet, setFleet, officers, setOfficers,
    routes, setRoutes, warehouses, setWarehouses, pods, setPods, users, setUsers,
    syncSetInv, syncSetDists, syncSetPods, syncSetFleet, syncSetUsers,
    showToast, openPanel, closePanel, openModal, closeModal, handleScan, verifyPod,
    panel, setPanel, modal, editItem, panelTab, setPanelTab, setPage,
    scanResult, setScanResult, scannerActive, setScannerActive, scanLog, setScanLog,
    manualScanOpen, setManualScanOpen, stats, saveRecord, deleteRecord,
    srch, setSrch, catF, setCatF, stF, setStF,
    hasPerm,
  };

  const FleetForm = ({ item, onSave, onClose }) => {
    const [f, setF] = useState(item || { plate: "", model: "", type: "Pickup", status: "Available", driver: "", loc: "", health: 100, mileage: "", year: new Date().getFullYear(), lastInsp: "", nextInsp: "", inspResult: "Passed" });
    const up = (k, v) => setF(p => ({ ...p, [k]: v }));
    return (
      <Overlay onClose={onClose} title={item ? "Edit Vehicle" : "Add New Vehicle"}>
        <FGrid>
          <FG label="Plate / Vehicle ID *"><FIn value={f.plate} onChange={v => up("plate", v)} placeholder="e.g. TRK-006" /></FG>
          <FG label="Model *"><FIn value={f.model} onChange={v => up("model", v)} placeholder="e.g. Toyota Hilux" /></FG>
          <FG label="Type"><FSel value={f.type} onChange={v => up("type", v)} opts={["Pickup", "Light Truck", "Medium Truck", "Van", "SUV", "Other"]} /></FG>
          <FG label="Year"><FIn type="number" value={f.year} onChange={v => up("year", +v)} /></FG>
          <FG label="Status"><FSel value={f.status} onChange={v => up("status", v)} opts={["Available", "In Use", "Maintenance"]} /></FG>
          <FG label="Health (%)"><FIn type="number" min="0" max="100" value={f.health} onChange={v => up("health", Math.min(100, Math.max(0, +v)))} /></FG>
          <FG label="Assigned Officer"><FSel value={f.driver || ""} onChange={v => up("driver", v === "—" ? "" : v)} opts={["—", ...officers.map(o => o.name)]} /></FG>
          <FG label="Current Location"><FIn value={f.loc} onChange={v => up("loc", v)} placeholder="e.g. Freetown Terminal" /></FG>
          <FG label="Mileage"><FIn value={f.mileage} onChange={v => up("mileage", v)} placeholder="e.g. 45,000 km" /></FG>
          <FG label="Last Inspection"><FIn value={f.lastInsp} onChange={v => up("lastInsp", v)} placeholder="e.g. Jan 2025" /></FG>
          <FG label="Next Inspection"><FIn value={f.nextInsp} onChange={v => up("nextInsp", v)} placeholder="e.g. Jul 2025" /></FG>
          <FG label="Inspection Result"><FSel value={f.inspResult} onChange={v => up("inspResult", v)} opts={["Passed", "Advisory", "Failed"]} /></FG>
        </FGrid>
        <ModalFooter>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={() => { if (!f.plate || !f.model) return showToast("Plate and model required", "error"); onSave(f); onClose(); }}>{item ? "Update Vehicle" : "Add Vehicle"}</Btn>
        </ModalFooter>
      </Overlay>
    );
  };

  const DistForm = ({ onSave, onClose }) => {
    const [f, setF] = useState({ date: new Date().toISOString().split("T")[0], beneId: benes[0]?.id, itemId: inv[0]?.id, qty: "", season: SEASONS[0], officer: "", truck: "", status: "Unassigned", priority: "Medium", notes: "", rate: "" });
    const up = (k, v) => setF(p => ({ ...p, [k]: v }));
    const sel = inv.find(i => i.id === +f.itemId);
    return (
      <Overlay onClose={onClose} title="Create New Distribution">
        <FGrid>
          <FG label="Date *"><FIn type="date" value={f.date} onChange={v => up("date", v)} /></FG>
          <FG label="Season"><FSel value={f.season} onChange={v => up("season", v)} opts={SEASONS} /></FG>
          <FG label="Beneficiary *" full><FSel value={f.beneId} onChange={v => up("beneId", +v)} opts={benes.map(b => ({ v: b.id, l: `${b.name} — ${b.group}` }))} /></FG>
          <FG label="Input Item *" full><FSel value={f.itemId} onChange={v => up("itemId", +v)} opts={inv.map(i => ({ v: i.id, l: `${i.name} (Avail: ${i.qty - (i.qtyDistributed || 0) - (i.qtyReserved || 0)} ${i.unit})` }))} /></FG>
          <FG label="Quantity *"><FIn type="number" value={f.qty} onChange={v => up("qty", v)} placeholder="0" />{sel && <small style={{color:"#16a34a",marginTop:4,display:"block",fontSize:12}}>Available: {sel.qty - (sel.qtyDistributed || 0) - (sel.qtyReserved || 0)} {sel.unit}</small>}</FG>
          <FG label="Priority"><FSel value={f.priority} onChange={v => up("priority", v)} opts={["High", "Medium", "Low"]} /></FG>
          <FG label="Field Officer"><FSel value={f.officer} onChange={v => up("officer", v === "—" ? "" : v)} opts={["—", ...officers.map(o => o.name)]} /></FG>
          <FG label="Vehicle"><FSel value={f.truck} onChange={v => up("truck", v === "—" ? "" : v)} opts={["—", ...fleet.map(t => t.plate)]} /></FG>
          <FG label="Rate ($)"><FIn type="number" value={f.rate} onChange={v => up("rate", v)} placeholder="0" /></FG>
          <FG label="Status"><FSel value={f.status} onChange={v => up("status", v)} opts={STATUSES} /></FG>
          <FG label="Notes" full><textarea value={f.notes} onChange={e => setF(p => ({ ...p, notes: e.target.value }))} style={{...S.fi,resize:"vertical",minHeight:60}} /></FG>
        </FGrid>
        <ModalFooter>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={() => {
            if (!f.qty || !f.beneId) return showToast("Fill required fields", "error");
            if (sel && +f.qty > (sel.qty - (sel.qtyDistributed || 0) - (sel.qtyReserved || 0))) return showToast("Insufficient available stock!", "error");
            const nid = Math.max(...dists.map(d => d.id), 0) + 1;
            const lastRef = dists.reduce((mx, d) => { const n = parseInt(d.ref.split("-")[2] || "0"); return n > mx ? n : mx; }, 1854);
            onSave({ ...f, id: nid, ref: `AG-${new Date().getFullYear()}-${String(lastRef + 1).padStart(6, "0")}`, qty: +f.qty, rate: +f.rate || 0 });
            onClose();
          }}>Create Distribution</Btn>
        </ModalFooter>
      </Overlay>
    );
  };

  const InvForm = ({ item, onSave, onClose }) => {
    const [f, setF] = useState(item || { name: "", cat: "Seeds", unit: "Kg", qty: "", qtyExpected: "", qtyDistributed: 0, qtyReserved: 0, min: "", supplier: "", cost: "", loc: "", expiry: "", procCode: "", procDate: "", receivedDate: "" });
    const up = (k, v) => setF(p => ({ ...p, [k]: v }));
    const variance = f.qty !== "" && f.qtyExpected !== "" ? +f.qty - +f.qtyExpected : null;
    const qtyAvail = f.qty !== "" ? (+f.qty) - (+f.qtyDistributed || 0) - (+f.qtyReserved || 0) : null;
    return (
      <Overlay onClose={onClose} title={item ? "Edit Item" : "Add Inventory Item"} width="min(720px,96vw)">
        <div style={{padding:"12px 24px 0",borderBottom:"1px solid #f1f5f9"}}><div style={{fontSize:12,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.5,marginBottom:10}}>Procurement Details</div></div>
        <FGrid>
          <FG label="Procurement Code *"><FIn value={f.procCode} onChange={v => up("procCode", v)} placeholder="e.g. PC-2025-001" /></FG>
          <FG label="Supplier *"><FIn value={f.supplier} onChange={v => up("supplier", v)} /></FG>
          <FG label="Procurement Date"><FIn type="date" value={f.procDate || ""} onChange={v => up("procDate", v)} /></FG>
          <FG label="Date Received"><FIn type="date" value={f.receivedDate || ""} onChange={v => up("receivedDate", v)} /></FG>
        </FGrid>
        <div style={{padding:"12px 24px 0",borderBottom:"1px solid #f1f5f9",borderTop:"1px solid #f1f5f9"}}><div style={{fontSize:12,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.5,marginBottom:10}}>Item Details</div></div>
        <FGrid>
          <FG label="Item Name *" full><FIn value={f.name} onChange={v => up("name", v)} placeholder="e.g. Maize Seeds (OPV)" /></FG>
          <FG label="Category"><FSel value={f.cat} onChange={v => up("cat", v)} opts={CATEGORIES} /></FG>
          <FG label="Unit"><FIn value={f.unit} onChange={v => up("unit", v)} placeholder="Kg / Units / Litres" /></FG>
          <FG label="Qty Expected"><FIn type="number" value={f.qtyExpected} onChange={v => up("qtyExpected", v)} placeholder="0" /></FG>
          <FG label="Qty Received *">
            <FIn type="number" value={f.qty} onChange={v => up("qty", v)} />
            {variance !== null && <small style={{marginTop:4,display:"block",fontWeight:600,fontSize:12,color:variance<0?"#dc2626":variance>0?"#d97706":"#16a34a"}}>{variance < 0 ? `${Math.abs(variance)} units short` : variance > 0 ? `${variance} surplus` : "Exact match"}</small>}
          </FG>
          <FG label="Minimum Level"><FIn type="number" value={f.min} onChange={v => up("min", v)} /></FG>
          <FG label="Unit Cost ($)"><FIn type="number" step="0.01" value={f.cost} onChange={v => up("cost", v)} /></FG>
          <FG label="Storage Location"><FIn value={f.loc} onChange={v => up("loc", v)} placeholder="Warehouse A" /></FG>
          <FG label="Expiry Date"><FIn type="date" value={f.expiry || ""} onChange={v => up("expiry", v)} /></FG>
        </FGrid>
        {item && (
          <>
            <div style={{padding:"12px 24px 0",borderTop:"1px solid #f1f5f9",borderBottom:"1px solid #f1f5f9"}}><div style={{fontSize:12,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.5,marginBottom:10}}>Distribution Activity</div></div>
            <div style={{padding:"12px 24px"}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:4}}>
                {[["Received", f.qty || 0, "#0f172a"], ["Distributed", f.qtyDistributed || 0, "#2563eb"], ["Reserved", f.qtyReserved || 0, "#d97706"], ["Available", qtyAvail !== null ? qtyAvail : "—", qtyAvail !== null && qtyAvail <= (+f.min || 0) ? "#dc2626" : "#16a34a"]].map(([l, v, c]) => (
                  <div key={l} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,padding:10,textAlign:"center"}}>
                    <div style={{fontSize:20,fontWeight:800,color:c}}>{v}</div>
                    <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        <ModalFooter>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={() => { if (!f.name || !f.qty) return showToast("Name and quantity required", "error"); if (!f.procCode) return showToast("Procurement code required", "error"); onSave({ ...f, qty: +f.qty, qtyExpected: +f.qtyExpected || 0, qtyDistributed: +f.qtyDistributed || 0, qtyReserved: +f.qtyReserved || 0, min: +f.min || 0, cost: +f.cost || 0 }); onClose(); }}>{item ? "Update Item" : "Add Item"}</Btn>
        </ModalFooter>
      </Overlay>
    );
  };

  const UserForm = ({ item, onSave, onClose }) => {
    const [f, setF] = useState(item || { name: "", email: "", role: "officer", status: "Active", phone: "", location: "Freetown", joined: new Date().getFullYear() + " " + ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][new Date().getMonth()] });
    const up = (k, v) => setF(p => ({ ...p, [k]: v }));
    const role = USER_ROLES.find(r => r.id === f.role);
    return (
      <Overlay onClose={onClose} title={item ? "Edit User" : "Add New User"}>
        <FGrid>
          <FG label="Full Name *" full><FIn value={f.name} onChange={v => up("name", v)} placeholder="e.g. James Musa" /></FG>
          <FG label="Email *"><FIn type="email" value={f.email} onChange={v => up("email", v)} placeholder="name@agroflow.sl" /></FG>
          <FG label="Phone"><FIn value={f.phone} onChange={v => up("phone", v)} placeholder="076 000 000" /></FG>
          <FG label="Role *" full>
            <FSel value={f.role} onChange={v => up("role", v)} opts={USER_ROLES.map(r => ({ v: r.id, l: r.label }))} />
            {role && <small style={{marginTop:4,display:"block",fontWeight:600,fontSize:12,color:role.color}}>{role.desc}</small>}
          </FG>
          <FG label="Status"><FSel value={f.status} onChange={v => up("status", v)} opts={["Active", "Inactive", "Suspended"]} /></FG>
          <FG label="Base Location"><FSel value={f.location} onChange={v => up("location", v)} opts={["Freetown", "Bo", "Makeni", "Kenema", "Koidu", "Port Loko", "Other"]} /></FG>
        </FGrid>
        {role && (
          <div style={{margin:"0 24px 16px",borderRadius:12,padding:14,background:role.bg}}>
            <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",marginBottom:8,color:role.color}}>Permissions for {role.label}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {(ROLE_PERMISSIONS[f.role] || []).map(p => (
                <span key={p} style={{background:"rgba(255,255,255,.7)",padding:"2px 8px",borderRadius:4,fontSize:12,fontWeight:600,border:`1px solid ${role.color}40`,color:role.color}}>{p.replace(/_/g, " ")}</span>
              ))}
            </div>
          </div>
        )}
        <ModalFooter>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={() => { if (!f.name || !f.email) return showToast("Name and email required", "error"); const av = f.name.split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase(); onSave({ ...f, avatar: av, lastLogin: item ? f.lastLogin : "Never", joined: f.joined || "2025" }); onClose(); }}>{item ? "Update User" : "Add User"}</Btn>
        </ModalFooter>
      </Overlay>
    );
  };

  const OfficerForm = ({ item, onSave, onClose }) => {
    const [f, setF] = useState(item || { name: "", id_no: "", lic: "Class B", exp: "", status: "Available", hosRisk: "Low", rating: 4.5, lastRun: "", location: "" });
    const up = (k, v) => setF(p => ({ ...p, [k]: v }));
    return (
      <Overlay onClose={onClose} title={item ? "Edit Officer" : "Add Field Officer"}>
        <FGrid>
          <FG label="Full Name *" full><FIn value={f.name} onChange={v => up("name", v)} /></FG>
          <FG label="ID Number"><FIn value={f.id_no} onChange={v => up("id_no", v)} placeholder="FO-006" /></FG>
          <FG label="Licence Class"><FSel value={f.lic} onChange={v => up("lic", v)} opts={["Class A", "Class B", "Class C"]} /></FG>
          <FG label="Experience"><FIn value={f.exp} onChange={v => up("exp", v)} placeholder="e.g. 3 yrs" /></FG>
          <FG label="Status"><FSel value={f.status} onChange={v => up("status", v)} opts={["Available", "On Trip", "Off Duty"]} /></FG>
          <FG label="HOS Risk"><FSel value={f.hosRisk} onChange={v => up("hosRisk", v)} opts={["Low", "Medium", "High"]} /></FG>
          <FG label="Base Location" full><FIn value={f.location} onChange={v => up("location", v)} placeholder="e.g. Freetown Hub" /></FG>
        </FGrid>
        <ModalFooter>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={() => { if (!f.name) return showToast("Name required", "error"); onSave({ ...f, avatar: f.name.split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase(), rating: f.rating || 4.5 }); onClose(); }}>{item ? "Update Officer" : "Add Officer"}</Btn>
        </ModalFooter>
      </Overlay>
    );
  };

  const ManualScanInput = () => {
    const [val, setVal] = useState("");
    const ref = useRef();
    useEffect(() => { setTimeout(() => ref.current?.focus(), 50); }, []);
    const submit = () => { if (val.trim()) { handleScan(val.trim()); setVal(""); setManualScanOpen(false); } };
    return (
      <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:80,zIndex:400,backdropFilter:"blur(4px)"}}>
        <div style={{background:"#fff",borderRadius:16,padding:28,boxShadow:"0 24px 48px rgba(0,0,0,.2)",width:"min(440px,95vw)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div>
              <div style={{fontWeight:800,fontSize:18,color:"#0f172a"}}>Barcode Scanner</div>
              <div style={{fontSize:12,color:"#94a3b8",marginTop:4}}>Scan or type barcode manually</div>
            </div>
            <button onClick={() => setManualScanOpen(false)} style={{fontSize:20,color:"#94a3b8",background:"none",border:"none",cursor:"pointer"}}>✕</button>
          </div>
          <div style={{background:"#0f172a",borderRadius:12,padding:20,marginBottom:16,position:"relative",overflow:"hidden",textAlign:"center"}}>
            <div style={{position:"absolute",left:0,right:0,height:2,background:"#16a34a",boxShadow:"0 0 8px #16a34a",animation:"scanline 1.8s ease-in-out infinite",top:"40%"}} />
            <div style={{fontSize:24,color:"rgba(255,255,255,.3)",marginBottom:6,letterSpacing:4,fontFamily:"monospace"}}>▮▯▮▮▯▮▯▯▮▯▮▮▯▮</div>
            <div style={{color:"rgba(255,255,255,.4)",fontSize:12}}>Point scanner at barcode or type below</div>
          </div>
          <div style={{display:"flex",gap:10,marginBottom:14}}>
            <input ref={ref} value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} placeholder="INV-00001 · AG-2025-001847" style={{flex:1,padding:"10px 12px",border:"1px solid #e2e8f0",borderRadius:8,fontFamily:"monospace",fontSize:14,letterSpacing:1,outline:"none"}} />
            <Btn onClick={submit}>Scan</Btn>
          </div>
          <div style={{fontSize:12,color:"#94a3b8",fontWeight:600,marginBottom:8}}>QUICK TEST:</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["INV-00001", "INV-00003", "AG-2025-001847", "AG-2025-001851", "POD-2025-001", "POD-2025-004"].map(c => (
              <button key={c} onClick={() => { handleScan(c); setManualScanOpen(false); }} style={{padding:"4px 10px",background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:6,fontSize:12,fontFamily:"monospace",cursor:"pointer",color:"#374151"}}>{c}</button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const ScanResultModal = () => {
    if (!scanResult) return null;
    const { type, item, code } = scanResult;
    const [adjQty, setAdjQty] = useState(1);
    const [adjMode, setAdjMode] = useState("receive");
    const close = () => setScanResult(null);
    const isInv = type === "inventory", isDist = type === "distribution", isPod = type === "pod";
    const distItem = isDist ? inv.find(x => x.id === item?.itemId) : null;
    const distBene = isDist ? benes.find(x => x.id === item?.beneId) : null;
    return (
      <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:400,backdropFilter:"blur(4px)"}}>
        <div style={{background:"#fff",borderRadius:16,boxShadow:"0 24px 48px rgba(0,0,0,.2)",overflow:"auto",width:"min(480px,96vw)",maxHeight:"92vh"}}>
          <div style={{padding:"16px 24px",borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:40,height:40,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,background:isInv?"#f0fdf4":isDist?"#eff6ff":isPod?"#fef9c3":"#fee2e2"}}>
                {isInv?"📦":isDist?"🚜":isPod?"📄":"❓"}
              </div>
              <div>
                <div style={{fontWeight:800,fontSize:14,color:"#0f172a"}}>{isInv ? "Inventory Item" : isDist ? "Distribution" : isPod ? "Proof of Delivery" : "Unknown Barcode"}</div>
                <div style={{fontSize:12,color:"#94a3b8",fontFamily:"monospace",marginTop:2}}>{code}</div>
              </div>
            </div>
            <button onClick={close} style={{fontSize:20,color:"#94a3b8",background:"none",border:"none",cursor:"pointer"}}>✕</button>
          </div>
          <div style={{padding:24}}>
            {isInv && (
              <div>
                <div style={{background:"#f8fafc",borderRadius:12,padding:16,marginBottom:16}}>
                  <div style={{fontWeight:700,fontSize:16,color:"#0f172a",marginBottom:4}}>{item.name}</div>
                  <div style={{fontSize:12,color:"#64748b",marginBottom:12}}>{item.cat} · {item.supplier} · {item.loc}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>
                    {[["In Stock", item.qty, item.qty <= item.min ? "#dc2626" : "#16a34a"], ["Min Level", item.min, "#374151"], ["Unit Cost", `$${item.cost}`, "#374151"]].map(([l, v, c]) => (
                      <div key={l} style={{textAlign:"center",background:"#fff",borderRadius:8,padding:10}}><div style={{fontSize:20,fontWeight:800,color:c}}>{v}</div><div style={{fontSize:12,color:"#94a3b8"}}>{l}</div></div>
                    ))}
                  </div>
                  <div style={{display:"flex",justifyContent:"center"}}><BarcodeDisplay code={code} width={200} height={40} showText /></div>
                </div>
                <div style={{background:"#f8fafc",borderRadius:8,padding:14,marginBottom:16}}>
                  <div style={{display:"flex",gap:8,marginBottom:12}}>
                    {["receive", "issue"].map(m => (
                      <button key={m} onClick={() => setAdjMode(m)} style={{flex:1,padding:"8px 12px",borderRadius:8,cursor:"pointer",fontSize:14,fontWeight:700,border:adjMode===m?"none":"1px solid #e2e8f0",background:adjMode===m?(m==="receive"?"#16a34a":"#d97706"):"#fff",color:adjMode===m?"#fff":"#374151"}}>
                        {m === "receive" ? "📥 Receive" : "📤 Issue"}
                      </button>
                    ))}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <Btn variant="outline" onClick={() => setAdjQty(q => Math.max(1, q - 1))}>−</Btn>
                    <input type="number" value={adjQty} min={1} onChange={e => setAdjQty(Math.max(1, +e.target.value))} style={{textAlign:"center",fontSize:20,fontWeight:800,width:80,padding:"6px 8px",border:"1px solid #e2e8f0",borderRadius:8,outline:"none"}} />
                    <Btn variant="outline" onClick={() => setAdjQty(q => q + 1)}>+</Btn>
                    <span style={{fontSize:14,color:"#64748b"}}>{item.unit}</span>
                  </div>
                </div>
                <div style={{display:"flex",gap:10}}>
                  <Btn style={{flex:1,textAlign:"center"}} onClick={() => { const delta = adjMode === "receive" ? adjQty : -adjQty; syncSetInv(v => v.map(x => x.id === item.id ? { ...x, qty: Math.max(0, x.qty + delta) } : x)); showToast(`${adjMode === "receive" ? "Added" : "Issued"} ${adjQty} ${item.unit}`); close(); }}>
                    {adjMode === "receive" ? "✓ Confirm Receive" : "✓ Confirm Issue"}
                  </Btn>
                  <Btn variant="outline" onClick={() => { setPage("inventory"); close(); }}>View Record</Btn>
                </div>
              </div>
            )}
            {isDist && (
              <div>
                <div style={{background:"#f8fafc",borderRadius:12,padding:16,marginBottom:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div style={{fontWeight:700,fontSize:14,color:"#0f172a"}}>{item.ref}</div><StatusPill s={item.status} /></div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                    {[["Beneficiary", distBene?.name || "—"], ["Group", distBene?.group || "—"], ["Item", distItem?.name || "—"], ["Quantity", `${item.qty} ${distItem?.unit || ""}`], ["Officer", item.officer || "Unassigned"], ["Vehicle", item.truck || "—"]].map(([l, v]) => (
                      <div key={l} style={{background:"#fff",borderRadius:8,padding:8}}><div style={{fontSize:10,color:"#94a3b8"}}>{l}</div><div style={{fontSize:14,fontWeight:600,color:"#0f172a",marginTop:2}}>{v}</div></div>
                    ))}
                  </div>
                  <div style={{display:"flex",justifyContent:"center"}}><BarcodeDisplay code={item.ref} width={220} height={38} /></div>
                </div>
                <div style={{display:"flex",gap:10}}>
                  {item.status !== "Delivered" && <Btn style={{flex:1}} onClick={() => { syncSetDists(ds => ds.map(d => d.id === item.id ? { ...d, status: "Delivered" } : d)); showToast("Marked as Delivered"); close(); }}>✓ Mark Delivered</Btn>}
                  <Btn variant="outline" style={{flex:1}} onClick={() => { openPanel(item, "dist"); close(); }}>View Details</Btn>
                </div>
              </div>
            )}
            {isPod && (
              <div>
                <div style={{borderRadius:12,padding:14,marginBottom:16,display:"flex",gap:10,alignItems:"center",background:item.verified?"#f0fdf4":"#fef9c3"}}>
                  <span style={{fontSize:20}}>{item.verified?"✅":"⏳"}</span>
                  <div>
                    <div style={{fontWeight:700,color:item.verified?"#15803d":"#854d0e"}}>{item.verified ? "Verified" : "Pending Verification"}</div>
                    <div style={{fontSize:12,color:"#64748b",marginTop:2}}>Signed at: {item.signedAt}</div>
                  </div>
                </div>
                <Pill l="Reference" v={item.ref} /><Pill l="Distribution" v={item.distRef} /><Pill l="Received By" v={item.receivedBy} /><Pill l="Condition" v={item.condition} />
                <div style={{display:"flex",justifyContent:"center",marginTop:16}}><BarcodeDisplay code={item.ref} width={200} height={40} showText /></div>
                <div style={{display:"flex",gap:10,marginTop:16}}>
                  {!item.verified && <Btn style={{flex:1}} onClick={() => { syncSetPods(ps => ps.map(x => x.id === item.id ? { ...x, verified: true } : x)); showToast("POD verified!"); close(); }}>✅ Verify POD</Btn>}
                  <Btn variant="outline" style={{flex:1}} onClick={close}>Close</Btn>
                </div>
              </div>
            )}
            {type === "unknown" && (
              <div style={{textAlign:"center",padding:"32px 0"}}>
                <div style={{fontSize:48,color:"#cbd5e1",marginBottom:12}}>❓</div>
                <div style={{fontWeight:700,color:"#374151",marginBottom:4}}>Barcode Not Found</div>
                <div style={{fontSize:14,color:"#94a3b8"}}>"{code}" doesn't match any record.</div>
                <Btn variant="outline" style={{marginTop:16}} onClick={close}>Close</Btn>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const SidePanel = () => {
    if (!panel) return null;
    const { item, type } = panel;
    const it = type === "dist" ? inv.find(x => x.id === item?.itemId) : null;
    const b = type === "dist" ? benes.find(x => x.id === item?.beneId) : null;
    const tabs = type === "dist" ? ["overview","stops","notes","billing"] : ["overview","history"];
    return (
      <div style={{position:"fixed",top:0,right:0,bottom:0,width:375,background:"#fff",boxShadow:"-4px 0 28px rgba(0,0,0,.13)",zIndex:200,display:"flex",flexDirection:"column",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 20px",borderBottom:"1px solid #f1f5f9"}}>
          <span style={{fontWeight:700,fontSize:15,color:"#0f172a"}}>{type==="dist"?item.ref:type==="fleet"?item.plate:item.name}</span>
          <button onClick={closePanel} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#94a3b8"}}>✕</button>
        </div>
        <div style={{display:"flex",borderBottom:"1px solid #f1f5f9"}}>
          {tabs.map(t => (
            <button key={t} onClick={() => setPanelTab(t)} style={{flex:1,padding:"10px 4px",border:"none",borderBottom:`2px solid ${panelTab===t?"#16a34a":"transparent"}`,background:"none",fontSize:12,color:panelTab===t?"#16a34a":"#64748b",fontWeight:panelTab===t?700:400,cursor:"pointer",textTransform:"capitalize"}}>{t}</button>
          ))}
        </div>
        <div style={{padding:20,flex:1}}>
          {type==="dist"&&panelTab==="overview"&&(
            <div>
              <div style={{display:"flex",gap:8,marginBottom:14}}><StatusPill s={item.status}/><PriorityTag p={item.priority}/></div>
              <Pill l="Date" v={fmtDate(item.date)}/><Pill l="Season" v={item.season}/><Pill l="Item" v={it?.name||"—"}/><Pill l="Quantity" v={`${item.qty} ${it?.unit||""}`}/><Pill l="Rate" v={`$${item.rate}`}/><Pill l="Officer" v={item.officer||"Unassigned"}/><Pill l="Vehicle" v={item.truck||"—"}/>
              <div style={{marginTop:14,background:"#f8fafc",borderRadius:10,padding:14,display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                <div style={{fontSize:11,color:"#94a3b8",fontWeight:600}}>DISTRIBUTION BARCODE</div>
                <BarcodeDisplay code={item.ref} width={240} height={44} showText/>
                <button onClick={() => handleScan(item.ref)} style={{...S.btnO,fontSize:12,borderColor:"#86efac",color:"#15803d",padding:"6px 14px"}}>📷 Simulate Scan</button>
              </div>
              {b&&(
                <div style={{marginTop:14}}>
                  <div style={{fontSize:12,color:"#94a3b8",fontWeight:600,marginBottom:8}}>BENEFICIARY</div>
                  <div style={{display:"flex",gap:10,alignItems:"center",background:"#f8fafc",borderRadius:10,padding:12}}>
                    <Avatar label={b.avatar} idx={0} size={40}/>
                    <div><div style={{fontWeight:700,fontSize:14}}>{b.name}</div><div style={{fontSize:12,color:"#94a3b8"}}>{b.group}</div><div style={{fontSize:12,color:"#94a3b8"}}>📍 {b.village} · 📱 {b.phone}</div></div>
                  </div>
                </div>
              )}
              <div style={{display:"flex",gap:8,marginTop:18}}>
                {item.status!=="Delivered"&&<Btn style={{flex:1,fontSize:12}} onClick={() => { syncSetDists(ds => ds.map(d => d.id === item.id ? { ...d, status: "Delivered" } : d)); setPanel(p => ({ ...p, item: { ...p.item, status: "Delivered" } })); showToast("Marked as Delivered"); }}>✓ Mark Delivered</Btn>}
                {item.status==="Delivered"&&<div style={{flex:1,textAlign:"center",background:"#f0fdf4",borderRadius:8,padding:10,fontSize:12,color:"#15803d",fontWeight:700}}>✅ Already Delivered</div>}
                <Btn variant="danger" style={{flex:1,fontSize:12}} onClick={() => { deleteRecord("distributions", item.id); setDists(ds => ds.filter(d => d.id !== item.id)); closePanel(); showToast("Load deleted"); }}>🗑 Delete</Btn>
              </div>
            </div>
          )}
          {type==="dist"&&panelTab==="stops"&&(<div><p style={{color:"#94a3b8",fontSize:13}}>No stop data for this distribution.</p></div>)}
          {type==="dist"&&panelTab==="notes"&&(<div><div style={{background:"#f8fafc",borderRadius:8,padding:14,fontSize:13,lineHeight:1.7,color:"#374151"}}>{item.notes||"No notes added."}</div></div>)}
          {type==="dist"&&panelTab==="billing"&&(<div><Pill l="Rate per Unit" v={`$${item.rate}`}/><Pill l="Quantity" v={`${item.qty} ${it?.unit||""}`}/><Pill l="Total Value" v={`$${(item.rate*item.qty).toFixed(2)}`}/></div>)}
          {type==="fleet"&&panelTab==="overview"&&(
            <div>
              <div style={{background:"#f0fdf4",borderRadius:12,padding:20,textAlign:"center",marginBottom:16,fontSize:56}}>🚛</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                {[{l:"Vehicle ID",v:item.plate},{l:"Model",v:item.model},{l:"Year",v:item.year},{l:"Mileage",v:item.mileage}].map(x => (
                  <div key={x.l} style={{background:"#f8fafc",padding:10,borderRadius:8}}><div style={{fontSize:11,color:"#94a3b8"}}>{x.l}</div><div style={{fontWeight:700,fontSize:13}}>{x.v}</div></div>
                ))}
              </div>
              <StatusPill s={item.status}/>
              {item.driver&&<div style={{marginTop:14,background:"#f8fafc",borderRadius:10,padding:12,display:"flex",gap:10,alignItems:"center"}}><Avatar label={item.driver.split(" ").map(x=>x[0]).join("")} idx={0} size={36}/><div><div style={{fontWeight:700}}>{item.driver}</div><div style={{fontSize:12,color:"#16a34a"}}>Assigned</div><div style={{fontSize:11,color:"#94a3b8"}}>📍 {item.loc}</div></div></div>}
              <div style={{marginTop:14}}>
                <div style={{fontSize:12,color:"#94a3b8",marginBottom:6}}>HEALTH SCORE</div>
                <div style={{height:10,background:"#f1f5f9",borderRadius:5,overflow:"hidden"}}><div style={{height:"100%",width:`${item.health}%`,background:healthClr(item.health),borderRadius:5}}/></div>
                <div style={{fontSize:13,fontWeight:700,color:healthClr(item.health),marginTop:4}}>{item.health}%</div>
              </div>
              <div style={{marginTop:14}}>
                <Pill l="Last Inspection" v={item.lastInsp}/><Pill l="Next Due" v={item.nextInsp}/>
                <div style={{marginTop:8}}><span style={{background:item.inspResult==="Passed"?"#dcfce7":item.inspResult==="Advisory"?"#fef9c3":"#fee2e2",color:item.inspResult==="Passed"?"#15803d":item.inspResult==="Advisory"?"#854d0e":"#b91c1c",padding:"3px 12px",borderRadius:20,fontSize:12,fontWeight:700}}>{item.inspResult}</span></div>
              </div>
              <div style={{display:"flex",gap:8,marginTop:18}}>
                <Btn style={{flex:1,fontSize:12}} onClick={() => openModal("editFleet", item)}>✏️ Edit Vehicle</Btn>
              </div>
            </div>
          )}
          {type==="fleet"&&panelTab==="history"&&(<div><p style={{color:"#94a3b8",fontSize:13}}>Trip history for {item.plate}.</p></div>)}
          {type==="officer"&&panelTab==="overview"&&(
            <div>
              <div style={{background:"#f0fdf4",borderRadius:12,padding:24,textAlign:"center",marginBottom:16}}>
                <Avatar label={item.avatar} idx={0} size={64}/>
                <div style={{fontWeight:800,fontSize:16,color:"#0f172a",marginTop:10}}>{item.name}</div>
                <div style={{fontSize:12,color:"#94a3b8",marginTop:4}}>{item.id_no} · {item.lic} · {item.exp}</div>
              </div>
              <StatusPill s={item.status}/>
              <div style={{marginTop:14}}>
                <Pill l="HOS Risk" v={<span style={{color:hosColor(item.hosRisk),fontWeight:700}}>{item.hosRisk}</span>}/>
                <Pill l="Rating" v={`${"★".repeat(Math.round(item.rating))} ${item.rating}`}/>
                <Pill l="Last Run" v={item.lastRun||"—"}/>
                <Pill l="Location" v={item.location}/>
              </div>
              <div style={{display:"flex",gap:8,marginTop:18}}>
                <Btn style={{flex:1,fontSize:12}} onClick={() => openModal("officer", item)}>✏️ Edit Officer</Btn>
              </div>
            </div>
          )}
          {type==="officer"&&panelTab==="history"&&(<div><p style={{color:"#94a3b8",fontSize:13}}>Trip history for {item.name}.</p></div>)}
        </div>
      </div>
    );
  };

  const isFullPage = page === "routes" || page === "warehouses";
  const currentPage = {
    dashboard: <Dashboard {...ctx} />, orders: <OrdersPage {...ctx} />, dispatch: <DispatchBoard {...ctx} />,
    routes: <RoutesPage {...ctx} />, fleet: <FleetPage {...ctx} />, officers: <OfficersPage {...ctx} />,
    warehouses: <WarehousesPage {...ctx} />, inventory: <InventoryPage {...ctx} />, beneficiaries: <BeneficiariesPage {...ctx} />,
    pod: <PODPage {...ctx} />, reports: <ReportsPage {...ctx} />, scanner: <ScannerPage {...ctx} />, settings: <SettingsPage {...ctx} />,
    users_admin: <UserAdmin {...ctx} hasPerm={hasPerm} />,
    audit: <AuditDashboard {...ctx} hasPerm={hasPerm} />,
  }[page] || <Dashboard {...ctx} />;

  const syncBg = syncStatus==="syncing"?"#fef9c3":syncStatus==="error"?"#fee2e2":online?"#f0fdf4":"#f1f5f9";
  const syncBorder = syncStatus==="syncing"?"#fde047":syncStatus==="error"?"#fca5a5":online?"#86efac":"#e2e8f0";
  const syncColor = syncStatus==="syncing"?"#854d0e":syncStatus==="error"?"#b91c1c":online?"#15803d":"#64748b";
  const syncDot = syncStatus==="syncing"?"#d97706":syncStatus==="error"?"#dc2626":online?"#16a34a":"#94a3b8";

  // --- Auth gate ---
  if (!authReady) {
    return (
      <div style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#0b1220",color:"#e2e8f0"}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:18,fontWeight:900}}>AgroFlow </div>
          <div style={{opacity:.8,marginTop:6}}>Loading session…</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthPanel onAuthed={() => { /* handled by auth listener */ }} showToast={showToast} />;
  }

  return (
    <div style={{display:"flex",height:"100vh",background:"#f8fafc",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",fontSize:14,color:"#0f172a"}}>
      <div style={{width:sidebarOpen?220:0,background:"#0f172a",display:"flex",flexDirection:"column",flexShrink:0,overflowY:"auto",overflow:sidebarOpen?undefined:"hidden",transition:"width .2s"}}>
        <div style={{padding:"20px 18px 14px",borderBottom:"1px solid rgba(255,255,255,.08)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,borderRadius:10,background:"#15803d",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"#fff",flexShrink:0}}>🌾</div>
            <div><div style={{fontWeight:800,fontSize:14,color:"#fff",letterSpacing:.3}}>AgroFlow</div><div style={{fontSize:10,color:"rgba(255,255,255,.4)",marginTop:1}}>Distribution System</div></div>
          </div>
        </div>
        <nav style={{flex:1,padding:"10px 0",overflowY:"auto"}}>
          {NAV_GROUPS.map(g => (
            <div key={g.id}>
              {g.label && (
                <button onClick={() => toggleGroup(g.id)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 18px",background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,.3)",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>
                  {g.label}<span style={{transition:"transform .2s",transform:openGroups[g.id]?"rotate(180deg)":"none",fontSize:9}}>▾</span>
                </button>
              )}
              {(!g.label || openGroups[g.id]) && g.items.map(navItem => {
                const Icon = navItem.icon;
                const active = page === navItem.id;
                return (
                  <button key={navItem.id} onClick={() => setPage(navItem.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"9px 18px 9px 22px",background:active?"rgba(22,163,74,.18)":undefined,border:"none",cursor:"pointer",borderLeft:active?"3px solid #16a34a":"3px solid transparent",color:active?"#4ade80":"rgba(255,255,255,.6)",fontSize:13,fontWeight:active?700:400,textAlign:"left"}}>
                    <Icon size={16} />{navItem.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div style={{padding:"14px 18px",borderTop:"1px solid rgba(255,255,255,.08)",display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:30,height:30,borderRadius:"50%",background:"rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>
            {displayInitial}
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:"#fff"}}>{displayName}</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,.4)"}}>{(profile?.role || "").replace(/_/g," ") || "—"}</div>
          </div>
        </div>
      </div>

      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{height:52,background:"#fff",borderBottom:"1px solid #e2e8f0",display:"flex",alignItems:"center",padding:"0 20px",gap:12,flexShrink:0}}>
          <button onClick={() => setSidebarOpen(v => !v)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",padding:4}}><Menu size={20} /></button>
          <div style={{flex:1,position:"relative",maxWidth:280}}>
            <Search size={14} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}} />
            <input placeholder="Search..." style={{width:"100%",padding:"6px 12px 6px 32px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,color:"#374151",outline:"none",background:"#f8fafc"}} />
          </div>
          <button onClick={() => setManualScanOpen(true)} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:8,cursor:"pointer",fontSize:14,fontWeight:600,whiteSpace:"nowrap",border:`1px solid ${scannerActive?"#86efac":"#e2e8f0"}`,background:scannerActive?"#f0fdf4":"#f8fafc",color:scannerActive?"#15803d":"#64748b"}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:scannerActive?"#16a34a":"#94a3b8"}} />📷 Scan
          </button>
          <button onClick={() => setScannerActive(v => !v)} style={{background:"none",border:"1px solid #e2e8f0",borderRadius:8,padding:6,cursor:"pointer",color:scannerActive?"#16a34a":"#94a3b8"}} title={scannerActive ? "Disable scanner" : "Enable scanner"}>
            {scannerActive ? <Wifi size={14} /> : <WifiOff size={14} />}
          </button>
          <div onClick={forceSync} title="Click to sync" style={{display:"flex",alignItems:"center",gap:6,padding:"4px 12px",borderRadius:20,cursor:"pointer",whiteSpace:"nowrap",border:`1px solid ${syncBorder}`,fontSize:12,fontWeight:600,background:syncBg,color:syncColor}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:syncDot,flexShrink:0}} />
            {syncStatus === "syncing" ? "Syncing..." : syncStatus === "error" ? "Sync Error" : !online ? "Offline" : dbReady ? "Online" : "Loading..."}
            {pendingCount > 0 && <span style={{background:"#d97706",color:"#fff",borderRadius:20,padding:"0 6px",fontSize:9,fontWeight:700}}>{pendingCount}</span>}
          </div>
          <div style={{position:"relative"}}>
            <button onClick={() => showToast(`${stats.exceptions} alerts`)} style={{background:"none",border:"1px solid #e2e8f0",borderRadius:8,width:36,height:36,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#94a3b8"}}><Bell size={16} /></button>
            {stats.exceptions > 0 && <span style={{position:"absolute",top:-4,right:-4,background:"#dc2626",color:"#fff",borderRadius:"50%",width:16,height:16,fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{stats.exceptions}</span>}
          </div>

          <div style={{display:"flex",alignItems:"center",gap:10,marginLeft:10}}>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"4px 10px",border:"1px solid #e2e8f0",borderRadius:999,background:"#fff"}}>
              <span style={{width:22,height:22,borderRadius:"50%",background:"#0ea5e9",color:"#fff",display:"grid",placeItems:"center",fontSize:12,fontWeight:900}}>
                {displayInitial}
              </span>
              <div style={{lineHeight:1.1}}>
                <div style={{fontSize:12,fontWeight:800,color:"#0f172a"}}>{displayName}</div>
                <div style={{fontSize:11,color:"#64748b"}}>Role: {roleId.replace(/_/g," ")}</div>
              </div>
            </div>
            <button onClick={signOut} style={{background:"none",border:"1px solid #e2e8f0",borderRadius:8,height:36,padding:"0 10px",cursor:"pointer",fontWeight:800,color:"#0f172a"}}>Sign out</button>
          </div>

          <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:4}}>
            <Avatar label={displayInitial} idx={0} size={32} />
            <div>
              <div style={{fontSize:12,fontWeight:700,color:"#0f172a"}}>{displayName}</div>
              <div style={{fontSize:10,color:"#94a3b8"}}>{(profile?.role || "").replace(/_/g," ") || "—"}</div>
            </div>
          </div>
        </div>
        <div style={{flex:1,overflow:isFullPage?"hidden":"auto",padding:isFullPage?0:"24px 24px 32px"}}>{currentPage}</div>
      </div>

      {panel && <><SidePanel /><div onClick={closePanel} style={{position:"fixed",inset:0,zIndex:190}} /></>}

      {modal === "dist" && <DistForm onSave={f => { syncSetDists(ds => [...ds, f]); if (f.status === "Delivered") { syncSetInv(v => v.map(i => i.id === +f.itemId ? { ...i, qty: Math.max(0, i.qty - +f.qty) } : i)); } showToast("Distribution recorded!"); }} onClose={closeModal} />}
      {modal === "inv" && <InvForm onSave={f => { syncSetInv(v => { const nid = Math.max(...v.map(i => i.id), 0) + 1; return [...v, { ...f, id: nid, barcode: `INV-${String(nid).padStart(5, "0")}` }]; }); showToast("Item added!"); }} onClose={closeModal} />}
      {modal === "editInv" && <InvForm item={editItem} onSave={f => { syncSetInv(v => v.map(i => i.id === editItem.id ? { ...f, id: editItem.id, barcode: editItem.barcode } : i)); showToast("Item updated!"); }} onClose={closeModal} />}
      {modal === "fleet" && <FleetForm onSave={f => { syncSetFleet(v => { const nid = Math.max(...v.map(x => x.id), 0) + 1; return [...v, { ...f, id: nid, lastPing: "Just added" }]; }); showToast("Vehicle added!"); }} onClose={closeModal} />}
      {modal === "editFleet" && <FleetForm item={editItem} onSave={f => { syncSetFleet(v => v.map(x => x.id === editItem.id ? { ...f, id: editItem.id, lastPing: x.lastPing } : x)); showToast("Vehicle updated!"); }} onClose={closeModal} />}
      {modal === "user" && <UserForm item={editItem} onSave={f => { if (editItem) { syncSetUsers(u => u.map(x => x.id === editItem.id ? { ...f, id: editItem.id } : x)); showToast("User updated!"); } else { syncSetUsers(u => { const nid = Math.max(...u.map(x => x.id), 0) + 1; return [...u, { ...f, id: nid }]; }); showToast("User added!"); } }} onClose={closeModal} />}
      {modal === "officer" && <OfficerForm item={editItem} onSave={f => { if (editItem) { const updated = { ...f, id: editItem.id }; setOfficers(p => p.map(x => x.id === editItem.id ? updated : x)); saveRecord("field_officers", updated); showToast("Officer updated!"); } else { setOfficers(p => { const nid = Math.max(...p.map(x => x.id), 0) + 1; const rec = { ...f, id: nid }; saveRecord("field_officers", rec); return [...p, rec]; }); showToast("Officer added!"); } }} onClose={closeModal} />}
      {modal === "pod_form" && <PODForm onClose={closeModal} inv={inv} benes={benes} dists={dists} showToast={showToast} onCreatedLocal={(newPod) => syncSetPods(ps => [newPod, ...ps])} />}

      {scanResult && <ScanResultModal />}
      {manualScanOpen && <ManualScanInput />}

      {toast && (
        <div style={{position:"fixed",bottom:24,right:24,padding:"12px 20px",borderRadius:12,fontWeight:600,fontSize:14,zIndex:999,boxShadow:"0 4px 12px rgba(0,0,0,.2)",display:"flex",alignItems:"center",gap:8,color:"#fff",background:toast.type==="error"?"#7f1d1d":"#14532d"}}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}