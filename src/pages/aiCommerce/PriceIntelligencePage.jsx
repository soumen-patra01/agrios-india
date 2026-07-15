import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar, Card, SearchBar } from "../../components/index.js";
import { useApp } from "../../store/AppStore.jsx";
import ForecastChart from "../../components/aiCommerce/ForecastChart.jsx";
import ConfidenceBar from "../../components/aiCommerce/ConfidenceBar.jsx";
import ReasonList from "../../components/aiCommerce/ReasonList.jsx";
import { pricePrediction } from "../../services/aiCommerce/pricePrediction.js";
import { smartPricing } from "../../services/aiCommerce/smartPricing.js";
import { CROPS } from "../../services/market/cropData.js";
import { rupee } from "../../utils/format.js";

const POPULAR = ["paddy", "wheat", "potato", "mustard", "maize", "jute"];

export default function PriceIntelligencePage() {
  const { pop } = useApp();
  const [q, setQ] = useState("");
  const [cropId, setCropId] = useState("paddy");
  const [forecast, setForecast] = useState(null);
  const [sell, setSell] = useState(null);

  useEffect(() => {
    pricePrediction.forecast(cropId).then(setForecast);
    smartPricing.suggestSell(cropId, { grade: "standard" }).then(setSell);
  }, [cropId]);

  const matches = q
    ? CROPS.filter((c) => (c.name + c.hindi + c.bengali).toLowerCase().includes(q.toLowerCase())).slice(0, 8)
    : [];

  const dirIcon = { up: "TrendingUp", down: "TrendingDown", flat: "Minus" };
  const dirColor = { up: T.primary, down: T.red, flat: T.inkSoft };

  return (
    <>
      <AppBar title="Price Intelligence" onBack={pop} />
      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 14,
        animation: "ag-fade .25s var(--ag-ease)" }}>

        <SearchBar value={q} onChange={setQ} placeholder="Search a crop…" />
        {matches.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {matches.map((c) => (
              <Card key={c.id} pad={11} onClick={() => { setCropId(c.id); setQ(""); }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{c.name}</span>
                <span style={{ fontSize: 12, color: T.inkFaint }}> · MSP {rupee(c.msp)}/{c.unit}</span>
              </Card>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {POPULAR.map((id) => {
            const c = CROPS.find((x) => x.id === id);
            const active = cropId === id;
            return (
              <button key={id} onClick={() => setCropId(id)}
                style={{ padding: "7px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, flexShrink: 0,
                  border: `1.5px solid ${active ? T.primary : T.line}`, cursor: "pointer", fontFamily: "inherit",
                  background: active ? T.primarySoft : T.surface, color: active ? T.primary : T.ink }}>
                {c?.name.split(" ")[0]}
              </button>
            );
          })}
        </div>

        {forecast?.found && (
          <Card pad={16}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>{forecast.crop}</div>
                <div style={{ fontSize: 11.5, color: T.inkSoft }}>{forecast.horizon}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: T.surface2, borderRadius: 999, padding: "4px 10px" }}>
                <Icon name={dirIcon[forecast.direction]} size={15} color={dirColor[forecast.direction]} />
                <span style={{ fontSize: 12, fontWeight: 700, color: dirColor[forecast.direction], textTransform: "capitalize" }}>{forecast.direction}</span>
              </div>
            </div>

            <ForecastChart low={forecast.bandLow} high={forecast.bandHigh} msp={forecast.msp}
              predicted={forecast.predicted} range={forecast.range} unit={forecast.unit} />

            <div style={{ marginTop: 14 }}><ConfidenceBar confidence={forecast.confidence} /></div>
            <div style={{ marginTop: 14, borderTop: `1px solid ${T.line}`, paddingTop: 14 }}>
              <ReasonList reasons={forecast.reasons} />
            </div>
          </Card>
        )}

        {sell?.found && (
          <Card pad={15} style={{ background: T.primarySoft, border: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Icon name="Sparkles" size={16} color={T.primary} />
              <span style={{ fontSize: 13, fontWeight: 700, color: T.primary }}>Suggested selling price</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: T.ink, fontFamily: T.display }}>
              {rupee(sell.suggested)}<span style={{ fontSize: 13, color: T.inkSoft, fontWeight: 400 }}>/{sell.unit}</span>
            </div>
            <div style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 4 }}>
              {sell.hasMsp ? `Floor (MSP) ${rupee(sell.floor)} · never sell below this.` : `Band floor ${rupee(sell.floor)} · market-driven crop (no MSP).`}
            </div>
          </Card>
        )}

        {forecast && (
          <div style={{ fontSize: 11, color: T.inkFaint, lineHeight: 1.5, padding: "0 2px" }}>
            {forecast.disclaimer}
          </div>
        )}
      </div>
    </>
  );
}
