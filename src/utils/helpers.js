const today = new Date();

export const fmtDate = d => d ? new Date(d).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}) : "—";
export const isExpired = e => e && new Date(e) < today;
export const isExpSoon = e => { if(!e) return false; const d=(new Date(e)-today)/86400000; return d>=0&&d<=60; };
export const catColor = c => ({Seeds:"#16a34a",Fertilizer:"#d97706",Pesticide:"#dc2626",Herbicide:"#ea580c",Tools:"#2563eb",Other:"#7c3aed"}[c]||"#64748b");
export const hosColor = r => ({Low:"#16a34a",Medium:"#d97706",High:"#dc2626"}[r]||"#64748b");
export const healthClr = h => h>=85?"#16a34a":h>=60?"#d97706":"#dc2626";
export const statusStyle = s => ({
  Unassigned:{bg:"#f1f5f9",c:"#64748b"}, Assigned:{bg:"#dbeafe",c:"#1d4ed8"},
  "In Transit":{bg:"#fef9c3",c:"#854d0e"}, Delivered:{bg:"#dcfce7",c:"#15803d"},
  Problem:{bg:"#fee2e2",c:"#b91c1c"}, Available:{bg:"#dcfce7",c:"#15803d"},
  "On Trip":{bg:"#fef9c3",c:"#854d0e"}, "Off Duty":{bg:"#f1f5f9",c:"#64748b"},
  Maintenance:{bg:"#fee2e2",c:"#b91c1c"}, "In Use":{bg:"#fef9c3",c:"#854d0e"},
  Active:{bg:"#dcfce7",c:"#15803d"}, Inactive:{bg:"#fee2e2",c:"#b91c1c"},
  Suspended:{bg:"#fef9c3",c:"#854d0e"},
}[s]||{bg:"#f1f5f9",c:"#64748b"});
export const conditionStyle = c => ({Good:{bg:"#dcfce7",c:"#15803d"},Damaged:{bg:"#fee2e2",c:"#b91c1c"},Partial:{bg:"#fef9c3",c:"#854d0e"}}[c]||{bg:"#f1f5f9",c:"#64748b"});
