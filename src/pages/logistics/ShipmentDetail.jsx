import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar, Card, Button, SectionHeader } from "../../components/index.js";
import { BottomSheet, Dialog } from "../../components/overlays.jsx";
import { Input } from "../../components/inputs.jsx";
import { useApp } from "../../store/AppStore.jsx";
import TrackingMap from "../../components/logistics/TrackingMap.jsx";
import StatusTimeline from "../../components/logistics/StatusTimeline.jsx";
import StatusPill from "../../components/logistics/StatusPill.jsx";
import { shipmentService } from "../../services/logistics/shipmentService.js";
import { trackingService } from "../../services/logistics/trackingService.js";
import { SHIPMENT_STATUS } from "../../services/logistics/constantsLog.js";
import { rupee } from "../../utils/format.js";

export default function ShipmentDetail({ shipmentId }) {
  const { pop, toast } = useApp();
  const [s, setS] = useState(null);
  const [trail, setTrail] = useState([]);
  const [eta, setEta] = useState(null);
  const [podOpen, setPodOpen] = useState(false);
  const [podBy, setPodBy] = useState("");
  const [dmgOpen, setDmgOpen] = useState(false);
  const [dmg, setDmg] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((n) => n + 1);

  useEffect(() => {
    shipmentService.getById(shipmentId).then(setS);
    trackingService.replay(shipmentId).then(setTrail);
    trackingService.eta(shipmentId).then(setEta);
  }, [shipmentId, tick]);

  if (!s) return <><AppBar title="Shipment" onBack={pop} /></>;

  const simulate = async () => { await trackingService.advance(shipmentId); toast("Location updated", "info"); refresh(); };
  const advance = async () => {
    const next = shipmentService.nextStatus(s.status);
    if (!next) return;
    if (next === "delivered") { setPodOpen(true); return; }
    await shipmentService.setStatus(shipmentId, next); toast(`Marked ${SHIPMENT_STATUS[next]?.label}`, "success"); refresh();
  };
  const confirmPod = async () => {
    await shipmentService.confirmDelivery(shipmentId, { receivedBy: podBy || "Recipient" });
    toast("Delivery confirmed", "success"); setPodOpen(false); setPodBy(""); refresh();
  };
  const reportDamage = async () => {
    if (!dmg.trim()) return;
    await shipmentService.reportDamage(shipmentId, dmg.trim());
    toast("Damage reported", "info"); setDmg(""); setDmgOpen(false); refresh();
  };

  const inTransit = ["picked_up", "in_transit"].includes(s.status);
  const canAdvance = shipmentService.nextStatus(s.status) && s.status !== "pending";

  const row = (label, value) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${T.line}` }}>
      <span style={{ fontSize: 12.5, color: T.inkSoft }}>{label}</span>
      <span style={{ fontSize: 12.5, fontWeight: 600, color: T.ink, textAlign: "right" }}>{value}</span>
    </div>
  );

  return (
    <>
      <AppBar title={s.ref} onBack={pop} />
      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 16,
        animation: "ag-fade .25s var(--ag-ease)" }}>

        <Card pad={14}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: T.ink }}>{s.commodity}</div>
              <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 2 }}>
                {s.pickup?.name} → {s.drop?.name}
              </div>
            </div>
            <StatusPill status={s.status} map={SHIPMENT_STATUS} />
          </div>
          <div style={{ marginTop: 10 }}>
            {row("Quantity", `${(s.quantityKg / 1000).toLocaleString("en-IN")} t`)}
            {row("Distance", `${s.distanceKm} km`)}
            {row("Freight", rupee(s.price))}
            {s.vehicleReg && row("Vehicle", s.vehicleReg)}
            {s.driverName && row("Driver", s.driverName)}
            {inTransit && eta != null && row("ETA to drop", `~${Math.round(eta / 60 * 10) / 10} h`)}
          </div>
        </Card>

        {/* tracking */}
        <div>
          <SectionHeader title="Live Tracking" />
          <TrackingMap pickup={s.pickup} drop={s.drop} trail={trail} />
          {inTransit && (
            <Button variant="soft" full icon="Navigation" onClick={simulate} style={{ marginTop: 10 }}>
              Simulate movement
            </Button>
          )}
        </div>

        {/* proof of delivery */}
        {s.pod && (
          <Card pad={13} style={{ background: T.primarySoft, border: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="CheckCircle2" size={18} color={T.primary} />
              <span style={{ fontSize: 13, fontWeight: 700, color: T.primary }}>Delivered</span>
            </div>
            <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 4 }}>
              Received by {s.pod.receivedBy} · {new Date(s.pod.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </div>
          </Card>
        )}

        {/* damage reports */}
        {s.damage?.length > 0 && (
          <Card pad={13} style={{ background: T.redSoft, border: "none" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.red, marginBottom: 6 }}>Damage Reports</div>
            {s.damage.map((d, i) => (
              <div key={i} style={{ fontSize: 12, color: T.inkSoft, marginTop: 3 }}>• {d.note}</div>
            ))}
          </Card>
        )}

        {/* timeline */}
        <div>
          <SectionHeader title="Timeline" />
          <StatusTimeline entries={s.timeline || []} labelFor={(st) => SHIPMENT_STATUS[st]?.label || st} />
        </div>

        {/* actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {canAdvance && (
            <Button full icon="ArrowRight" onClick={advance}>
              Mark {SHIPMENT_STATUS[shipmentService.nextStatus(s.status)]?.label}
            </Button>
          )}
          {inTransit && (
            <Button variant="outline" full icon="AlertTriangle" onClick={() => setDmgOpen(true)}>Report damage</Button>
          )}
          {shipmentService.canCancel(s) && (
            <Button variant="danger" full icon="X" onClick={() => setCancelOpen(true)}>Cancel shipment</Button>
          )}
        </div>
      </div>

      <BottomSheet open={podOpen} onClose={() => setPodOpen(false)} title="Confirm Delivery">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label="Received by" value={podBy} onChange={(v) => setPodBy(v)} icon="User" placeholder="Recipient name" />
          <Button full icon="Check" onClick={confirmPod}>Confirm proof of delivery</Button>
        </div>
      </BottomSheet>

      <BottomSheet open={dmgOpen} onClose={() => setDmgOpen(false)} title="Report Damage">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label="What happened?" value={dmg} onChange={(v) => setDmg(v)} icon="AlertTriangle" placeholder="e.g. 3 crates crushed" />
          <Button full icon="Send" onClick={reportDamage}>Submit report</Button>
        </div>
      </BottomSheet>

      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel shipment?" icon="X" danger
        body="This shipment will be cancelled and any assigned vehicle/driver freed."
        confirmLabel="Cancel shipment"
        onConfirm={async () => { await shipmentService.cancel(shipmentId); toast("Shipment cancelled", "info"); refresh(); }} />
    </>
  );
}
