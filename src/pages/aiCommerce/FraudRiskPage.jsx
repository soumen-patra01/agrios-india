import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar, Card, Chip, EmptyState } from "../../components/index.js";
import { useApp } from "../../store/AppStore.jsx";
import ScoreBadge from "../../components/aiCommerce/ScoreBadge.jsx";
import { fraudDetection } from "../../services/aiCommerce/fraudDetection.js";
import { riskScoring } from "../../services/aiCommerce/riskScoring.js";
import { sellerMatching } from "../../services/aiCommerce/sellerMatching.js";

const SEV_COLOR = { high: "red", medium: "orange", low: "yellow" };

export default function FraudRiskPage() {
  const { pop } = useApp();
  const [tab, setTab] = useState("fraud");
  const [flags, setFlags] = useState(null);
  const [risks, setRisks] = useState(null);
  const [supplyRisk, setSupplyRisk] = useState(null);

  useEffect(() => {
    fraudDetection.scan().then(setFlags);
    riskScoring.supplyChainRisk().then(setSupplyRisk);
    (async () => {
      const { items } = await sellerMatching.rank({ limit: 8 });
      const profiles = await Promise.all(items.map((x) => riskScoring.sellerRisk(x.seller.id)));
      setRisks(profiles.filter(Boolean).sort((a, b) => b.overall - a.overall));
    })();
  }, []);

  return (
    <>
      <AppBar title="Fraud & Risk" onBack={pop} />
      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 14,
        animation: "ag-fade .25s var(--ag-ease)" }}>

        <div style={{ display: "flex", gap: 8 }}>
          <Chip active={tab === "fraud"} onClick={() => setTab("fraud")}>Fraud flags</Chip>
          <Chip active={tab === "risk"} onClick={() => setTab("risk")}>Risk scores</Chip>
        </div>

        {tab === "fraud" && (
          flags === null ? null : flags.length === 0 ? (
            <EmptyState icon="ShieldCheck" title="No fraud flags"
              body="No suspicious listings detected. Load AI commerce demo data to see the detector in action." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {flags.map((f) => (
                <Card key={f.subjectId} pad={13}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: T[`${SEV_COLOR[f.severity]}Soft`],
                      display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <Icon name="ShieldAlert" size={19} color={T[SEV_COLOR[f.severity]]} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>{f.name}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: T[SEV_COLOR[f.severity]],
                          background: T[`${SEV_COLOR[f.severity]}Soft`], borderRadius: 5, padding: "1px 6px", textTransform: "uppercase" }}>{f.severity}</span>
                      </div>
                      <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 1 }}>{f.sellerName}</div>
                      <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                        {f.reasons.map((r, i) => (
                          <div key={i} style={{ fontSize: 11.5, color: T.inkSoft, display: "flex", gap: 5 }}>
                            <Icon name="Dot" size={13} color={T.inkFaint} />{r.label}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: T[SEV_COLOR[f.severity]], fontFamily: T.display }}>{f.score}</div>
                  </div>
                </Card>
              ))}
            </div>
          )
        )}

        {tab === "risk" && (
          <>
            {supplyRisk && (
              <Card pad={14} style={{ background: T.orangeSoft, border: "none" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>Supply-chain risk</div>
                    <div style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 2 }}>{supplyRisk.reasons[0]?.label}</div>
                  </div>
                  <ScoreBadge score={supplyRisk.overall} size={44} invert />
                </div>
              </Card>
            )}
            {risks === null ? null : risks.length === 0 ? (
              <EmptyState icon="Gauge" title="No risk profiles" body="Load AI commerce demo data first." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {risks.map((r) => (
                  <Card key={r.subjectId} pad={13}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <ScoreBadge score={r.overall} size={42} invert label={r.band} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>{r.name}</div>
                        <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
                          {r.dimensions.filter((d) => d.score != null).map((d) => (
                            <span key={d.name} style={{ fontSize: 10.5, color: T.inkSoft, background: T.surface2, borderRadius: 5, padding: "2px 7px" }}>
                              {d.name.replace(" risk", "")}: <b style={{ color: T[SEV_COLOR[d.band?.toLowerCase()] ] || T.ink }}>{d.score}</b>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
