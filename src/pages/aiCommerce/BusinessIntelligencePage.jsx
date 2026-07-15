import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar, Card, SectionHeader, EmptyState } from "../../components/index.js";
import { useApp } from "../../store/AppStore.jsx";
import StatTile from "../../components/erp/StatTile.jsx";
import { businessIntelligence } from "../../services/aiCommerce/businessIntelligence.js";
import { rupee, compact } from "../../utils/format.js";

export default function BusinessIntelligencePage() {
  const { pop } = useApp();
  const [ex, setEx] = useState(null);

  useEffect(() => { businessIntelligence.executive().then(setEx); }, []);

  if (!ex) return <><AppBar title="Business Intelligence" onBack={pop} /></>;

  const empty = ex.sales.orders === 0 && ex.marketplace.products === 0;

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
      <AppBar title="Business Intelligence" onBack={pop} />
      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 18,
        animation: "ag-fade .25s var(--ag-ease)" }}>

        {empty ? (
          <EmptyState icon="BarChart3" title="No data yet" body="Load AI commerce demo data from the hub to populate the dashboards." />
        ) : (
          <>
            {group("Sales", [
              { label: "Revenue", value: compact(ex.sales.revenue), icon: "IndianRupee", a: "primary" },
              { label: "Orders", value: ex.sales.orders, icon: "Package", a: "blue" },
              { label: "Delivered", value: ex.sales.delivered, icon: "CheckCircle2", a: "primary" },
              { label: "Avg order", value: rupee(ex.sales.avgOrderValue), icon: "Receipt", a: "orange" },
              { label: "Conversion", value: `${ex.sales.conversion}%`, icon: "TrendingUp", a: "primary" },
            ])}

            {group("Marketplace", [
              { label: "Products", value: ex.marketplace.products, icon: "ShoppingBag", a: "blue" },
              { label: "Published", value: ex.marketplace.published, icon: "Store", a: "primary" },
              { label: "Sellers", value: ex.marketplace.sellers, icon: "Users", a: "orange" },
              { label: "Out of stock", value: ex.marketplace.outOfStock, icon: "PackageX", a: "red" },
            ])}

            {group("Inventory", [
              { label: "Units", value: compact(ex.inventory.totalUnits).replace("₹", ""), icon: "Boxes", a: "blue" },
              { label: "Healthy", value: ex.inventory.healthy, icon: "CheckCircle2", a: "primary" },
              { label: "Low stock", value: ex.inventory.lowStock, icon: "AlertTriangle", a: "orange" },
              { label: "Out", value: ex.inventory.outOfStock, icon: "XCircle", a: "red" },
            ])}

            {group("Customers & Ops", [
              { label: "Leads", value: ex.customer.leads, icon: "Flame", a: "orange" },
              { label: "Hot leads", value: ex.customer.hotLeads, icon: "Flame", a: "red" },
              { label: "Districts", value: ex.customer.districts, icon: "MapPin", a: "blue" },
              { label: "Fraud flags", value: ex.operational.fraudFlags, icon: "ShieldAlert", a: "red" },
            ])}

            {ex.topDemand?.length > 0 && (
              <div>
                <SectionHeader title="Top demand categories" />
                <Card pad={14}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {ex.topDemand.map((d) => (
                      <div key={d.category}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                          <span style={{ color: T.ink, fontWeight: 600 }}>{d.label}</span>
                          <span style={{ color: T.inkSoft }}>{d.level} · {d.demandIndex}/100</span>
                        </div>
                        <div style={{ height: 7, borderRadius: 7, background: T.surface2, overflow: "hidden" }}>
                          <div style={{ width: `${d.demandIndex}%`, height: "100%", background: T.blue, borderRadius: 7 }} />
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
                Aggregated from the marketplace, logistics and AI engines on this device. Cross-organisation intelligence arrives with the backend phase.
              </span>
            </div>
          </>
        )}
      </div>
    </>
  );
}
