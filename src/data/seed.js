export const INIT_INVENTORY = [
  { id:1, barcode:"INV-00001", name:"Maize Seeds (OPV)", cat:"Seeds", unit:"Kg", qty:500, qtyExpected:600, qtyDistributed:150, qtyReserved:0, min:100, supplier:"AgroSupplies Ltd", cost:2.50, loc:"Warehouse A", expiry:"2026-06-30", procCode:"PC-2025-001", procDate:"2025-01-10", receivedDate:"2025-01-18" },
  { id:2, barcode:"INV-00002", name:"NPK Fertilizer 17:17:17", cat:"Fertilizer", unit:"Bags (50kg)", qty:80, qtyExpected:100, qtyDistributed:15, qtyReserved:0, min:20, supplier:"FertileCo", cost:35, loc:"Warehouse B", expiry:"2027-01-01", procCode:"PC-2025-001", procDate:"2025-01-10", receivedDate:"2025-01-20" },
  { id:3, barcode:"INV-00003", name:"Urea Fertilizer", cat:"Fertilizer", unit:"Bags (50kg)", qty:15, qtyExpected:50, qtyDistributed:0, qtyReserved:0, min:25, supplier:"FertileCo", cost:30, loc:"Warehouse B", expiry:"2027-01-01", procCode:"PC-2025-001", procDate:"2025-01-10", receivedDate:"2025-01-20" },
  { id:4, barcode:"INV-00004", name:"Soybean Seeds", cat:"Seeds", unit:"Kg", qty:200, qtyExpected:200, qtyDistributed:0, qtyReserved:0, min:50, supplier:"SeedWorks", cost:3.20, loc:"Warehouse A", expiry:"2025-12-31", procCode:"PC-2025-002", procDate:"2025-02-05", receivedDate:"2025-02-12" },
  { id:5, barcode:"INV-00005", name:"Lambda-cyhalothrin", cat:"Pesticide", unit:"Litres", qty:40, qtyExpected:50, qtyDistributed:0, qtyReserved:0, min:10, supplier:"AgroChem", cost:18, loc:"Chem. Store", expiry:"2025-09-01", procCode:"PC-2025-003", procDate:"2025-02-20", receivedDate:"2025-03-01" },
  { id:8, barcode:"INV-00008", name:"Glyphosate Herbicide", cat:"Herbicide", unit:"Litres", qty:55, qtyExpected:60, qtyDistributed:0, qtyReserved:20, min:15, supplier:"AgroChem", cost:12, loc:"Chem. Store", expiry:"2026-03-01", procCode:"PC-2025-003", procDate:"2025-02-20", receivedDate:"2025-03-01" },
  { id:6, barcode:"INV-00006", name:"Hand Hoes", cat:"Tools", unit:"Units", qty:120, qtyExpected:150, qtyDistributed:18, qtyReserved:0, min:30, supplier:"ToolMart", cost:8, loc:"Equip. Shed", expiry:null, procCode:"PC-2025-004", procDate:"2025-03-01", receivedDate:"2025-03-08" },
  { id:7, barcode:"INV-00007", name:"Watering Cans (10L)", cat:"Tools", unit:"Units", qty:60, qtyExpected:60, qtyDistributed:0, qtyReserved:0, min:15, supplier:"ToolMart", cost:5, loc:"Equip. Shed", expiry:null, procCode:"PC-2025-004", procDate:"2025-03-01", receivedDate:"2025-03-08" },
];

export const INIT_BENES = [
  { id:1, name:"Musa Kamara", group:"Freetown Farmers Cooperative", village:"Waterloo", phone:"076123456", gender:"M", count:12, rating:4.8, avatar:"MK" },
  { id:2, name:"Aminata Sesay", group:"Women in Agriculture SL", village:"Lungi", phone:"078234567", gender:"F", count:25, rating:4.6, avatar:"AS" },
  { id:3, name:"Ibrahim Bangura", group:"Youth Agri-Hub", village:"Bo", phone:"077345678", gender:"M", count:18, rating:4.9, avatar:"IB" },
  { id:4, name:"Fatmata Koroma", group:"Kono Seed Savers", village:"Koidu", phone:"079456789", gender:"F", count:30, rating:4.7, avatar:"FK" },
  { id:5, name:"Abdul Conteh", group:"Northern Smallholders", village:"Makeni", phone:"076567890", gender:"M", count:22, rating:4.5, avatar:"AC" },
];

