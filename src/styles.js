export const S = {
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

export const statusStyle = s => ({
  Unassigned:  {bg:"#f1f5f9",c:"#64748b"}, Assigned:    {bg:"#dbeafe",c:"#1d4ed8"},
  "In Transit":{bg:"#fef9c3",c:"#854d0e"}, Delivered:   {bg:"#dcfce7",c:"#15803d"},
  Problem:     {bg:"#fee2e2",c:"#b91c1c"}, Available:   {bg:"#dcfce7",c:"#15803d"},
  "On Trip":   {bg:"#fef9c3",c:"#854d0e"}, "Off Duty":  {bg:"#f1f5f9",c:"#64748b"},
  Maintenance: {bg:"#fee2e2",c:"#b91c1c"}, "In Use":    {bg:"#fef9c3",c:"#854d0e"},
  Active:      {bg:"#dcfce7",c:"#15803d"}, Inactive:    {bg:"#fee2e2",c:"#b91c1c"},
  Suspended:   {bg:"#fef9c3",c:"#854d0e"},
}[s]||{bg:"#f1f5f9",c:"#64748b"});

export const conditionStyle = c => ({Good:{bg:"#dcfce7",c:"#15803d"},Damaged:{bg:"#fee2e2",c:"#b91c1c"},Partial:{bg:"#fef9c3",c:"#854d0e"}}[c]||{bg:"#f1f5f9",c:"#64748b"});
