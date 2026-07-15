import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar, Card, Chip, SectionHeader, EmptyState } from "../../components/index.js";
import { useApp } from "../../store/AppStore.jsx";
import { demandForecast } from "../../services/aiCommerce/demandForecast.js";
import { supplyForecast } from "../../services/aiCommerce/supplyForecast.js";

const LEVEL_COLOR = { High: "primary", Moderate: "orange", Low: "red", Ample: "primary", Balanced: "orange", Tight: "red" };

function Bar({ label, value, level, sub }) {
  const a = LEVEL_COLOR[level] || "blue";
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{label}</span>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: T[a] }}>{level} · {value}</span>
      </div>
      <div style={{ height: 8, borderRadius: 8, background: T.surface2, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: T[a], borderRadius: 8 }} />
      </div>
      {sub && <div style={{ fontSize: 10.5, color: T.inkFaint, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

export default function ForecastPage() {
  const { pop } = useApp();
  const [tab, setTab] = useState("demand");
  const [demand, setDemand] = useState(null);
  const [supply, setSupply] = useState(null);
  const [storage, setStorage] = useState(null);

  useEffect(() => {
    demandForecast.ranking().then(setDemand);
    supplyForecast.ranking().then(setSupply);
    supplyForecast.storageCapacity().then(setStorage);
  }, []);

  return (
    <>
      <AppBar title="Demand & Supply" onBack={pop} />
      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 14,
        animation: "ag-fade .25s var(--ag-ease)" }}>

        <div style={{ display: "flex", gap: 8 }}>
          <Chip active={tab === "demand"} onClick={() => setTab("demand")}>Demand</Chip>
          <Chip active={tab === "supply"} onClick={() => setTab("supply")}>Supply</Chip>
        </div>

        {tab === "demand" && (
          demand === null ? null : demand.every((d) => d.unitsOrdered === 0) ? (
            <EmptyState icon="Activity" title="No demand signal yet" body="Load AI commerce demo data from the hub first." />
          ) : (
            <Card pad={15}>
              <SectionHeader title="Demand index by category" />
              <div style={{ marginTop: 10 }}>
                {demand.map((d) => (
                  <Bar key={d.category} label={d.label} value={d.demandIndex} level={d.level}
                    sub={d.festival ? `${d.unitsOrdered} units · festival lift: ${d.festival}` : `${d.unitsOrdered} units ordered`} />
                ))}
              </div>
            </Card>
          )
        )}

        {tab === "supply" && (
          <>
            {storage && (
              <Card pad={15} style={{ background: T.blueSoft, border: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="Warehouse" size={17} color={T.blue} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>Storage capacity — {storage.position}</span>
                </div>
                <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 6 }}>
                  {storage.freeTonnes}t free of {storage.capacityTonnes}t across {storage.facilities} facilities · {storage.utilisation}% used
                </div>
              </Card>
            )}
            {supply === null ? null : (
              <Card pad={15}>
                <SectionHeader title="Supply position by category" />
                <div style={{ marginTop: 10 }}>
                  {supply.map((s) => (
                    <Bar key={s.category} label={s.label} value={s.supplyIndex} level={s.position}
                      sub={`${s.availableUnits} available · ${s.orderedUnits} ordered`} />
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </>
  );
}
