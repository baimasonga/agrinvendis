import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { S } from "../styles";

export default function AuthPanel({ onAuthed, showToast }) {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email || !password) return showToast("Email and password are required", "error");
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName || email.split("@")[0] } },
        });
        if (error) throw error;
        showToast("Account created. Check email for confirmation if required.", "success");
        // Some projects require email confirmation; still attempt to sign in after sign up if session exists
        if (data.session) onAuthed?.(data.session);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthed?.(data.session);
        showToast("Signed in", "success");
      }
    } catch (e) {
      console.error(e);
      showToast(e?.message || "Auth failed", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#0b1220",padding:16}}>
      <div style={{width:"min(520px, 96vw)",background:"#fff",borderRadius:16,boxShadow:"0 10px 35px rgba(0,0,0,.25)",padding:18}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div>
            <div style={{fontSize:18,fontWeight:900,color:"#0f172a"}}>AgroFlow</div>
            <div style={{fontSize:12,color:"#64748b"}}>Sign in to access inventory, distribution & POD</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button
              style={{...S.btnO, padding:"6px 10px", opacity: mode==="signin" ? 1 : .65}}
              onClick={() => setMode("signin")}
              disabled={busy}
            >Sign in</button>
            <button
              style={{...S.btnO, padding:"6px 10px", opacity: mode==="signup" ? 1 : .65}}
              onClick={() => setMode("signup")}
              disabled={busy}
            >Sign up</button>
          </div>
        </div>

        {mode==="signup" && (
          <div style={{marginBottom:10}}>
            <div style={{fontSize:12,fontWeight:800,color:"#0f172a",marginBottom:6}}>Full name (optional)</div>
            <input value={fullName} onChange={(e)=>setFullName(e.target.value)} placeholder="e.g., Mohamed Bangura"
              style={{...S.fi, width:"100%"}} />
          </div>
        )}

        <div style={{marginBottom:10}}>
          <div style={{fontSize:12,fontWeight:800,color:"#0f172a",marginBottom:6}}>Email</div>
          <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com"
            style={{...S.fi, width:"100%"}} />
        </div>

        <div style={{marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:800,color:"#0f172a",marginBottom:6}}>Password</div>
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••"
            style={{...S.fi, width:"100%"}} />
          <div style={{fontSize:11,color:"#64748b",marginTop:6}}>
            Use at least 8 characters (recommended). If email confirmation is enabled, check your inbox after sign up.
          </div>
        </div>

        <button style={{...S.btn, width:"100%", justifyContent:"center"}} onClick={submit} disabled={busy}>
          {busy ? "Please wait..." : (mode==="signup" ? "Create account" : "Sign in")}
        </button>

        <div style={{fontSize:11,color:"#64748b",marginTop:12,lineHeight:1.4}}>
          Roles are controlled via Supabase <b>profiles</b> table (RLS). After first sign-in, your profile is created with default role <b>field_officer</b>.
        </div>
      </div>
    </div>
  );
}