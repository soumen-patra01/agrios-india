import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar, Card, EmptyState, Button, IconTile } from "../../components/index.js";
import { useApp } from "../../store/AppStore.jsx";
import { seedLog } from "../../services/logistics/seedLog.js";
import { logisticsAnalytics } from "../../services/logistics/logisticsAnalytics.js";
import { rupee, compact } from "../../utils/format.js";

const MODULES = [
  { kind: "logShipments",   label: "Shipments",    desc: "Book & track deliveries",     icon: "Package",       a: "primary" },
  { kind: "logFleet",       label: "Fleet & Drivers",desc: "Provide transport services",icon: "Truck",         a: "blue"    },
  { kind: "logWarehouse",   label: "Warehousing",  desc: "Dry & cold storage",          icon: "Warehouse",     a: "orange"  },
  { kind: "logContracts",   label: "Contract Farming",desc: "Digital buyer agreements", icon: "FileSignature", a: "primary" },
  { kind: "logAuctions",    label: "Auctions",     desc: "Forward & reverse bidding",   icon: "Gavel",         a: "yellow"  },
  { kind: "logProcurement", label: "Procurement",  desc: "Tenders & purchase orders",   icon: "ClipboardList", a: "blue"    },
  { kind: "logExport",      label: "Export",       desc: "Docs & compliance",           icon: "Container",     a: "primary" },
  { kind: "logAnalytics",   label: "Analytics",    desc: "Supply-chain KPIs",           icon: "BarChart3",     a: "orange"  },
];

export default function LogisticsHub() {
  const { pop, push, toast } = useApp();
  const [seeding, setSeeding] = useState(false);
  const [hasData, setHasData] = useState(null);
  const [ov, setOv] = useState(null);
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((n) => n + 1);

  useEffect(() => {
    seedLog.hasData().then(setHasData);
    logisticsAnalytics.overview().then(setOv);
  }, [tick]);

  const loadDemo = async () => {
    setSeeding(true);
    const r = await seedLog.load();
    setSeeding(false);
    toast(`${r.shipments} shipments, ${r.vehicles} vehicles, ${r.warehouses} warehouses loaded`, "success");
    refresh();
  };

  const clearDemo = async () => { await seedLog.clear(); toast("Demo data cleared", "info"); refresh(); };

  return (
    <>
      <AppBar title="Logistics & Trade" onBack={pop} />
      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 16,
        animation: "ag-fade .25s var(--ag-ease)" }}>

        {/* hero summary */}
        {ov && hasData && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
            {[
              { label: "Shipments", value: ov.shipments.total, icon: "Package", a: "primary" },
              { label: "In Transit", value: ov.shipments.active, icon: "Navigation", a: "orange" },
              { label: "Revenue", value: compact(ov.shipments.revenue), icon: "IndianRupee", a: "primary" },
              { label: "Warehouses", value: ov.warehouses.facilities, icon: "Warehouse", a: "blue" },
            ].map((s) => (
              <div key={s.label} style={{ flexShrink: 0, background: T.surface, border: `1px solid ${T.line}`,
                borderRadius: T.rMd, padding: "10px 14px", minWidth: 104 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name={s.icon} size={14} color={T.primary} />
                  <span style={{ fontSize: 17, fontWeight: 800, color: T.ink, fontFamily: T.display }}>{s.value}</span>
                </div>
                <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {hasData === false ? (
          <EmptyState icon="Truck" title="Logistics & Smart Commerce"
            body="Transport, fleet, shipment tracking, warehousing, cold chain, contract farming, auctions, procurement and export — all in one place. Load demo data to explore."
            action={seeding ? "Loading…" : "Load demo data"} onAction={seeding ? undefined : loadDemo} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {MODULES.map((m) => (
              <Card key={m.kind} onClick={() => push({ kind: m.kind })} pad={13}>
                <IconTile name={m.icon} a={m.a} size={40} iconSize={20} />
                <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink, marginTop: 9 }}>{m.label}</div>
                <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 2 }}>{m.desc}</div>
              </Card>
            ))}
          </div>
        )}

        {hasData && (
          <Button variant="soft" full icon="Trash2" onClick={clearDemo}>Clear demo data</Button>
        )}
      </div>
    </>
  );
}
