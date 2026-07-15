import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar, Card, SectionHeader, EmptyState } from "../../components/index.js";
import { useApp } from "../../store/AppStore.jsx";
import StatTile from "../../components/erp/StatTile.jsx";
import { logisticsAnalytics } from "../../services/logistics/logisticsAnalytics.js";
import { rupee, compact } from "../../utils/format.js";

export default function LogisticsAnalytics() {
  const { pop } = useApp();
  const [ov, setOv] = useState(null);
  const [throughput, setThroughput] = useState([]);

  useEffect(() => {
    logisticsAnalytics.overview().then(setOv);
    logisticsAnalytics.commodityThroughput().then(setThroughput);
  }, []);

  if (!ov) return <><AppBar title="Analytics" onBack={pop} /></>;

  const empty = ov.shipments.total === 0 && ov.warehouses.facilities === 0;
  const maxKg = Math.max(1, ...throughput.map((t) => t.kg));

  const group = (title, tiles) => (
    <div>
      <SectionHeader title={title} />
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
        {tiles.map((t) => <StatTile key={t.label} {...t} />)}
      </div>
    </div>
  );

  return (
    <>
      <AppBar title="Supply-Chain Analytics" onBack={pop} />
      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 18,
        animation: "ag-fade .25s var(--ag-ease)" }}>

        {empty ? (
          <EmptyState icon="BarChart3" title="No data yet"
            body="Load demo data or create shipments, warehouses and trades to see supply-chain KPIs here." />
        ) : (
          <>
            {group("Shipments", [
              { label: "Total", value: ov.shipments.total, icon: "Package", a: "primary" },
              { label: "Active", value: ov.shipments.active, icon: "Navigation", a: "orange" },
              { label: "Delivered", value: ov.shipments.delivered, icon: "CheckCircle2", a: "primary" },
              { label: "Revenue", value: compact(ov.shipments.revenue), icon: "IndianRupee", a: "blue" },
              { label: "Total km", value: ov.shipments.totalKm.toLocaleString("en-IN"), icon: "Route", a: "orange" },
            ])}

            {group("Fleet", [
              { label: "Vehicles", value: ov.fleet.vehicles, icon: "Truck", a: "blue" },
              { label: "Available", value: ov.fleet.available, icon: "Check", a: "primary" },
              { label: "On Trip", value: ov.fleet.onTrip, icon: "Navigation", a: "orange" },
              { label: "Drivers", value: ov.fleet.drivers, icon: "User", a: "primary" },
              { label: "Doc Alerts", value: ov.fleet.docAlerts, icon: "AlertTriangle", a: "red" },
            ])}

            {group("Warehousing", [
              { label: "Facilities", value: ov.warehouses.facilities, icon: "Warehouse", a: "orange" },
              { label: "Cold", value: ov.warehouses.cold, icon: "Snowflake", a: "blue" },
              { label: "Utilisation", value: `${ov.warehouses.utilisation}%`, icon: "Gauge", a: "primary" },
              { label: "Capacity", value: `${Math.round(ov.warehouses.capacityKg / 1000).toLocaleString("en-IN")}t`, icon: "Boxes", a: "yellow" },
            ])}

            {group("Trade", [
              { label: "Auctions", value: ov.trade.auctions, icon: "Gavel", a: "yellow" },
              { label: "Live", value: ov.trade.liveAuctions, icon: "Radio", a: "primary" },
              { label: "Tenders", value: ov.trade.procurements, icon: "ClipboardList", a: "blue" },
              { label: "Open", value: ov.trade.openProcurements, icon: "Inbox", a: "orange" },
            ])}

            {throughput.length > 0 && (
              <div>
                <SectionHeader title="Delivered throughput by commodity" />
                <Card pad={14}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {throughput.map((t) => (
                      <div key={t.commodity}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                          <span style={{ color: T.ink, fontWeight: 600 }}>{t.commodity}</span>
                          <span style={{ color: T.inkSoft }}>{(t.kg / 1000).toLocaleString("en-IN")} t</span>
                        </div>
                        <div style={{ height: 8, borderRadius: 8, background: T.surface2, overflow: "hidden" }}>
                          <div style={{ width: `${(t.kg / maxKg) * 100}%`, height: "100%", background: T.primary, borderRadius: 8 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: T.surface2,
              borderRadius: T.rMd, padding: "10px 12px" }}>
              <Icon name="Info" size={15} color={T.inkSoft} style={{ marginTop: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 11.5, color: T.inkSoft, lineHeight: 1.5 }}>
                Demand forecasting, price prediction and supply-chain risk detection are AI features planned for the backend phase.
              </span>
            </div>
          </>
        )}
      </div>
    </>
  );
}
