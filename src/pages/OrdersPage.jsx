import { useState } from "react";
import { S, statusStyle } from "../styles";
import { StatusPill, PriorityTag, Avatar, PageHead } from "../components/ui";
import { fmtDate } from "../utils/helpers";
import { STATUSES } from "../data/seed";

export default function OrdersPage(props) {
  const { inv, benes, dists, openPanel, openModal, showToast, handleScan, setManualScanOpen } = props;
  const [sf,setSf]=useState("All"); const [pf,setPf]=useState("All"); const [q,setQ]=useState("");
  const rows=dists.filter(d=>{ const b=benes.find(x=>x.id===d.beneId); const it=inv.find(x=>x.id===d.itemId); const txt=`${d.ref} ${b?.name||""} ${it?.name||""}`.toLowerCase(); return (sf==="All"||d.status===sf)&&(pf==="All"||d.priority===pf)&&(!q||txt.includes(q.toLowerCase())); });

  return (
    <div>
      <PageHead title="Orders / Loads" sub={`${dists.length} total records`}>
        <button onClick={()=>setManualScanOpen(true)} style={{...S.btnO,borderColor:"#86efac",color:"#15803d"}}>📷 Scan Load</button>
        <button onClick={()=>openModal("dist")} style={S.btn}>+ Create New Load</button>
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
                <td style={S.td}><div style={{display:"flex",alignItems:"center",gap:8}}><Avatar label={b?.avatar||"?"} idx={i}/><div><div style={{fontWeight:600,fontSize:13}}>{b?.name||"—"}</div><div style={{fontSize:11,color:"#94a3b8"}}>{b?.group||""}</div></div></div></td>
                <td style={{...S.td,fontSize:12}}>{it?.name||"—"}</td>
                <td style={{...S.td,fontSize:12,color:"#64748b"}}>{fmtDate(d.date)}</td>
                <td style={S.td}><StatusPill s={d.status}/></td>
                <td style={S.td}>{d.officer?<div style={{display:"flex",alignItems:"center",gap:6}}><Avatar label={d.officer.split(" ").map(x=>x[0]).join("")} idx={i+2} size={26}/><span style={{fontSize:12}}>{d.officer}</span></div>:<span style={{color:"#94a3b8",fontSize:12}}>—</span>}</td>
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
}
