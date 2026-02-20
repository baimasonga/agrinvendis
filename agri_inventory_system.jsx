import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";

/*
  CLEAN VERSION:
  - No demo users
  - No seed identity
  - User comes ONLY from Supabase Auth + profiles
*/

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  const [invCount, setInvCount] = useState(0);
  const [distCount, setDistCount] = useState(0);
  const [podCount, setPodCount] = useState(0);

  /* ---------------- AUTH ---------------- */

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  /* ---------------- PROFILE ---------------- */

  useEffect(() => {
    if (!session?.user) return;

    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [session]);

  /* ---------------- DASHBOARD COUNTS ---------------- */

  useEffect(() => {
    if (!session) return;

    supabase.from("inventory_items").select("id", { count: "exact" })
      .then(r => setInvCount(r.count || 0));

    supabase.from("distributions").select("id", { count: "exact" })
      .then(r => setDistCount(r.count || 0));

    supabase.from("pods").select("id", { count: "exact" })
      .then(r => setPodCount(r.count || 0));
  }, [session]);

  /* ---------------- LOGIN UI ---------------- */

  if (!session) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Login</h2>
        <AuthPanel />
      </div>
    );
  }

  /* ---------------- MAIN APP ---------------- */

  return (
    <div style={{ padding: 20 }}>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <strong>{profile?.email}</strong>
          <div style={{ fontSize: 12 }}>{profile?.role}</div>
        </div>

        <button onClick={() => supabase.auth.signOut()}>Logout</button>
      </header>

      <hr />

      <h3>Dashboard</h3>

      <ul>
        <li>Inventory Items: {invCount}</li>
        <li>Distributions: {distCount}</li>
        <li>POD Records: {podCount}</li>
      </ul>

      <p>
        (All numbers are live from Supabase. If zero, tables are empty.)
      </p>
    </div>
  );
}

/* ---------------- SIMPLE AUTH PANEL ---------------- */

function AuthPanel() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    await supabase.auth.signInWithPassword({ email, password });
  };

  const signup = async () => {
    await supabase.auth.signUp({ email, password });
  };

  return (
    <div style={{ maxWidth: 300 }}>
      <input
        placeholder="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <br />
      <input
        placeholder="password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <br />
      <button onClick={login}>Login</button>
      <button onClick={signup}>Signup</button>
    </div>
  );
}
