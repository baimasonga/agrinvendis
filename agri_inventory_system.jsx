import { useState, useMemo, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════ SEED DATA ═══════════════════════════ */
const INIT_INVENTORY = [
  /* ── Procurement Batch PC-2025-001 (Seed Inputs — Long Rains) ── */
  /*  Maize Seeds: 150 Kg distributed (AG-001847: 50 + AG-001849: 100), 0 reserved */
  { id:1, barcode:"INV-00001", name:"Maize Seeds (OPV)",       cat:"Seeds",      unit:"Kg",          qty:500, qtyExpected:600, qtyDistributed:150, qtyReserved:0,  min:100, supplier:"AgroSupplies Ltd", cost:2.50,  loc:"Warehouse A", expiry:"2026-06-30", procCode:"PC-2025-001", procDate:"2025-01-10", receivedDate:"2025-01-18" },
  /*  NPK 17:17:17: 15 Bags distributed (AG-001848: 5 + AG-001852: 10), 0 reserved */
  { id:2, barcode:"INV-00002", name:"NPK Fertilizer 17:17:17", cat:"Fertilizer", unit:"Bags (50kg)", qty:80,  qtyExpected:100, qtyDistributed:15,  qtyReserved:0,  min:20,  supplier:"FertileCo",        cost:35,    loc:"Warehouse B", expiry:"2027-01-01", procCode:"PC-2025-001", procDate:"2025-01-10", receivedDate:"2025-01-20" },
  /*  Urea Fertilizer: none distributed, none reserved */
  { id:3, barcode:"INV-00003", name:"Urea Fertilizer",          cat:"Fertilizer", unit:"Bags (50kg)", qty:15,  qtyExpected:50,  qtyDistributed:0,   qtyReserved:0,  min:25,  supplier:"FertileCo",        cost:30,    loc:"Warehouse B", expiry:"2027-01-01", procCode:"PC-2025-001", procDate:"2025-01-10", receivedDate:"2025-01-20" },
  /* ── Procurement Batch PC-2025-002 (Seed Programme — Soybean) ── */
  /*  Soybean Seeds: 0 distributed, 30 Kg unassigned pending (AG-001851) */
  { id:4, barcode:"INV-00004", name:"Soybean Seeds",            cat:"Seeds",      unit:"Kg",          qty:200, qtyExpected:200, qtyDistributed:0,   qtyReserved:0,  min:50,  supplier:"SeedWorks",        cost:3.20,  loc:"Warehouse A", expiry:"2025-12-31", procCode:"PC-2025-002", procDate:"2025-02-05", receivedDate:"2025-02-12" },
  /* ── Procurement Batch PC-2025-003 (Crop Protection Chemicals) ── */
  /*  Lambda-cyhalothrin: 0 distributed, 0 reserved (AG-001854 is Problem status) */
  { id:5, barcode:"INV-00005", name:"Lambda-cyhalothrin",       cat:"Pesticide",  unit:"Litres",      qty:40,  qtyExpected:50,  qtyDistributed:0,   qtyReserved:0,  min:10,  supplier:"AgroChem",         cost:18,    loc:"Chem. Store",  expiry:"2025-09-01", procCode:"PC-2025-003", procDate:"2025-02-20", receivedDate:"2025-03-01" },
  /*  Glyphosate: 0 distributed, 20 L reserved/assigned (AG-001853 Assigned) */
  { id:8, barcode:"INV-00008", name:"Glyphosate Herbicide",     cat:"Herbicide",  unit:"Litres",      qty:55,  qtyExpected:60,  qtyDistributed:0,   qtyReserved:20, min:15,  supplier:"AgroChem",         cost:12,    loc:"Chem. Store",  expiry:"2026-03-01", procCode:"PC-2025-003", procDate:"2025-02-20", receivedDate:"2025-03-01" },
  /* ── Procurement Batch PC-2025-004 (Field Tools & Equipment) ── */
  /*  Hand Hoes: 18 Units distributed (AG-001850: 18), 0 reserved */
  { id:6, barcode:"INV-00006", name:"Hand Hoes",                cat:"Tools",      unit:"Units",       qty:120, qtyExpected:150, qtyDistributed:18,  qtyReserved:0,  min:30,  supplier:"ToolMart",         cost:8,     loc:"Equip. Shed",  expiry:null,          procCode:"PC-2025-004", procDate:"2025-03-01", receivedDate:"2025-03-08" },
  /*  Watering Cans: none distributed, none reserved */
  { id:7, barcode:"INV-00007", name:"Watering Cans (10L)",      cat:"Tools",      unit:"Units",       qty:60,  qtyExpected:60,  qtyDistributed:0,   qtyReserved:0,  min:15,  supplier:"ToolMart",         cost:5,     loc:"Equip. Shed",  expiry:null,          procCode:"PC-2025-004", procDate:"2025-03-01", receivedDate:"2025-03-08" },
];
const INIT_BENES = [
  { id:1, name:"Musa Kamara",     group:"Freetown Farmers Cooperative", village:"Waterloo", phone:"076123456", gender:"M", count:12, rating:4.8, avatar:"MK" },
  { id:2, name:"Aminata Sesay",   group:"Women in Agriculture SL",      village:"Lungi",    phone:"078234567", gender:"F", count:25, rating:4.6, avatar:"AS" },
  { id:3, name:"Ibrahim Bangura", group:"Youth Agri-Hub",               village:"Bo",       phone:"077345678", gender:"M", count:18, rating:4.9, avatar:"IB" },
  { id:4, name:"Fatmata Koroma",  group:"Kono Seed Savers",             village:"Koidu",    phone:"079456789", gender:"F", count:30, rating:4.7, avatar:"FK" },
  { id:5, name:"Abdul Conteh",    group:"Northern Smallholders",        village:"Makeni",   phone:"076567890", gender:"M", count:22, rating:4.5, avatar:"AC" },
];
const SEASONS   = ["2025 Long Rains","2025 Short Rains","2026 Long Rains","2026 Short Rains"];
const CATEGORIES= ["Seeds","Fertilizer","Pesticide","Herbicide","Tools","Other"];
const STATUSES  = ["Unassigned","Assigned","In Transit","Delivered","Problem"];
const INIT_DISTS = [
  { id:1, ref:"AG-2025-001847", date:"2025-03-15", beneId:1, itemId:1, qty:50,  season:"2025 Long Rains", officer:"James Musa",   truck:"TRK-001", status:"Delivered",  priority:"High",   rate:125, notes:"Pre-season seeds. Use dock door #2." },
  { id:2, ref:"AG-2025-001848", date:"2025-03-15", beneId:1, itemId:2, qty:5,   season:"2025 Long Rains", officer:"James Musa",   truck:"TRK-002", status:"Delivered",  priority:"High",   rate:175, notes:"Basal fertilizer for March planting." },
  { id:3, ref:"AG-2025-001849", date:"2025-03-20", beneId:2, itemId:1, qty:100, season:"2025 Long Rains", officer:"Hawa Turay",   truck:"TRK-001", status:"Delivered",  priority:"Medium", rate:250, notes:"Women's cooperative allocation." },
  { id:4, ref:"AG-2025-001850", date:"2025-03-22", beneId:3, itemId:6, qty:18,  season:"2025 Long Rains", officer:"Sorie Kamara", truck:"TRK-003", status:"Delivered",  priority:"Low",    rate:144, notes:"Youth group tools only." },
  { id:5, ref:"AG-2025-001851", date:"2025-04-01", beneId:4, itemId:4, qty:30,  season:"2025 Long Rains", officer:null,           truck:null,      status:"Unassigned", priority:"High",   rate:96,  notes:"Soybean pilot program." },
  { id:6, ref:"AG-2025-001852", date:"2025-04-03", beneId:5, itemId:2, qty:10,  season:"2025 Long Rains", officer:"James Musa",   truck:"TRK-002", status:"Delivered",  priority:"Low",    rate:350, notes:"Northern distribution run." },
  { id:7, ref:"AG-2025-001853", date:"2025-04-05", beneId:2, itemId:8, qty:20,  season:"2025 Long Rains", officer:"Hawa Turay",   truck:"TRK-001", status:"Assigned",   priority:"Medium", rate:240, notes:"Herbicide for weed control." },
  { id:8, ref:"AG-2025-001854", date:"2025-04-07", beneId:3, itemId:5, qty:10,  season:"2025 Long Rains", officer:null,           truck:null,      status:"Problem",    priority:"High",   rate:180, notes:"Pesticide delayed at checkpoint." },
];
const INIT_OFFICERS = [
  { id:1, name:"James Musa",    id_no:"FO-001", lic:"Class B", exp:"8 yrs", status:"Available", hosRisk:"Low",    rating:4.9, lastRun:"Waterloo → Lungi",  location:"Freetown Hub",    avatar:"JM" },
  { id:2, name:"Hawa Turay",    id_no:"FO-002", lic:"Class A", exp:"5 yrs", status:"On Trip",   hosRisk:"Medium", rating:4.7, lastRun:"Freetown → Bo",     location:"En route to Bo",  avatar:"HT" },
  { id:3, name:"Sorie Kamara",  id_no:"FO-003", lic:"Class B", exp:"3 yrs", status:"Off Duty",  hosRisk:"Low",    rating:4.8, lastRun:"Makeni → Koidu",    location:"Makeni Base",     avatar:"SK" },
  { id:4, name:"Mary Conteh",   id_no:"FO-004", lic:"Class A", exp:"6 yrs", status:"On Trip",   hosRisk:"High",   rating:4.6, lastRun:"Freetown → Makeni", location:"En route Makeni", avatar:"MC" },
  { id:5, name:"Alpha Bangura", id_no:"FO-005", lic:"Class B", exp:"9 yrs", status:"Available", hosRisk:"Low",    rating:4.9, lastRun:"Bo → Kenema",       location:"Bo Hub",          avatar:"AB" },
];
const INIT_FLEET = [
  { id:1, plate:"TRK-001", model:"Toyota Hilux",        type:"Pickup",       status:"Available",   driver:"James Musa",   loc:"Freetown Terminal", lastPing:"2 min ago",  health:95, mileage:"47,200 km",  year:2021, lastInsp:"Jan 2025", nextInsp:"Jul 2025", inspResult:"Passed" },
  { id:2, plate:"TRK-002", model:"Mitsubishi Canter",   type:"Light Truck",  status:"In Use",      driver:"Hawa Turay",   loc:"En route to Bo",    lastPing:"5 min ago",  health:88, mileage:"63,400 km",  year:2020, lastInsp:"Dec 2024", nextInsp:"Jun 2025", inspResult:"Passed" },
  { id:3, plate:"TRK-003", model:"Isuzu NPR",           type:"Medium Truck", status:"Available",   driver:"Sorie Kamara", loc:"Makeni Base",        lastPing:"12 min ago", health:72, mileage:"89,100 km",  year:2019, lastInsp:"Nov 2024", nextInsp:"May 2025", inspResult:"Advisory" },
  { id:4, plate:"TRK-004", model:"Ford Transit",        type:"Van",          status:"Maintenance", driver:null,           loc:"Service Centre",     lastPing:"2 hrs ago",  health:40, mileage:"102,000 km", year:2018, lastInsp:"Oct 2024", nextInsp:"Overdue",  inspResult:"Failed" },
  { id:5, plate:"TRK-005", model:"Toyota Land Cruiser", type:"SUV",          status:"Available",   driver:"Alpha Bangura",loc:"Bo Hub",             lastPing:"1 min ago",  health:98, mileage:"31,600 km",  year:2022, lastInsp:"Feb 2025", nextInsp:"Aug 2025", inspResult:"Passed" },
];
const INIT_ROUTES = [
  { id:1, ref:"ROUTE-2025-001", truck:"TRK-001", officer:"James Musa",    origin:"Freetown Hub",  dest:"Waterloo Cooperative", distance:"45 km",  status:"On Time",  progress:72, eta:"2:30 PM, Apr 8", lastUpdate:"2 min ago",  confidence:95, stops:["Freetown Hub","Mile 7 Checkpoint","Waterloo Cooperative"],   stopStatus:["Completed","In Transit","Pending"],   events:["Departed hub at 8:15 AM","Passed Mile 7 at 9:30 AM"], linkedLoads:["AG-2025-001847","AG-2025-001848"] },
  { id:2, ref:"ROUTE-2025-002", truck:"TRK-002", officer:"Hawa Turay",    origin:"Freetown Hub",  dest:"Bo Agri-Hub",           distance:"232 km", status:"Delayed",  progress:38, eta:"5:15 PM, Apr 8", lastUpdate:"5 min ago",  confidence:72, stops:["Freetown Hub","Waterloo Check","Moyamba Junction","Bo Agri-Hub"], stopStatus:["Completed","Completed","In Transit","Pending"], events:["Departed 7:00 AM","Delayed at Moyamba - road conditions"], linkedLoads:["AG-2025-001849"] },
  { id:3, ref:"ROUTE-2025-003", truck:"TRK-003", officer:"Sorie Kamara",  origin:"Makeni Base",   dest:"Koidu Seed Savers",     distance:"185 km", status:"On Time",  progress:15, eta:"4:00 PM, Apr 8", lastUpdate:"12 min ago", confidence:88, stops:["Makeni Base","Magburaka","Yengema","Koidu Seed Savers"],       stopStatus:["Completed","In Transit","Pending","Pending"],   events:["Departed Makeni 10:00 AM"],           linkedLoads:["AG-2025-001850"] },
  { id:4, ref:"ROUTE-2025-004", truck:"TRK-005", officer:"Alpha Bangura", origin:"Bo Hub",        dest:"Kenema Farmers",        distance:"88 km",  status:"On Time",  progress:90, eta:"1:45 PM, Apr 8", lastUpdate:"1 min ago",  confidence:97, stops:["Bo Hub","Blama Junction","Kenema Farmers"],                   stopStatus:["Completed","Completed","In Transit"],           events:["Departed Bo 9:00 AM","Near destination"], linkedLoads:["AG-2025-001852"] },
  { id:5, ref:"ROUTE-2025-005", truck:"TRK-002", officer:"Mary Conteh",   origin:"Freetown Hub",  dest:"Makeni Smallholders",   distance:"198 km", status:"Critical", progress:55, eta:"6:00 PM, Apr 8", lastUpdate:"45 min ago", confidence:58, stops:["Freetown Hub","Port Loko","Bombali Junction","Makeni Smallholders"], stopStatus:["Completed","Completed","In Transit","Pending"], events:["Departed 6:30 AM","GPS signal lost near Bombali"], linkedLoads:["AG-2025-001853"] },
];
const INIT_WAREHOUSES = [
  { id:1, name:"Freetown Main Hub",       address:"12 Siaka Stevens St, Freetown", status:"Active",      capacity:125000, utilization:87, inbound:142, outbound:238, onHand:5847, docks:16, docksAvail:8,  yard:"Congested", apptIn:45, apptOut:52, inventory:[{cat:"Seeds",units:1847,pct:31.6},{cat:"Fertilizer",units:2156,pct:36.9},{cat:"Tools",units:1844,pct:31.5}], schedule:[{time:"08:00",dock:"1-4",dir:"IN",ref:"IN-2401"},{time:"09:30",dock:"5-8",dir:"OUT",ref:"OUT-1847"},{time:"10:00",dock:"9-12",dir:"IN",ref:"IN-2403"},{time:"11:00",dock:"5-8",dir:"OUT",ref:"OUT-1848"}] },
  { id:2, name:"Bo Regional Hub",         address:"15 Fenton Rd, Bo",             status:"Active",      capacity:75000,  utilization:62, inbound:89,  outbound:156, onHand:8234, docks:10, docksAvail:6,  yard:"Normal",    apptIn:38, apptOut:41, inventory:[{cat:"Seeds",units:3100,pct:37.6},{cat:"Herbicide",units:2200,pct:26.7},{cat:"Pesticide",units:2934,pct:35.7}], schedule:[{time:"08:30",dock:"1-4",dir:"IN",ref:"IN-2402"},{time:"10:00",dock:"5-8",dir:"OUT",ref:"OUT-1849"},{time:"14:00",dock:"5-8",dir:"OUT",ref:"OUT-1851"}] },
  { id:3, name:"Makeni Distribution Ctr", address:"9 Azzolini Hwy, Makeni",       status:"Active",      capacity:90000,  utilization:45, inbound:76,  outbound:124, onHand:4156, docks:12, docksAvail:12, yard:"Empty",     apptIn:28, apptOut:35, inventory:[{cat:"Fertilizer",units:2400,pct:57.7},{cat:"Tools",units:1756,pct:42.3}], schedule:[{time:"09:00",dock:"1-4",dir:"IN",ref:"IN-2406"},{time:"11:30",dock:"5-8",dir:"OUT",ref:"OUT-1852"}] },
  { id:4, name:"Kenema Field Store",      address:"7 Hangha Rd, Kenema",          status:"Active",      capacity:45000,  utilization:73, inbound:52,  outbound:89,  onHand:2903, docks:6,  docksAvail:3,  yard:"Normal",    apptIn:22, apptOut:28, inventory:[{cat:"Seeds",units:1200,pct:41.3},{cat:"Pesticide",units:900,pct:31.0},{cat:"Tools",units:803,pct:27.7}], schedule:[{time:"08:00",dock:"1-4",dir:"OUT",ref:"OUT-1853"},{time:"10:30",dock:"1-4",dir:"IN",ref:"IN-2407"}] },
  { id:5, name:"Lungi Agri Depot",        address:"Lungi Airport Rd, Port Loko",  status:"Maintenance", capacity:60000,  utilization:28, inbound:34,  outbound:67,  onHand:1431, docks:8,  docksAvail:2,  yard:"Congested", apptIn:12, apptOut:18, inventory:[{cat:"Seeds",units:800,pct:55.9},{cat:"Tools",units:631,pct:44.1}], schedule:[] },
  { id:6, name:"Koidu Seed Store",        address:"Kono District Main Rd, Koidu", status:"Active",      capacity:35000,  utilization:59, inbound:88,  outbound:107, onHand:2365, docks:4,  docksAvail:4,  yard:"Empty",     apptIn:40, apptOut:45, inventory:[{cat:"Seeds",units:1400,pct:59.2},{cat:"Fertilizer",units:965,pct:40.8}], schedule:[{time:"08:00",dock:"1-4",dir:"IN",ref:"IN-2408"},{time:"12:00",dock:"1-4",dir:"OUT",ref:"OUT-1854"}] },
];
const INIT_PODS = [
  /* POD-2025-001 → AG-2025-001847 · itemId:1 · Maize Seeds (OPV) · Delivered to Waterloo Cooperative */
  { id:1, ref:"POD-2025-001", distRef:"AG-2025-001847", beneId:1,
    date:"2025-03-15", time:"14:30", officer:"James Musa", vehicle:"TRK-001", season:"2025 Long Rains",
    receivedBy:"Musa Kamara", condition:"Good", verified:true, signedAt:"Waterloo Cooperative HQ",
    items:[{
      invId:1, barcode:"INV-00001", name:"Maize Seeds (OPV)", procCode:"PC-2025-001",
      cat:"Seeds", unit:"Kg", qtyOrdered:50, qty:50, qtyVariance:0, itemCondition:"Good"
    }],
    notes:"All items received in good condition. Bags sealed and undamaged." },

  /* POD-2025-002 → AG-2025-001848 · itemId:2 · NPK Fertilizer 17:17:17 · Waterloo Cooperative */
  { id:2, ref:"POD-2025-002", distRef:"AG-2025-001848", beneId:1,
    date:"2025-03-15", time:"15:10", officer:"James Musa", vehicle:"TRK-002", season:"2025 Long Rains",
    receivedBy:"Musa Kamara", condition:"Good", verified:true, signedAt:"Waterloo Cooperative HQ",
    items:[{
      invId:2, barcode:"INV-00002", name:"NPK Fertilizer 17:17:17", procCode:"PC-2025-001",
      cat:"Fertilizer", unit:"Bags (50kg)", qtyOrdered:5, qty:5, qtyVariance:0, itemCondition:"Good"
    }],
    notes:"Stored immediately upon arrival. All 5 bags intact, no moisture damage." },

  /* POD-2025-003 → AG-2025-001849 · itemId:1 · Maize Seeds (OPV) · Lungi Women's Centre */
  { id:3, ref:"POD-2025-003", distRef:"AG-2025-001849", beneId:2,
    date:"2025-03-20", time:"13:45", officer:"Hawa Turay", vehicle:"TRK-001", season:"2025 Long Rains",
    receivedBy:"Aminata Sesay", condition:"Good", verified:true, signedAt:"Lungi Women's Centre",
    items:[{
      invId:1, barcode:"INV-00001", name:"Maize Seeds (OPV)", procCode:"PC-2025-001",
      cat:"Seeds", unit:"Kg", qtyOrdered:100, qty:100, qtyVariance:0, itemCondition:"Good"
    }],
    notes:"Received by group secretary. Distributed to 25 women cooperative members on same day." },

  /* POD-2025-004 → AG-2025-001850 · itemId:6 · Hand Hoes · Bo Youth Agri-Hub — 2 units damaged */
  { id:4, ref:"POD-2025-004", distRef:"AG-2025-001850", beneId:3,
    date:"2025-03-22", time:"11:20", officer:"Sorie Kamara", vehicle:"TRK-003", season:"2025 Long Rains",
    receivedBy:"Ibrahim Bangura", condition:"Damaged", verified:true, signedAt:"Bo Youth Agri-Hub",
    items:[{
      invId:6, barcode:"INV-00006", name:"Hand Hoes", procCode:"PC-2025-004",
      cat:"Tools", unit:"Units", qtyOrdered:18, qty:18, qtyVariance:0,
      itemCondition:"Damaged", damageNote:"2 of 18 units had bent handles — unusable"
    }],
    notes:"18 units physically received. 2 hoes had badly bent handles, reported to Field Operations. Replacement requested." },

  /* POD-2025-005 → AG-2025-001852 · itemId:2 · NPK Fertilizer 17:17:17 · Makeni Smallholders */
  { id:5, ref:"POD-2025-005", distRef:"AG-2025-001852", beneId:5,
    date:"2025-04-03", time:"16:00", officer:"James Musa", vehicle:"TRK-002", season:"2025 Long Rains",
    receivedBy:"Abdul Conteh", condition:"Good", verified:false, signedAt:"Makeni Smallholders Base",
    items:[{
      invId:2, barcode:"INV-00002", name:"NPK Fertilizer 17:17:17", procCode:"PC-2025-001",
      cat:"Fertilizer", unit:"Bags (50kg)", qtyOrdered:10, qty:10, qtyVariance:0, itemCondition:"Good"
    }],
    notes:"Pending supervisor sign-off. Delivery confirmed by phone but physical signature outstanding." },
];

/* ─── USER ROLES & INITIAL USERS ─── */
const USER_ROLES = [
  { id:"field_officer",    label:"Field Officer",        color:"#16a34a", bg:"#dcfce7",  icon:"🧑‍🌾", desc:"Manages field operations and deliveries" },
  { id:"admin_store",      label:"Admin / Store Mgr",    color:"#7c3aed", bg:"#f5f3ff",  icon:"🏪", desc:"Controls inventory and warehouse stock" },
  { id:"procurement",      label:"Procurement",          color:"#d97706", bg:"#fef9c3",  icon:"📋", desc:"Handles purchasing and supplier management" },
  { id:"me_manager",       label:"M&E Manager",          color:"#0891b2", bg:"#ecfeff",  icon:"📊", desc:"Monitoring, evaluation and reporting oversight" },
  { id:"me_officer",       label:"M&E Officer",          color:"#06b6d4", bg:"#ecfeff",  icon:"📈", desc:"Conducts field monitoring and data collection" },
  { id:"manager",          label:"Manager",              color:"#2563eb", bg:"#eff6ff",  icon:"👔", desc:"General management and oversight" },
  { id:"officer",          label:"Officer",              color:"#64748b", bg:"#f1f5f9",  icon:"🎖", desc:"General operational officer" },
];
const ROLE_PERMISSIONS = {
  field_officer: ["view_inventory","view_distributions","update_pod","view_routes","view_fleet"],
  admin_store:   ["view_inventory","edit_inventory","view_distributions","view_warehouses","edit_warehouses","view_reports"],
  procurement:   ["view_inventory","edit_inventory","view_reports","view_orders"],
  me_manager:    ["view_all","view_reports","export_reports","manage_users","view_analytics"],
  me_officer:    ["view_all","view_reports","export_reports"],
  manager:       ["view_all","edit_distributions","edit_inventory","manage_fleet","view_reports"],
  officer:       ["view_inventory","view_distributions","view_fleet","view_routes"],
};
const INIT_USERS = [
  { id:1, name:"Sarah Admin",    email:"sarah@agroflow.sl",    role:"manager",       status:"Active",   phone:"076001001", location:"Freetown", lastLogin:"Today, 08:12",     joined:"Jan 2024", avatar:"SA" },
  { id:2, name:"James Musa",     email:"james@agroflow.sl",    role:"field_officer", status:"Active",   phone:"076001002", location:"Freetown", lastLogin:"Today, 07:45",     joined:"Feb 2024", avatar:"JM" },
  { id:3, name:"Hawa Turay",     email:"hawa@agroflow.sl",     role:"field_officer", status:"Active",   phone:"078001003", location:"Bo",       lastLogin:"Today, 06:30",     joined:"Mar 2024", avatar:"HT" },
  { id:4, name:"Emmanuel Kofi",  email:"e.kofi@agroflow.sl",   role:"admin_store",   status:"Active",   phone:"077001004", location:"Makeni",   lastLogin:"Yesterday, 17:22", joined:"Jan 2024", avatar:"EK" },
  { id:5, name:"Fatima Bangura", email:"fatima@agroflow.sl",   role:"procurement",   status:"Active",   phone:"079001005", location:"Freetown", lastLogin:"Today, 09:00",     joined:"Apr 2024", avatar:"FB" },
  { id:6, name:"David Kamara",   email:"david@agroflow.sl",    role:"me_manager",    status:"Active",   phone:"076001006", location:"Freetown", lastLogin:"Yesterday, 14:10", joined:"Jan 2024", avatar:"DK" },
  { id:7, name:"Mariatu Sesay",  email:"mariatu@agroflow.sl",  role:"me_officer",    status:"Active",   phone:"078001007", location:"Kenema",   lastLogin:"2 days ago",       joined:"Jun 2024", avatar:"MS" },
  { id:8, name:"Thomas Conteh",  email:"thomas@agroflow.sl",   role:"officer",       status:"Inactive", phone:"077001008", location:"Bo",       lastLogin:"1 week ago",       joined:"May 2024", avatar:"TC" },
];

/* ═══════════════════════════ HELPERS ═══════════════════════════ */
const today     = new Date();
const fmtDate   = d => d ? new Date(d).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}) : "—";
const isExpired = e => e && new Date(e) < today;
const isExpSoon = e => { if(!e) return false; const d=(new Date(e)-today)/86400000; return d>=0&&d<=60; };
const catColor  = c => ({Seeds:"#16a34a",Fertilizer:"#d97706",Pesticide:"#dc2626",Herbicide:"#ea580c",Tools:"#2563eb",Other:"#7c3aed"}[c]||"#64748b");
const hosColor  = r => ({Low:"#16a34a",Medium:"#d97706",High:"#dc2626"}[r]||"#64748b");
const healthClr = h => h>=85?"#16a34a":h>=60?"#d97706":"#dc2626";
const AV_COLORS = ["#16a34a","#2563eb","#7c3aed","#d97706","#dc2626","#0891b2","#db2777"];
const statusStyle = s => ({
  Unassigned:  {bg:"#f1f5f9",c:"#64748b"}, Assigned:    {bg:"#dbeafe",c:"#1d4ed8"},
  "In Transit":{bg:"#fef9c3",c:"#854d0e"}, Delivered:   {bg:"#dcfce7",c:"#15803d"},
  Problem:     {bg:"#fee2e2",c:"#b91c1c"}, Available:   {bg:"#dcfce7",c:"#15803d"},
  "On Trip":   {bg:"#fef9c3",c:"#854d0e"}, "Off Duty":  {bg:"#f1f5f9",c:"#64748b"},
  Maintenance: {bg:"#fee2e2",c:"#b91c1c"}, "In Use":    {bg:"#fef9c3",c:"#854d0e"},
  Active:      {bg:"#dcfce7",c:"#15803d"}, Inactive:    {bg:"#fee2e2",c:"#b91c1c"},
  Suspended:   {bg:"#fef9c3",c:"#854d0e"},
}[s]||{bg:"#f1f5f9",c:"#64748b"});
const conditionStyle = c => ({Good:{bg:"#dcfce7",c:"#15803d"},Damaged:{bg:"#fee2e2",c:"#b91c1c"},Partial:{bg:"#fef9c3",c:"#854d0e"}}[c]||{bg:"#f1f5f9",c:"#64748b"});

