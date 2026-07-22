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
  const { pop, tc } = useApp();
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
      <AppBar title={tc({ en: "Demand & Supply", hi: "मांग और आपूर्ति", bn: "চাহিদা ও জোগান" })} onBack={pop} />
      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 14,
        animation: "ag-fade .25s var(--ag-ease)" }}>

        <div style={{ display: "flex", gap: 8 }}>
          <Chip active={tab === "demand"} onClick={() => setTab("demand")}>{tc({ en: "Demand", hi: "मांग", bn: "চাহিদা" })}</Chip>
          <Chip active={tab === "supply"} onClick={() => setTab("supply")}>{tc({ en: "Supply", hi: "आपूर्ति", bn: "জোগান" })}</Chip>
        </div>

        {tab === "demand" && (
          demand === null ? null : demand.every((d) => d.unitsOrdered === 0) ? (
            <EmptyState icon="Activity"
              title={tc({ en: "No demand signal yet", hi: "अभी तक कोई मांग संकेत नहीं", bn: "এখনও কোনো চাহিদার সংকেত নেই" })}
              body={tc({ en: "Load AI commerce demo data from the hub first.", hi: "पहले हब से AI कॉमर्स डेमो डेटा लोड करें।", bn: "প্রথমে হাব থেকে AI কমার্স ডেমো ডেটা লোড করুন।" })} />
          ) : (
            <Card pad={15}>
              <SectionHeader title={tc({ en: "Demand index by category", hi: "श्रेणी अनुसार मांग सूचकांक", bn: "শ্রেণি অনুযায়ী চাহিদা সূচক" })} />
              <div style={{ marginTop: 10 }}>
                {demand.map((d) => (
                  <Bar key={d.category} label={d.label} value={d.demandIndex} level={d.level}
                    sub={d.festival
                      ? tc({ en: `${d.unitsOrdered} units · festival lift: ${d.festival}`, hi: `${d.unitsOrdered} यूनिट · त्योहारी बढ़त: ${d.festival}`, bn: `${d.unitsOrdered} ইউনিট · উৎসবের চাহিদা বৃদ্ধি: ${d.festival}` })
                      : tc({ en: `${d.unitsOrdered} units ordered`, hi: `${d.unitsOrdered} यूनिट का ऑर्डर`, bn: `${d.unitsOrdered} ইউনিট অর্ডার করা হয়েছে` })} />
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
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{tc({ en: "Storage capacity —", hi: "भंडारण क्षमता —", bn: "সংরক্ষণ ক্ষমতা —" })} {storage.position}</span>
                </div>
                <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 6 }}>
                  {tc({
                    en: `${storage.freeTonnes}t free of ${storage.capacityTonnes}t across ${storage.facilities} facilities · ${storage.utilisation}% used`,
                    hi: `${storage.facilities} सुविधाओं में ${storage.capacityTonnes}t में से ${storage.freeTonnes}t खाली · ${storage.utilisation}% उपयोग में`,
                    bn: `${storage.facilities}টি সুবিধায় ${storage.capacityTonnes}t-এর মধ্যে ${storage.freeTonnes}t খালি · ${storage.utilisation}% ব্যবহৃত`,
                  })}
                </div>
              </Card>
            )}
            {supply === null ? null : (
              <Card pad={15}>
                <SectionHeader title={tc({ en: "Supply position by category", hi: "श्रेणी अनुसार आपूर्ति स्थिति", bn: "শ্রেণি অনুযায়ী জোগানের অবস্থা" })} />
                <div style={{ marginTop: 10 }}>
                  {supply.map((s) => (
                    <Bar key={s.category} label={s.label} value={s.supplyIndex} level={s.position}
                      sub={tc({
                        en: `${s.availableUnits} available · ${s.orderedUnits} ordered`,
                        hi: `${s.availableUnits} उपलब्ध · ${s.orderedUnits} ऑर्डर किए गए`,
                        bn: `${s.availableUnits} উপলব্ধ · ${s.orderedUnits} অর্ডার করা হয়েছে`,
                      })} />
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