export const SEASONS = ["2025 Long Rains","2025 Short Rains","2026 Long Rains","2026 Short Rains"];
export const CATEGORIES = ["Seeds","Fertilizer","Pesticide","Herbicide","Tools","Other"];
export const STATUSES = ["Unassigned","Assigned","In Transit","Delivered","Problem"];

export const INIT_DISTS = [
  { id:1, ref:"AG-2025-001847", date:"2025-03-15", beneId:1, itemId:1, qty:50, season:"2025 Long Rains", officer:"James Musa", truck:"TRK-001", status:"Delivered", priority:"High", rate:125, notes:"Pre-season seeds. Use dock door #2." },
  { id:2, ref:"AG-2025-001848", date:"2025-03-15", beneId:1, itemId:2, qty:5, season:"2025 Long Rains", officer:"James Musa", truck:"TRK-002", status:"Delivered", priority:"High", rate:175, notes:"Basal fertilizer for March planting." },
  { id:3, ref:"AG-2025-001849", date:"2025-03-20", beneId:2, itemId:1, qty:100, season:"2025 Long Rains", officer:"Hawa Turay", truck:"TRK-001", status:"Delivered", priority:"Medium", rate:250, notes:"Women's cooperative allocation." },
  { id:4, ref:"AG-2025-001850", date:"2025-03-22", beneId:3, itemId:6, qty:18, season:"2025 Long Rains", officer:"Sorie Kamara", truck:"TRK-003", status:"Delivered", priority:"Low", rate:144, notes:"Youth group tools only." },
  { id:5, ref:"AG-2025-001851", date:"2025-04-01", beneId:4, itemId:4, qty:30, season:"2025 Long Rains", officer:null, truck:null, status:"Unassigned", priority:"High", rate:96, notes:"Soybean pilot program." },
  { id:6, ref:"AG-2025-001852", date:"2025-04-03", beneId:5, itemId:2, qty:10, season:"2025 Long Rains", officer:"James Musa", truck:"TRK-002", status:"Delivered", priority:"Low", rate:350, notes:"Northern distribution run." },
  { id:7, ref:"AG-2025-001853", date:"2025-04-05", beneId:2, itemId:8, qty:20, season:"2025 Long Rains", officer:"Hawa Turay", truck:"TRK-001", status:"Assigned", priority:"Medium", rate:240, notes:"Herbicide for weed control." },
  { id:8, ref:"AG-2025-001854", date:"2025-04-07", beneId:3, itemId:5, qty:10, season:"2025 Long Rains", officer:null, truck:null, status:"Problem", priority:"High", rate:180, notes:"Pesticide delayed at checkpoint." },
];

export const INIT_OFFICERS = [
  { id:1, name:"James Musa", id_no:"FO-001", lic:"Class B", exp:"8 yrs", status:"Available", hosRisk:"Low", rating:4.9, lastRun:"Waterloo → Lungi", location:"Freetown Hub", avatar:"JM" },
  { id:2, name:"Hawa Turay", id_no:"FO-002", lic:"Class A", exp:"5 yrs", status:"On Trip", hosRisk:"Medium", rating:4.7, lastRun:"Freetown → Bo", location:"En route to Bo", avatar:"HT" },
  { id:3, name:"Sorie Kamara", id_no:"FO-003", lic:"Class B", exp:"3 yrs", status:"Off Duty", hosRisk:"Low", rating:4.8, lastRun:"Makeni → Koidu", location:"Makeni Base", avatar:"SK" },
  { id:4, name:"Mary Conteh", id_no:"FO-004", lic:"Class A", exp:"6 yrs", status:"On Trip", hosRisk:"High", rating:4.6, lastRun:"Freetown → Makeni", location:"En route Makeni", avatar:"MC" },
  { id:5, name:"Alpha Bangura", id_no:"FO-005", lic:"Class B", exp:"9 yrs", status:"Available", hosRisk:"Low", rating:4.9, lastRun:"Bo → Kenema", location:"Bo Hub", avatar:"AB" },
];

