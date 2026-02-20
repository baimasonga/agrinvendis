import React, { useState, useMemo } from "react";
import { S, statusStyle } from "../styles";
import { StatusPill, PriorityTag, Avatar, BarcodeDisplay, PageHead } from "../components/ui";
import { fmtDate, isExpired, isExpSoon, catColor } from "../utils/helpers";
import { CATEGORIES } from "../data/seed";

export default function InventoryPage(props) {
  const { inv, setInv, dists, openModal, showToast, setManualScanOpen, handleScan, deleteRecord, srch, setSrch, catF, setCatF, stF, setStF } = props;
  const [procF,setProcF]=useState("All");
  const [viewMode,setViewMode]=useState("grouped");

  const allProcCodes=useMemo(()=>[...new Set(inv.map(i=>i.procCode).filter(Boolean))].sort(),[inv]);

  const rows=useMemo(()=>inv.filter(i=>
    (catF==="All"||i.cat===catF)&&
    (stF==="All"||(stF==="Low"?i.qty<=i.min:i.qty>i.min))&&
    (procF==="All"||i.procCode===procF)&&
    (!srch||i.name.toLowerCase().includes(srch.toLowerCase())||
            i.supplier.toLowerCase().includes(srch.toLowerCase())||
            (i.procCode||"").toLowerCase().includes(srch.toLowerCase()))
  ),[inv,catF,stF,procF,srch]);

  const grouped=useMemo(()=>{
    const g=allProcCodes.reduce((acc,pc)=>{
      const items=rows.filter(i=>i.procCode===pc);
      if(items.length) acc[pc]=items;
      return acc;
    },{});
    const ungrouped=rows.filter(i=>!i.procCode);
    if(ungrouped.length) g["—"]=ungrouped;
    return g;
  },[allProcCodes,rows]);

  const grandQtyExp   = rows.reduce((a,i)=>a+(i.qtyExpected||0),0);
  const grandQtyRec   = rows.reduce((a,i)=>a+i.qty,0);
  const grandQtyDist  = rows.reduce((a,i)=>a+(i.qtyDistributed||0),0);
  const grandQtyResv  = rows.reduce((a,i)=>a+(i.qtyReserved||0),0);
  const grandQtyAvail = grandQtyRec - grandQtyDist - grandQtyResv;
  const grandValue    = rows.reduce((a,i)=>a+i.qty*i.cost,0);
  const grandAvailVal = rows.reduce((a,i)=>a+(i.qty-(i.qtyDistributed||0)-(i.qtyReserved||0))*i.cost,0);
  const grandVariance = grandQtyRec - grandQtyExp;

  const ItemRow=({item})=>{
    const qtyAvail = item.qty - (item.qtyDistributed||0) - (item.qtyReserved||0);
    const low=qtyAvail<=item.min, exp=isExpired(item.expiry), soon=isExpSoon(item.expiry);
    const procVariance=(item.qtyExpected||0)>0?item.qty-(item.qtyExpected||0):null;
    return (
      <tr style={S.tr} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background=""}>
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
        <td style={{...S.td,textAlign:"right",fontWeight:700,fontSize:13,color:"#64748b"}}>{(item.qtyExpected||0)||"—"}</td>
        <td style={{...S.td,textAlign:"right",fontWeight:700,fontSize:13,color:"#374151"}}>{item.qty}</td>
        <td style={{...S.td,textAlign:"right"}}>
          {procVariance!==null?(
            <span style={{fontWeight:700,fontSize:12,color:procVariance<0?"#dc2626":procVariance>0?"#d97706":"#94a3b8"}}>
              {procVariance<0?`−${Math.abs(procVariance)}`:procVariance>0?`+${procVariance}`:"="}
            </span>
          ):<span style={{color:"#cbd5e1"}}>—</span>}
        </td>
        <td style={{...S.td,textAlign:"right",color:"#2563eb",fontWeight:700,fontSize:13}}>
          {(item.qtyDistributed||0)>0?item.qtyDistributed:<span style={{color:"#cbd5e1",fontWeight:400}}>—</span>}
        </td>
        <td style={{...S.td,textAlign:"right",color:"#d97706",fontWeight:700,fontSize:13}}>
          {(item.qtyReserved||0)>0?<span style={{background:"#fef9c3",color:"#854d0e",padding:"1px 8px",borderRadius:20,fontSize:11,fontWeight:700}}>{item.qtyReserved}</span>:<span style={{color:"#cbd5e1",fontWeight:400}}>—</span>}
        </td>
        <td style={{...S.td,textAlign:"right",fontWeight:800,fontSize:15,color:low?"#dc2626":"#16a34a"}}>{qtyAvail}</td>
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
                  <React.Fragment key={`g-${pc}`}>
                    <GroupHeader procCode={pc} items={items}/>
                    {items.map(item=><ItemRow key={item.id} item={item}/>)}
                    <SubtotalRow items={items} label={pc}/>
                  </React.Fragment>
                ))
              ):(
                rows.map(item=><ItemRow key={item.id} item={item}/>)
              )}

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
}