/* ═══════════════════════════ ATOMS ═══════════════════════════ */
const StatusPill  = ({s}) => { const st=statusStyle(s); return <span style={{background:st.bg,color:st.c,padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>{s}</span>; };
const PriorityTag = ({p}) => { const c=({High:"#dc2626",Medium:"#d97706",Low:"#16a34a"}[p]||"#64748b"); return <span style={{background:c+"1a",color:c,padding:"2px 8px",borderRadius:4,fontSize:11,fontWeight:700}}>{p}</span>; };
const Av = ({label,idx=0,size=32}) => (
  <div style={{width:size,height:size,borderRadius:"50%",background:AV_COLORS[idx%AV_COLORS.length],display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:Math.round(size*.37),flexShrink:0}}>{label}</div>
);
const Pill = ({l,v}) => (
  <div style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #f1f5f9"}}>
    <span style={{fontSize:12,color:"#94a3b8"}}>{l}</span>
    <span style={{fontSize:13,color:"#0f172a",fontWeight:500}}>{v}</span>
  </div>
);
const RoleBadge = ({roleId}) => {
  const r = USER_ROLES.find(x=>x.id===roleId);
  if(!r) return null;
  return <span style={{background:r.bg,color:r.color,padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{r.icon} {r.label}</span>;
};

/* ═══════════════════════════ BARCODE ═══════════════════════════ */
const BarcodeDisplay = ({code,width=130,height=36,showText=true,mini=false}) => {
  const W = mini?70:width, H = mini?22:height;
  const seed = code.split("").reduce((acc,c,i)=>acc+c.charCodeAt(0)*(i+1),0);
  let rng = seed;
  const next = () => { rng=(rng*1664525+1013904223)&0xffffffff; return Math.abs(rng); };
  const pattern = [1,2,1];
  for(let i=0;i<code.length*2+4;i++) pattern.push((next()%3)+1);
  pattern.push(1,2,1);
  const unitW = W/pattern.reduce((a,b)=>a+b,0);
  let x=0; const bars=[];
  pattern.forEach((w,i)=>{ const bw=w*unitW; if(i%2===0) bars.push({x,w:Math.max(bw-0.4,0.6)}); x+=bw; });
  return (
    <svg width={W} height={H+(showText&&!mini?11:0)} style={{display:"block",flexShrink:0}}>
      {bars.map((b,i)=><rect key={i} x={b.x} y={0} width={b.w} height={H} fill="#0f172a" rx={0.2}/>)}
      {showText&&!mini&&<text x={W/2} y={H+9} textAnchor="middle" fontSize="7.5" fill="#64748b" fontFamily="monospace" letterSpacing="0.5">{code}</text>}
    </svg>
  );
};

/* ═══════════════════════════ FORM HELPERS ═══════════════════════════ */
const FGrid = ({children}) => <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,padding:"18px 22px"}}>{children}</div>;
const FG    = ({label,full,children}) => <div style={{display:"flex",flexDirection:"column",gap:5,gridColumn:full?"1/-1":undefined}}><label style={{fontSize:11,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{label}</label>{children}</div>;
const FIn   = ({onChange,...p}) => <input {...p} onChange={e=>onChange(e.target.value)} style={S.fi}/>;
const FSel  = ({onChange,opts,...p}) => <select {...p} onChange={e=>onChange(e.target.value)} style={S.fi}>{opts.map(o=>typeof o==="string"?<option key={o}>{o}</option>:<option key={o.v} value={o.v}>{o.l}</option>)}</select>;
const Overlay = ({onClose,title,width,children}) => (
  <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,backdropFilter:"blur(4px)"}}>
    <div style={{background:"#fff",borderRadius:14,width:width||"min(640px,96vw)",maxHeight:"92vh",overflow:"auto",boxShadow:"0 24px 48px rgba(0,0,0,.2)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 22px",borderBottom:"1px solid #f1f5f9"}}>
        <span style={{fontWeight:800,fontSize:17,color:"#0f172a"}}>{title}</span>
        <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#94a3b8"}}>✕</button>
      </div>
      {children}
    </div>
  </div>
);
const PageHead = ({title,sub,children}) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
    <div><h2 style={{margin:0,fontSize:22,fontWeight:800,color:"#0f172a"}}>{title}</h2>{sub&&<p style={{margin:"4px 0 0",color:"#94a3b8",fontSize:13}}>{sub}</p>}</div>
    <div style={{display:"flex",gap:8}}>{children}</div>
  </div>
);

/* ═══════════════════════════ OFFLINE-FIRST SYNC ENGINE ═══════════════════════════ */
const SUPABASE_URL  = "https://fdhqfnbrwmjtbtpzoevs.supabase.co";
const SUPABASE_ANON = "YOUR_ANON_KEY_HERE";
const IDB_NAME      = "agroflow_db";
const IDB_VERSION   = 2;
const STORES = ["inventory","distributions","beneficiaries","field_officers","fleet","pods","routes","warehouses","users","sync_queue"];
const TABLE_MAP = {inventory:"inventory",distributions:"distributions",beneficiaries:"beneficiaries",field_officers:"field_officers",fleet:"fleet",pods:"pods",routes:"routes",warehouses:"warehouses",users:"users"};

const openDB = () => new Promise((res,rej)=>{
  const req = indexedDB.open(IDB_NAME,IDB_VERSION);
  req.onupgradeneeded = e => { const db=e.target.result; STORES.forEach(s=>{ if(!db.objectStoreNames.contains(s)) db.createObjectStore(s,{keyPath:"id",autoIncrement:s==="sync_queue"}); }); };
  req.onsuccess = e=>res(e.target.result);
  req.onerror   = e=>rej(e.target.error);
});
const idbGetAll = (db,store) => new Promise((res,rej)=>{ const req=db.transaction(store,"readonly").objectStore(store).getAll(); req.onsuccess=()=>res(req.result||[]); req.onerror=()=>rej(req.error); });
const idbPut    = (db,store,rec) => new Promise((res,rej)=>{ const req=db.transaction(store,"readwrite").objectStore(store).put(rec); req.onsuccess=()=>res(req.result); req.onerror=()=>rej(req.error); });
const idbDelete = (db,store,id) => new Promise((res,rej)=>{ const req=db.transaction(store,"readwrite").objectStore(store).delete(id); req.onsuccess=()=>res(); req.onerror=()=>rej(req.error); });
const idbClear  = (db,store) => new Promise((res,rej)=>{ const req=db.transaction(store,"readwrite").objectStore(store).clear(); req.onsuccess=()=>res(); req.onerror=()=>rej(req.error); });
const sbH  = () => ({"Content-Type":"application/json",apikey:SUPABASE_ANON,Authorization:`Bearer ${SUPABASE_ANON}`,Prefer:"return=representation"});
const sbFetch = async (table,method="GET",body=null) => { const r=await fetch(`${SUPABASE_URL}/rest/v1/${table}`,{method,headers:sbH(),body:body?JSON.stringify(body):undefined}); if(!r.ok) throw new Error(await r.text()); return method==="DELETE"?null:r.json(); };
const sbUpsert = (t,rec) => sbFetch(t,"POST",rec);
const sbDelRec = (t,id)  => fetch(`${SUPABASE_URL}/rest/v1/${t}?id=eq.${id}`,{method:"DELETE",headers:sbH()});
const sbSelect = t => sbFetch(t,"GET");

function useSyncDB({onLoad}) {
  const dbRef=useRef(null);
  const [dbReady,setDbReady]=useState(false);
  const [online,setOnline]=useState(navigator.onLine);
  const [syncStatus,setSyncStatus]=useState("idle");
  const [pendingCount,setPendingCount]=useState(0);
  const isSyncing=useRef(false);

  const refreshPending=useCallback(async()=>{ if(!dbRef.current) return; const q=await idbGetAll(dbRef.current,"sync_queue"); setPendingCount(q.length); },[]);
  const flushQueue=useCallback(async()=>{
    if(isSyncing.current||!dbRef.current) return;
    const queue=await idbGetAll(dbRef.current,"sync_queue");
    if(!queue.length){setSyncStatus("idle");return;}
    isSyncing.current=true; setSyncStatus("syncing"); let err=0;
    for(const op of queue){
      try{
        if(op.op==="upsert") await sbUpsert(op.table,op.record);
        else if(op.op==="delete") await sbDelRec(op.table,op.record_id);
        await idbDelete(dbRef.current,"sync_queue",op.id);
      }catch(e){err++;console.warn("Sync fail:",e.message);}
    }
    isSyncing.current=false; setSyncStatus(err>0?"error":"idle"); refreshPending();
  },[refreshPending]);
  const pullRemote=useCallback(async()=>{
    setSyncStatus("syncing");
    try{
      const results={};
      await Promise.all(Object.entries(TABLE_MAP).map(async([store,table])=>{
        try{ const rows=await sbSelect(table); if(Array.isArray(rows)&&rows.length){await idbClear(dbRef.current,store);await Promise.all(rows.map(r=>idbPut(dbRef.current,store,r)));results[store]=rows;} }catch(e){console.warn(`Pull ${table}:`,e.message);}
      }));
      if(Object.keys(results).length) onLoad(results);
      setSyncStatus("idle");
    }catch(e){setSyncStatus("error");}
  },[onLoad]);
  const forceSync=useCallback(async()=>{ if(!navigator.onLine){setSyncStatus("offline");return;} await flushQueue(); await pullRemote(); },[flushQueue,pullRemote]);
  useEffect(()=>{
    (async()=>{
      const db=await openDB(); dbRef.current=db;
      const local={};
      await Promise.all(STORES.filter(s=>s!=="sync_queue").map(async s=>{local[s]=await idbGetAll(db,s);}));
      onLoad(local); setDbReady(true); refreshPending();
      if(navigator.onLine) forceSync();
    })();
  },[]);// eslint-disable-line
  useEffect(()=>{
    const goOn=()=>{setOnline(true);forceSync();}; const goOff=()=>{setOnline(false);setSyncStatus("offline");};
    window.addEventListener("online",goOn); window.addEventListener("offline",goOff);
    return()=>{window.removeEventListener("online",goOn);window.removeEventListener("offline",goOff);};
  },[forceSync]);
  const saveRecord=useCallback(async(store,record)=>{
    if(!dbRef.current) return;
    await idbPut(dbRef.current,store,record);
    await idbPut(dbRef.current,"sync_queue",{op:"upsert",table:TABLE_MAP[store]||store,record,timestamp:Date.now()});
    refreshPending(); if(navigator.onLine) flushQueue();
  },[flushQueue,refreshPending]);
  const deleteRecord=useCallback(async(store,id)=>{
    if(!dbRef.current) return;
    await idbDelete(dbRef.current,store,id);
    await idbPut(dbRef.current,"sync_queue",{op:"delete",table:TABLE_MAP[store]||store,record_id:id,timestamp:Date.now()});
    refreshPending(); if(navigator.onLine) flushQueue();
  },[flushQueue,refreshPending]);
  return{dbReady,online,syncStatus,pendingCount,forceSync,saveRecord,deleteRecord};
}

/* ═══════════════════════════════════ APP ═══════════════════════════════════ */
export default function App() {
  /* ── core state ── */
  const [page,      setPage]      = useState("dashboard");
  const [inv,       setInv]       = useState(INIT_INVENTORY);
  const [benes,     setBenes]     = useState(INIT_BENES);
  const [dists,     setDists]     = useState(INIT_DISTS);
  const [fleet,     setFleet]     = useState(INIT_FLEET);
  const [officers,  setOfficers]  = useState(INIT_OFFICERS);
  const [routes,    setRoutes]    = useState(INIT_ROUTES);
  const [warehouses,setWarehouses]= useState(INIT_WAREHOUSES);
  const [pods,      setPods]      = useState(INIT_PODS);
  const [users,     setUsers]     = useState(INIT_USERS);
  const [panel,     setPanel]     = useState(null);
  const [modal,     setModal]     = useState(null);
  const [editItem,  setEditItem]  = useState(null);
  const [toast,     setToast]     = useState(null);
  const [panelTab,  setPanelTab]  = useState("overview");
  /* ── inventory filters ── */
  const [srch, setSrch] = useState(""); const [catF,setCatF]=useState("All"); const [stF,setStF]=useState("All");
  /* ── scanner ── */
  const [scanResult,setScanResult]=useState(null);
  const [scannerActive,setScannerActive]=useState(true);
  const [scanLog,setScanLog]=useState([]);
  const [manualScanOpen,setManualScanOpen]=useState(false);
  const scanBuffer=useRef(""); const scanTimer=useRef(null);
  const invRef=useRef(inv); const distsRef=useRef(dists); const podsRef=useRef(pods);
  useEffect(()=>{invRef.current=inv;},[inv]);
  useEffect(()=>{distsRef.current=dists;},[dists]);
  useEffect(()=>{podsRef.current=pods;},[pods]);

  /* ── sync ── */
  const onDbLoad=useCallback((data)=>{
    if(data.inventory?.length)      setInv(data.inventory);
    if(data.distributions?.length)  setDists(data.distributions);
    if(data.beneficiaries?.length)  setBenes(data.beneficiaries);
    if(data.field_officers?.length) setOfficers(data.field_officers);
    if(data.fleet?.length)          setFleet(data.fleet);
    if(data.pods?.length)           setPods(data.pods);
    if(data.routes?.length)         setRoutes(data.routes);
    if(data.warehouses?.length)     setWarehouses(data.warehouses);
    if(data.users?.length)          setUsers(data.users);
  },[]);
  const {dbReady,online,syncStatus,pendingCount,forceSync,saveRecord,deleteRecord}=useSyncDB({onLoad:onDbLoad});

  const syncSet = useCallback((setter,store)=>(updater)=>{
    setter(prev=>{
      const next=typeof updater==="function"?updater(prev):updater;
      next.forEach(r=>saveRecord(store,r));
      return next;
    });
  },[saveRecord]);
  const syncSetInv   = useMemo(()=>syncSet(setInv,"inventory"),[syncSet]);
  const syncSetDists = useMemo(()=>syncSet(setDists,"distributions"),[syncSet]);
  const syncSetPods  = useMemo(()=>syncSet(setPods,"pods"),[syncSet]);
  const syncSetFleet = useMemo(()=>syncSet(setFleet,"fleet"),[syncSet]);
  const syncSetUsers = useMemo(()=>syncSet(setUsers,"users"),[syncSet]);

  /* ── helpers ── */
  const showToast  = useCallback((msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),3500); },[]);
  const openPanel  = useCallback((item,type)=>{ setPanel({item,type}); setPanelTab("overview"); },[]);
  const closePanel = useCallback(()=>setPanel(null),[]);
  const openModal  = useCallback((m,item=null)=>{ setModal(m); setEditItem(item); },[]);
  const closeModal = useCallback(()=>{ setModal(null); setEditItem(null); },[]);

  /* ── scanner logic ── */
  const handleScan = useCallback((code)=>{
    if(!code||code.length<3) return;
    const _inv=invRef.current, _dists=distsRef.current, _pods=podsRef.current;
    const invItem=_inv.find(i=>i.barcode===code);
    if(invItem){ setScanResult({type:"inventory",item:invItem,code}); setScanLog(l=>[{code,type:"inventory",label:invItem.name,time:new Date().toLocaleTimeString()},...l].slice(0,50)); return; }
    const dist=_dists.find(d=>d.ref===code);
    if(dist){ setScanResult({type:"distribution",item:dist,code}); setScanLog(l=>[{code,type:"distribution",label:dist.ref,time:new Date().toLocaleTimeString()},...l].slice(0,50)); return; }
    const pod=_pods.find(p=>p.ref===code);
    if(pod){ setScanResult({type:"pod",item:pod,code}); setScanLog(l=>[{code,type:"pod",label:pod.ref,time:new Date().toLocaleTimeString()},...l].slice(0,50)); return; }
    setScanLog(l=>[{code,type:"unknown",label:"Not found",time:new Date().toLocaleTimeString()},...l].slice(0,50));
    setScanResult({type:"unknown",item:null,code});
  },[showToast]);

  useEffect(()=>{
    if(!scannerActive) return;
    const onKey=(e)=>{
      const tag=document.activeElement?.tagName;
      if(tag==="INPUT"||tag==="TEXTAREA"||tag==="SELECT") return;
      if(e.key==="Enter"){ const buf=scanBuffer.current.trim(); if(buf.length>=3) handleScan(buf); scanBuffer.current=""; clearTimeout(scanTimer.current); return; }
      if(e.key.length===1){ scanBuffer.current+=e.key; clearTimeout(scanTimer.current); scanTimer.current=setTimeout(()=>{scanBuffer.current="";},80); }
    };
    window.addEventListener("keydown",onKey);
    return()=>window.removeEventListener("keydown",onKey);
  },[scannerActive,handleScan]);

  /* ── stats ── */
  const stats = useMemo(()=>{
    const lowStock=inv.filter(i=>i.qty<=i.min), expiring=inv.filter(i=>isExpSoon(i.expiry)&&!isExpired(i.expiry)), expired=inv.filter(i=>isExpired(i.expiry));
    return { activeDists:dists.filter(d=>d.status==="In Transit"||d.status==="Assigned").length, onTimePct:Math.round((dists.filter(d=>d.status==="Delivered").length/Math.max(dists.length,1))*100), itemsAvail:inv.filter(i=>i.qty>i.min).length, exceptions:lowStock.length+expiring.length+expired.length, totalValue:inv.reduce((a,i)=>a+i.qty*i.cost,0), totalRevenue:dists.reduce((a,d)=>a+d.rate,0), lowStock, expiring, expired };
  },[inv,dists]);

  /* ── nav ── */
  const NAV_GROUPS = [
    {id:"overview",label:null,items:[{id:"dashboard",icon:"⊞",label:"Dashboard"}]},
    {id:"operations",label:"Operations",items:[{id:"orders",icon:"≡",label:"Orders / Loads"},{id:"dispatch",icon:"⧉",label:"Dispatch Board"},{id:"routes",icon:"🗺",label:"Routes & Tracking"}]},
    {id:"assets",label:"Assets",items:[{id:"fleet",icon:"🚛",label:"Fleet"},{id:"officers",icon:"👤",label:"Field Officers"},{id:"warehouses",icon:"🏭",label:"Warehouses / Hubs"}]},
    {id:"inputs",label:"Inputs & People",items:[{id:"inventory",icon:"📦",label:"Inventory"},{id:"beneficiaries",icon:"👥",label:"Beneficiaries"}]},
    {id:"records",label:"Records",items:[{id:"pod",icon:"📄",label:"Proof of Delivery"},{id:"reports",icon:"📈",label:"Reports"}]},
    {id:"system",label:"System",items:[{id:"scanner",icon:"📷",label:"Barcode Scanner"},{id:"settings",icon:"⚙",label:"Settings"}]},
  ];
  const activeGroupId=NAV_GROUPS.find(g=>g.items.some(i=>i.id===page))?.id;
  const [openGroups,setOpenGroups]=useState(()=>{ const init={}; NAV_GROUPS.forEach(g=>{init[g.id]=g.id==="overview"||g.id===activeGroupId;}); return init; });
  const toggleGroup=id=>setOpenGroups(p=>({...p,[id]:!p[id]}));

  /* ═══════════════════ FORMS ═══════════════════ */
  const FleetForm = ({item,onSave,onClose}) => {
    const [f,setF]=useState(item||{plate:"",model:"",type:"Pickup",status:"Available",driver:"",loc:"",health:100,mileage:"",year:new Date().getFullYear(),lastInsp:"",nextInsp:"",inspResult:"Passed"});
    const up=(k,v)=>setF(p=>({...p,[k]:v}));
    return (
      <Overlay onClose={onClose} title={item?"Edit Vehicle":"+ Add New Vehicle"}>
        <FGrid>
          <FG label="Plate / Vehicle ID *"><FIn value={f.plate} onChange={v=>up("plate",v)} placeholder="e.g. TRK-006"/></FG>
          <FG label="Model *"><FIn value={f.model} onChange={v=>up("model",v)} placeholder="e.g. Toyota Hilux"/></FG>
          <FG label="Type"><FSel value={f.type} onChange={v=>up("type",v)} opts={["Pickup","Light Truck","Medium Truck","Van","SUV","Other"]}/></FG>
          <FG label="Year"><FIn type="number" value={f.year} onChange={v=>up("year",+v)}/></FG>
          <FG label="Status"><FSel value={f.status} onChange={v=>up("status",v)} opts={["Available","In Use","Maintenance"]}/></FG>
          <FG label="Health (%)"><FIn type="number" min="0" max="100" value={f.health} onChange={v=>up("health",Math.min(100,Math.max(0,+v)))}/></FG>
          <FG label="Assigned Officer"><FSel value={f.driver||""} onChange={v=>up("driver",v==="—"?"":v)} opts={["—",...officers.map(o=>o.name)]}/></FG>
          <FG label="Current Location"><FIn value={f.loc} onChange={v=>up("loc",v)} placeholder="e.g. Freetown Terminal"/></FG>
          <FG label="Mileage"><FIn value={f.mileage} onChange={v=>up("mileage",v)} placeholder="e.g. 45,000 km"/></FG>
          <FG label="Last Inspection"><FIn value={f.lastInsp} onChange={v=>up("lastInsp",v)} placeholder="e.g. Jan 2025"/></FG>
          <FG label="Next Inspection"><FIn value={f.nextInsp} onChange={v=>up("nextInsp",v)} placeholder="e.g. Jul 2025"/></FG>
          <FG label="Inspection Result"><FSel value={f.inspResult} onChange={v=>up("inspResult",v)} opts={["Passed","Advisory","Failed"]}/></FG>
        </FGrid>
        <div style={S.mfoot}>
          <button onClick={onClose} style={S.btnG}>Cancel</button>
          <button onClick={()=>{ if(!f.plate||!f.model) return showToast("Plate and model required","error"); onSave(f); onClose(); }} style={S.btn}>🚛 {item?"Update Vehicle":"Add Vehicle"}</button>
        </div>
      </Overlay>
    );
  };

  const DistForm = ({onSave,onClose}) => {
    const [f,setF]=useState({date:new Date().toISOString().split("T")[0],beneId:benes[0]?.id,itemId:inv[0]?.id,qty:"",season:SEASONS[0],officer:"",truck:"",status:"Unassigned",priority:"Medium",notes:"",rate:""});
    const up=(k,v)=>setF(p=>({...p,[k]:v}));
    const sel=inv.find(i=>i.id===+f.itemId);
    return (
      <Overlay onClose={onClose} title="+ Create New Distribution">
        <FGrid>
          <FG label="Date *"><FIn type="date" value={f.date} onChange={v=>up("date",v)}/></FG>
          <FG label="Season"><FSel value={f.season} onChange={v=>up("season",v)} opts={SEASONS}/></FG>
          <FG label="Beneficiary *" full><FSel value={f.beneId} onChange={v=>up("beneId",+v)} opts={benes.map(b=>({v:b.id,l:`${b.name} — ${b.group}`}))}/></FG>
          <FG label="Input Item *" full><FSel value={f.itemId} onChange={v=>up("itemId",+v)} opts={inv.map(i=>({v:i.id,l:`${i.name} (Available: ${i.qty-(i.qtyDistributed||0)-(i.qtyReserved||0)} ${i.unit})`}))}/></FG>
          <FG label="Quantity *"><FIn type="number" value={f.qty} onChange={v=>up("qty",v)} placeholder="0"/>{sel&&<small style={{color:"#16a34a",marginTop:3,display:"block"}}>Available: {sel.qty-(sel.qtyDistributed||0)-(sel.qtyReserved||0)} {sel.unit}</small>}</FG>
          <FG label="Priority"><FSel value={f.priority} onChange={v=>up("priority",v)} opts={["High","Medium","Low"]}/></FG>
          <FG label="Field Officer"><FSel value={f.officer} onChange={v=>up("officer",v==="—"?"":v)} opts={["—",...officers.map(o=>o.name)]}/></FG>
          <FG label="Vehicle"><FSel value={f.truck} onChange={v=>up("truck",v==="—"?"":v)} opts={["—",...fleet.map(t=>t.plate)]}/></FG>
          <FG label="Rate ($)"><FIn type="number" value={f.rate} onChange={v=>up("rate",v)} placeholder="0"/></FG>
          <FG label="Status"><FSel value={f.status} onChange={v=>up("status",v)} opts={STATUSES}/></FG>
          <FG label="Notes" full><textarea value={f.notes} onChange={e=>setF(p=>({...p,notes:e.target.value}))} style={{...S.fi,resize:"vertical",minHeight:60}}/></FG>
        </FGrid>
        <div style={S.mfoot}>
          <button onClick={onClose} style={S.btnG}>Cancel</button>
          <button onClick={()=>{
            if(!f.qty||!f.beneId) return showToast("Fill required fields","error");
            if(sel&&+f.qty>(sel.qty-(sel.qtyDistributed||0)-(sel.qtyReserved||0))) return showToast("Insufficient available stock!","error");
            const nid=Math.max(...dists.map(d=>d.id),0)+1;
            const lastRef=dists.reduce((mx,d)=>{ const n=parseInt(d.ref.split("-")[2]||"0"); return n>mx?n:mx; },1854);
            onSave({...f,id:nid,ref:`AG-${new Date().getFullYear()}-${String(lastRef+1).padStart(6,"0")}`,qty:+f.qty,rate:+f.rate||0});
            onClose();
          }} style={S.btn}>+ Create Distribution</button>
        </div>
      </Overlay>
    );
  };

  const InvForm = ({item,onSave,onClose}) => {
    const [f,setF]=useState(item||{name:"",cat:"Seeds",unit:"Kg",qty:"",qtyExpected:"",qtyDistributed:0,qtyReserved:0,min:"",supplier:"",cost:"",loc:"",expiry:"",procCode:"",procDate:"",receivedDate:""});
    const up=(k,v)=>setF(p=>({...p,[k]:v}));
    const variance = f.qty!==""&&f.qtyExpected!==""?+f.qty - +f.qtyExpected:null;
    const qtyAvail = f.qty!==""?(+f.qty)-(+f.qtyDistributed||0)-(+f.qtyReserved||0):null;
    return (
      <Overlay onClose={onClose} title={item?"Edit Item":"+ Add Inventory Item"} width="min(720px,96vw)">
        {/* ── Section: Procurement ── */}
        <div style={{padding:"14px 22px 0",borderBottom:"1px solid #f1f5f9",marginBottom:0}}>
          <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.7,marginBottom:10}}>📋 Procurement Details</div>
        </div>
        <FGrid>
          <FG label="Procurement Code / No. *"><FIn value={f.procCode} onChange={v=>up("procCode",v)} placeholder="e.g. PC-2025-001"/></FG>
          <FG label="Supplier *"><FIn value={f.supplier} onChange={v=>up("supplier",v)}/></FG>
          <FG label="Procurement Date"><FIn type="date" value={f.procDate||""} onChange={v=>up("procDate",v)}/></FG>
          <FG label="Date Received"><FIn type="date" value={f.receivedDate||""} onChange={v=>up("receivedDate",v)}/></FG>
        </FGrid>
        {/* ── Section: Item Details ── */}
        <div style={{padding:"14px 22px 0",borderBottom:"1px solid #f1f5f9",borderTop:"1px solid #f1f5f9",marginBottom:0}}>
          <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.7,marginBottom:10}}>📦 Item Details</div>
        </div>
        <FGrid>
          <FG label="Item Name *" full><FIn value={f.name} onChange={v=>up("name",v)} placeholder="e.g. Maize Seeds (OPV)"/></FG>
          <FG label="Category"><FSel value={f.cat} onChange={v=>up("cat",v)} opts={CATEGORIES}/></FG>
          <FG label="Unit"><FIn value={f.unit} onChange={v=>up("unit",v)} placeholder="Kg / Units / Litres"/></FG>
          <FG label="Qty Expected (Ordered)"><FIn type="number" value={f.qtyExpected} onChange={v=>up("qtyExpected",v)} placeholder="0"/></FG>
          <FG label="Qty Received (Actual) *">
            <FIn type="number" value={f.qty} onChange={v=>up("qty",v)}/>
            {variance!==null&&<small style={{marginTop:3,display:"block",fontWeight:600,color:variance<0?"#dc2626":variance>0?"#d97706":"#16a34a"}}>{variance<0?`⚠ ${Math.abs(variance)} units short`:variance>0?`↑ ${variance} surplus`:"✓ Exact match"}</small>}
          </FG>
          <FG label="Minimum Level"><FIn type="number" value={f.min} onChange={v=>up("min",v)}/></FG>
          <FG label="Unit Cost ($)"><FIn type="number" step="0.01" value={f.cost} onChange={v=>up("cost",v)}/></FG>
          <FG label="Storage Location"><FIn value={f.loc} onChange={v=>up("loc",v)} placeholder="Warehouse A"/></FG>
          <FG label="Expiry Date"><FIn type="date" value={f.expiry||""} onChange={v=>up("expiry",v)}/></FG>
        </FGrid>
        {/* ── Section: Distribution Activity (read-only for existing items) ── */}
        {item&&(
          <>
            <div style={{padding:"14px 22px 0",borderTop:"1px solid #f1f5f9",borderBottom:"1px solid #f1f5f9",marginBottom:0}}>
              <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.7,marginBottom:10}}>🚚 Distribution Activity</div>
            </div>
            <div style={{padding:"14px 22px"}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:4}}>
                {[
                  ["Received",     f.qty||0,              "#0f172a"],
                  ["Distributed",  f.qtyDistributed||0,   "#2563eb"],
                  ["Reserved",     f.qtyReserved||0,      "#d97706"],
                  ["Available",    qtyAvail!==null?qtyAvail:"—", qtyAvail!==null&&qtyAvail<=(+f.min||0)?"#dc2626":"#16a34a"],
                ].map(([l,v,c])=>(
                  <div key={l} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,padding:"10px 12px",textAlign:"center"}}>
                    <div style={{fontSize:20,fontWeight:800,color:c}}>{v}</div>
                    <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{l}</div>
                  </div>
                ))}
              </div>
              <p style={{fontSize:11,color:"#94a3b8",margin:"6px 0 0"}}>Distributed and Reserved figures are calculated from delivery records. To correct them, edit the related distributions or PODs.</p>
            </div>
          </>
        )}
        <div style={S.mfoot}>
          <button onClick={onClose} style={S.btnG}>Cancel</button>
          <button onClick={()=>{ if(!f.name||!f.qty) return showToast("Name and quantity required","error"); if(!f.procCode) return showToast("Procurement code required","error"); onSave({...f,qty:+f.qty,qtyExpected:+f.qtyExpected||0,qtyDistributed:+f.qtyDistributed||0,qtyReserved:+f.qtyReserved||0,min:+f.min||0,cost:+f.cost||0}); onClose(); }} style={S.btn}>📦 {item?"Update Item":"Add Item"}</button>
        </div>
      </Overlay>
    );
  };

  const UserForm = ({item,onSave,onClose}) => {
    const [f,setF]=useState(item||{name:"",email:"",role:"officer",status:"Active",phone:"",location:"Freetown",joined:new Date().getFullYear()+" "+["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][new Date().getMonth()]});
    const up=(k,v)=>setF(p=>({...p,[k]:v}));
    const role=USER_ROLES.find(r=>r.id===f.role);
    return (
      <Overlay onClose={onClose} title={item?"Edit User":"+ Add New User"}>
        <FGrid>
          <FG label="Full Name *" full><FIn value={f.name} onChange={v=>up("name",v)} placeholder="e.g. James Musa"/></FG>
          <FG label="Email *"><FIn type="email" value={f.email} onChange={v=>up("email",v)} placeholder="name@agroflow.sl"/></FG>
          <FG label="Phone"><FIn value={f.phone} onChange={v=>up("phone",v)} placeholder="076 000 000"/></FG>
          <FG label="Role *" full>
            <FSel value={f.role} onChange={v=>up("role",v)} opts={USER_ROLES.map(r=>({v:r.id,l:`${r.icon} ${r.label}`}))}/>
            {role&&<small style={{color:role.color,marginTop:4,display:"block",fontWeight:600}}>↳ {role.desc}</small>}
          </FG>
          <FG label="Status"><FSel value={f.status} onChange={v=>up("status",v)} opts={["Active","Inactive","Suspended"]}/></FG>
          <FG label="Base Location"><FSel value={f.location} onChange={v=>up("location",v)} opts={["Freetown","Bo","Makeni","Kenema","Koidu","Port Loko","Other"]}/></FG>
        </FGrid>
        {role&&(
          <div style={{margin:"0 22px 16px",background:role.bg,borderRadius:10,padding:14}}>
            <div style={{fontSize:12,fontWeight:700,color:role.color,marginBottom:8}}>PERMISSIONS FOR {role.label.toUpperCase()}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {(ROLE_PERMISSIONS[f.role]||[]).map(p=>(
                <span key={p} style={{background:"rgba(255,255,255,.7)",border:`1px solid ${role.color}40`,color:role.color,padding:"2px 8px",borderRadius:4,fontSize:11,fontWeight:600}}>✓ {p.replace(/_/g," ")}</span>
              ))}
            </div>
          </div>
        )}
        <div style={S.mfoot}>
          <button onClick={onClose} style={S.btnG}>Cancel</button>
          <button onClick={()=>{ if(!f.name||!f.email) return showToast("Name and email required","error"); const av=f.name.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase(); onSave({...f,avatar:av,lastLogin:item?f.lastLogin:"Never",joined:f.joined||"2025"}); onClose(); }} style={S.btn}>👤 {item?"Update User":"Add User"}</button>
        </div>
      </Overlay>
    );
  };

  const OfficerForm = ({item,onSave,onClose}) => {
    const [f,setF]=useState(item||{name:"",id_no:"",lic:"Class B",exp:"",status:"Available",hosRisk:"Low",rating:4.5,lastRun:"",location:""});
    const up=(k,v)=>setF(p=>({...p,[k]:v}));
    return (
      <Overlay onClose={onClose} title={item?"Edit Officer":"+ Add Field Officer"}>
        <FGrid>
          <FG label="Full Name *" full><FIn value={f.name} onChange={v=>up("name",v)}/></FG>
          <FG label="ID Number"><FIn value={f.id_no} onChange={v=>up("id_no",v)} placeholder="FO-006"/></FG>
          <FG label="Licence Class"><FSel value={f.lic} onChange={v=>up("lic",v)} opts={["Class A","Class B","Class C"]}/></FG>
          <FG label="Experience"><FIn value={f.exp} onChange={v=>up("exp",v)} placeholder="e.g. 3 yrs"/></FG>
          <FG label="Status"><FSel value={f.status} onChange={v=>up("status",v)} opts={["Available","On Trip","Off Duty"]}/></FG>
          <FG label="HOS Risk"><FSel value={f.hosRisk} onChange={v=>up("hosRisk",v)} opts={["Low","Medium","High"]}/></FG>
          <FG label="Base Location" full><FIn value={f.location} onChange={v=>up("location",v)} placeholder="e.g. Freetown Hub"/></FG>
        </FGrid>
        <div style={S.mfoot}>
          <button onClick={onClose} style={S.btnG}>Cancel</button>
          <button onClick={()=>{ if(!f.name) return showToast("Name required","error"); onSave({...f,avatar:f.name.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase(),rating:f.rating||4.5}); onClose(); }} style={S.btn}>👤 {item?"Update Officer":"Add Officer"}</button>
        </div>
      </Overlay>
    );
  };

  /* ═══════════════════ SCANNER UI ═══════════════════ */
  const ManualScanInput = () => {
    const [val,setVal]=useState(""); const ref=useRef();
    useEffect(()=>{ setTimeout(()=>ref.current?.focus(),50); },[]);
    const submit=()=>{ if(val.trim()){ handleScan(val.trim()); setVal(""); setManualScanOpen(false); } };
    return (
      <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:80,zIndex:400,backdropFilter:"blur(4px)"}}>
        <div style={{background:"#fff",borderRadius:16,padding:28,width:"min(440px,95vw)",boxShadow:"0 24px 48px rgba(0,0,0,.2)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
            <div><div style={{fontWeight:800,fontSize:17,color:"#0f172a"}}>📷 Barcode Scanner</div><div style={{fontSize:12,color:"#94a3b8",marginTop:3}}>Scan or type barcode manually</div></div>
            <button onClick={()=>setManualScanOpen(false)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#94a3b8"}}>✕</button>
          </div>
          <div style={{background:"#0f172a",borderRadius:12,padding:20,marginBottom:18,position:"relative",overflow:"hidden",textAlign:"center"}}>
            <div style={{position:"absolute",left:0,right:0,height:2,background:"#16a34a",boxShadow:"0 0 8px #16a34a",animation:"scanline 1.8s ease-in-out infinite",top:"40%"}}/>
            <div style={{fontSize:28,color:"rgba(255,255,255,.3)",marginBottom:6,letterSpacing:2}}>▮▯▮▮▯▮▯▯▮▯▮▮▯▮</div>
            <div style={{color:"rgba(255,255,255,.4)",fontSize:11}}>Point scanner at barcode or type below</div>
            <style>{`@keyframes scanline{0%{top:10%}50%{top:85%}100%{top:10%}}`}</style>
          </div>
          <div style={{display:"flex",gap:10,marginBottom:14}}>
            <input ref={ref} value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="INV-00001 · AG-2025-001847 · POD-2025-001" style={{...S.fi,fontFamily:"monospace",fontSize:14,flex:1,letterSpacing:1}}/>
            <button onClick={submit} style={{...S.btn,padding:"9px 18px"}}>Scan</button>
          </div>
          <div style={{fontSize:11,color:"#94a3b8",fontWeight:600,marginBottom:8}}>QUICK TEST — click to simulate a scan:</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {["INV-00001","INV-00003","AG-2025-001847","AG-2025-001851","POD-2025-001","POD-2025-004"].map(c=>(
              <button key={c} onClick={()=>{handleScan(c);setManualScanOpen(false);}} style={{padding:"4px 10px",background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:6,fontSize:11,fontFamily:"monospace",cursor:"pointer",color:"#374151"}}>{c}</button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const ScanResultModal = () => {
    if(!scanResult) return null;
    const {type,item,code}=scanResult;
    const [adjQty,setAdjQty]=useState(1);
    const [adjMode,setAdjMode]=useState("receive");
    const close=()=>setScanResult(null);
    const isInv=type==="inventory", isDist=type==="distribution", isPod=type==="pod", isUnk=type==="unknown";
    const distItem=isDist?inv.find(x=>x.id===item?.itemId):null;
    const distBene=isDist?benes.find(x=>x.id===item?.beneId):null;
    return (
      <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:400,backdropFilter:"blur(4px)"}}>
        <div style={{background:"#fff",borderRadius:16,width:"min(480px,96vw)",maxHeight:"92vh",overflow:"auto",boxShadow:"0 24px 48px rgba(0,0,0,.25)"}}>
          <div style={{padding:"18px 22px",borderBottom:"1px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:38,height:38,borderRadius:10,background:isInv?"#f0fdf4":isDist?"#eff6ff":isPod?"#fef9c3":"#fee2e2",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{isInv?"📦":isDist?"🚜":isPod?"📄":"❓"}</div>
              <div><div style={{fontWeight:800,fontSize:15,color:"#0f172a"}}>{isInv?"Inventory Item":isDist?"Distribution":isPod?"Proof of Delivery":"Unknown Barcode"}</div><div style={{fontSize:11,color:"#94a3b8",fontFamily:"monospace",marginTop:2}}>{code}</div></div>
            </div>
            <button onClick={close} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#94a3b8"}}>✕</button>
          </div>
          <div style={{padding:22}}>
            {isInv&&(
              <div>
                <div style={{background:"#f8fafc",borderRadius:12,padding:16,marginBottom:16}}>
                  <div style={{fontWeight:700,fontSize:16,color:"#0f172a",marginBottom:4}}>{item.name}</div>
                  <div style={{fontSize:12,color:"#64748b",marginBottom:12}}>{item.cat} · {item.supplier} · {item.loc}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>
                    {[["In Stock",item.qty,item.qty<=item.min?"#dc2626":"#16a34a"],["Min Level",item.min,"#374151"],["Unit Cost",`$${item.cost}`,"#374151"]].map(([l,v,c])=>(
                      <div key={l} style={{textAlign:"center",background:"#fff",borderRadius:8,padding:10}}><div style={{fontSize:22,fontWeight:800,color:c}}>{v}</div><div style={{fontSize:11,color:"#94a3b8"}}>{l}</div></div>
                    ))}
                  </div>
                  <div style={{display:"flex",justifyContent:"center"}}><BarcodeDisplay code={code} width={200} height={40} showText={true}/></div>
                </div>
                <div style={{background:"#f8fafc",borderRadius:10,padding:14,marginBottom:16}}>
                  <div style={{display:"flex",gap:8,marginBottom:12}}>
                    {["receive","issue"].map(m=><button key={m} onClick={()=>setAdjMode(m)} style={{flex:1,padding:"8px 12px",background:adjMode===m?(m==="receive"?"#16a34a":"#d97706"):"#fff",border:`1px solid ${adjMode===m?(m==="receive"?"#16a34a":"#d97706"):"#e2e8f0"}`,borderRadius:8,cursor:"pointer",color:adjMode===m?"#fff":"#374151",fontWeight:700,fontSize:13}}>{m==="receive"?"📥 Receive":"📤 Issue"}</button>)}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <button onClick={()=>setAdjQty(q=>Math.max(1,q-1))} style={{...S.btnO,padding:"8px 14px",fontSize:18}}>−</button>
                    <input type="number" value={adjQty} min={1} onChange={e=>setAdjQty(Math.max(1,+e.target.value))} style={{...S.fi,textAlign:"center",fontSize:20,fontWeight:800,width:80}}/>
                    <button onClick={()=>setAdjQty(q=>q+1)} style={{...S.btnO,padding:"8px 14px",fontSize:18}}>+</button>
                    <span style={{fontSize:13,color:"#64748b"}}>{item.unit}</span>
                  </div>
                </div>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>{ const delta=adjMode==="receive"?adjQty:-adjQty; syncSetInv(v=>v.map(x=>x.id===item.id?{...x,qty:Math.max(0,x.qty+delta)}:x)); showToast(`${adjMode==="receive"?"Added":"Issued"} ${adjQty} ${item.unit}`); close(); }} style={{...S.btn,flex:1,textAlign:"center",padding:12}}>{adjMode==="receive"?"📥 Confirm Receive":"📤 Confirm Issue"}</button>
                  <button onClick={()=>{setPage("inventory");close();}} style={{...S.btnO,padding:"12px 16px"}}>View Record</button>
                </div>
              </div>
            )}
            {isDist&&(
              <div>
                <div style={{background:"#f8fafc",borderRadius:12,padding:16,marginBottom:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div style={{fontWeight:700,fontSize:15,color:"#0f172a"}}>{item.ref}</div><StatusPill s={item.status}/></div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                    {[["Beneficiary",distBene?.name||"—"],["Group",distBene?.group||"—"],["Item",distItem?.name||"—"],["Quantity",`${item.qty} ${distItem?.unit||""}`],["Officer",item.officer||"Unassigned"],["Vehicle",item.truck||"—"]].map(([l,v])=>(
                      <div key={l} style={{background:"#fff",borderRadius:8,padding:"8px 10px"}}><div style={{fontSize:10,color:"#94a3b8"}}>{l}</div><div style={{fontSize:13,fontWeight:600,color:"#0f172a",marginTop:1}}>{v}</div></div>
                    ))}
                  </div>
                  <div style={{display:"flex",justifyContent:"center"}}><BarcodeDisplay code={item.ref} width={220} height={38}/></div>
                </div>
                <div style={{display:"flex",gap:10}}>
                  {item.status!=="Delivered"&&<button onClick={()=>{ syncSetDists(ds=>ds.map(d=>d.id===item.id?{...d,status:"Delivered"}:d)); showToast(`${item.ref} marked Delivered ✓`); close(); }} style={{...S.btn,flex:1,textAlign:"center",padding:12}}>✅ Mark Delivered</button>}
                  {item.status==="Unassigned"&&<button onClick={()=>{ syncSetDists(ds=>ds.map(d=>d.id===item.id?{...d,status:"Assigned"}:d)); showToast("Marked as Assigned"); close(); }} style={{...S.btnO,flex:1,padding:12,borderColor:"#2563eb",color:"#1d4ed8"}}>Assign →</button>}
                  <button onClick={()=>{setPage("orders");close();}} style={{...S.btnO,padding:"12px 16px"}}>Open Record</button>
                </div>
              </div>
            )}
            {isPod&&(
              <div>
                <div style={{background:"#f8fafc",borderRadius:12,padding:16,marginBottom:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div style={{fontWeight:700,fontSize:15,color:"#0f172a"}}>{item.ref}</div><span style={{background:item.verified?"#dcfce7":"#fef9c3",color:item.verified?"#15803d":"#854d0e",padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:700}}>{item.verified?"Verified":"Pending"}</span></div>
                  <Pill l="Dist. Ref" v={item.distRef}/><Pill l="Received By" v={item.receivedBy}/><Pill l="Condition" v={item.condition}/>
                  <div style={{display:"flex",justifyContent:"center",marginTop:10}}><BarcodeDisplay code={item.ref} width={180} height={36}/></div>
                </div>
                <div style={{display:"flex",gap:10}}>
                  {!item.verified&&<button onClick={()=>{ syncSetPods(ps=>ps.map(p=>p.id===item.id?{...p,verified:true}:p)); showToast(`${item.ref} verified ✓`); close(); }} style={{...S.btn,flex:1,textAlign:"center",padding:12}}>✅ Verify POD</button>}
                  <button onClick={()=>{setPage("pod");close();}} style={{...S.btnO,flex:1,textAlign:"center",padding:12}}>Open POD</button>
                </div>
              </div>
            )}
            {isUnk&&(
              <div style={{textAlign:"center",padding:"20px 0"}}>
                <div style={{fontSize:48,marginBottom:12}}>❓</div>
                <div style={{fontWeight:700,fontSize:16,color:"#0f172a",marginBottom:6}}>Barcode Not Recognised</div>
                <div style={{fontFamily:"monospace",background:"#f8fafc",padding:"8px 16px",borderRadius:8,display:"inline-block",marginBottom:16}}>{code}</div>
                <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                  <button onClick={()=>{openModal("inv");close();}} style={S.btn}>+ Add as New Item</button>
                  <button onClick={close} style={S.btnO}>Dismiss</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ═══════════════════ PAGES ═══════════════════ */
  const Dashboard = () => {
    const recentDists=dists.slice(-5).reverse();
    const catBreakdown=CATEGORIES.map(c=>({cat:c,count:inv.filter(i=>i.cat===c).length,value:inv.filter(i=>i.cat===c).reduce((a,i)=>a+i.qty*i.cost,0)})).filter(x=>x.count>0);
    return (
      <div>
        <PageHead title="Dashboard" sub={`Overview for ${fmtDate(new Date().toISOString().split("T")[0])}`}>
          <button onClick={()=>setPage("reports")} style={S.btnO}>📈 View Reports</button>
          <button onClick={()=>setModal("dist")} style={S.btn}>+ New Distribution</button>
        </PageHead>
        {/* KPI row */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
          {[{l:"Active Distributions",v:stats.activeDists,bg:"#eff6ff",c:"#2563eb",ic:"🚜"},{l:"On-Time Rate",v:`${stats.onTimePct}%`,bg:"#f0fdf4",c:"#16a34a",ic:"✅"},{l:"Items Available",v:stats.itemsAvail,bg:"#faf5ff",c:"#7c3aed",ic:"📦"},{l:"Alerts",v:stats.exceptions,bg:"#fff7ed",c:"#ea580c",ic:"⚠"}].map((c,i)=>(
            <div key={i} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:"16px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",boxShadow:"0 1px 3px rgba(0,0,0,.05)"}}>
              <div><div style={{fontSize:28,fontWeight:800,color:c.c}}>{c.v}</div><div style={{fontSize:12,color:"#64748b",marginTop:3}}>{c.l}</div></div>
              <div style={{width:44,height:44,borderRadius:12,background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{c.ic}</div>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
          {/* Recent distributions */}
          <div style={S.card}>
            <div style={S.ch}>🚜 Recent Distributions</div>
            {recentDists.map((d,i)=>{ const b=benes.find(x=>x.id===d.beneId); const it=inv.find(x=>x.id===d.itemId); return (
              <div key={d.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 20px",borderBottom:"1px solid #f8fafc",cursor:"pointer"}} onClick={()=>openPanel(d,"dist")}>
                <div style={{display:"flex",alignItems:"center",gap:10}}><Av label={b?.avatar||"?"} idx={i} size={32}/><div><div style={{fontWeight:600,fontSize:13,color:"#0f172a"}}>{b?.name||"—"}</div><div style={{fontSize:11,color:"#94a3b8"}}>{it?.name||"—"} · {fmtDate(d.date)}</div></div></div>
                <StatusPill s={d.status}/>
              </div>
            );})}
            <button onClick={()=>setPage("orders")} style={{...S.clr,width:"100%",textAlign:"center",padding:10,fontSize:12}}>View all orders →</button>
          </div>
          {/* Alerts */}
          <div style={S.card}>
            <div style={S.ch}>⚠ Stock Alerts</div>
            {stats.lowStock.length===0&&stats.expiring.length===0&&stats.expired.length===0&&<p style={{padding:"16px 20px",color:"#94a3b8",fontSize:13}}>No alerts — all stock levels are healthy.</p>}
            {stats.expired.map(i=><div key={i.id} style={{padding:"10px 20px",borderBottom:"1px solid #f8fafc",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:600,fontSize:13,color:"#dc2626"}}>🔴 {i.name}</div><div style={{fontSize:11,color:"#94a3b8"}}>Expired: {fmtDate(i.expiry)}</div></div><button onClick={()=>openModal("editInv",i)} style={{...S.icnBtn,fontSize:11,color:"#dc2626"}}>Review</button></div>)}
            {stats.expiring.map(i=><div key={i.id} style={{padding:"10px 20px",borderBottom:"1px solid #f8fafc",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:600,fontSize:13,color:"#d97706"}}>🟡 {i.name}</div><div style={{fontSize:11,color:"#94a3b8"}}>Expires: {fmtDate(i.expiry)}</div></div><button onClick={()=>openModal("editInv",i)} style={{...S.icnBtn,fontSize:11,color:"#d97706"}}>Review</button></div>)}
            {stats.lowStock.map(i=><div key={i.id} style={{padding:"10px 20px",borderBottom:"1px solid #f8fafc",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:600,fontSize:13,color:"#ea580c"}}>⚠️ {i.name}</div><div style={{fontSize:11,color:"#94a3b8"}}>Stock: {i.qty} / Min: {i.min}</div></div><button onClick={()=>openModal("editInv",i)} style={{...S.icnBtn,fontSize:11,color:"#ea580c"}}>Reorder</button></div>)}
          </div>
        </div>
        {/* Category breakdown */}
        <div style={S.card}>
          <div style={S.ch}>📦 Inventory by Category</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,padding:16}}>
            {catBreakdown.map(c=>(
              <div key={c.cat} style={{background:"#f8fafc",borderRadius:10,padding:14,display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:38,height:38,borderRadius:10,background:catColor(c.cat)+"1a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,color:catColor(c.cat),fontWeight:700}}>{c.count}</div>
                <div><div style={{fontWeight:700,color:"#0f172a",fontSize:13}}>{c.cat}</div><div style={{fontSize:12,color:"#64748b"}}>${c.value.toLocaleString()} total value</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const OrdersPage = () => {
    const [sf,setSf]=useState("All"); const [pf,setPf]=useState("All"); const [q,setQ]=useState("");
    const rows=dists.filter(d=>{ const b=benes.find(x=>x.id===d.beneId); const it=inv.find(x=>x.id===d.itemId); const txt=`${d.ref} ${b?.name||""} ${it?.name||""}`.toLowerCase(); return (sf==="All"||d.status===sf)&&(pf==="All"||d.priority===pf)&&(!q||txt.includes(q.toLowerCase())); });
    return (
      <div>
        <PageHead title="Orders / Loads" sub={`${dists.length} total records`}>
          <button onClick={()=>setManualScanOpen(true)} style={{...S.btnO,borderColor:"#86efac",color:"#15803d"}}>📷 Scan Load</button>
          <button onClick={()=>setModal("dist")} style={S.btn}>+ Create New Load</button>
        </PageHead>
        <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
          <span style={S.fl}>Status:</span>
          <select style={S.fsel} value={sf} onChange={e=>setSf(e.target.value)}><option value="All">All Status</option>{STATUSES.map(s=><option key={s}>{s}</option>)}</select>
          <span style={S.fl}>Priority:</span>
          <select style={S.fsel} value={pf} onChange={e=>setPf(e.target.value)}><option value="All">All</option>{["High","Medium","Low"].map(p=><option key={p}>{p}</option>)}</select>
          <input style={{...S.fsel,minWidth:220}} placeholder="Search loads…" value={q} onChange={e=>setQ(e.target.value)}/>
          <button onClick={()=>{setSf("All");setPf("All");setQ("");}} style={S.clr}>✕ Clear</button>
        </div>
        <div style={S.card}>
          <table style={S.tbl}>
            <thead><tr style={S.thead}>{["Load ID","Beneficiary","Item","Date","Status","Officer","Vehicle","Rate","Priority","POD","Scan"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((d,i)=>{ const b=benes.find(x=>x.id===d.beneId); const it=inv.find(x=>x.id===d.itemId); return (
                <tr key={d.id} style={S.tr} onClick={()=>openPanel(d,"dist")} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                  <td style={S.td}><span style={{color:"#2563eb",fontWeight:700,fontSize:13}}>{d.ref}</span></td>
                  <td style={S.td}><div style={{display:"flex",alignItems:"center",gap:8}}><Av label={b?.avatar||"?"} idx={i}/><div><div style={{fontWeight:600,fontSize:13}}>{b?.name||"—"}</div><div style={{fontSize:11,color:"#94a3b8"}}>{b?.group||""}</div></div></div></td>
                  <td style={{...S.td,fontSize:12}}>{it?.name||"—"}</td>
                  <td style={{...S.td,fontSize:12,color:"#64748b"}}>{fmtDate(d.date)}</td>
                  <td style={S.td}><StatusPill s={d.status}/></td>
                  <td style={S.td}>{d.officer?<div style={{display:"flex",alignItems:"center",gap:6}}><Av label={d.officer.split(" ").map(x=>x[0]).join("")} idx={i+2} size={26}/><span style={{fontSize:12}}>{d.officer}</span></div>:<span style={{color:"#94a3b8",fontSize:12}}>—</span>}</td>
                  <td style={{...S.td,fontSize:12,color:"#64748b"}}>{d.truck||"—"}</td>
                  <td style={{...S.td,fontWeight:700}}>${d.rate}</td>
                  <td style={S.td}><PriorityTag p={d.priority}/></td>
                  <td style={S.td}>{d.status==="Delivered"?<span>✅</span>:<span style={{color:"#cbd5e1"}}>○</span>}</td>
                  <td style={S.td}><button onClick={e=>{e.stopPropagation();handleScan(d.ref);}} style={{...S.icnBtn,color:"#15803d",fontSize:12}}>📷</button></td>
                </tr>
              );})}
            </tbody>
          </table>
          {!rows.length&&<p style={{textAlign:"center",color:"#94a3b8",padding:32}}>No records match your filters.</p>}
        </div>
      </div>
    );
  };

  const DispatchBoard = () => (
    <div>
      <PageHead title="Dispatch Board" sub="Distribution pipeline by status">
        <button onClick={()=>setModal("dist")} style={S.btn}>+ New Load</button>
      </PageHead>
      <div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:16}}>
        {STATUSES.map(col=>{ const cards=dists.filter(d=>d.status===col); const st=statusStyle(col);
          return (
            <div key={col} style={{minWidth:230,flex:"0 0 230px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <span style={{width:10,height:10,borderRadius:"50%",background:st.c}}/>
                <span style={{fontWeight:700,fontSize:14,color:"#0f172a"}}>{col}</span>
                <span style={{background:"#f1f5f9",color:"#64748b",borderRadius:20,padding:"1px 8px",fontSize:12,fontWeight:600,marginLeft:"auto"}}>{cards.length}</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {cards.map((d,i)=>{ const b=benes.find(x=>x.id===d.beneId); const it=inv.find(x=>x.id===d.itemId); return (
                  <div key={d.id} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:14,cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,.05)"}} onClick={()=>openPanel(d,"dist")} onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 14px rgba(0,0,0,.1)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,.05)"}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:11,fontWeight:700,color:"#2563eb"}}>{d.ref}</span><PriorityTag p={d.priority}/></div>
                    <div style={{fontWeight:700,fontSize:13,color:"#0f172a",marginBottom:2}}>{b?.name||"—"}</div>
                    <div style={{fontSize:11,color:"#64748b",marginBottom:6}}>{it?.name||"—"} · {d.qty} {it?.unit||""}</div>
                    <div style={{fontSize:11,color:"#94a3b8"}}>📅 {fmtDate(d.date)}</div>
                    {d.officer?<div style={{display:"flex",alignItems:"center",gap:6,marginTop:8}}><Av label={d.officer.split(" ").map(x=>x[0]).join("")} idx={i} size={22}/><span style={{fontSize:11}}>{d.officer}</span></div>:<span style={{fontSize:11,color:"#94a3b8",fontStyle:"italic"}}>Unassigned</span>}
                  </div>
                );})}
                {!cards.length&&<div style={{background:"#f8fafc",border:"2px dashed #e2e8f0",borderRadius:10,padding:"24px 14px",textAlign:"center",color:"#cbd5e1",fontSize:12}}>No loads</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const FleetPage = () => {
    const avail=fleet.filter(f=>f.status==="Available").length;
    const inUse=fleet.filter(f=>f.status==="In Use").length;
    const maint=fleet.filter(f=>f.status==="Maintenance").length;
    const avgH=Math.round(fleet.reduce((a,f)=>a+f.health,0)/fleet.length);
    return (
      <div>
        <PageHead title="Fleet" sub={`${fleet.length} registered vehicles`}>
          <button onClick={()=>showToast("Import feature coming soon")} style={S.btnO}>↓ Import</button>
          <button onClick={()=>showToast("Maintenance scheduler coming soon")} style={S.btnO}>🔧 Schedule Maintenance</button>
          <button onClick={()=>openModal("fleet")} style={S.btn}>+ Add Vehicle</button>
        </PageHead>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:14,marginBottom:20}}>
          {[{l:"Total",v:fleet.length,bg:"#eff6ff"},{l:"Available",v:avail,bg:"#f0fdf4"},{l:"In Use",v:inUse,bg:"#fef9c3"},{l:"Maintenance",v:maint,bg:"#fee2e2"},{l:"Avg Health",v:`${avgH}%`,bg:"#f0fdf4"}].map((c,i)=>(
            <div key={i} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:26,fontWeight:800,color:"#0f172a"}}>{c.v}</div><div style={{fontSize:12,color:"#64748b",marginTop:2}}>{c.l}</div></div>
              <div style={{width:42,height:42,borderRadius:10,background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🚛</div>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <table style={S.tbl}>
            <thead><tr style={S.thead}>{["Vehicle","Type","Status","Officer","Location","Last Ping","Health","Actions"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {fleet.map((v,i)=>(
                <tr key={v.id} style={S.tr} onClick={()=>openPanel(v,"fleet")} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                  <td style={S.td}><div style={{fontWeight:700}}>{v.plate}</div><div style={{fontSize:11,color:"#94a3b8"}}>{v.model}</div></td>
                  <td style={{...S.td,fontSize:12,color:"#64748b"}}>{v.type}</td>
                  <td style={S.td}><StatusPill s={v.status}/></td>
                  <td style={S.td}>{v.driver?<div style={{display:"flex",alignItems:"center",gap:8}}><Av label={v.driver.split(" ").map(x=>x[0]).join("")} idx={i} size={28}/><span style={{fontSize:12}}>{v.driver}</span></div>:<span style={{color:"#94a3b8",fontSize:12}}>Unassigned</span>}</td>
                  <td style={{...S.td,fontSize:12}}>{v.loc}</td>
                  <td style={{...S.td,fontSize:12,color:"#64748b"}}>{v.lastPing}</td>
                  <td style={S.td}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:60,height:6,borderRadius:3,background:"#e2e8f0",overflow:"hidden"}}><div style={{height:"100%",width:`${v.health}%`,background:healthClr(v.health),borderRadius:3}}/></div><span style={{fontSize:12,fontWeight:700,color:healthClr(v.health)}}>{v.health}%</span></div></td>
                  <td style={S.td}>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={e=>{e.stopPropagation();openModal("editFleet",v);}} style={S.icnBtn} title="Edit">✏️</button>
                      <button onClick={e=>{e.stopPropagation();if(window.confirm(`Delete ${v.plate}?`)){deleteRecord("fleet",v.id);setFleet(p=>p.filter(x=>x.id!==v.id));showToast("Vehicle removed");}}} style={{...S.icnBtn,color:"#dc2626"}} title="Delete">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const OfficersPage = () => {
    const [q,setQ]=useState(""); const [stF2,setStF2]=useState("All");
    const rows=officers.filter(o=>(stF2==="All"||o.status===stF2)&&(!q||o.name.toLowerCase().includes(q.toLowerCase())));
    return (
      <div>
        <PageHead title="Field Officers" sub={`${officers.length} active officers`}>
          <input style={{...S.fsel,minWidth:200}} placeholder="🔍 Search officers…" value={q} onChange={e=>setQ(e.target.value)}/>
          <select style={S.fsel} value={stF2} onChange={e=>setStF2(e.target.value)}><option value="All">All Status</option>{["Available","On Trip","Off Duty"].map(s=><option key={s}>{s}</option>)}</select>
          <button onClick={()=>showToast("Export feature coming soon")} style={S.btnO}>↓ Export</button>
          <button onClick={()=>openModal("officer")} style={S.btn}>+ Add Officer</button>
        </PageHead>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
          {[{l:"Total Officers",v:officers.length,bg:"#eff6ff"},{l:"Available Now",v:officers.filter(o=>o.status==="Available").length,bg:"#f0fdf4"},{l:"HOS Risk Alerts",v:officers.filter(o=>o.hosRisk==="High").length,bg:"#fee2e2"},{l:"Avg Rating",v:`${(officers.reduce((a,o)=>a+o.rating,0)/officers.length).toFixed(1)} ★`,bg:"#fef9c3"}].map((c,i)=>(
            <div key={i} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:26,fontWeight:800,color:"#0f172a"}}>{c.v}</div><div style={{fontSize:12,color:"#64748b",marginTop:2}}>{c.l}</div></div>
              <div style={{width:42,height:42,borderRadius:10,background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>👤</div>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <table style={S.tbl}>
            <thead><tr style={S.thead}>{["Officer","Status","HOS Risk","Rating","Last Run","Location","Actions"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((o,i)=>(
                <tr key={o.id} style={S.tr} onClick={()=>openPanel(o,"officer")} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                  <td style={S.td}><div style={{display:"flex",alignItems:"center",gap:10}}><Av label={o.avatar} idx={i} size={38}/><div><div style={{fontWeight:700,fontSize:14}}>{o.name}</div><div style={{fontSize:11,color:"#94a3b8"}}>{o.id_no} · {o.lic} · {o.exp}</div></div></div></td>
                  <td style={S.td}><StatusPill s={o.status}/></td>
                  <td style={S.td}><span style={{width:10,height:10,borderRadius:"50%",background:hosColor(o.hosRisk),display:"inline-block",marginRight:6}}/><span style={{fontSize:12,color:hosColor(o.hosRisk),fontWeight:600}}>{o.hosRisk}</span></td>
                  <td style={S.td}><span style={{fontWeight:700}}>{"★".repeat(Math.round(o.rating))}</span><span style={{color:"#64748b",fontSize:12}}> {o.rating}</span></td>
                  <td style={{...S.td,fontSize:12}}>{o.lastRun||"—"}</td>
                  <td style={{...S.td,fontSize:12}}>{o.location}</td>
                  <td style={S.td}>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={e=>{e.stopPropagation();openModal("officer",o);}} style={S.icnBtn} title="Edit">✏️</button>
                      <button onClick={e=>{e.stopPropagation();if(window.confirm(`Remove ${o.name}?`)){deleteRecord("field_officers",o.id);setOfficers(p=>p.filter(x=>x.id!==o.id));showToast("Officer removed");}}} style={{...S.icnBtn,color:"#dc2626"}} title="Delete">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length&&<p style={{textAlign:"center",color:"#94a3b8",padding:32}}>No officers match.</p>}
        </div>
      </div>
    );
  };

  const InventoryPage = () => {
    const [procF,setProcF]=useState("All");
    const [viewMode,setViewMode]=useState("grouped"); // "grouped" | "flat"

    /* ── filter rows ── */
    const rows=inv.filter(i=>
      (catF==="All"||i.cat===catF)&&
      (stF==="All"||(stF==="Low"?i.qty<=i.min:i.qty>i.min))&&
      (procF==="All"||i.procCode===procF)&&
      (!srch||i.name.toLowerCase().includes(srch.toLowerCase())||
              i.supplier.toLowerCase().includes(srch.toLowerCase())||
              (i.procCode||"").toLowerCase().includes(srch.toLowerCase()))
    );

    /* ── derive sorted unique procurement codes ── */
    const allProcCodes=[...new Set(inv.map(i=>i.procCode).filter(Boolean))].sort();

    /* ── group rows by procurement code ── */
    const grouped=allProcCodes.reduce((acc,pc)=>{
      const items=rows.filter(i=>i.procCode===pc);
      if(items.length) acc[pc]=items;
      return acc;
    },{});
    const ungrouped=rows.filter(i=>!i.procCode);
    if(ungrouped.length) grouped["—"]=ungrouped;

    /* ── grand totals ── */
    const grandQtyExp   = rows.reduce((a,i)=>a+(i.qtyExpected||0),0);
    const grandQtyRec   = rows.reduce((a,i)=>a+i.qty,0);
    const grandQtyDist  = rows.reduce((a,i)=>a+(i.qtyDistributed||0),0);
    const grandQtyResv  = rows.reduce((a,i)=>a+(i.qtyReserved||0),0);
    const grandQtyAvail = grandQtyRec - grandQtyDist - grandQtyResv;
    const grandValue    = rows.reduce((a,i)=>a+i.qty*i.cost,0);
    const grandAvailVal = rows.reduce((a,i)=>a+(i.qty-(i.qtyDistributed||0)-(i.qtyReserved||0))*i.cost,0);
    const grandVariance = grandQtyRec - grandQtyExp;

    /* ── row renderer (used in both views) ── */
    const ItemRow=({item})=>{
      const qtyAvail = item.qty - (item.qtyDistributed||0) - (item.qtyReserved||0);
      const low=qtyAvail<=item.min, exp=isExpired(item.expiry), soon=isExpSoon(item.expiry);
      const procVariance=(item.qtyExpected||0)>0?item.qty-(item.qtyExpected||0):null;
      return (
        <tr key={item.id} style={S.tr} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background=""}>
          <td style={S.td}>
            <div style={{fontWeight:600,fontSize:13}}>{exp&&"🔴 "}{soon&&!exp&&"🟡 "}{low&&!exp&&"⚠️ "}{item.name}</div>
            <div style={{fontSize:11,color:"#94a3b8"}}>{item.supplier}</div>
          </td>
          <td style={S.td}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer"}} onClick={()=>handleScan(item.barcode)} title="Click to simulate scan">
              <BarcodeDisplay code={item.barcode} width={80} height={22} showText={false} mini/>
              <span style={{fontSize:9,fontFamily:"monospace",color:"#94a3b8"}}>{item.barcode}</span>
            </div>
          </td>
          <td style={S.td}><span style={{background:catColor(item.cat)+"1a",color:catColor(item.cat),padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:600}}>{item.cat}</span></td>
          {/* Procurement qty */}
          <td style={{...S.td,textAlign:"right",fontWeight:700,fontSize:13,color:"#64748b"}}>{(item.qtyExpected||0)||"—"}</td>
          <td style={{...S.td,textAlign:"right",fontWeight:700,fontSize:13,color:"#374151"}}>{item.qty}</td>
          <td style={{...S.td,textAlign:"right"}}>
            {procVariance!==null?(
              <span style={{fontWeight:700,fontSize:12,color:procVariance<0?"#dc2626":procVariance>0?"#d97706":"#94a3b8"}}>
                {procVariance<0?`−${Math.abs(procVariance)}`:procVariance>0?`+${procVariance}`:"="}
              </span>
            ):<span style={{color:"#cbd5e1"}}>—</span>}
          </td>
          {/* Distribution movement */}
          <td style={{...S.td,textAlign:"right",color:"#2563eb",fontWeight:700,fontSize:13}}>
            {(item.qtyDistributed||0)>0?item.qtyDistributed:<span style={{color:"#cbd5e1",fontWeight:400}}>—</span>}
          </td>
          <td style={{...S.td,textAlign:"right",color:"#d97706",fontWeight:700,fontSize:13}}>
            {(item.qtyReserved||0)>0?<span style={{background:"#fef9c3",color:"#854d0e",padding:"1px 8px",borderRadius:20,fontSize:11,fontWeight:700}}>{item.qtyReserved}</span>:<span style={{color:"#cbd5e1",fontWeight:400}}>—</span>}
          </td>
          <td style={{...S.td,textAlign:"right",fontWeight:800,fontSize:15,color:low?"#dc2626":"#16a34a"}}>{qtyAvail}</td>
          {/* Financials & meta */}
          <td style={{...S.td,fontSize:12,color:"#64748b"}}>{item.unit}</td>
          <td style={{...S.td,fontSize:12,color:"#94a3b8",textAlign:"right"}}>{item.min}</td>
          <td style={{...S.td,fontWeight:700,textAlign:"right"}}>${item.cost}</td>
          <td style={{...S.td,fontWeight:700,textAlign:"right",color:"#0f172a"}}>${(item.qty*item.cost).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
          <td style={{...S.td,fontWeight:700,textAlign:"right",color:"#16a34a"}}>${(qtyAvail*item.cost).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
          <td style={S.td}><span style={{fontSize:12,color:exp?"#dc2626":soon?"#d97706":"#64748b",fontWeight:exp||soon?700:400}}>{item.procDate?fmtDate(item.procDate):"—"}</span></td>
          <td style={S.td}><span style={{fontSize:12,color:"#374151"}}>{item.receivedDate?fmtDate(item.receivedDate):"—"}</span></td>
          <td style={S.td}><span style={{fontSize:12,color:exp?"#dc2626":soon?"#d97706":"#64748b",fontWeight:exp||soon?700:400}}>{item.expiry?fmtDate(item.expiry):"—"}</span></td>
          <td style={S.td}><div style={{display:"flex",gap:4}}>
            <button onClick={()=>handleScan(item.barcode)} style={{...S.icnBtn,color:"#15803d"}} title="Scan">📷</button>
            <button onClick={()=>openModal("editInv",item)} style={S.icnBtn} title="Edit">✏️</button>
            <button onClick={()=>{ deleteRecord("inventory",item.id); setInv(p=>p.filter(x=>x.id!==item.id)); showToast("Item removed"); }} style={{...S.icnBtn,color:"#dc2626"}} title="Delete">🗑️</button>
          </div></td>
        </tr>
      );
    };

    /* ── group subtotal row ── */
    const SubtotalRow=({items,label})=>{
      const qtyExp  = items.reduce((a,i)=>a+(i.qtyExpected||0),0);
      const qtyRec  = items.reduce((a,i)=>a+i.qty,0);
      const qtyDist = items.reduce((a,i)=>a+(i.qtyDistributed||0),0);
      const qtyResv = items.reduce((a,i)=>a+(i.qtyReserved||0),0);
      const qtyAvail= qtyRec - qtyDist - qtyResv;
      const val     = items.reduce((a,i)=>a+i.qty*i.cost,0);
      const availVal= items.reduce((a,i)=>a+(i.qty-(i.qtyDistributed||0)-(i.qtyReserved||0))*i.cost,0);
      const vari    = qtyRec - qtyExp;
      return (
        <tr style={{background:"#f0fdf4",borderTop:"2px solid #bbf7d0"}}>
          <td colSpan={3} style={{...S.td,fontWeight:700,fontSize:12,color:"#15803d",padding:"8px 14px"}}>
            📊 Subtotal — {label} ({items.length} item{items.length!==1?"s":""})
          </td>
          <td style={{...S.td,fontWeight:800,textAlign:"right",color:"#374151",padding:"8px 6px"}}>{qtyExp||"—"}</td>
          <td style={{...S.td,fontWeight:800,textAlign:"right",color:"#374151",padding:"8px 6px"}}>{qtyRec}</td>
          <td style={{...S.td,fontWeight:800,textAlign:"right",color:vari<0?"#dc2626":vari>0?"#d97706":"#94a3b8",padding:"8px 6px"}}>{vari<0?`−${Math.abs(vari)}`:vari>0?`+${vari}`:"="}</td>
          <td style={{...S.td,fontWeight:800,textAlign:"right",color:"#2563eb",padding:"8px 6px"}}>{qtyDist||"—"}</td>
          <td style={{...S.td,fontWeight:800,textAlign:"right",color:"#854d0e",padding:"8px 6px"}}>{qtyResv||"—"}</td>
          <td style={{...S.td,fontWeight:800,textAlign:"right",color:"#15803d",fontSize:14,padding:"8px 6px"}}>{qtyAvail}</td>
          <td colSpan={3} style={{padding:"8px 6px"}}/>
          <td style={{...S.td,fontWeight:800,textAlign:"right",color:"#374151",padding:"8px 6px"}}>${val.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
          <td style={{...S.td,fontWeight:800,textAlign:"right",color:"#15803d",padding:"8px 6px"}}>${availVal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
          <td colSpan={3} style={{padding:"8px 6px"}}/>
        </tr>
      );
    };

    /* ── procurement group header row ── */
    const GroupHeader=({procCode,items})=>{
      const pc=inv.find(i=>i.procCode===procCode);
      const supplier=[...new Set(items.map(i=>i.supplier))].join(", ");
      return (
        <tr style={{background:"#1e293b",cursor:"default"}}>
          <td colSpan={14} style={{padding:"10px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{background:"#15803d",color:"#fff",padding:"2px 10px",borderRadius:4,fontFamily:"monospace",fontSize:12,fontWeight:700}}>{procCode}</span>
                <span style={{fontSize:12,color:"rgba(255,255,255,.6)"}}>{supplier}</span>
              </div>
              {pc?.procDate&&(
                <span style={{fontSize:11,color:"rgba(255,255,255,.45)"}}>
                  📋 Ordered: <span style={{color:"rgba(255,255,255,.75)",fontWeight:600}}>{fmtDate(pc.procDate)}</span>
                  {pc?.receivedDate&&<> &nbsp;·&nbsp; 📥 Received: <span style={{color:"rgba(255,255,255,.75)",fontWeight:600}}>{fmtDate(pc.receivedDate)}</span></>}
                </span>
              )}
              <span style={{marginLeft:"auto",background:"rgba(255,255,255,.08)",color:"rgba(255,255,255,.5)",padding:"2px 10px",borderRadius:20,fontSize:11}}>{items.length} item{items.length!==1?"s":""}</span>
            </div>
          </td>
        </tr>
      );
    };

    const TABLE_HEADERS=["Item","Barcode","Category","Qty Expected","Qty Received","Proc. Variance","Distributed","Reserved","Available","Unit","Min","Unit Cost","Total Value","Avail. Value","Proc. Date","Rec. Date","Expiry","Actions"];

    return (
      <div>
        <PageHead title="Inventory" sub={`${rows.length} of ${inv.length} items · $${grandValue.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} total value`}>
          <button onClick={()=>setManualScanOpen(true)} style={{...S.btnO,borderColor:"#86efac",color:"#15803d"}}>📷 Scan Item</button>
          <button onClick={()=>setViewMode(v=>v==="grouped"?"flat":"grouped")} style={{...S.btnO,borderColor:viewMode==="grouped"?"#2563eb":"#e2e8f0",color:viewMode==="grouped"?"#1d4ed8":"#374151"}}>{viewMode==="grouped"?"⊞ Grouped":"≡ Flat List"}</button>
          <button onClick={()=>showToast("Export coming soon")} style={S.btnO}>↓ Export</button>
          <button onClick={()=>openModal("inv")} style={S.btn}>+ Add Item</button>
        </PageHead>

        {/* ── KPI summary strip ── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:10,marginBottom:18}}>
          {[
            {l:"Total Items",      v:inv.length,                                                             bg:"#eff6ff",c:"#2563eb",ic:"📦"},
            {l:"Qty Ordered",      v:inv.reduce((a,i)=>a+(i.qtyExpected||0),0).toLocaleString(),             bg:"#f8fafc",c:"#374151",ic:"📋"},
            {l:"Qty Received",     v:inv.reduce((a,i)=>a+i.qty,0).toLocaleString(),                          bg:"#f0fdf4",c:"#16a34a",ic:"✅"},
            {l:"Distributed",      v:inv.reduce((a,i)=>a+(i.qtyDistributed||0),0).toLocaleString(),          bg:"#eff6ff",c:"#2563eb",ic:"🚚"},
            {l:"Reserved",         v:inv.reduce((a,i)=>a+(i.qtyReserved||0),0).toLocaleString(),             bg:"#fef9c3",c:"#854d0e",ic:"🔒"},
            {l:"Available",        v:inv.reduce((a,i)=>a+i.qty-(i.qtyDistributed||0)-(i.qtyReserved||0),0).toLocaleString(), bg:"#f0fdf4",c:"#15803d",ic:"🏷"},
            {l:"Available Value",  v:`$${inv.reduce((a,i)=>a+(i.qty-(i.qtyDistributed||0)-(i.qtyReserved||0))*i.cost,0).toLocaleString()}`, bg:"#faf5ff",c:"#7c3aed",ic:"💰"},
          ].map((c,i)=>(
            <div key={i} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",boxShadow:"0 1px 3px rgba(0,0,0,.05)"}}>
              <div><div style={{fontSize:18,fontWeight:800,color:c.c}}>{c.v}</div><div style={{fontSize:10,color:"#64748b",marginTop:2}}>{c.l}</div></div>
              <div style={{width:36,height:36,borderRadius:8,background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{c.ic}</div>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
          <input style={{...S.fsel,minWidth:240}} placeholder="🔍 Search name, supplier, proc. code…" value={srch} onChange={e=>setSrch(e.target.value)}/>
          <span style={S.fl}>Proc. Code:</span>
          <select style={S.fsel} value={procF} onChange={e=>setProcF(e.target.value)}>
            <option value="All">All Batches</option>
            {allProcCodes.map(pc=><option key={pc} value={pc}>{pc}</option>)}
          </select>
          <span style={S.fl}>Category:</span>
          <select style={S.fsel} value={catF} onChange={e=>setCatF(e.target.value)}><option value="All">All</option>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select>
          <span style={S.fl}>Stock:</span>
          <select style={S.fsel} value={stF} onChange={e=>setStF(e.target.value)}><option value="All">All</option><option value="OK">OK</option><option value="Low">Low</option></select>
          <button onClick={()=>{setSrch("");setCatF("All");setStF("All");setProcF("All");}} style={S.clr}>✕ Clear</button>
          <span style={{marginLeft:"auto",fontSize:11,color:"#94a3b8"}}>{rows.length} items shown</span>
        </div>

        {/* ── Table ── */}
        <div style={S.card}>
          <div style={{overflowX:"auto"}}>
            <table style={{...S.tbl,minWidth:1100}}>
              <thead>
                <tr style={S.thead}>
                  {TABLE_HEADERS.map(h=><th key={h} style={{...S.th,textAlign:["Qty Expected","Qty Received","Proc. Variance","Distributed","Reserved","Available","Min","Unit Cost","Total Value","Avail. Value"].includes(h)?"right":"left"}}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {viewMode==="grouped"?(
                  Object.entries(grouped).map(([pc,items])=>(
                    <>
                      <GroupHeader key={`gh-${pc}`} procCode={pc} items={items}/>
                      {items.map(item=><ItemRow key={item.id} item={item}/>)}
                      <SubtotalRow key={`st-${pc}`} items={items} label={pc}/>
                    </>
                  ))
                ):(
                  rows.map(item=><ItemRow key={item.id} item={item}/>)
                )}

                {/* ── Grand Total row ── */}
                {rows.length>0&&(
                  <tr style={{background:"#0f172a",borderTop:"3px solid #15803d"}}>
                    <td colSpan={3} style={{padding:"12px 14px",fontWeight:800,fontSize:13,color:"#fff"}}>
                      🏆 GRAND TOTAL — {rows.length} item{rows.length!==1?"s":""}
                    </td>
                    <td style={{padding:"12px 8px",fontWeight:800,textAlign:"right",color:"rgba(255,255,255,.6)",fontSize:12}}>{grandQtyExp||"—"}</td>
                    <td style={{padding:"12px 8px",fontWeight:800,textAlign:"right",color:"rgba(255,255,255,.8)",fontSize:13}}>{grandQtyRec.toLocaleString()}</td>
                    <td style={{padding:"12px 8px",fontWeight:800,textAlign:"right",fontSize:12,color:grandVariance<0?"#f87171":grandVariance>0?"#fbbf24":"#86efac"}}>
                      {grandVariance<0?`−${Math.abs(grandVariance)}`:grandVariance>0?`+${grandVariance}`:"="}
                    </td>
                    <td style={{padding:"12px 8px",fontWeight:800,textAlign:"right",color:"#60a5fa",fontSize:13}}>{grandQtyDist.toLocaleString()}</td>
                    <td style={{padding:"12px 8px",fontWeight:800,textAlign:"right",color:"#fbbf24",fontSize:13}}>{grandQtyResv||"—"}</td>
                    <td style={{padding:"12px 8px",fontWeight:900,textAlign:"right",color:"#4ade80",fontSize:15}}>{grandQtyAvail.toLocaleString()}</td>
                    <td colSpan={3} style={{padding:"12px 8px"}}/>
                    <td style={{padding:"12px 8px",fontWeight:800,textAlign:"right",color:"rgba(255,255,255,.7)",fontSize:12}}>${grandValue.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                    <td style={{padding:"12px 8px",fontWeight:900,textAlign:"right",color:"#4ade80",fontSize:13}}>${grandAvailVal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                    <td colSpan={3} style={{padding:"12px 8px"}}/>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {!rows.length&&<p style={{textAlign:"center",color:"#94a3b8",padding:32}}>No items match your filters.</p>}
        </div>
      </div>
    );
  };

  const BeneficiariesPage = () => {
    const [q,setQ]=useState(""); const [gf,setGf]=useState("All");
    const rows=benes.filter(b=>(gf==="All"||b.gender===gf)&&(!q||b.name.toLowerCase().includes(q.toLowerCase())||b.group.toLowerCase().includes(q.toLowerCase())||b.village.toLowerCase().includes(q.toLowerCase())));
    const totalBenes=benes.reduce((a,b)=>a+b.count,0);
    return (
      <div>
        <PageHead title="Beneficiaries" sub={`${benes.length} groups · ${totalBenes} total beneficiaries`}>
          <button onClick={()=>showToast("Export coming soon")} style={S.btnO}>↓ Export List</button>
          <button onClick={()=>showToast("Add beneficiary form coming soon")} style={S.btn}>+ Add Beneficiary</button>
        </PageHead>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
          {[{l:"Total Groups",v:benes.length,bg:"#eff6ff",c:"#2563eb"},{l:"Total Beneficiaries",v:totalBenes,bg:"#f0fdf4",c:"#16a34a"},{l:"Avg Rating",v:`${(benes.reduce((a,b)=>a+b.rating,0)/benes.length).toFixed(1)} ★`,bg:"#fef9c3",c:"#d97706"}].map((c,i)=>(
            <div key={i} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:28,fontWeight:800,color:c.c}}>{c.v}</div><div style={{fontSize:12,color:"#64748b",marginTop:2}}>{c.l}</div></div>
              <div style={{width:44,height:44,borderRadius:12,background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>👥</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:10,marginBottom:16,alignItems:"center"}}>
          <input style={{...S.fsel,minWidth:260}} placeholder="🔍 Search by name, group, village…" value={q} onChange={e=>setQ(e.target.value)}/>
          <span style={S.fl}>Gender:</span>
          <select style={S.fsel} value={gf} onChange={e=>setGf(e.target.value)}><option value="All">All</option><option value="M">Male</option><option value="F">Female</option></select>
          <button onClick={()=>{setQ("");setGf("All");}} style={S.clr}>✕ Clear</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
          {rows.map((b,i)=>{
            const bDists=dists.filter(d=>d.beneId===b.id);
            return (
              <div key={b.id} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:18,boxShadow:"0 1px 3px rgba(0,0,0,.05)",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 14px rgba(0,0,0,.1)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,.05)"}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                  <Av label={b.avatar} idx={i} size={44}/>
                  <div><div style={{fontWeight:700,fontSize:15,color:"#0f172a"}}>{b.name}</div><div style={{fontSize:12,color:"#94a3b8"}}>{b.group}</div></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                  {[["Village",b.village],["Phone",b.phone],["Members",b.count],["Gender",b.gender==="F"?"Female":"Male"]].map(([l,v])=>(
                    <div key={l} style={{background:"#f8fafc",borderRadius:8,padding:"7px 10px"}}><div style={{fontSize:10,color:"#94a3b8"}}>{l}</div><div style={{fontSize:13,fontWeight:600,color:"#0f172a",marginTop:1}}>{v}</div></div>
                  ))}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:13,fontWeight:700}}>{"★".repeat(Math.round(b.rating))}<span style={{color:"#64748b",fontWeight:400}}> {b.rating}</span></span>
                  <span style={{fontSize:12,color:"#94a3b8"}}>{bDists.length} distributions</span>
                </div>
              </div>
            );
          })}
        </div>
        {!rows.length&&<p style={{textAlign:"center",color:"#94a3b8",padding:32}}>No beneficiaries match.</p>}
      </div>
    );
  };

  const RoutesPage = () => {
    const [selRoute,setSelRoute]=useState(null); const [routeStF,setRouteStF]=useState("All");
    const statusClr=s=>({OnTime:"#16a34a","On Time":"#16a34a",Delayed:"#d97706",Critical:"#dc2626"}[s]||"#64748b");
    const PIN_POS=[[28,38],[55,60],[42,25],[70,45],[36,68]];
    return (
      <div style={{display:"flex",gap:0,height:"calc(100vh - 52px)",margin:"-24px -24px -32px -24px",overflow:"hidden"}}>
        <div style={{flex:1,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:selRoute?370:0,zIndex:20,background:"rgba(255,255,255,.97)",borderBottom:"1px solid #e2e8f0",padding:"14px 20px",display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
            <h2 style={{margin:0,fontSize:18,fontWeight:800,color:"#0f172a",marginRight:4}}>Routes & Tracking</h2>
            {[{l:"Active",v:routes.filter(r=>r.status!=="Delivered").length,bg:"#eff6ff",c:"#2563eb"},{l:"On-Time",v:`${Math.round((routes.filter(r=>r.status==="On Time").length/routes.length)*100)}%`,bg:"#f0fdf4",c:"#16a34a"},{l:"Critical",v:routes.filter(r=>r.status==="Critical").length,bg:"#fee2e2",c:"#b91c1c"},{l:"Fleet",v:`${fleet.filter(f=>f.status!=="Maintenance").length}/${fleet.length}`,bg:"#faf5ff",c:"#7c3aed"}].map((s,i)=>(
              <div key={i} style={{background:s.bg,borderRadius:10,padding:"8px 14px",display:"flex",alignItems:"center",gap:8}}>
                <div style={{fontSize:18,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:"#64748b"}}>{s.l}</div>
              </div>
            ))}
            <select style={{...S.fsel,marginLeft:"auto"}} value={routeStF} onChange={e=>setRouteStF(e.target.value)}><option value="All">All Routes</option>{["On Time","Delayed","Critical"].map(s=><option key={s}>{s}</option>)}</select>
          </div>
          <div style={{position:"absolute",inset:0,background:"#e8f5e9",paddingTop:64}}>
            <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:.5}} viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
              <rect width="800" height="600" fill="#d4edda"/>
              <ellipse cx="300" cy="350" rx="200" ry="120" fill="#b8dfc5" opacity=".6"/>
              <ellipse cx="580" cy="200" rx="120" ry="80" fill="#c5e8cc" opacity=".5"/>
              <line x1="0" y1="300" x2="800" y2="300" stroke="#fff" strokeWidth="4" opacity=".6"/>
              <line x1="400" y1="0" x2="400" y2="600" stroke="#fff" strokeWidth="4" opacity=".6"/>
              <line x1="0" y1="150" x2="800" y2="450" stroke="#fff" strokeWidth="3" opacity=".4"/>
              <polyline points="224,228 440,360 560,270" stroke="#16a34a" strokeWidth="3" fill="none" strokeDasharray="8,4" opacity=".7"/>
              <polyline points="440,360 336,408" stroke="#d97706" strokeWidth="3" fill="none" strokeDasharray="8,4" opacity=".7"/>
              <polyline points="336,150 336,408" stroke="#dc2626" strokeWidth="3" fill="none" strokeDasharray="8,4" opacity=".7"/>
              {[["Freetown",30,55],["Bo",55,60],["Makeni",42,25],["Kenema",70,45],["Koidu",72,70],["Lungi",28,42],["Waterloo",36,62]].map(([n,x,y])=>(
                <g key={n}><circle cx={x*8} cy={y*6} r="5" fill="#15803d" opacity=".8"/><text x={x*8+8} y={y*6+4} fontSize="11" fill="#15803d" fontWeight="bold" opacity=".9">{n}</text></g>
              ))}
            </svg>
            {routes.filter(r=>routeStF==="All"||r.status===routeStF).map((r,i)=>{
              const [px,py]=PIN_POS[i]||[30+i*12,40+i*10];
              return (
                <div key={r.id} onClick={()=>setSelRoute(selRoute?.id===r.id?null:r)} style={{position:"absolute",left:`${px}%`,top:`${py}%`,transform:"translate(-50%,-50%)",cursor:"pointer",zIndex:10}}>
                  <div style={{width:36,height:36,borderRadius:"50%",background:statusClr(r.status),border:"3px solid #fff",boxShadow:"0 2px 8px rgba(0,0,0,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🚛</div>
                  <div style={{position:"absolute",top:40,left:"50%",transform:"translateX(-50%)",background:"rgba(15,23,42,.85)",color:"#fff",padding:"2px 8px",borderRadius:6,fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>{r.truck}</div>
                </div>
              );
            })}
            <div style={{position:"absolute",bottom:20,left:20,background:"rgba(255,255,255,.95)",borderRadius:10,padding:"10px 14px",boxShadow:"0 2px 8px rgba(0,0,0,.12)"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:6}}>STATUS</div>
              {[["On Time","#16a34a"],["Delayed","#d97706"],["Critical","#dc2626"]].map(([l,c])=>(
                <div key={l} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><div style={{width:10,height:10,borderRadius:"50%",background:c}}/><span style={{fontSize:12}}>{l}</span></div>
              ))}
            </div>
            <div style={{position:"absolute",bottom:20,right:selRoute?390:20,background:"rgba(255,255,255,.97)",borderRadius:12,padding:"12px 0",boxShadow:"0 4px 16px rgba(0,0,0,.12)",minWidth:280,maxWidth:320,maxHeight:240,overflowY:"auto"}}>
              <div style={{padding:"0 14px 8px",fontWeight:700,fontSize:13,borderBottom:"1px solid #f1f5f9"}}>Active Routes ({routes.length})</div>
              {routes.filter(r=>routeStF==="All"||r.status===routeStF).map(r=>(
                <div key={r.id} style={{padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid #f8fafc",background:selRoute?.id===r.id?"#f0fdf4":undefined}} onClick={()=>setSelRoute(selRoute?.id===r.id?null:r)}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:12,fontWeight:700,color:"#2563eb"}}>{r.truck}</span><span style={{fontSize:11,fontWeight:700,background:statusClr(r.status)+"18",color:statusClr(r.status),padding:"1px 8px",borderRadius:20}}>{r.status}</span></div>
                  <div style={{fontSize:11,color:"#374151"}}>{r.origin} → {r.dest}</div>
                  <div style={{marginTop:6,height:4,background:"#f1f5f9",borderRadius:2}}><div style={{height:"100%",width:`${r.progress}%`,background:statusClr(r.status),borderRadius:2}}/></div>
                  <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{r.progress}% · ETA {r.eta}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {selRoute&&(
          <div style={{width:370,background:"#fff",borderLeft:"1px solid #e2e8f0",overflowY:"auto",flexShrink:0}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 20px",borderBottom:"1px solid #f1f5f9"}}>
              <span style={{fontWeight:700,fontSize:15}}>Route Details</span>
              <button onClick={()=>setSelRoute(null)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#94a3b8"}}>✕</button>
            </div>
            <div style={{padding:20}}>
              <div style={{display:"flex",gap:12,alignItems:"center",background:"#f0fdf4",borderRadius:10,padding:12,marginBottom:16}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:statusClr(selRoute.status),display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🚛</div>
                <div><div style={{fontWeight:700,fontSize:14}}>{selRoute.ref}</div><div style={{fontSize:12,color:"#16a34a"}}>{selRoute.officer} · {selRoute.truck}</div></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                {[["Origin",selRoute.origin],["Destination",selRoute.dest],["Distance",selRoute.distance],["Status",selRoute.status]].map(([l,v])=>(
                  <div key={l} style={{background:"#f8fafc",borderRadius:8,padding:10}}><div style={{fontSize:11,color:"#94a3b8"}}>{l}</div><div style={{fontWeight:700,fontSize:12,marginTop:2}}>{v}</div></div>
                ))}
              </div>
              <div style={{background:"#f8fafc",borderRadius:10,padding:14,marginBottom:16}}>
                <div style={{fontSize:12,color:"#94a3b8",fontWeight:600,marginBottom:8}}>ETA & PROGRESS</div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:12,color:"#64748b"}}>Arrival</span><span style={{fontSize:13,fontWeight:700}}>{selRoute.eta}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:12,color:"#64748b"}}>Confidence</span><span style={{fontSize:13,fontWeight:700,color:"#16a34a"}}>{selRoute.confidence}%</span></div>
                <div style={{height:8,background:"#e2e8f0",borderRadius:4,overflow:"hidden",marginBottom:4}}><div style={{height:"100%",width:`${selRoute.progress}%`,background:statusClr(selRoute.status),borderRadius:4}}/></div>
                <div style={{fontSize:10,color:"#94a3b8"}}>{selRoute.progress}% · Last update: {selRoute.lastUpdate}</div>
              </div>
              <div style={{marginBottom:16}}>
                <div style={{fontSize:12,color:"#94a3b8",fontWeight:600,marginBottom:10}}>STOPS</div>
                <div style={{position:"relative",paddingLeft:20}}>
                  <div style={{position:"absolute",left:8,top:8,bottom:8,width:2,background:"#e2e8f0"}}/>
                  {selRoute.stops.map((stop,si)=>{ const st=selRoute.stopStatus[si]; const clr=st==="Completed"?"#16a34a":st==="In Transit"?"#d97706":"#cbd5e1"; return (
                    <div key={si} style={{marginBottom:14,position:"relative"}}>
                      <div style={{position:"absolute",left:-15,top:3,width:12,height:12,borderRadius:"50%",background:clr,border:"2px solid #fff",boxShadow:`0 0 0 2px ${clr}`}}/>
                      <div style={{fontWeight:600,fontSize:13}}>{stop}</div>
                      <div style={{fontSize:11,color:clr,fontWeight:600,marginTop:2}}>{st}</div>
                    </div>
                  );})}
                </div>
              </div>
              <div>
                <div style={{fontSize:12,color:"#94a3b8",fontWeight:600,marginBottom:8}}>LINKED LOADS</div>
                {selRoute.linkedLoads.map(ref=>{ const d=dists.find(x=>x.ref===ref); return d?<div key={ref} style={{background:"#f8fafc",borderRadius:8,padding:10,marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:12,fontWeight:700,color:"#2563eb"}}>{ref}</div><div style={{fontSize:11,color:"#94a3b8"}}>{inv.find(x=>x.id===d.itemId)?.name||"—"}</div></div><StatusPill s={d.status}/></div>:null; })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const WarehousesPage = () => {
    const [selW,setSelW]=useState(null); const [stF2,setStF2]=useState("All");
    const avgUtil=Math.round(warehouses.reduce((a,w)=>a+w.utilization,0)/warehouses.length);
    const utilColor=u=>u>=90?"#dc2626":u>=70?"#d97706":"#16a34a";
    const filtered=warehouses.filter(w=>stF2==="All"||w.status===stF2);
    return (
      <div style={{display:"flex",height:"calc(100vh - 52px)",margin:"-24px -24px -32px -24px",overflow:"hidden"}}>
        <div style={{flex:1,overflowY:"auto",padding:"24px 24px 32px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <div><h2 style={{margin:0,fontSize:22,fontWeight:800,color:"#0f172a"}}>Warehouses / Hubs</h2><p style={{margin:"4px 0 0",color:"#94a3b8",fontSize:13}}>{warehouses.length} distribution hubs across Sierra Leone</p></div>
            <div style={{display:"flex",gap:8}}>
              <select style={S.fsel} value={stF2} onChange={e=>setStF2(e.target.value)}><option value="All">All Status</option><option>Active</option><option>Maintenance</option></select>
              <button onClick={()=>showToast("Analytics coming soon")} style={S.btnO}>📊 Analytics</button>
              <button onClick={()=>showToast("Add warehouse form coming soon")} style={S.btn}>+ Add Warehouse</button>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
            {[{l:"Active",v:warehouses.filter(w=>w.status==="Active").length,bg:"#eff6ff",c:"#2563eb"},{l:"Avg Utilization",v:`${avgUtil}%`,bg:"#f0fdf4",c:"#16a34a"},{l:"Critical Alerts",v:warehouses.filter(w=>w.utilization>90).length,bg:"#fee2e2",c:"#b91c1c"},{l:"Throughput",v:`${warehouses.reduce((a,w)=>a+w.inbound+w.outbound,0).toLocaleString()}`,bg:"#faf5ff",c:"#7c3aed"}].map((c,i)=>(
              <div key={i} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontSize:24,fontWeight:800,color:c.c}}>{c.v}</div><div style={{fontSize:12,color:"#64748b",marginTop:2}}>{c.l}</div></div>
                <div style={{width:40,height:40,borderRadius:10,background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🏭</div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
            {filtered.map((w,i)=>(
              <div key={w.id} style={{background:"#fff",border:`1px solid ${selW?.id===w.id?"#16a34a":"#e2e8f0"}`,borderRadius:12,padding:18,cursor:"pointer",boxShadow:`0 1px 3px rgba(0,0,0,.05)`,transition:"all .15s"}} onClick={()=>setSelW(selW?.id===w.id?null:w)} onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 14px rgba(0,0,0,.1)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,.05)"}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div><div style={{fontWeight:700,fontSize:14,color:"#0f172a"}}>{w.name}</div><div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{w.address}</div></div>
                  <StatusPill s={w.status}/>
                </div>
                <div style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#64748b",marginBottom:4}}><span>Utilization</span><span style={{fontWeight:700,color:utilColor(w.utilization)}}>{w.utilization}%</span></div>
                  <div style={{height:6,background:"#e2e8f0",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${w.utilization}%`,background:utilColor(w.utilization),borderRadius:3}}/></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                  {[["On Hand",w.onHand.toLocaleString()],["Inbound",w.inbound],["Outbound",w.outbound]].map(([l,v])=>(
                    <div key={l} style={{background:"#f8fafc",borderRadius:8,padding:"7px 10px",textAlign:"center"}}><div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{v}</div><div style={{fontSize:10,color:"#94a3b8"}}>{l}</div></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        {selW&&(
          <div style={{width:340,background:"#fff",borderLeft:"1px solid #e2e8f0",overflowY:"auto",flexShrink:0}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 20px",borderBottom:"1px solid #f1f5f9"}}>
              <span style={{fontWeight:700,fontSize:14}}>{selW.name}</span>
              <button onClick={()=>setSelW(null)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#94a3b8"}}>✕</button>
            </div>
            <div style={{padding:18}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                {[["Capacity",`${(selW.capacity/1000).toFixed(0)}k units`],["Utilization",`${selW.utilization}%`],["Docks Total",selW.docks],["Docks Free",selW.docksAvail],["Yard Status",selW.yard]].map(([l,v])=>(
                  <div key={l} style={{background:"#f8fafc",borderRadius:8,padding:"8px 10px"}}><div style={{fontSize:10,color:"#94a3b8"}}>{l}</div><div style={{fontSize:13,fontWeight:700,marginTop:2}}>{v}</div></div>
                ))}
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:12,color:"#94a3b8",fontWeight:600,marginBottom:8}}>INVENTORY BREAKDOWN</div>
                {selW.inventory.map(iv=>(
                  <div key={iv.cat} style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}><span style={{fontWeight:600}}>{iv.cat}</span><span style={{color:"#64748b"}}>{iv.units.toLocaleString()} ({iv.pct}%)</span></div>
                    <div style={{height:5,background:"#e2e8f0",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${iv.pct}%`,background:catColor(iv.cat),borderRadius:3}}/></div>
                  </div>
                ))}
              </div>
              {selW.schedule.length>0&&(
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:12,color:"#94a3b8",fontWeight:600,marginBottom:8}}>TODAY'S SCHEDULE</div>
                  {selW.schedule.slice(0,5).map((s,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid #f8fafc",fontSize:11}}>
                      <span style={{fontWeight:700,color:"#374151"}}>{s.time}</span>
                      <span style={{background:s.dir==="IN"?"#dbeafe":"#dcfce7",color:s.dir==="IN"?"#1d4ed8":"#15803d",padding:"2px 8px",borderRadius:20,fontWeight:700}}>{s.dir} · {s.ref}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <button onClick={()=>showToast("Inventory management coming soon")} style={{...S.btn,width:"100%",textAlign:"center",padding:10}}>📦 Manage Inventory</button>
                <button onClick={()=>showToast("Appointment scheduler coming soon")} style={{...S.btnO,width:"100%",textAlign:"center",padding:10,borderColor:"#16a34a",color:"#15803d"}}>📅 Schedule Appointment</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const PODPage = () => {
    const [selPod,setSelPod]=useState(null);
    const [podSrch,setPodSrch]=useState("");
    const [podStF,setPodStF]=useState("All");
    const [condF,setCondF]=useState("All");

    const filtered=pods.filter(p=>{
      const b=benes.find(x=>x.id===p.beneId);
      const procCodes=[...new Set(p.items.map(it=>it.procCode).filter(Boolean))].join(" ");
      const txt=`${p.ref} ${p.distRef} ${b?.name||""} ${p.receivedBy} ${p.officer||""} ${procCodes}`.toLowerCase();
      return (podStF==="All"||(podStF==="Verified"?p.verified:!p.verified))
          && (condF==="All"||p.condition===condF)
          && (!podSrch||txt.includes(podSrch.toLowerCase()));
    });

    /* ── derived totals ── */
    const totalOrdered  = pods.reduce((a,p)=>a+p.items.reduce((b,it)=>b+(it.qtyOrdered||it.qty),0),0);
    const totalReceived = pods.reduce((a,p)=>a+p.items.reduce((b,it)=>b+it.qty,0),0);
    const totalVariance = totalReceived - totalOrdered;
    const podsDamaged   = pods.filter(p=>p.condition==="Damaged"||p.items.some(it=>it.itemCondition==="Damaged")).length;

    /* ── per-item condition colour ── */
    const ics=c=>({Good:{bg:"#dcfce7",c:"#15803d"},Damaged:{bg:"#fee2e2",c:"#b91c1c"},Partial:{bg:"#fef9c3",c:"#854d0e"}}[c]||{bg:"#f1f5f9",c:"#64748b"});

    return (
      <div>
        <PageHead title="Proof of Delivery" sub={`${pods.length} records · ${pods.filter(p=>p.verified).length} verified`}>
          <button onClick={()=>setManualScanOpen(true)} style={{...S.btnO,borderColor:"#86efac",color:"#15803d"}}>📷 Scan POD</button>
          <button onClick={()=>showToast("Import coming soon")} style={S.btnO}>📥 Import</button>
          <button onClick={()=>showToast("POD recording form coming soon")} style={S.btn}>+ Record POD</button>
        </PageHead>

        {/* ── KPI strip ── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:12,marginBottom:18}}>
          {[
            {l:"Total PODs",      v:pods.length,                              bg:"#eff6ff",c:"#2563eb",ic:"📄"},
            {l:"Verified",        v:pods.filter(p=>p.verified).length,        bg:"#f0fdf4",c:"#16a34a",ic:"✅"},
            {l:"Pending",         v:pods.filter(p=>!p.verified).length,       bg:"#fef9c3",c:"#854d0e",ic:"⏳"},
            {l:"Damaged Reports", v:podsDamaged,                              bg:"#fee2e2",c:"#b91c1c",ic:"⚠"},
            {l:"Total Ordered",   v:totalOrdered.toLocaleString(),            bg:"#f8fafc", c:"#374151",ic:"📋"},
            {l:"Qty Variance",
              v:(totalVariance<0?`−${Math.abs(totalVariance)}`:totalVariance>0?`+${totalVariance}`:"="),
              bg:totalVariance<0?"#fee2e2":totalVariance>0?"#fef9c3":"#f0fdf4",
              c: totalVariance<0?"#b91c1c":totalVariance>0?"#854d0e":"#15803d",ic:"⚖"},
          ].map((c,i)=>(
            <div key={i} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",boxShadow:"0 1px 3px rgba(0,0,0,.05)"}}>
              <div><div style={{fontSize:20,fontWeight:800,color:c.c}}>{c.v}</div><div style={{fontSize:10,color:"#64748b",marginTop:2}}>{c.l}</div></div>
              <div style={{width:36,height:36,borderRadius:8,background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>{c.ic}</div>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div style={{display:"flex",gap:10,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
          <input style={{...S.fsel,minWidth:280}} placeholder="🔍 Search ref, beneficiary, officer, proc. code…" value={podSrch} onChange={e=>setPodSrch(e.target.value)}/>
          <span style={S.fl}>Status:</span>
          <select style={S.fsel} value={podStF} onChange={e=>setPodStF(e.target.value)}>
            <option value="All">All</option><option value="Verified">Verified</option><option value="Pending">Pending</option>
          </select>
          <span style={S.fl}>Condition:</span>
          <select style={S.fsel} value={condF} onChange={e=>setCondF(e.target.value)}>
            <option value="All">All</option><option>Good</option><option>Damaged</option><option>Partial</option>
          </select>
          <button onClick={()=>{setPodSrch("");setPodStF("All");setCondF("All");}} style={S.clr}>✕ Clear</button>
          <span style={{marginLeft:"auto",fontSize:11,color:"#94a3b8"}}>{filtered.length} records</span>
        </div>

        {/* ── Table ── */}
        <div style={S.card}>
          <div style={{overflowX:"auto"}}>
            <table style={{...S.tbl,minWidth:1000}}>
              <thead>
                <tr style={S.thead}>
                  {["POD Ref","Dist. Ref","Beneficiary","Officer","Vehicle","Date & Time","Items (Ordered → Received)","Proc. Code","Condition","Verified","Actions"].map(h=><th key={h} style={S.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p,i)=>{
                  const b=benes.find(x=>x.id===p.beneId);
                  const cs=conditionStyle(p.condition);
                  const procCodes=[...new Set(p.items.map(it=>it.procCode).filter(Boolean))];
                  const hasVariance=p.items.some(it=>(it.qtyVariance||0)!==0);
                  const hasDmg=p.items.some(it=>it.itemCondition==="Damaged");
                  return (
                    <tr key={p.id} style={S.tr} onClick={()=>setSelPod(selPod?.id===p.id?null:p)} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                      <td style={S.td}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          {hasDmg&&<span title="Damage reported" style={{fontSize:12}}>⚠️</span>}
                          <span style={{color:"#2563eb",fontWeight:700,fontFamily:"monospace"}}>{p.ref}</span>
                        </div>
                      </td>
                      <td style={{...S.td,fontSize:12,color:"#374151",fontFamily:"monospace"}}>{p.distRef}</td>
                      <td style={S.td}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <Av label={b?.avatar||"??"} idx={i} size={28}/>
                          <div><div style={{fontWeight:600,fontSize:13}}>{p.receivedBy}</div><div style={{fontSize:11,color:"#94a3b8"}}>{b?.group||""}</div></div>
                        </div>
                      </td>
                      <td style={{...S.td,fontSize:12}}>
                        {p.officer
                          ? <div style={{display:"flex",alignItems:"center",gap:6}}><Av label={p.officer.split(" ").map(x=>x[0]).join("")} idx={i+3} size={24}/><span>{p.officer}</span></div>
                          : <span style={{color:"#94a3b8"}}>—</span>}
                      </td>
                      <td style={{...S.td,fontSize:12,color:"#64748b"}}>{p.vehicle||"—"}</td>
                      <td style={{...S.td,fontSize:12,color:"#64748b",whiteSpace:"nowrap"}}>{fmtDate(p.date)}<br/><span style={{fontSize:10,color:"#94a3b8"}}>{p.time}</span></td>
                      <td style={{...S.td,fontSize:12,maxWidth:220}}>
                        {p.items.map((it,ii)=>{
                          const variance=it.qtyOrdered!==undefined?it.qty-it.qtyOrdered:0;
                          return (
                            <div key={ii} style={{marginBottom:ii<p.items.length-1?6:0}}>
                              <span style={{fontWeight:600,color:"#0f172a"}}>{it.name}</span>
                              <div style={{fontSize:11,color:"#64748b",marginTop:1}}>
                                {it.qtyOrdered!==undefined&&<span style={{color:"#94a3b8"}}>{it.qtyOrdered} ordered → </span>}
                                <span style={{fontWeight:700,color:variance<0?"#dc2626":"#15803d"}}>{it.qty} {it.unit}</span>
                                {variance!==0&&<span style={{fontWeight:700,color:variance<0?"#dc2626":"#d97706",marginLeft:4}}>{variance<0?`(−${Math.abs(variance)})`:variance>0?`(+${variance})`:""}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </td>
                      <td style={S.td}>
                        {procCodes.map(pc=>(
                          <span key={pc} style={{background:"#f1f5f9",color:"#374151",border:"1px solid #e2e8f0",padding:"2px 8px",borderRadius:4,fontSize:11,fontFamily:"monospace",display:"inline-block",marginBottom:2}}>{pc}</span>
                        ))}
                      </td>
                      <td style={S.td}><span style={{background:cs.bg,color:cs.c,padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:600}}>{p.condition}</span></td>
                      <td style={S.td}>{p.verified?<span style={{color:"#15803d",fontWeight:600,fontSize:12}}>✅ Verified</span>:<span style={{color:"#d97706",fontWeight:600,fontSize:12}}>⏳ Pending</span>}</td>
                      <td style={S.td}>
                        <div style={{display:"flex",gap:6}}>
                          {!p.verified&&<button onClick={e=>{e.stopPropagation();syncSetPods(ps=>ps.map(x=>x.id===p.id?{...x,verified:true}:x));showToast("POD verified!");}} style={{...S.icnBtn,color:"#15803d",fontSize:12}}>✓ Verify</button>}
                          <button onClick={e=>{e.stopPropagation();setSelPod(selPod?.id===p.id?null:p);}} style={S.icnBtn}>👁</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!filtered.length&&<p style={{textAlign:"center",color:"#94a3b8",padding:32}}>No POD records match.</p>}
        </div>

        {/* ── Detail Panel ── */}
        {selPod&&(
          <div style={{position:"fixed",top:0,right:0,bottom:0,width:400,background:"#fff",boxShadow:"-4px 0 28px rgba(0,0,0,.13)",zIndex:200,overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 20px",borderBottom:"1px solid #f1f5f9"}}>
              <div>
                <div style={{fontWeight:700,fontSize:15,color:"#0f172a"}}>{selPod.ref}</div>
                <div style={{fontSize:11,color:"#94a3b8",marginTop:2,fontFamily:"monospace"}}>{selPod.distRef}</div>
              </div>
              <button onClick={()=>setSelPod(null)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#94a3b8"}}>✕</button>
            </div>
            <div style={{padding:20}}>

              {/* Status banner */}
              <div style={{background:selPod.verified?"#f0fdf4":"#fef9c3",borderRadius:10,padding:14,marginBottom:16,display:"flex",gap:10,alignItems:"center"}}>
                <span style={{fontSize:24}}>{selPod.verified?"✅":"⏳"}</span>
                <div>
                  <div style={{fontWeight:700,color:selPod.verified?"#15803d":"#854d0e"}}>{selPod.verified?"Verified":"Pending Verification"}</div>
                  <div style={{fontSize:12,color:"#64748b",marginTop:2}}>Signed at: {selPod.signedAt}</div>
                </div>
              </div>

              {/* Delivery metadata */}
              <div style={{fontSize:12,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Delivery Details</div>
              <Pill l="Date & Time"    v={`${fmtDate(selPod.date)} at ${selPod.time}`}/>
              <Pill l="Season"         v={selPod.season||"—"}/>
              <Pill l="Field Officer"  v={selPod.officer||"—"}/>
              <Pill l="Vehicle"        v={selPod.vehicle||"—"}/>
              <Pill l="Received By"    v={selPod.receivedBy}/>
              <Pill l="Overall Condition" v={<span style={{color:conditionStyle(selPod.condition).c,fontWeight:700}}>{selPod.condition}</span>}/>

              {/* Items received — full inventory linkage */}
              <div style={{fontSize:12,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,margin:"16px 0 8px"}}>Items Received</div>
              {selPod.items.map((it,i)=>{
                const variance=it.qtyOrdered!==undefined?it.qty-it.qtyOrdered:null;
                const cs=ics(it.itemCondition||"Good");
                const invItem=inv.find(x=>x.id===it.invId);
                return (
                  <div key={i} style={{background:"#f8fafc",borderRadius:10,padding:14,marginBottom:10,border:`1px solid ${it.itemCondition==="Damaged"?"#fca5a5":"#e2e8f0"}`}}>
                    {/* Item header */}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:14,color:"#0f172a"}}>{it.name}</div>
                        <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{it.cat} · {it.unit}</div>
                      </div>
                      <span style={{background:cs.bg,color:cs.c,padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:700,flexShrink:0,marginLeft:8}}>{it.itemCondition||"Good"}</span>
                    </div>

                    {/* Proc code + barcode row */}
                    <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
                      <span style={{background:"#e0f2fe",color:"#0369a1",padding:"2px 8px",borderRadius:4,fontSize:11,fontFamily:"monospace",fontWeight:700}}>📋 {it.procCode}</span>
                      <span style={{background:"#f1f5f9",color:"#374151",padding:"2px 8px",borderRadius:4,fontSize:11,fontFamily:"monospace"}}>🏷 {it.barcode}</span>
                    </div>

                    {/* Qty ordered / received / variance */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:it.damageNote?10:0}}>
                      {[
                        ["Ordered",   it.qtyOrdered!==undefined?it.qtyOrdered:"—", "#374151"],
                        ["Received",  it.qty,   "#15803d"],
                        ["Variance",  variance!==null?(variance<0?`−${Math.abs(variance)}`:variance>0?`+${variance}`:"="):"—",
                          variance===null?"#94a3b8":variance<0?"#dc2626":variance>0?"#d97706":"#16a34a"],
                      ].map(([l,v,c])=>(
                        <div key={l} style={{background:"#fff",borderRadius:6,padding:"8px 10px",textAlign:"center",border:"1px solid #e2e8f0"}}>
                          <div style={{fontSize:16,fontWeight:800,color:c}}>{v}</div>
                          <div style={{fontSize:10,color:"#94a3b8",marginTop:1}}>{l}</div>
                        </div>
                      ))}
                    </div>

                    {/* Damage note */}
                    {it.damageNote&&(
                      <div style={{background:"#fee2e2",borderRadius:6,padding:"7px 10px",marginTop:8,fontSize:12,color:"#b91c1c",fontWeight:600}}>
                        ⚠ {it.damageNote}
                      </div>
                    )}

                    {/* Inventory barcode display */}
                    <div style={{display:"flex",justifyContent:"center",marginTop:10,padding:8,background:"#fff",borderRadius:6,border:"1px solid #e2e8f0"}}>
                      <BarcodeDisplay code={it.barcode||selPod.ref} width={160} height={28} showText={true}/>
                    </div>
                  </div>
                );
              })}

              {/* Notes */}
              {selPod.notes&&(
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:12,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>Notes</div>
                  <div style={{background:"#f8fafc",borderRadius:8,padding:12,fontSize:13,lineHeight:1.6,color:"#374151"}}>{selPod.notes}</div>
                </div>
              )}

              {/* POD barcode */}
              <div style={{marginBottom:16}}>
                <div style={{fontSize:12,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>POD Barcode</div>
                <div style={{display:"flex",justifyContent:"center",background:"#f8fafc",borderRadius:8,padding:14}}>
                  <BarcodeDisplay code={selPod.ref} width={200} height={40} showText={true}/>
                </div>
              </div>

              {/* Signature */}
              <div style={{marginBottom:16}}>
                <div style={{fontSize:12,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Signature</div>
                <div style={{background:"#f8fafc",borderRadius:8,padding:16,textAlign:"center",border:"2px dashed #e2e8f0"}}>
                  <div style={{fontSize:24,marginBottom:4}}>✍️</div>
                  <div style={{fontSize:13,fontStyle:"italic",fontWeight:600}}>{selPod.receivedBy}</div>
                  <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{fmtDate(selPod.date)} · {selPod.signedAt}</div>
                </div>
              </div>

              {/* Action */}
              {!selPod.verified&&(
                <button onClick={()=>{syncSetPods(ps=>ps.map(x=>x.id===selPod.id?{...x,verified:true}:x));setSelPod(p=>({...p,verified:true}));showToast("POD verified!");}}
                  style={{...S.btn,width:"100%",textAlign:"center",padding:12}}>✅ Approve & Verify POD</button>
              )}
              {selPod.verified&&(
                <div style={{textAlign:"center",color:"#15803d",fontWeight:600,padding:12,background:"#f0fdf4",borderRadius:8}}>✅ Delivery verified</div>
              )}
            </div>
          </div>
        )}
        {selPod&&<div onClick={()=>setSelPod(null)} style={{position:"fixed",inset:0,zIndex:199}}/>}
      </div>
    );
  };

  const ReportsPage = () => {
    const [period,setPeriod]=useState("30days");
    const distByStatus=STATUSES.map(s=>({s,count:dists.filter(d=>d.status===s).length}));
    const distByOfficer=[...new Set(dists.map(d=>d.officer).filter(Boolean))].map(o=>({officer:o,count:dists.filter(d=>d.officer===o).length,delivered:dists.filter(d=>d.officer===o&&d.status==="Delivered").length}));
    const invByCat=CATEGORIES.map(c=>({cat:c,items:inv.filter(i=>i.cat===c).length,value:inv.filter(i=>i.cat===c).reduce((a,i)=>a+i.qty*i.cost,0)})).filter(x=>x.items>0);
    return (
      <div>
        <PageHead title="Reports & Analytics" sub="Distribution and inventory performance summary">
          <select style={S.fsel} value={period} onChange={e=>setPeriod(e.target.value)}><option value="7days">Last 7 days</option><option value="30days">Last 30 days</option><option value="all">All Time</option></select>
          <button onClick={()=>showToast("PDF export coming soon")} style={S.btnO}>↓ Export PDF</button>
          <button onClick={()=>showToast("Excel export coming soon")} style={S.btnO}>↓ Export Excel</button>
        </PageHead>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
          {[{l:"Total Distributions",v:dists.length,c:"#2563eb",ic:"🚜"},{l:"Delivered",v:dists.filter(d=>d.status==="Delivered").length,c:"#16a34a",ic:"✅"},{l:"Total Value Distributed",v:`$${stats.totalRevenue.toLocaleString()}`,c:"#7c3aed",ic:"💰"},{l:"Inventory Value",v:`$${stats.totalValue.toLocaleString()}`,c:"#d97706",ic:"📦"}].map((c,i)=>(
            <div key={i} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:"16px 18px",boxShadow:"0 1px 3px rgba(0,0,0,.05)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontSize:20}}>{c.ic}</span></div>
              <div style={{fontSize:24,fontWeight:800,color:c.c}}>{c.v}</div>
              <div style={{fontSize:12,color:"#64748b",marginTop:3}}>{c.l}</div>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
          <div style={S.card}>
            <div style={S.ch}>📊 Distribution by Status</div>
            <div style={{padding:"12px 20px"}}>
              {distByStatus.filter(x=>x.count>0).map(({s,count})=>{ const st=statusStyle(s); const pct=Math.round((count/dists.length)*100); return (
                <div key={s} style={{marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:13,fontWeight:600,color:"#0f172a"}}>{s}</span><span style={{fontSize:13,fontWeight:700,color:st.c}}>{count} ({pct}%)</span></div>
                  <div style={{height:8,background:"#f1f5f9",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:st.c,borderRadius:4}}/></div>
                </div>
              );})}
            </div>
          </div>
          <div style={S.card}>
            <div style={S.ch}>📦 Inventory by Category</div>
            <div style={{padding:"12px 20px"}}>
              {invByCat.map(({cat,items,value})=>(
                <div key={cat} style={{marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:13,fontWeight:600}}><span style={{background:catColor(cat)+"1a",color:catColor(cat),padding:"1px 8px",borderRadius:20,fontSize:11,marginRight:6}}>{cat}</span></span><span style={{fontSize:13,fontWeight:700}}>{items} items · <span style={{color:"#64748b"}}>$</span>{value.toFixed(0)}</span></div>
                  <div style={{height:6,background:"#f1f5f9",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.round((value/stats.totalValue)*100)}%`,background:catColor(cat),borderRadius:3}}/></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={S.card}>
          <div style={S.ch}>👤 Performance by Field Officer</div>
          <table style={S.tbl}>
            <thead><tr style={S.thead}>{["Officer","Total Loads","Delivered","Delivery Rate","In Transit","Problem"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {distByOfficer.map((o,i)=>{
                const total=o.count, delivered=o.delivered, rate=Math.round((delivered/total)*100);
                const inTransit=dists.filter(d=>d.officer===o.officer&&d.status==="In Transit").length;
                const problem=dists.filter(d=>d.officer===o.officer&&d.status==="Problem").length;
                return (
                  <tr key={o.officer} style={S.tr} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                    <td style={S.td}><div style={{display:"flex",alignItems:"center",gap:8}}><Av label={o.officer.split(" ").map(x=>x[0]).join("")} idx={i} size={30}/><span style={{fontWeight:600}}>{o.officer}</span></div></td>
                    <td style={{...S.td,fontWeight:700}}>{total}</td>
                    <td style={{...S.td,color:"#16a34a",fontWeight:700}}>{delivered}</td>
                    <td style={S.td}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:60,height:6,background:"#e2e8f0",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${rate}%`,background:rate>=80?"#16a34a":rate>=60?"#d97706":"#dc2626",borderRadius:3}}/></div><span style={{fontSize:12,fontWeight:700,color:rate>=80?"#16a34a":rate>=60?"#d97706":"#dc2626"}}>{rate}%</span></div></td>
                    <td style={{...S.td,color:"#d97706",fontWeight:700}}>{inTransit}</td>
                    <td style={{...S.td,color:"#dc2626",fontWeight:700}}>{problem||"—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const ScannerPage = () => {
    const [batchInput,setBatchInput]=useState(""); const [mode,setMode]=useState("lookup");
    const bRef=useRef();
    useEffect(()=>{ setTimeout(()=>bRef.current?.focus(),100); },[]);
    const doScan=(code=batchInput)=>{ if(!code.trim()) return; handleScan(code.trim()); setBatchInput(""); bRef.current?.focus(); };
    const modeColor={lookup:"#2563eb",receive:"#16a34a",issue:"#d97706",verify:"#7c3aed"};
    return (
      <div>
        <PageHead title="📷 Barcode Scanner" sub="Scan inventory, distributions, and PODs with hardware scanner or manually"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
          {[["lookup","🔍","Lookup","Find any item"],["receive","📥","Receive Stock","Add incoming inventory"],["issue","📤","Issue Stock","Deduct for distribution"],["verify","✅","Verify POD","Confirm delivery"]].map(([m,ic,l,sub])=>(
            <button key={m} onClick={()=>setMode(m)} style={{background:mode===m?modeColor[m]:"#fff",border:`2px solid ${mode===m?modeColor[m]:"#e2e8f0"}`,borderRadius:12,padding:"14px 16px",cursor:"pointer",textAlign:"left"}}>
              <div style={{fontSize:22,marginBottom:6}}>{ic}</div>
              <div style={{fontWeight:700,fontSize:14,color:mode===m?"#fff":"#0f172a"}}>{l}</div>
              <div style={{fontSize:11,color:mode===m?"rgba(255,255,255,.75)":"#94a3b8",marginTop:2}}>{sub}</div>
            </button>
          ))}
        </div>
        <div style={{background:"#0f172a",borderRadius:16,padding:28,marginBottom:24,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",left:0,right:0,height:3,background:modeColor[mode],boxShadow:`0 0 12px ${modeColor[mode]}`,animation:"scanline 2s ease-in-out infinite",opacity:.8}}/>
          <style>{`@keyframes scanline{0%{top:15%}50%{top:80%}100%{top:15%}}`}</style>
          <div style={{color:"rgba(255,255,255,.5)",fontSize:12,marginBottom:12,textTransform:"uppercase",letterSpacing:1}}>Mode: {mode.toUpperCase()} · {scannerActive?"Active":"Paused"}</div>
          <div style={{display:"flex",gap:10}}>
            <input ref={bRef} value={batchInput} onChange={e=>setBatchInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doScan()} placeholder="Point scanner at barcode or type and press Enter…" style={{flex:1,padding:"14px 16px",background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",borderRadius:10,fontSize:15,color:"#fff",outline:"none",fontFamily:"monospace",letterSpacing:1}}/>
            <button onClick={()=>doScan()} style={{...S.btn,background:modeColor[mode],padding:"14px 20px"}}>→ Scan</button>
          </div>
          <div style={{color:"rgba(255,255,255,.3)",fontSize:11,marginTop:10}}>Hardware scanners send Enter automatically. Scanner is active globally on any page.</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
          <div style={S.card}>
            <div style={S.ch}>📋 Scan Log <span style={{marginLeft:"auto",background:"#f1f5f9",color:"#64748b",borderRadius:20,padding:"1px 8px",fontSize:11,fontWeight:600}}>{scanLog.length}</span></div>
            {scanLog.length===0&&<p style={{color:"#94a3b8",fontSize:13,padding:"16px 20px"}}>No scans yet.</p>}
            {scanLog.slice(0,12).map((s,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 20px",borderBottom:"1px solid #f8fafc"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:14}}>{s.type==="inventory"?"📦":s.type==="distribution"?"🚜":s.type==="pod"?"📄":"❓"}</span>
                  <div><div style={{fontSize:12,fontWeight:700,fontFamily:"monospace"}}>{s.code}</div><div style={{fontSize:11,color:"#94a3b8"}}>{s.label}</div></div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:11,color:"#94a3b8"}}>{s.time}</span>
                  <span style={{width:8,height:8,borderRadius:"50%",background:s.type==="unknown"?"#dc2626":"#16a34a"}}/>
                </div>
              </div>
            ))}
            {scanLog.length>0&&<button onClick={()=>setScanLog([])} style={{...S.clr,width:"100%",textAlign:"center",padding:10}}>Clear log</button>}
          </div>
          <div style={S.card}>
            <div style={S.ch}>🏷 Test Barcodes</div>
            <div style={{padding:"12px 20px"}}>
              {[...inv.slice(0,4).map(i=>({code:i.barcode,label:i.name,type:"inventory"})),...dists.slice(0,2).map(d=>({code:d.ref,label:d.ref,type:"distribution"})),...pods.slice(0,2).map(p=>({code:p.ref,label:p.ref,type:"pod"}))].map((t,i)=>(
                <button key={i} onClick={()=>handleScan(t.code)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",padding:"10px 12px",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,marginBottom:6,cursor:"pointer",textAlign:"left"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span>{t.type==="inventory"?"📦":t.type==="distribution"?"🚜":"📄"}</span>
                    <div><div style={{fontSize:12,fontWeight:700,fontFamily:"monospace"}}>{t.code}</div><div style={{fontSize:11,color:"#94a3b8"}}>{t.label}</div></div>
                  </div>
                  <BarcodeDisplay code={t.code} width={70} height={22} showText={false} mini/>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ═══════════════════ SETTINGS + USER MANAGEMENT ═══════════════════ */

  /* NotificationsTab must be a standalone component so useState calls
     obey React's Rules of Hooks (no hooks inside .map() callbacks).    */
  const NotificationsTab = ({showToast}) => {
    const PREFS = [
      {key:"lowStock",     title:"Low stock alerts",        desc:"Notify when inventory falls below minimum level",  def:true},
      {key:"expiry",       title:"Expiry warnings",          desc:"Alert 60 days before items expire",               def:true},
      {key:"delivery",     title:"Delivery confirmations",   desc:"Notify when distributions are marked delivered",   def:true},
      {key:"podReview",    title:"POD pending reviews",      desc:"Remind when PODs are awaiting verification",       def:false},
      {key:"maintenance",  title:"Fleet maintenance due",    desc:"Notify when vehicle inspection is overdue",        def:true},
      {key:"hos",          title:"Officer HOS alerts",       desc:"Alert for high Hours-of-Service risk officers",    def:false},
    ];
    const initState = Object.fromEntries(PREFS.map(p=>[p.key,p.def]));
    const [prefs,setPrefs] = useState(initState);
    const toggle = key => setPrefs(p=>({...p,[key]:!p[key]}));
    return (
      <div style={{maxWidth:560}}>
        <div style={S.card}>
          <div style={S.ch}>🔔 Notification Preferences</div>
          <div style={{padding:"18px 22px"}}>
            {PREFS.map(({key,title,desc})=>(
              <div key={key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:"1px solid #f1f5f9"}}>
                <div><div style={{fontWeight:600,fontSize:14,color:"#0f172a"}}>{title}</div><div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{desc}</div></div>
                <div onClick={()=>toggle(key)} style={{width:44,height:24,borderRadius:12,background:prefs[key]?"#15803d":"#e2e8f0",cursor:"pointer",position:"relative",flexShrink:0}}>
                  <div style={{position:"absolute",width:18,height:18,borderRadius:"50%",background:"#fff",top:3,left:prefs[key]?23:3,transition:"left .15s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
                </div>
              </div>
            ))}
            <button onClick={()=>showToast("Notification settings saved!")} style={{...S.btn,marginTop:16}}>Save Preferences</button>
          </div>
        </div>
      </div>
    );
  };

  const SettingsPage = () => {
    const [tab,setTab]=useState("users");
    const [userSrch,setUserSrch]=useState("");
    const [roleFilter,setRoleFilter]=useState("All");
    const [statusFilter,setStatusFilter]=useState("All");

    const filteredUsers=users.filter(u=>{
      const txt=`${u.name} ${u.email} ${u.location}`.toLowerCase();
      const role=USER_ROLES.find(r=>r.id===u.role);
      return (roleFilter==="All"||u.role===roleFilter)&&(statusFilter==="All"||u.status===statusFilter)&&(!userSrch||txt.includes(userSrch.toLowerCase())||role?.label.toLowerCase().includes(userSrch.toLowerCase()));
    });

    const TABS=[{id:"users",label:"👥 User Management"},{id:"roles",label:"🔐 Roles & Permissions"},{id:"general",label:"⚙ General"},{id:"notifications",label:"🔔 Notifications"},{id:"sync",label:"🔄 Sync & Database"}];

    return (
      <div>
        <PageHead title="Settings" sub="Manage your system configuration"/>
        {/* Tab bar */}
        <div style={{display:"flex",gap:4,marginBottom:24,borderBottom:"2px solid #e2e8f0",paddingBottom:0}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 18px",background:"none",border:"none",borderBottom:`2px solid ${tab===t.id?"#15803d":"transparent"}`,marginBottom:-2,cursor:"pointer",fontSize:13,fontWeight:tab===t.id?700:500,color:tab===t.id?"#15803d":"#64748b",whiteSpace:"nowrap"}}>{t.label}</button>
          ))}
        </div>

        {/* ── USER MANAGEMENT TAB ── */}
        {tab==="users"&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
              {USER_ROLES.map(r=>{ const count=users.filter(u=>u.role===r.id&&u.status==="Active").length; return (
                <div key={r.id} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:"14px 16px",display:"flex",gap:12,alignItems:"center",boxShadow:"0 1px 3px rgba(0,0,0,.05)"}}>
                  <div style={{width:40,height:40,borderRadius:10,background:r.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{r.icon}</div>
                  <div><div style={{fontSize:22,fontWeight:800,color:r.color}}>{count}</div><div style={{fontSize:11,color:"#64748b",marginTop:1}}>{r.label}</div></div>
                </div>
              );})}
            </div>
            <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
              <input style={{...S.fsel,minWidth:240}} placeholder="🔍 Search users by name, email, role…" value={userSrch} onChange={e=>setUserSrch(e.target.value)}/>
              <span style={S.fl}>Role:</span>
              <select style={S.fsel} value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}>
                <option value="All">All Roles</option>
                {USER_ROLES.map(r=><option key={r.id} value={r.id}>{r.icon} {r.label}</option>)}
              </select>
              <span style={S.fl}>Status:</span>
              <select style={S.fsel} value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
                <option value="All">All</option><option>Active</option><option>Inactive</option><option>Suspended</option>
              </select>
              <button onClick={()=>{setUserSrch("");setRoleFilter("All");setStatusFilter("All");}} style={S.clr}>✕ Clear</button>
              <button onClick={()=>openModal("user")} style={{...S.btn,marginLeft:"auto"}}>+ Add User</button>
            </div>
            <div style={S.card}>
              <table style={S.tbl}>
                <thead><tr style={S.thead}>{["User","Role","Status","Location","Last Login","Joined","Actions"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {filteredUsers.map((u,i)=>(
                    <tr key={u.id} style={S.tr} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                      <td style={S.td}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <Av label={u.avatar} idx={i} size={36}/>
                          <div>
                            <div style={{fontWeight:700,fontSize:14,color:"#0f172a"}}>{u.name}</div>
                            <div style={{fontSize:11,color:"#94a3b8"}}>{u.email}</div>
                            {u.phone&&<div style={{fontSize:11,color:"#94a3b8"}}>📱 {u.phone}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={S.td}><RoleBadge roleId={u.role}/></td>
                      <td style={S.td}><StatusPill s={u.status}/></td>
                      <td style={{...S.td,fontSize:12,color:"#374151"}}>📍 {u.location}</td>
                      <td style={{...S.td,fontSize:12,color:"#64748b"}}>{u.lastLogin}</td>
                      <td style={{...S.td,fontSize:12,color:"#64748b"}}>{u.joined}</td>
                      <td style={S.td}>
                        <div style={{display:"flex",gap:6}}>
                          <button onClick={()=>openModal("user",u)} style={{...S.icnBtn,fontSize:11}} title="Edit">✏️ Edit</button>
                          <button onClick={()=>{ if(u.status==="Active"){syncSetUsers(us=>us.map(x=>x.id===u.id?{...x,status:"Inactive"}:x));showToast(`${u.name} deactivated`);}else{syncSetUsers(us=>us.map(x=>x.id===u.id?{...x,status:"Active"}:x));showToast(`${u.name} activated`);}}} style={{...S.icnBtn,fontSize:11,color:u.status==="Active"?"#d97706":"#16a34a"}} title={u.status==="Active"?"Deactivate":"Activate"}>{u.status==="Active"?"⏸ Disable":"▶ Enable"}</button>
                          <button onClick={()=>{ if(window.confirm(`Delete ${u.name}?`)){deleteRecord("users",u.id);setUsers(p=>p.filter(x=>x.id!==u.id));showToast("User removed");}}} style={{...S.icnBtn,color:"#dc2626",fontSize:11}} title="Delete">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filteredUsers.length&&<p style={{textAlign:"center",color:"#94a3b8",padding:32}}>No users match your filters.</p>}
            </div>
          </div>
        )}

        {/* ── ROLES & PERMISSIONS TAB ── */}
        {tab==="roles"&&(
          <div>
            <p style={{color:"#64748b",fontSize:14,marginBottom:20}}>Each role has a defined set of permissions controlling what actions users can perform in the system.</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
              {USER_ROLES.map(r=>(
                <div key={r.id} style={{background:"#fff",border:`1px solid ${r.color}30`,borderRadius:12,padding:20,boxShadow:"0 1px 3px rgba(0,0,0,.05)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                    <div style={{width:44,height:44,borderRadius:12,background:r.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{r.icon}</div>
                    <div>
                      <div style={{fontWeight:700,fontSize:15,color:r.color}}>{r.label}</div>
                      <div style={{fontSize:12,color:"#64748b",marginTop:2}}>{r.desc}</div>
                    </div>
                    <span style={{marginLeft:"auto",fontWeight:700,fontSize:14,color:r.color}}>{users.filter(u=>u.role===r.id).length} users</span>
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {(ROLE_PERMISSIONS[r.id]||[]).map(p=>(
                      <span key={p} style={{background:r.bg,color:r.color,border:`1px solid ${r.color}30`,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600}}>✓ {p.replace(/_/g," ")}</span>
                    ))}
                  </div>
                  {!(ROLE_PERMISSIONS[r.id]?.length) && <p style={{fontSize:12,color:"#94a3b8",margin:0}}>No permissions defined.</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── GENERAL TAB ── */}
        {tab==="general"&&(
          <div style={{maxWidth:560}}>
            <div style={S.card}>
              <div style={S.ch}>🏢 Organisation Details</div>
              <div style={{padding:"18px 22px"}}>
                {[["Organisation Name","AgroFlow Sierra Leone"],["Programme","National Agricultural Distribution Programme"],["Country","Sierra Leone"],["Reporting Year","2025"]].map(([l,v])=>(
                  <div key={l} style={{marginBottom:14}}>
                    <label style={{fontSize:11,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",letterSpacing:.5,display:"block",marginBottom:5}}>{l}</label>
                    <input defaultValue={v} style={S.fi}/>
                  </div>
                ))}
                <button onClick={()=>showToast("Settings saved!")} style={S.btn}>Save Changes</button>
              </div>
            </div>
            <div style={S.card}>
              <div style={S.ch}>🗺 Regional Configuration</div>
              <div style={{padding:"18px 22px"}}>
                <div style={{marginBottom:14}}>
                  <label style={{fontSize:11,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",letterSpacing:.5,display:"block",marginBottom:5}}>Timezone</label>
                  <select style={S.fi} defaultValue="Africa/Freetown"><option>Africa/Freetown (GMT+0)</option><option>UTC</option></select>
                </div>
                <div style={{marginBottom:14}}>
                  <label style={{fontSize:11,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",letterSpacing:.5,display:"block",marginBottom:5}}>Date Format</label>
                  <select style={S.fi} defaultValue="DD/MM/YYYY"><option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option></select>
                </div>
                <div style={{marginBottom:14}}>
                  <label style={{fontSize:11,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",letterSpacing:.5,display:"block",marginBottom:5}}>Currency</label>
                  <select style={S.fi} defaultValue="USD"><option>USD ($)</option><option>SLL (Le)</option><option>GBP (£)</option></select>
                </div>
                <button onClick={()=>showToast("Regional settings saved!")} style={S.btn}>Save</button>
              </div>
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS TAB ── */}
        {tab==="notifications"&&<NotificationsTab showToast={showToast}/>}

        {/* ── SYNC & DATABASE TAB ── */}
        {tab==="sync"&&(
          <div style={{maxWidth:600}}>
            <div style={S.card}>
              <div style={S.ch}>🔄 Sync Status</div>
              <div style={{padding:20}}>
                <div style={{display:"flex",alignItems:"center",gap:12,background:online?"#f0fdf4":"#f1f5f9",borderRadius:10,padding:16,marginBottom:16}}>
                  <span style={{width:14,height:14,borderRadius:"50%",background:online?"#16a34a":"#94a3b8",flexShrink:0}}/>
                  <div>
                    <div style={{fontWeight:700,color:online?"#15803d":"#374151"}}>{online?"Connected to Cloud":"Offline Mode"}</div>
                    <div style={{fontSize:12,color:"#64748b",marginTop:2}}>{online?"All changes sync automatically to Supabase":"Changes are saved locally and will sync when connection is restored"}</div>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                  {[["Sync Status",syncStatus.charAt(0).toUpperCase()+syncStatus.slice(1)],["Pending Changes",pendingCount],["Local DB","IndexedDB (Browser)"],["Cloud DB","Supabase (PostgreSQL)"]].map(([l,v])=>(
                    <div key={l} style={{background:"#f8fafc",borderRadius:8,padding:12}}><div style={{fontSize:11,color:"#94a3b8"}}>{l}</div><div style={{fontWeight:700,fontSize:14,marginTop:2,color:l==="Pending Changes"&&pendingCount>0?"#d97706":"#0f172a"}}>{v}</div></div>
                  ))}
                </div>
                <button onClick={forceSync} style={{...S.btn,marginRight:8}}>🔄 Force Sync Now</button>
                <button onClick={()=>showToast("Local database cleared — refresh to reload")} style={{...S.btnO,color:"#dc2626",borderColor:"#fca5a5"}}>🗑 Clear Local Cache</button>
              </div>
            </div>
            <div style={S.card}>
              <div style={S.ch}>☁ Supabase Configuration</div>
              <div style={{padding:20}}>
                <div style={{background:"#fef9c3",border:"1px solid #fde047",borderRadius:8,padding:12,marginBottom:16,fontSize:13,color:"#854d0e"}}>⚠ Replace the placeholder below with your actual Supabase anon key to enable cloud sync.</div>
                {[["Project URL",SUPABASE_URL],["Anon Key","YOUR_ANON_KEY_HERE — paste in agri_inventory_system.jsx"]].map(([l,v])=>(
                  <div key={l} style={{marginBottom:12}}>
                    <label style={{fontSize:11,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",display:"block",marginBottom:4}}>{l}</label>
                    <input defaultValue={v} readOnly style={{...S.fi,fontFamily:"monospace",fontSize:11,color:"#374151",background:"#f8fafc"}}/>
                  </div>
                ))}
                <button onClick={()=>showToast("Open the .jsx file and replace SUPABASE_ANON to connect")} style={S.btnO}>ℹ How to connect →</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ═══════════════════ SIDE PANEL ═══════════════════ */
  const SidePanel = () => {
    if(!panel) return null;
    const {item,type}=panel;
    const tabs=type==="dist"?["overview","stops","notes","billing"]:["overview","history"];
    const b  =type==="dist"?benes.find(x=>x.id===item.beneId):null;
    const it =type==="dist"?inv.find(x=>x.id===item.itemId):null;
    return (
      <div style={{position:"fixed",top:0,right:0,bottom:0,width:375,background:"#fff",boxShadow:"-4px 0 28px rgba(0,0,0,.13)",zIndex:200,display:"flex",flexDirection:"column",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 20px",borderBottom:"1px solid #f1f5f9"}}>
          <span style={{fontWeight:700,fontSize:15,color:"#0f172a"}}>{type==="dist"?item.ref:type==="fleet"?item.plate:item.name}</span>
          <button onClick={closePanel} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#94a3b8"}}>✕</button>
        </div>
        <div style={{display:"flex",borderBottom:"1px solid #f1f5f9"}}>
          {tabs.map(t=>(
            <button key={t} onClick={()=>setPanelTab(t)} style={{flex:1,padding:"10px 4px",border:"none",borderBottom:`2px solid ${panelTab===t?"#16a34a":"transparent"}`,background:"none",fontSize:12,color:panelTab===t?"#16a34a":"#64748b",fontWeight:panelTab===t?700:400,cursor:"pointer",textTransform:"capitalize"}}>{t}</button>
          ))}
        </div>
        <div style={{padding:20,flex:1}}>
          {/* DISTRIBUTION PANEL */}
          {type==="dist"&&panelTab==="overview"&&(
            <div>
              <div style={{display:"flex",gap:8,marginBottom:14}}><StatusPill s={item.status}/><PriorityTag p={item.priority}/></div>
              <Pill l="Date" v={fmtDate(item.date)}/><Pill l="Season" v={item.season}/><Pill l="Item" v={it?.name||"—"}/><Pill l="Quantity" v={`${item.qty} ${it?.unit||""}`}/><Pill l="Rate" v={`$${item.rate}`}/><Pill l="Officer" v={item.officer||"Unassigned"}/><Pill l="Vehicle" v={item.truck||"—"}/>
              <div style={{marginTop:14,background:"#f8fafc",borderRadius:10,padding:14,display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                <div style={{fontSize:11,color:"#94a3b8",fontWeight:600}}>DISTRIBUTION BARCODE</div>
                <BarcodeDisplay code={item.ref} width={240} height={44} showText={true}/>
                <button onClick={()=>handleScan(item.ref)} style={{...S.btnO,fontSize:12,borderColor:"#86efac",color:"#15803d",padding:"6px 14px"}}>📷 Simulate Scan</button>
              </div>
              {b&&(
                <div style={{marginTop:14}}>
                  <div style={{fontSize:12,color:"#94a3b8",fontWeight:600,marginBottom:8}}>BENEFICIARY</div>
                  <div style={{display:"flex",gap:10,alignItems:"center",background:"#f8fafc",borderRadius:10,padding:12}}>
                    <Av label={b.avatar} idx={0} size={40}/>
                    <div><div style={{fontWeight:700,fontSize:14}}>{b.name}</div><div style={{fontSize:12,color:"#94a3b8"}}>{b.group}</div><div style={{fontSize:12,color:"#94a3b8"}}>📍 {b.village} · 📱 {b.phone}</div></div>
                  </div>
                </div>
              )}
              <div style={{display:"flex",gap:8,marginTop:18}}>
                {item.status!=="Delivered"&&<button onClick={()=>{ syncSetDists(ds=>ds.map(d=>d.id===item.id?{...d,status:"Delivered"}:d)); setPanel(p=>({...p,item:{...p.item,status:"Delivered"}})); showToast("Marked as Delivered"); }} style={{...S.btn,flex:1,fontSize:12}}>✓ Mark Delivered</button>}
                {item.status==="Delivered"&&<div style={{flex:1,textAlign:"center",background:"#f0fdf4",borderRadius:8,padding:10,fontSize:12,color:"#15803d",fontWeight:700}}>✅ Already Delivered</div>}
                <button onClick={()=>{ deleteRecord("distributions",item.id); setDists(ds=>ds.filter(d=>d.id!==item.id)); closePanel(); showToast("Load deleted"); }} style={{...S.btnO,flex:1,fontSize:12,color:"#dc2626",borderColor:"#fca5a5"}}>🗑 Delete</button>
              </div>
            </div>
          )}
          {type==="dist"&&panelTab==="stops"&&(<div><p style={{color:"#94a3b8",fontSize:13}}>No stop data for this distribution.</p></div>)}
          {type==="dist"&&panelTab==="notes"&&(<div><div style={{background:"#f8fafc",borderRadius:8,padding:14,fontSize:13,lineHeight:1.7,color:"#374151"}}>{item.notes||"No notes added."}</div></div>)}
          {type==="dist"&&panelTab==="billing"&&(<div><Pill l="Rate per Unit" v={`$${item.rate}`}/><Pill l="Quantity" v={`${item.qty} ${it?.unit||""}`}/><Pill l="Total Value" v={`$${(item.rate*item.qty).toFixed(2)}`}/></div>)}
          {/* FLEET PANEL */}
          {type==="fleet"&&panelTab==="overview"&&(
            <div>
              <div style={{background:"#f0fdf4",borderRadius:12,padding:20,textAlign:"center",marginBottom:16,fontSize:56}}>🚛</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                {[{l:"Vehicle ID",v:item.plate},{l:"Model",v:item.model},{l:"Year",v:item.year},{l:"Mileage",v:item.mileage}].map(x=>(
                  <div key={x.l} style={{background:"#f8fafc",padding:10,borderRadius:8}}><div style={{fontSize:11,color:"#94a3b8"}}>{x.l}</div><div style={{fontWeight:700,fontSize:13}}>{x.v}</div></div>
                ))}
              </div>
              <StatusPill s={item.status}/>
              {item.driver&&<div style={{marginTop:14,background:"#f8fafc",borderRadius:10,padding:12,display:"flex",gap:10,alignItems:"center"}}><Av label={item.driver.split(" ").map(x=>x[0]).join("")} idx={0} size={36}/><div><div style={{fontWeight:700}}>{item.driver}</div><div style={{fontSize:12,color:"#16a34a"}}>Assigned</div><div style={{fontSize:11,color:"#94a3b8"}}>📍 {item.loc}</div></div></div>}
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
                <button onClick={()=>openModal("editFleet",item)} style={{...S.btn,flex:1,fontSize:12}}>✏️ Edit Vehicle</button>
              </div>
            </div>
          )}
          {type==="fleet"&&panelTab==="history"&&(<div><p style={{color:"#94a3b8",fontSize:13}}>Trip history for {item.plate}.</p></div>)}
          {/* OFFICER PANEL */}
          {type==="officer"&&panelTab==="overview"&&(
            <div>
              <div style={{background:"#f0fdf4",borderRadius:12,padding:24,textAlign:"center",marginBottom:16}}>
                <Av label={item.avatar} idx={0} size={64}/>
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
                <button onClick={()=>openModal("officer",item)} style={{...S.btn,flex:1,fontSize:12}}>✏️ Edit Officer</button>
              </div>
            </div>
          )}
          {type==="officer"&&panelTab==="history"&&(<div><p style={{color:"#94a3b8",fontSize:13}}>Trip history for {item.name}.</p></div>)}
        </div>
      </div>
    );
  };

  /* ═══════════════════ ROUTING ═══════════════════ */
  const isFullPage=page==="routes"||page==="warehouses";
  const currentPage = {
    dashboard:     <Dashboard/>,
    orders:        <OrdersPage/>,
    dispatch:      <DispatchBoard/>,
    routes:        <RoutesPage/>,
    fleet:         <FleetPage/>,
    officers:      <OfficersPage/>,
    warehouses:    <WarehousesPage/>,
    inventory:     <InventoryPage/>,
    beneficiaries: <BeneficiariesPage/>,
    pod:           <PODPage/>,
    reports:       <ReportsPage/>,
    scanner:       <ScannerPage/>,
    settings:      <SettingsPage/>,
  }[page]||<Dashboard/>;

  /* ═══════════════════ LAYOUT ═══════════════════ */
  return (
    <div style={{display:"flex",height:"100vh",background:"#f8fafc",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",fontSize:14,color:"#0f172a"}}>
      {/* ── SIDEBAR ── */}
      <div style={{width:220,background:"#0f172a",display:"flex",flexDirection:"column",flexShrink:0,overflowY:"auto"}}>
        {/* Logo */}
        <div style={{padding:"20px 18px 14px",borderBottom:"1px solid rgba(255,255,255,.08)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,borderRadius:10,background:"#15803d",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"#fff",flexShrink:0}}>🌾</div>
            <div><div style={{fontWeight:800,fontSize:14,color:"#fff",letterSpacing:.3}}>AgroFlow</div><div style={{fontSize:10,color:"rgba(255,255,255,.4)",marginTop:1}}>Distribution System</div></div>
          </div>
        </div>
        {/* Nav */}
        <nav style={{flex:1,padding:"10px 0"}}>
          {NAV_GROUPS.map(g=>(
            <div key={g.id}>
              {g.label&&(
                <button onClick={()=>toggleGroup(g.id)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 18px",background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,.3)",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>
                  {g.label}<span style={{transition:"transform .2s",transform:openGroups[g.id]?"rotate(180deg)":"none",fontSize:9}}>▾</span>
                </button>
              )}
              {(!g.label||openGroups[g.id])&&g.items.map(item=>(
                <button key={item.id} onClick={()=>setPage(item.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"9px 18px 9px 22px",background:page===item.id?"rgba(22,163,74,.18)":undefined,border:"none",cursor:"pointer",borderLeft:page===item.id?"3px solid #16a34a":"3px solid transparent",color:page===item.id?"#4ade80":"rgba(255,255,255,.6)",fontSize:13,fontWeight:page===item.id?700:400,textAlign:"left"}}>
                  <span style={{fontSize:15}}>{item.icon}</span>{item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        {/* User */}
        <div style={{padding:"14px 18px",borderTop:"1px solid rgba(255,255,255,.08)",display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:30,height:30,borderRadius:"50%",background:"rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>SA</div>
          <div><div style={{fontSize:12,fontWeight:700,color:"#fff"}}>Sarah Admin</div><div style={{fontSize:10,color:"rgba(255,255,255,.4)"}}>Operations Manager</div></div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Topbar */}
        <div style={{height:52,background:"#fff",borderBottom:"1px solid #e2e8f0",display:"flex",alignItems:"center",padding:"0 20px",gap:12,flexShrink:0}}>
          <div style={{flex:1,position:"relative",maxWidth:280}}>
            <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#94a3b8",fontSize:13}}>🔍</span>
            <input placeholder="Search…" style={{width:"100%",padding:"7px 12px 7px 30px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:13,color:"#374151",outline:"none",background:"#f8fafc"}}/>
          </div>
          {/* Scanner */}
          <button onClick={()=>setManualScanOpen(true)} style={{display:"flex",alignItems:"center",gap:7,padding:"7px 14px",background:scannerActive?"#f0fdf4":"#f8fafc",border:`1px solid ${scannerActive?"#86efac":"#e2e8f0"}`,borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600,color:scannerActive?"#15803d":"#64748b",whiteSpace:"nowrap"}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:scannerActive?"#16a34a":"#94a3b8",boxShadow:scannerActive?"0 0 0 2px #bbf7d0":undefined}}/>
            📷 Scan
          </button>
          <button onClick={()=>setScannerActive(v=>!v)} style={{background:"none",border:"1px solid #e2e8f0",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:12,color:"#94a3b8"}} title={scannerActive?"Disable scanner":"Enable scanner"}>
            {scannerActive?"🟢":"⚪"}
          </button>
          {/* Sync status */}
          <div onClick={forceSync} title="Click to sync" style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:20,background:syncStatus==="syncing"?"#fef9c3":syncStatus==="error"?"#fee2e2":online?"#f0fdf4":"#f1f5f9",border:`1px solid ${syncStatus==="syncing"?"#fde047":syncStatus==="error"?"#fca5a5":online?"#86efac":"#e2e8f0"}`,cursor:"pointer",whiteSpace:"nowrap"}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:syncStatus==="syncing"?"#ca8a04":syncStatus==="error"?"#dc2626":online?"#16a34a":"#94a3b8",flexShrink:0}}/>
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
            <span style={{fontSize:11,fontWeight:600,color:syncStatus==="syncing"?"#854d0e":syncStatus==="error"?"#b91c1c":online?"#15803d":"#64748b"}}>
              {syncStatus==="syncing"?"Syncing…":syncStatus==="error"?"Sync Error":!online?"Offline":dbReady?"Online ✓":"Loading…"}
            </span>
            {pendingCount>0&&<span style={{background:"#d97706",color:"#fff",borderRadius:20,padding:"0 5px",fontSize:9,fontWeight:700}}>{pendingCount}</span>}
          </div>
          {/* Notifications */}
          <div style={{position:"relative"}}>
            <button onClick={()=>showToast(`${stats.exceptions} alerts — check Inventory for details`)} style={{background:"none",border:"1px solid #e2e8f0",borderRadius:8,width:36,height:36,cursor:"pointer",fontSize:15}}>🔔</button>
            {stats.exceptions>0&&<span style={{position:"absolute",top:-4,right:-4,background:"#dc2626",color:"#fff",borderRadius:"50%",width:16,height:16,fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{stats.exceptions}</span>}
          </div>
          {/* User */}
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:"#15803d",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:12}}>SA</div>
            <div><div style={{fontSize:12,fontWeight:700,color:"#0f172a"}}>Sarah Admin</div><div style={{fontSize:10,color:"#94a3b8"}}>Operations Manager</div></div>
          </div>
        </div>
        {/* Page content */}
        <div style={{flex:1,overflow:isFullPage?"hidden":"auto",padding:isFullPage?0:"24px 24px 32px"}}>
          {currentPage}
        </div>
      </div>

      {/* ── SIDE PANEL ── */}
      {panel&&<><SidePanel/><div onClick={closePanel} style={{position:"fixed",inset:0,zIndex:190}}/></>}

      {/* ── MODALS ── */}
      {modal==="dist"    &&<DistForm onSave={f=>{syncSetDists(ds=>[...ds,f]);if(f.status==="Delivered"){syncSetInv(v=>v.map(i=>i.id===+f.itemId?{...i,qty:Math.max(0,i.qty-+f.qty)}:i));}showToast("Distribution recorded!");}} onClose={closeModal}/>}
      {modal==="inv"     &&<InvForm  onSave={f=>{syncSetInv(v=>{const nid=Math.max(...v.map(i=>i.id),0)+1;return [...v,{...f,id:nid,barcode:`INV-${String(nid).padStart(5,"0")}`}];});showToast("Item added!");}} onClose={closeModal}/>}
      {modal==="editInv" &&<InvForm  item={editItem} onSave={f=>{syncSetInv(v=>v.map(i=>i.id===editItem.id?{...f,id:editItem.id,barcode:editItem.barcode}:i));showToast("Item updated!");}} onClose={closeModal}/>}
      {modal==="fleet"   &&<FleetForm onSave={f=>{syncSetFleet(v=>{const nid=Math.max(...v.map(x=>x.id),0)+1;return [...v,{...f,id:nid,lastPing:"Just added"}];});showToast("Vehicle added!");}} onClose={closeModal}/>}
      {modal==="editFleet"&&<FleetForm item={editItem} onSave={f=>{syncSetFleet(v=>v.map(x=>x.id===editItem.id?{...f,id:editItem.id,lastPing:x.lastPing}:x));showToast("Vehicle updated!");}} onClose={closeModal}/>}
      {modal==="user"    &&<UserForm   item={editItem} onSave={f=>{if(editItem){syncSetUsers(u=>u.map(x=>x.id===editItem.id?{...f,id:editItem.id}:x));showToast("User updated!");}else{syncSetUsers(u=>{const nid=Math.max(...u.map(x=>x.id),0)+1;return [...u,{...f,id:nid}];});showToast("User added!");}}} onClose={closeModal}/>}
      {modal==="officer" &&<OfficerForm item={editItem} onSave={f=>{if(editItem){const updated={...f,id:editItem.id};setOfficers(p=>p.map(x=>x.id===editItem.id?updated:x));saveRecord("field_officers",updated);showToast("Officer updated!");}else{setOfficers(p=>{const nid=Math.max(...p.map(x=>x.id),0)+1;const rec={...f,id:nid};saveRecord("field_officers",rec);return [...p,rec];});showToast("Officer added!");}}} onClose={closeModal}/>}

      {/* ── BARCODE ── */}
      {scanResult&&<ScanResultModal/>}
      {manualScanOpen&&<ManualScanInput/>}

      {/* ── TOAST ── */}
      {toast&&<div style={{position:"fixed",bottom:24,right:24,background:toast.type==="error"?"#7f1d1d":"#14532d",color:"#fff",padding:"12px 20px",borderRadius:10,fontWeight:600,fontSize:14,zIndex:999,boxShadow:"0 4px 24px rgba(0,0,0,.2)",display:"flex",alignItems:"center",gap:8}}>
        {toast.type==="error"?"❌":"✅"} {toast.msg}
      </div>}
    </div>
  );
}

/* ═══════════════════════════ STYLE CONSTANTS ═══════════════════════════ */
const S = {
  card:  {background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,overflow:"hidden",marginBottom:20,boxShadow:"0 1px 3px rgba(0,0,0,.05)"},
  ch:    {padding:"12px 20px",borderBottom:"1px solid #f1f5f9",fontWeight:700,fontSize:14,color:"#0f172a",display:"flex",alignItems:"center",gap:8},
  tbl:   {width:"100%",borderCollapse:"collapse"},
  thead: {background:"#f8fafc"},
  th:    {padding:"10px 14px",textAlign:"left",fontSize:11,color:"#94a3b8",textTransform:"uppercase",letterSpacing:.8,borderBottom:"1px solid #e2e8f0",whiteSpace:"nowrap",fontWeight:600},
  tr:    {borderBottom:"1px solid #f1f5f9",transition:"background .1s",cursor:"pointer"},
  td:    {padding:"12px 14px",fontSize:13,color:"#374151",verticalAlign:"middle"},
  fi:    {padding:"9px 12px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:13,color:"#374151",outline:"none",background:"#fff",width:"100%",boxSizing:"border-box"},
  btn:   {padding:"9px 16px",background:"#15803d",border:"none",borderRadius:8,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,whiteSpace:"nowrap"},
  btnO:  {padding:"9px 16px",background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,color:"#374151",cursor:"pointer",fontSize:13,fontWeight:600,whiteSpace:"nowrap"},
  btnG:  {padding:"9px 16px",background:"transparent",border:"1px solid #e2e8f0",borderRadius:8,color:"#64748b",cursor:"pointer",fontSize:13},
  icnBtn:{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:14},
  dots:  {background:"none",border:"1px solid #e2e8f0",borderRadius:6,padding:"3px 10px",cursor:"pointer",fontSize:16,color:"#94a3b8",letterSpacing:2},
  mfoot: {display:"flex",justifyContent:"flex-end",gap:10,padding:"16px 22px",borderTop:"1px solid #f1f5f9"},
  fsel:  {padding:"7px 10px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:12,color:"#374151",background:"#fff",outline:"none"},
  fl:    {fontSize:12,color:"#64748b",whiteSpace:"nowrap"},
  clr:   {padding:"6px 12px",background:"none",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:12},
};