export const INIT_FLEET = [
  { id:1, plate:"TRK-001", model:"Toyota Hilux", type:"Pickup", status:"Available", driver:"James Musa", loc:"Freetown Terminal", lastPing:"2 min ago", health:95, mileage:"47,200 km", year:2021, lastInsp:"Jan 2025", nextInsp:"Jul 2025", inspResult:"Passed" },
  { id:2, plate:"TRK-002", model:"Mitsubishi Canter", type:"Light Truck", status:"In Use", driver:"Hawa Turay", loc:"En route to Bo", lastPing:"5 min ago", health:88, mileage:"63,400 km", year:2020, lastInsp:"Dec 2024", nextInsp:"Jun 2025", inspResult:"Passed" },
  { id:3, plate:"TRK-003", model:"Isuzu NPR", type:"Medium Truck", status:"Available", driver:"Sorie Kamara", loc:"Makeni Base", lastPing:"12 min ago", health:72, mileage:"89,100 km", year:2019, lastInsp:"Nov 2024", nextInsp:"May 2025", inspResult:"Advisory" },
  { id:4, plate:"TRK-004", model:"Ford Transit", type:"Van", status:"Maintenance", driver:null, loc:"Service Centre", lastPing:"2 hrs ago", health:40, mileage:"102,000 km", year:2018, lastInsp:"Oct 2024", nextInsp:"Overdue", inspResult:"Failed" },
  { id:5, plate:"TRK-005", model:"Toyota Land Cruiser", type:"SUV", status:"Available", driver:"Alpha Bangura", loc:"Bo Hub", lastPing:"1 min ago", health:98, mileage:"31,600 km", year:2022, lastInsp:"Feb 2025", nextInsp:"Aug 2025", inspResult:"Passed" },
];

export const INIT_ROUTES = [
  { id:1, ref:"ROUTE-2025-001", truck:"TRK-001", officer:"James Musa", origin:"Freetown Hub", dest:"Waterloo Cooperative", distance:"45 km", status:"On Time", progress:72, eta:"2:30 PM, Apr 8", lastUpdate:"2 min ago", confidence:95, stops:["Freetown Hub","Mile 7 Checkpoint","Waterloo Cooperative"], stopStatus:["Completed","In Transit","Pending"], events:["Departed hub at 8:15 AM","Passed Mile 7 at 9:30 AM"], linkedLoads:["AG-2025-001847","AG-2025-001848"] },
  { id:2, ref:"ROUTE-2025-002", truck:"TRK-002", officer:"Hawa Turay", origin:"Freetown Hub", dest:"Bo Agri-Hub", distance:"232 km", status:"Delayed", progress:38, eta:"5:15 PM, Apr 8", lastUpdate:"5 min ago", confidence:72, stops:["Freetown Hub","Waterloo Check","Moyamba Junction","Bo Agri-Hub"], stopStatus:["Completed","Completed","In Transit","Pending"], events:["Departed 7:00 AM","Delayed at Moyamba - road conditions"], linkedLoads:["AG-2025-001849"] },
  { id:3, ref:"ROUTE-2025-003", truck:"TRK-003", officer:"Sorie Kamara", origin:"Makeni Base", dest:"Koidu Seed Savers", distance:"185 km", status:"On Time", progress:15, eta:"4:00 PM, Apr 8", lastUpdate:"12 min ago", confidence:88, stops:["Makeni Base","Magburaka","Yengema","Koidu Seed Savers"], stopStatus:["Completed","In Transit","Pending","Pending"], events:["Departed Makeni 10:00 AM"], linkedLoads:["AG-2025-001850"] },
  { id:4, ref:"ROUTE-2025-004", truck:"TRK-005", officer:"Alpha Bangura", origin:"Bo Hub", dest:"Kenema Farmers", distance:"88 km", status:"On Time", progress:90, eta:"1:45 PM, Apr 8", lastUpdate:"1 min ago", confidence:97, stops:["Bo Hub","Blama Junction","Kenema Farmers"], stopStatus:["Completed","Completed","In Transit"], events:["Departed Bo 9:00 AM","Near destination"], linkedLoads:["AG-2025-001852"] },
  { id:5, ref:"ROUTE-2025-005", truck:"TRK-002", officer:"Mary Conteh", origin:"Freetown Hub", dest:"Makeni Smallholders", distance:"198 km", status:"Critical", progress:55, eta:"6:00 PM, Apr 8", lastUpdate:"45 min ago", confidence:58, stops:["Freetown Hub","Port Loko","Bombali Junction","Makeni Smallholders"], stopStatus:["Completed","Completed","In Transit","Pending"], events:["Departed 6:30 AM","GPS signal lost near Bombali"], linkedLoads:["AG-2025-001853"] },
];

