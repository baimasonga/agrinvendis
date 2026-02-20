import { AV_COLORS, USER_ROLES } from '../../data/seed';
import { S, statusStyle } from '../../styles';

export const StatusPill = ({ s }) => {
  const st = statusStyle(s);
  return <span style={{background:st.bg,color:st.c,padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>{s}</span>;
};

export const PriorityTag = ({ p }) => {
  const c = ({High:"#dc2626",Medium:"#d97706",Low:"#16a34a"}[p]||"#64748b");
  return <span style={{background:c+"1a",color:c,padding:"2px 8px",borderRadius:4,fontSize:11,fontWeight:700}}>{p}</span>;
};

export const Avatar = ({ label, idx = 0, size = 32 }) => (
  <div style={{width:size,height:size,borderRadius:"50%",background:AV_COLORS[idx%AV_COLORS.length],display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:Math.round(size*.37),flexShrink:0}}>{label}</div>
);

export const Pill = ({ l, v }) => (
  <div style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #f1f5f9"}}>
    <span style={{fontSize:12,color:"#94a3b8"}}>{l}</span>
    <span style={{fontSize:13,color:"#0f172a",fontWeight:500}}>{v}</span>
  </div>
);

export const RoleBadge = ({ roleId }) => {
  const r = USER_ROLES.find(x => x.id === roleId);
  if (!r) return null;
  return <span style={{background:r.bg,color:r.color,padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{r.icon} {r.label}</span>;
};

export const BarcodeDisplay = ({ code, width = 130, height = 36, showText = true, mini = false }) => {
  const W = mini ? 70 : width, H = mini ? 22 : height;
  const seed = code.split("").reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0);
  let rng = seed;
  const next = () => { rng = (rng * 1664525 + 1013904223) & 0xffffffff; return Math.abs(rng); };
  const pattern = [1, 2, 1];
  for (let i = 0; i < code.length * 2 + 4; i++) pattern.push((next() % 3) + 1);
  pattern.push(1, 2, 1);
  const unitW = W / pattern.reduce((a, b) => a + b, 0);
  let x = 0;
  const bars = [];
  pattern.forEach((w, i) => { const bw = w * unitW; if (i % 2 === 0) bars.push({ x, w: Math.max(bw - 0.4, 0.6) }); x += bw; });
  return (
    <svg width={W} height={H + (showText && !mini ? 11 : 0)} style={{display:"block",flexShrink:0}}>
      {bars.map((b, i) => <rect key={i} x={b.x} y={0} width={b.w} height={H} fill="#0f172a" rx={0.2} />)}
      {showText && !mini && <text x={W / 2} y={H + 9} textAnchor="middle" fontSize="7.5" fill="#64748b" fontFamily="monospace" letterSpacing="0.5">{code}</text>}
    </svg>
  );
};

export const PageHead = ({ title, sub, children }) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
    <div><h2 style={{margin:0,fontSize:22,fontWeight:800,color:"#0f172a"}}>{title}</h2>{sub&&<p style={{margin:"4px 0 0",color:"#94a3b8",fontSize:13}}>{sub}</p>}</div>
    <div style={{display:"flex",gap:8}}>{children}</div>
  </div>
);

export const Overlay = ({ onClose, title, width, children }) => (
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

export const FGrid = ({ children }) => <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,padding:"18px 22px"}}>{children}</div>;

export const FG = ({ label, full, children }) => <div style={{display:"flex",flexDirection:"column",gap:5,gridColumn:full?"1/-1":undefined}}><label style={{fontSize:11,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{label}</label>{children}</div>;

export const FIn = ({ onChange, ...p }) => <input {...p} onChange={e => onChange(e.target.value)} style={S.fi} />;

export const FSel = ({ onChange, opts, ...p }) => <select {...p} onChange={e => onChange(e.target.value)} style={S.fi}>{opts.map(o => typeof o === "string" ? <option key={o}>{o}</option> : <option key={o.v} value={o.v}>{o.l}</option>)}</select>;

export const Btn = ({ children, variant = "primary", style: extraStyle, ...props }) => {
  const base = variant === "outline" ? S.btnO : variant === "ghost" ? S.btnG : variant === "danger" ? {...S.btnO, color:"#dc2626", borderColor:"#fca5a5"} : S.btn;
  return <button style={{...base, ...extraStyle}} {...props}>{children}</button>;
};

export const ModalFooter = ({ children }) => (
  <div style={S.mfoot}>{children}</div>
);
