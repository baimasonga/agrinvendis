import { S, statusStyle } from "../styles";
import { StatusPill, PriorityTag, Avatar, PageHead } from "../components/ui";
import { fmtDate } from "../utils/helpers";
import { STATUSES } from "../data/seed";

export default function DispatchBoard(props) {
  const { inv, benes, dists, openPanel, openModal } = props;

  return (
    <div>
      <PageHead title="Dispatch Board" sub="Distribution pipeline by status">
        <button onClick={()=>openModal("dist")} style={S.btn}>+ New Load</button>
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
                    {d.officer?<div style={{display:"flex",alignItems:"center",gap:6,marginTop:8}}><Avatar label={d.officer.split(" ").map(x=>x[0]).join("")} idx={i} size={22}/><span style={{fontSize:11}}>{d.officer}</span></div>:<span style={{fontSize:11,color:"#94a3b8",fontStyle:"italic"}}>Unassigned</span>}
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
}