export const INIT_WAREHOUSES = [
  { id:1, name:"Freetown Main Hub", address:"12 Siaka Stevens St, Freetown", status:"Active", capacity:125000, utilization:87, inbound:142, outbound:238, onHand:5847, docks:16, docksAvail:8, yard:"Congested", apptIn:45, apptOut:52, inventory:[{cat:"Seeds",units:1847,pct:31.6},{cat:"Fertilizer",units:2156,pct:36.9},{cat:"Tools",units:1844,pct:31.5}], schedule:[{time:"08:00",dock:"1-4",dir:"IN",ref:"IN-2401"},{time:"09:30",dock:"5-8",dir:"OUT",ref:"OUT-1847"},{time:"10:00",dock:"9-12",dir:"IN",ref:"IN-2403"},{time:"11:00",dock:"5-8",dir:"OUT",ref:"OUT-1848"}] },
  { id:2, name:"Bo Regional Hub", address:"15 Fenton Rd, Bo", status:"Active", capacity:75000, utilization:62, inbound:89, outbound:156, onHand:8234, docks:10, docksAvail:6, yard:"Normal", apptIn:38, apptOut:41, inventory:[{cat:"Seeds",units:3100,pct:37.6},{cat:"Herbicide",units:2200,pct:26.7},{cat:"Pesticide",units:2934,pct:35.7}], schedule:[{time:"08:30",dock:"1-4",dir:"IN",ref:"IN-2402"},{time:"10:00",dock:"5-8",dir:"OUT",ref:"OUT-1849"},{time:"14:00",dock:"5-8",dir:"OUT",ref:"OUT-1851"}] },
  { id:3, name:"Makeni Distribution Ctr", address:"9 Azzolini Hwy, Makeni", status:"Active", capacity:90000, utilization:45, inbound:76, outbound:124, onHand:4156, docks:12, docksAvail:12, yard:"Empty", apptIn:28, apptOut:35, inventory:[{cat:"Fertilizer",units:2400,pct:57.7},{cat:"Tools",units:1756,pct:42.3}], schedule:[{time:"09:00",dock:"1-4",dir:"IN",ref:"IN-2406"},{time:"11:30",dock:"5-8",dir:"OUT",ref:"OUT-1852"}] },
  { id:4, name:"Kenema Field Store", address:"7 Hangha Rd, Kenema", status:"Active", capacity:45000, utilization:73, inbound:52, outbound:89, onHand:2903, docks:6, docksAvail:3, yard:"Normal", apptIn:22, apptOut:28, inventory:[{cat:"Seeds",units:1200,pct:41.3},{cat:"Pesticide",units:900,pct:31.0},{cat:"Tools",units:803,pct:27.7}], schedule:[{time:"08:00",dock:"1-4",dir:"OUT",ref:"OUT-1853"},{time:"10:30",dock:"1-4",dir:"IN",ref:"IN-2407"}] },
  { id:5, name:"Lungi Agri Depot", address:"Lungi Airport Rd, Port Loko", status:"Maintenance", capacity:60000, utilization:28, inbound:34, outbound:67, onHand:1431, docks:8, docksAvail:2, yard:"Congested", apptIn:12, apptOut:18, inventory:[{cat:"Seeds",units:800,pct:55.9},{cat:"Tools",units:631,pct:44.1}], schedule:[] },
  { id:6, name:"Koidu Seed Store", address:"Kono District Main Rd, Koidu", status:"Active", capacity:35000, utilization:59, inbound:88, outbound:107, onHand:2365, docks:4, docksAvail:4, yard:"Empty", apptIn:40, apptOut:45, inventory:[{cat:"Seeds",units:1400,pct:59.2},{cat:"Fertilizer",units:965,pct:40.8}], schedule:[{time:"08:00",dock:"1-4",dir:"IN",ref:"IN-2408"},{time:"12:00",dock:"1-4",dir:"OUT",ref:"OUT-1854"}] },
];

