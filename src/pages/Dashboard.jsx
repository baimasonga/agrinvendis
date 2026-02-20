import { useState } from "react";
import { S, statusStyle } from "../styles";
import { StatusPill, PriorityTag, Avatar, BarcodeDisplay, PageHead, Btn } from "../components/ui";
import { fmtDate, catColor } from "../utils/helpers";
import { CATEGORIES, STATUSES } from "../data/seed";

export default function Dashboard(props) {
  const { inv, benes, dists, fleet, officers, routes, stats, openPanel, openModal, setPage, showToast } = props;

  const recentDists = dists.slice(-5).reverse();
  const catBreakdown = CATEGORIES.map(c => ({ cat: c, count: inv.filter(i => i.cat === c).length, value: inv.filter(i => i.cat === c).reduce((a, i) => a + i.qty * i.cost, 0) })).filter(x => x.count > 0);

  return (
    <div>
      <PageHead title="Dashboard" sub={`Overview for ${fmtDate(new Date().toISOString().split("T")[0])}`}>
        <button onClick={() => setPage("reports")} style={S.btnO}>📈 View Reports</button>
        <button onClick={() => openModal("dist")} style={S.btn}>+ New Distribution</button>
      </PageHead>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
        {[{l:"Active Distributions",v:stats.activeDists,bg:"#eff6ff",c:"#2563eb",ic:"🚜"},{l:"On-Time Rate",v:`${stats.onTimePct}%`,bg:"#f0fdf4",c:"#16a34a",ic:"✅"},{l:"Items Available",v:stats.itemsAvail,bg:"#faf5ff",c:"#7c3aed",ic:"📦"},{l:"Alerts",v:stats.exceptions,bg:"#fff7ed",c:"#ea580c",ic:"⚠"}].map((c,i)=>(
          <div key={i} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:"16px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",boxShadow:"0 1px 3px rgba(0,0,0,.05)"}}>
            <div><div style={{fontSize:28,fontWeight:800,color:c.c}}>{c.v}</div><div style={{fontSize:12,color:"#64748b",marginTop:3}}>{c.l}</div></div>
            <div style={{width:44,height:44,borderRadius:12,background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{c.ic}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
        <div style={S.card}>
          <div style={S.ch}>🚜 Recent Distributions</div>
          {recentDists.map((d,i)=>{ const b=benes.find(x=>x.id===d.beneId); const it=inv.find(x=>x.id===d.itemId); return (
            <div key={d.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 20px",borderBottom:"1px solid #f8fafc",cursor:"pointer"}} onClick={()=>openPanel(d,"dist")}>
              <div style={{display:"flex",alignItems:"center",gap:10}}><Avatar label={b?.avatar||"?"} idx={i} size={32}/><div><div style={{fontWeight:600,fontSize:13,color:"#0f172a"}}>{b?.name||"—"}</div><div style={{fontSize:11,color:"#94a3b8"}}>{it?.name||"—"} · {fmtDate(d.date)}</div></div></div>
              <StatusPill s={d.status}/>
            </div>
          );})}
          <button onClick={()=>setPage("orders")} style={{...S.clr,width:"100%",textAlign:"center",padding:10,fontSize:12}}>View all orders →</button>
        </div>
        <div style={S.card}>
          <div style={S.ch}>⚠ Stock Alerts</div>
          {stats.lowStock.length===0&&stats.expiring.length===0&&stats.expired.length===0&&<p style={{padding:"16px 20px",color:"#94a3b8",fontSize:13}}>No alerts — all stock levels are healthy.</p>}
          {stats.expired.map(i=><div key={i.id} style={{padding:"10px 20px",borderBottom:"1px solid #f8fafc",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:600,fontSize:13,color:"#dc2626"}}>🔴 {i.name}</div><div style={{fontSize:11,color:"#94a3b8"}}>Expired: {fmtDate(i.expiry)}</div></div><button onClick={()=>openModal("editInv",i)} style={{...S.icnBtn,fontSize:11,color:"#dc2626"}}>Review</button></div>)}
          {stats.expiring.map(i=><div key={i.id} style={{padding:"10px 20px",borderBottom:"1px solid #f8fafc",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:600,fontSize:13,color:"#d97706"}}>🟡 {i.name}</div><div style={{fontSize:11,color:"#94a3b8"}}>Expires: {fmtDate(i.expiry)}</div></div><button onClick={()=>openModal("editInv",i)} style={{...S.icnBtn,fontSize:11,color:"#d97706"}}>Review</button></div>)}
          {stats.lowStock.map(i=><div key={i.id} style={{padding:"10px 20px",borderBottom:"1px solid #f8fafc",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:600,fontSize:13,color:"#ea580c"}}>⚠️ {i.name}</div><div style={{fontSize:11,color:"#94a3b8"}}>Stock: {i.qty} / Min: {i.min}</div></div><button onClick={()=>openModal("editInv",i)} style={{...S.icnBtn,fontSize:11,color:"#ea580c"}}>Reorder</button></div>)}
        </div>
      </div>
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
}
