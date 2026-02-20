import { useEffect, useMemo, useRef, useState } from "react";
import { S } from "../styles";
import { Overlay, FGrid, FG, FIn, FSel, Btn, ModalFooter } from "./ui";
import { supabase } from "../lib/supabaseClient";

async function getGPS() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          acc: pos.coords.accuracy,
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

export default function PODForm({
  onClose,
  inv,
  benes,
  dists,
  onCreatedLocal,
  showToast,
}) {
  const [distRef, setDistRef] = useState(dists?.[0]?.ref || "");
  const dist = useMemo(() => dists.find((d) => d.ref === distRef), [dists, distRef]);
  const bene = useMemo(() => benes.find((b) => String(b.id) === String(dist?.beneId || dist?.bene_id)), [benes, dist]);

  const invItem = useMemo(() => {
    if (!dist) return null;
    // dist.itemId in seed is numeric; in Supabase flow it may be uuid
    return inv.find((i) => String(i.id) === String(dist.itemId || dist.item_id)) || null;
  }, [inv, dist]);

  const [f, setF] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    officer: dist?.officer || "",
    vehicle: dist?.truck || "",
    season: dist?.season || "",
    receivedBy: bene?.name || "",
    signedAt: bene?.village ? `${bene.village}` : "",
    condition: "Good",
    qtyOrdered: dist?.qty || 0,
    qtyReceived: dist?.qty || 0,
    notes: "",
    gps: null,
    signatureDataUrl: "",
  });

  useEffect(() => {
    setF((p) => ({
      ...p,
      officer: dist?.officer || p.officer,
      vehicle: dist?.truck || p.vehicle,
      season: dist?.season || p.season,
      receivedBy: bene?.name || p.receivedBy,
      signedAt: bene?.village ? `${bene.village}` : p.signedAt,
      qtyOrdered: dist?.qty ?? p.qtyOrdered,
      qtyReceived: dist?.qty ?? p.qtyReceived,
    }));
  }, [distRef]); // eslint-disable-line react-hooks/exhaustive-deps

  const canvasRef = useRef(null);
  const drawing = useRef(false);

  const draw = (e) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const startDraw = (e) => {
    drawing.current = true;
    draw(e);
  };
  const endDraw = () => {
    drawing.current = false;
  };

  const clearSig = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    setF((p) => ({ ...p, signatureDataUrl: "" }));
  };

  const captureSig = () => {
    const url = canvasRef.current.toDataURL("image/png");
    setF((p) => ({ ...p, signatureDataUrl: url }));
  };

  const generatePodRef = () => {
    const year = new Date().getFullYear();
    const rand = Math.floor(Math.random() * 900) + 100;
    return `POD-${year}-${rand}`;
  };

  const savePOD = async () => {
    if (!dist) return showToast("Select a valid distribution", "error");
    if (!f.receivedBy) return showToast("Received by is required", "error");
    if (!invItem) return showToast("Distribution item not found in inventory", "error");

    const podRef = generatePodRef();

    const gps = f.gps || (await getGPS());

    try {
      const podInsert = await supabase
        .from("pods")
        .insert([
          {
            ref: podRef,
            dist_ref: dist.ref,
            distribution_id: dist.id || null,
            bene_id: dist.beneId || dist.bene_id || null,
            date: f.date,
            time: f.time,
            officer: f.officer,
            vehicle: f.vehicle,
            season: f.season,
            received_by: f.receivedBy,
            condition: f.condition,
            signed_at: f.signedAt,
            notes: f.notes,
            gps_lat: gps?.lat ?? null,
            gps_lng: gps?.lng ?? null,
            gps_accuracy: gps?.acc ?? null,
            signature_data_url: f.signatureDataUrl || null,
            verified: false,
          },
        ])
        .select("*")
        .single();

      if (podInsert.error) throw podInsert.error;

      const itemInsert = await supabase.from("pod_items").insert([
        {
          pod_id: podInsert.data.id,
          inv_item_id: invItem.id,
          barcode: invItem.barcode,
          name: invItem.name,
          proc_code: invItem.procCode || invItem.proc_code,
          cat: invItem.cat,
          unit: invItem.unit,
          qty_ordered: Number(f.qtyOrdered || 0),
          qty_received: Number(f.qtyReceived || 0),
          item_condition: f.condition === "Damaged" ? "Damaged" : "Good",
          damage_note: f.condition === "Damaged" ? "Reported damaged at delivery" : null,
        },
      ]);

      if (itemInsert.error) throw itemInsert.error;

      // Best-effort audit log
      await supabase.from("audit_logs").insert([{
        action: "POD_CREATED",
        entity: "pods",
        entity_id: podInsert.data.id,
        payload: { podRef, distRef: dist.ref, beneId: dist.beneId || dist.bene_id }
      }]);

      onCreatedLocal({
        id: podInsert.data.id,
        ref: podRef,
        distRef: dist.ref,
        beneId: dist.beneId || dist.bene_id,
        date: f.date,
        time: f.time,
        officer: f.officer,
        vehicle: f.vehicle,
        season: f.season,
        receivedBy: f.receivedBy,
        condition: f.condition,
        verified: false,
        signedAt: f.signedAt,
        signatureDataUrl: f.signatureDataUrl,
        gps,
        items: [
          {
            invId: invItem.id,
            barcode: invItem.barcode,
            name: invItem.name,
            procCode: invItem.procCode || invItem.proc_code,
            cat: invItem.cat,
            unit: invItem.unit,
            qtyOrdered: Number(f.qtyOrdered || 0),
            qty: Number(f.qtyReceived || 0),
            itemCondition: f.condition === "Damaged" ? "Damaged" : "Good",
            damageNote: f.condition === "Damaged" ? "Reported damaged at delivery" : null,
          },
        ],
        notes: f.notes,
      });

      showToast("POD recorded (pending verification)", "success");
      onClose();
    } catch (e) {
      console.error(e);
      showToast("Failed to save POD to Supabase (check auth/RLS)", "error");
    }
  };

  return (
    <Overlay onClose={onClose} title="Record Proof of Delivery (POD)" width="min(860px, 96vw)">
      <FGrid>
        <FG label="Distribution Ref *" full>
          <FSel value={distRef} onChange={setDistRef} opts={dists.map((d) => d.ref)} />
        </FG>

        <FG label="Beneficiary" full>
          <div style={{ ...S.fi, background: "#f8fafc" }}>
            {bene?.name || "—"} {bene?.group ? `— ${bene.group}` : ""}
          </div>
        </FG>

        <FG label="Date *">
          <FIn type="date" value={f.date} onChange={(v) => setF((p) => ({ ...p, date: v }))} />
        </FG>
        <FG label="Time *">
          <FIn value={f.time} onChange={(v) => setF((p) => ({ ...p, time: v }))} />
        </FG>

        <FG label="Field Officer">
          <FIn value={f.officer} onChange={(v) => setF((p) => ({ ...p, officer: v }))} />
        </FG>
        <FG label="Vehicle">
          <FIn value={f.vehicle} onChange={(v) => setF((p) => ({ ...p, vehicle: v }))} />
        </FG>

        <FG label="Received By *" full>
          <FIn value={f.receivedBy} onChange={(v) => setF((p) => ({ ...p, receivedBy: v }))} />
        </FG>

        <FG label="Signed At (Location)" full>
          <FIn
            value={f.signedAt}
            onChange={(v) => setF((p) => ({ ...p, signedAt: v }))}
            placeholder="Village / Site name"
          />
        </FG>

        <FG label="Condition">
          <FSel value={f.condition} onChange={(v) => setF((p) => ({ ...p, condition: v }))} opts={["Good", "Partial", "Damaged"]} />
        </FG>

        <FG label="Qty Ordered">
          <FIn type="number" value={f.qtyOrdered} onChange={(v) => setF((p) => ({ ...p, qtyOrdered: v }))} />
        </FG>

        <FG label="Qty Received *">
          <FIn type="number" value={f.qtyReceived} onChange={(v) => setF((p) => ({ ...p, qtyReceived: v }))} />
        </FG>

        <FG label="GPS (optional)" full>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              style={S.btnO}
              onClick={async () => {
                const gps = await getGPS();
                if (!gps) return showToast("GPS not available / denied", "error");
                setF((p) => ({ ...p, gps }));
                showToast(`GPS captured (±${Math.round(gps.acc)}m)`, "success");
              }}
            >
              📍 Capture GPS
            </button>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              {f.gps ? `${f.gps.lat.toFixed(5)}, ${f.gps.lng.toFixed(5)} (±${Math.round(f.gps.acc)}m)` : "Not captured"}
            </div>
          </div>
        </FG>

        <FG label="Signature (draw)" full>
          <div style={{ background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: 10, padding: 10 }}>
            <canvas
              ref={canvasRef}
              width={760}
              height={140}
              style={{ width: "100%", height: 140, background: "#fff", borderRadius: 8 }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={() => {
                endDraw();
                captureSig();
              }}
              onMouseLeave={() => {
                endDraw();
                captureSig();
              }}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={() => {
                endDraw();
                captureSig();
              }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={S.btnO} onClick={clearSig}>
                Clear
              </button>
              <button style={S.btnO} onClick={captureSig}>
                Save Signature
              </button>
              <span style={{ fontSize: 12, color: "#64748b", marginLeft: "auto" }}>
                {f.signatureDataUrl ? "Signature saved" : "Not saved yet"}
              </span>
            </div>
          </div>
        </FG>

        <FG label="Notes" full>
          <textarea
            value={f.notes}
            onChange={(e) => setF((p) => ({ ...p, notes: e.target.value }))}
            style={{ ...S.fi, minHeight: 80, resize: "vertical" }}
            placeholder="Damage notes, partial delivery explanation, etc."
          />
        </FG>
      </FGrid>

      <ModalFooter>
        <Btn variant="ghost" onClick={onClose}>
          Cancel
        </Btn>
        <Btn onClick={savePOD}>Save POD</Btn>
      </ModalFooter>
    </Overlay>
  );
}