export const INIT_PODS = [
  { id:1, ref:"POD-2025-001", distRef:"AG-2025-001847", beneId:1, date:"2025-03-15", time:"14:30", officer:"James Musa", vehicle:"TRK-001", season:"2025 Long Rains", receivedBy:"Musa Kamara", condition:"Good", verified:true, signedAt:"Waterloo Cooperative HQ", items:[{ invId:1, barcode:"INV-00001", name:"Maize Seeds (OPV)", procCode:"PC-2025-001", cat:"Seeds", unit:"Kg", qtyOrdered:50, qty:50, qtyVariance:0, itemCondition:"Good" }], notes:"All items received in good condition. Bags sealed and undamaged." },
  { id:2, ref:"POD-2025-002", distRef:"AG-2025-001848", beneId:1, date:"2025-03-15", time:"15:10", officer:"James Musa", vehicle:"TRK-002", season:"2025 Long Rains", receivedBy:"Musa Kamara", condition:"Good", verified:true, signedAt:"Waterloo Cooperative HQ", items:[{ invId:2, barcode:"INV-00002", name:"NPK Fertilizer 17:17:17", procCode:"PC-2025-001", cat:"Fertilizer", unit:"Bags (50kg)", qtyOrdered:5, qty:5, qtyVariance:0, itemCondition:"Good" }], notes:"Stored immediately upon arrival. All 5 bags intact, no moisture damage." },
  { id:3, ref:"POD-2025-003", distRef:"AG-2025-001849", beneId:2, date:"2025-03-20", time:"13:45", officer:"Hawa Turay", vehicle:"TRK-001", season:"2025 Long Rains", receivedBy:"Aminata Sesay", condition:"Good", verified:true, signedAt:"Lungi Women's Centre", items:[{ invId:1, barcode:"INV-00001", name:"Maize Seeds (OPV)", procCode:"PC-2025-001", cat:"Seeds", unit:"Kg", qtyOrdered:100, qty:100, qtyVariance:0, itemCondition:"Good" }], notes:"Received by group secretary. Distributed to 25 women cooperative members on same day." },
  { id:4, ref:"POD-2025-004", distRef:"AG-2025-001850", beneId:3, date:"2025-03-22", time:"11:20", officer:"Sorie Kamara", vehicle:"TRK-003", season:"2025 Long Rains", receivedBy:"Ibrahim Bangura", condition:"Damaged", verified:true, signedAt:"Bo Youth Agri-Hub", items:[{ invId:6, barcode:"INV-00006", name:"Hand Hoes", procCode:"PC-2025-004", cat:"Tools", unit:"Units", qtyOrdered:18, qty:18, qtyVariance:0, itemCondition:"Damaged", damageNote:"2 of 18 units had bent handles — unusable" }], notes:"18 units physically received. 2 hoes had badly bent handles, reported to Field Operations. Replacement requested." },
  { id:5, ref:"POD-2025-005", distRef:"AG-2025-001852", beneId:5, date:"2025-04-03", time:"16:00", officer:"James Musa", vehicle:"TRK-002", season:"2025 Long Rains", receivedBy:"Abdul Conteh", condition:"Good", verified:false, signedAt:"Makeni Smallholders Base", items:[{ invId:2, barcode:"INV-00002", name:"NPK Fertilizer 17:17:17", procCode:"PC-2025-001", cat:"Fertilizer", unit:"Bags (50kg)", qtyOrdered:10, qty:10, qtyVariance:0, itemCondition:"Good" }], notes:"Pending supervisor sign-off. Delivery confirmed by phone but physical signature outstanding." },
];

