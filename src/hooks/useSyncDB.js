import { useState, useEffect, useRef, useCallback } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const SUPABASE_CONFIGURED = !!(SUPABASE_URL && SUPABASE_ANON && !SUPABASE_ANON.includes("YOUR_"));
const IDB_NAME = "agroflow_db";
const IDB_VERSION = 2;
const STORES = ["inventory","distributions","beneficiaries","field_officers","fleet","pods","routes","warehouses","users","sync_queue"];
const TABLE_MAP = {inventory:"inventory",distributions:"distributions",beneficiaries:"beneficiaries",field_officers:"field_officers",fleet:"fleet",pods:"pods",routes:"routes",warehouses:"warehouses",users:"users"};

const openDB = () => new Promise((res,rej)=>{
  const req = indexedDB.open(IDB_NAME,IDB_VERSION);
  req.onupgradeneeded = e => { const db=e.target.result; STORES.forEach(s=>{ if(!db.objectStoreNames.contains(s)) db.createObjectStore(s,{keyPath:"id",autoIncrement:s==="sync_queue"}); }); };
  req.onsuccess = e=>res(e.target.result);
  req.onerror = e=>rej(e.target.error);
});
const idbGetAll = (db,store) => new Promise((res,rej)=>{ const req=db.transaction(store,"readonly").objectStore(store).getAll(); req.onsuccess=()=>res(req.result||[]); req.onerror=()=>rej(req.error); });
const idbPut = (db,store,rec) => new Promise((res,rej)=>{ const req=db.transaction(store,"readwrite").objectStore(store).put(rec); req.onsuccess=()=>res(req.result); req.onerror=()=>rej(req.error); });
const idbDelete = (db,store,id) => new Promise((res,rej)=>{ const req=db.transaction(store,"readwrite").objectStore(store).delete(id); req.onsuccess=()=>res(); req.onerror=()=>rej(req.error); });
const idbClear = (db,store) => new Promise((res,rej)=>{ const req=db.transaction(store,"readwrite").objectStore(store).clear(); req.onsuccess=()=>res(); req.onerror=()=>rej(req.error); });
const sbH = () => ({"Content-Type":"application/json",apikey:SUPABASE_ANON,Authorization:`Bearer ${SUPABASE_ANON}`,Prefer:"return=representation"});
const sbFetch = async (table,method="GET",body=null) => { const r=await fetch(`${SUPABASE_URL}/rest/v1/${table}`,{method,headers:sbH(),body:body?JSON.stringify(body):undefined}); if(!r.ok) throw new Error(await r.text()); return method==="DELETE"?null:r.json(); };
const sbUpsert = (t,rec) => sbFetch(t,"POST",rec);
const sbDelRec = (t,id) => fetch(`${SUPABASE_URL}/rest/v1/${t}?id=eq.${id}`,{method:"DELETE",headers:sbH()});
const sbSelect = t => sbFetch(t,"GET");

export default function useSyncDB({onLoad}) {
  const dbRef=useRef(null);
  const [dbReady,setDbReady]=useState(false);
  const [online,setOnline]=useState(navigator.onLine);
  const [syncStatus,setSyncStatus]=useState("idle");
  const [pendingCount,setPendingCount]=useState(0);
  const isSyncing=useRef(false);

  const refreshPending=useCallback(async()=>{ if(!dbRef.current) return; const q=await idbGetAll(dbRef.current,"sync_queue"); setPendingCount(q.length); },[]);
  const flushQueue=useCallback(async()=>{
    if(isSyncing.current||!dbRef.current) return;
    const queue=await idbGetAll(dbRef.current,"sync_queue");
    if(!queue.length){setSyncStatus("idle");return;}
    isSyncing.current=true; setSyncStatus("syncing"); let err=0;
    for(const op of queue){
      try{
        if(op.op==="upsert") await sbUpsert(op.table,op.record);
        else if(op.op==="delete") await sbDelRec(op.table,op.record_id);
        await idbDelete(dbRef.current,"sync_queue",op.id);
      }catch(e){err++;console.warn("Sync fail:",e.message);}
    }
    isSyncing.current=false; setSyncStatus(err>0?"error":"idle"); refreshPending();
  },[refreshPending]);
  const pullRemote=useCallback(async()=>{
    if(!SUPABASE_CONFIGURED){setSyncStatus("idle");return;}
    setSyncStatus("syncing");
    try{
      const results={};
      await Promise.all(Object.entries(TABLE_MAP).map(async([store,table])=>{
        try{ const rows=await sbSelect(table); if(Array.isArray(rows)&&rows.length){await idbClear(dbRef.current,store);await Promise.all(rows.map(r=>idbPut(dbRef.current,store,r)));results[store]=rows;} }catch(e){console.warn(`Pull ${table}:`,e.message);}
      }));
      if(Object.keys(results).length) onLoad(results);
      setSyncStatus("idle");
    }catch(e){setSyncStatus("error");}
  },[onLoad]);
  const forceSync=useCallback(async()=>{ if(!navigator.onLine){setSyncStatus("offline");return;} if(!SUPABASE_CONFIGURED){setSyncStatus("idle");return;} await flushQueue(); await pullRemote(); },[flushQueue,pullRemote]);
  useEffect(()=>{
    (async()=>{
      const db=await openDB(); dbRef.current=db;
      const local={};
      await Promise.all(STORES.filter(s=>s!=="sync_queue").map(async s=>{local[s]=await idbGetAll(db,s);}));
      onLoad(local); setDbReady(true); refreshPending();
      if(navigator.onLine) forceSync();
    })();
  },[]);
  useEffect(()=>{
    const goOn=()=>{setOnline(true);forceSync();}; const goOff=()=>{setOnline(false);setSyncStatus("offline");};
    window.addEventListener("online",goOn); window.addEventListener("offline",goOff);
    return()=>{window.removeEventListener("online",goOn);window.removeEventListener("offline",goOff);};
  },[forceSync]);
  const saveRecord=useCallback(async(store,record)=>{
    if(!dbRef.current) return;
    await idbPut(dbRef.current,store,record);
    await idbPut(dbRef.current,"sync_queue",{op:"upsert",table:TABLE_MAP[store]||store,record,timestamp:Date.now()});
    refreshPending(); if(navigator.onLine) flushQueue();
  },[flushQueue,refreshPending]);
  const deleteRecord=useCallback(async(store,id)=>{
    if(!dbRef.current) return;
    await idbDelete(dbRef.current,store,id);
    await idbPut(dbRef.current,"sync_queue",{op:"delete",table:TABLE_MAP[store]||store,record_id:id,timestamp:Date.now()});
    refreshPending(); if(navigator.onLine) flushQueue();
  },[flushQueue,refreshPending]);
  return{dbReady,online,syncStatus,pendingCount,forceSync,saveRecord,deleteRecord};
}
