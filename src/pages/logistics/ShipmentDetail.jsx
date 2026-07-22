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
  const { pop, toast, tc } = useApp();
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

  if (!s) return <><AppBar title={tc({en:"Shipment", hi:"शिपमेंट", bn:"শিপমেন্ট"})} onBack={pop} /></>;

  const simulate = async () => { await trackingService.advance(shipmentId); toast(tc({en:"Location updated", hi:"स्थान अपडेट किया गया", bn:"অবস্থান আপডেট করা হয়েছে"}), "info"); refresh(); };
  const advance = async () => {
    const next = shipmentService.nextStatus(s.status);
    if (!next) return;
    if (next === "delivered") { setPodOpen(true); return; }
    await shipmentService.setStatus(shipmentId, next); toast(`${tc({en:"Marked", hi:"चिह्नित", bn:"চিহ্নিত"})} ${SHIPMENT_STATUS[next]?.label}`, "success"); refresh();
  };
  const confirmPod = async () => {
    await shipmentService.confirmDelivery(shipmentId, { receivedBy: podBy || tc({en:"Recipient", hi:"प्राप्तकर्ता", bn:"প্রাপক"}) });
    toast(tc({en:"Delivery confirmed", hi:"डिलीवरी की पुष्टि हुई", bn:"ডেলিভারি নিশ্চিত করা হয়েছে"}), "success"); setPodOpen(false); setPodBy(""); refresh();
  };
  const reportDamage = async () => {
    if (!dmg.trim()) return;
    await shipmentService.reportDamage(shipmentId, dmg.trim());
    toast(tc({en:"Damage reported", hi:"क्षति की सूचना दी गई", bn:"ক্ষতির প্রতিবেদন করা হয়েছে"}), "info"); setDmg(""); setDmgOpen(false); refresh();
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
            {row(tc({en:"Quantity", hi:"मात्रा", bn:"পরিমাণ"}), `${(s.quantityKg / 1000).toLocaleString("en-IN")} t`)}
            {row(tc({en:"Distance", hi:"दूरी", bn:"দূরত্ব"}), `${s.distanceKm} km`)}
            {row(tc({en:"Freight", hi:"भाड़ा", bn:"ভাড়া"}), rupee(s.price))}
            {s.vehicleReg && row(tc({en:"Vehicle", hi:"वाहन", bn:"যানবাহন"}), s.vehicleReg)}
            {s.driverName && row(tc({en:"Driver", hi:"चालक", bn:"চালক"}), s.driverName)}
            {inTransit && eta != null && row(tc({en:"ETA to drop", hi:"ड्रॉप तक ईटीए", bn:"ড্রপে পৌঁছানোর আনুমানিক সময়"}), `~${Math.round(eta / 60 * 10) / 10} h`)}
          </div>
        </Card>

        {/* tracking */}
        <div>
          <SectionHeader title={tc({en:"Live Tracking", hi:"लाइव ट्रैकिंग", bn:"লাইভ ট্র্যাকিং"})} />
          <TrackingMap pickup={s.pickup} drop={s.drop} trail={trail} />
          {inTransit && (
            <Button variant="soft" full icon="Navigation" onClick={simulate} style={{ marginTop: 10 }}>
              {tc({en:"Simulate movement", hi:"गति का अनुकरण करें", bn:"চলাচল সিমুলেট করুন"})}
            </Button>
          )}
        </div>

        {/* proof of delivery */}
        {s.pod && (
          <Card pad={13} style={{ background: T.primarySoft, border: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="CheckCircle2" size={18} color={T.primary} />
              <span style={{ fontSize: 13, fontWeight: 700, color: T.primary }}>{tc({en:"Delivered", hi:"वितरित", bn:"ডেলিভারি সম্পন্ন"})}</span>
            </div>
            <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 4 }}>
              {tc({en:"Received by", hi:"द्वारा प्राप्त", bn:"গ্রহণ করেছেন"})} {s.pod.receivedBy} · {new Date(s.pod.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </div>
          </Card>
        )}

        {/* damage reports */}
        {s.damage?.length > 0 && (
          <Card pad={13} style={{ background: T.redSoft, border: "none" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.red, marginBottom: 6 }}>{tc({en:"Damage Reports", hi:"क्षति रिपोर्ट", bn:"ক্ষতির প্রতিবেদন"})}</div>
            {s.damage.map((d, i) => (
              <div key={i} style={{ fontSize: 12, color: T.inkSoft, marginTop: 3 }}>• {d.note}</div>
            ))}
          </Card>
        )}

        {/* timeline */}
        <div>
          <SectionHeader title={tc({en:"Timeline", hi:"समयरेखा", bn:"সময়রেখা"})} />
          <StatusTimeline entries={s.timeline || []} labelFor={(st) => SHIPMENT_STATUS[st]?.label || st} />
        </div>

        {/* actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {canAdvance && (
            <Button full icon="ArrowRight" onClick={advance}>
              {tc({en:"Mark", hi:"चिह्नित करें", bn:"চিহ্নিত করুন"})} {SHIPMENT_STATUS[shipmentService.nextStatus(s.status)]?.label}
            </Button>
          )}
          {inTransit && (
            <Button variant="outline" full icon="AlertTriangle" onClick={() => setDmgOpen(true)}>{tc({en:"Report damage", hi:"क्षति की सूचना दें", bn:"ক্ষতির প্রতিবেদন করুন"})}</Button>
          )}
          {shipmentService.canCancel(s) && (
            <Button variant="danger" full icon="X" onClick={() => setCancelOpen(true)}>{tc({en:"Cancel shipment", hi:"शिपमेंट रद्द करें", bn:"শিপমেন্ট বাতিল করুন"})}</Button>
          )}
        </div>
      </div>

      <BottomSheet open={podOpen} onClose={() => setPodOpen(false)} title={tc({en:"Confirm Delivery", hi:"डिलीवरी की पुष्टि करें", bn:"ডেলিভারি নিশ্চিত করুন"})}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label={tc({en:"Received by", hi:"द्वारा प्राप्त", bn:"গ্রহণ করেছেন"})} value={podBy} onChange={(v) => setPodBy(v)} icon="User" placeholder={tc({en:"Recipient name", hi:"प्राप्तकर्ता का नाम", bn:"প্রাপকের নাম"})} />
          <Button full icon="Check" onClick={confirmPod}>{tc({en:"Confirm proof of delivery", hi:"डिलीवरी का प्रमाण पुष्ट करें", bn:"ডেলিভারির প্রমাণ নিশ্চিত করুন"})}</Button>
        </div>
      </BottomSheet>

      <BottomSheet open={dmgOpen} onClose={() => setDmgOpen(false)} title={tc({en:"Report Damage", hi:"क्षति की सूचना दें", bn:"ক্ষতির প্রতিবেদন করুন"})}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label={tc({en:"What happened?", hi:"क्या हुआ?", bn:"কী ঘটেছে?"})} value={dmg} onChange={(v) => setDmg(v)} icon="AlertTriangle" placeholder={tc({en:"e.g. 3 crates crushed", hi:"जैसे, 3 क्रेट टूट गए", bn:"যেমন, ৩টি ক্রেট ভেঙে গেছে"})} />
          <Button full icon="Send" onClick={reportDamage}>{tc({en:"Submit report", hi:"रिपोर्ट जमा करें", bn:"প্রতিবেদন জমা দিন"})}</Button>
        </div>
      </BottomSheet>

      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} title={tc({en:"Cancel shipment?", hi:"शिपमेंट रद्द करें?", bn:"শিপমেন্ট বাতিল করবেন?"})} icon="X" danger
        body={tc({en:"This shipment will be cancelled and any assigned vehicle/driver freed.", hi:"यह शिपमेंट रद्द कर दी जाएगी और किसी भी सौंपे गए वाहन/चालक को मुक्त कर दिया जाएगा।", bn:"এই শিপমেন্টটি বাতিল করা হবে এবং যেকোনো নির্ধারিত যানবাহন/চালক মুক্ত করা হবে।"})}
        confirmLabel={tc({en:"Cancel shipment", hi:"शिपमेंट रद्द करें", bn:"শিপমেন্ট বাতিল করুন"})}
        onConfirm={async () => { await shipmentService.cancel(shipmentId); toast(tc({en:"Shipment cancelled", hi:"शिपमेंट रद्द की गई", bn:"শিপমেন্ট বাতিল করা হয়েছে"}), "info"); refresh(); }} />
    </>
  );
}