export const USER_ROLES = [
  { id:"field_officer", label:"Field Officer", color:"#16a34a", bg:"#dcfce7", icon:"🧑‍🌾", desc:"Manages field operations and deliveries" },
  { id:"admin_store", label:"Admin / Store Mgr", color:"#7c3aed", bg:"#f5f3ff", icon:"🏪", desc:"Controls inventory and warehouse stock" },
  { id:"procurement", label:"Procurement", color:"#d97706", bg:"#fef9c3", icon:"📋", desc:"Handles purchasing and supplier management" },
  { id:"me_manager", label:"M&E Manager", color:"#0891b2", bg:"#ecfeff", icon:"📊", desc:"Monitoring, evaluation and reporting oversight" },
  { id:"me_officer", label:"M&E Officer", color:"#06b6d4", bg:"#ecfeff", icon:"📈", desc:"Conducts field monitoring and data collection" },
  { id:"manager", label:"Manager", color:"#2563eb", bg:"#eff6ff", icon:"👔", desc:"General management and oversight" },
  { id:"officer", label:"Officer", color:"#64748b", bg:"#f1f5f9", icon:"🎖", desc:"General operational officer" },
];

export const ROLE_PERMISSIONS = {
  field_officer: ["view_inventory","view_distributions","update_pod","view_routes","view_fleet"],
  admin_store: ["view_inventory","edit_inventory","view_distributions","view_warehouses","edit_warehouses","view_reports","manage_users","view_audit"],
  procurement: ["view_inventory","edit_inventory","view_reports","view_orders"],
  me_manager: ["view_all","view_reports","export_reports","manage_users","view_analytics","view_audit"],
  me_officer: ["view_all","view_reports","export_reports","view_audit"],
  manager: ["view_all","edit_distributions","edit_inventory","manage_fleet","view_reports","manage_users","view_audit"],
  officer: ["view_inventory","view_distributions","view_fleet","view_routes"],
};

export const INIT_USERS = [
  { id:1, name:"Sarah Admin", email:"sarah@agroflow.sl", role:"manager", status:"Active", phone:"076001001", location:"Freetown", lastLogin:"Today, 08:12", joined:"Jan 2024", avatar:"SA" },
  { id:2, name:"James Musa", email:"james@agroflow.sl", role:"field_officer", status:"Active", phone:"076001002", location:"Freetown", lastLogin:"Today, 07:45", joined:"Feb 2024", avatar:"JM" },
  { id:3, name:"Hawa Turay", email:"hawa@agroflow.sl", role:"field_officer", status:"Active", phone:"078001003", location:"Bo", lastLogin:"Today, 06:30", joined:"Mar 2024", avatar:"HT" },
  { id:4, name:"Emmanuel Kofi", email:"e.kofi@agroflow.sl", role:"admin_store", status:"Active", phone:"077001004", location:"Makeni", lastLogin:"Yesterday, 17:22", joined:"Jan 2024", avatar:"EK" },
  { id:5, name:"Fatima Bangura", email:"fatima@agroflow.sl", role:"procurement", status:"Active", phone:"079001005", location:"Freetown", lastLogin:"Today, 09:00", joined:"Apr 2024", avatar:"FB" },
  { id:6, name:"David Kamara", email:"david@agroflow.sl", role:"me_manager", status:"Active", phone:"076001006", location:"Freetown", lastLogin:"Yesterday, 14:10", joined:"Jan 2024", avatar:"DK" },
  { id:7, name:"Mariatu Sesay", email:"mariatu@agroflow.sl", role:"me_officer", status:"Active", phone:"078001007", location:"Kenema", lastLogin:"2 days ago", joined:"Jun 2024", avatar:"MS" },
  { id:8, name:"Thomas Conteh", email:"thomas@agroflow.sl", role:"officer", status:"Inactive", phone:"077001008", location:"Bo", lastLogin:"1 week ago", joined:"May 2024", avatar:"TC" },
];

export const AV_COLORS = ["#16a34a","#2563eb","#7c3aed","#d97706","#dc2626","#0891b2","#db2777"];
