import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar, Card, Button, EmptyState, IconTile } from "../../components/index.js";
import { useApp } from "../../store/AppStore.jsx";
import { seedAiCommerce } from "../../services/aiCommerce/seedAiCommerce.js";
import { businessIntelligence } from "../../services/aiCommerce/businessIntelligence.js";
import { commerceAutomation } from "../../services/aiCommerce/commerceAutomation.js";
import { compact } from "../../utils/format.js";

const MODULES = [
  { kind: "aiRecs",     label: "Recommendations", desc: "Personalized & seasonal picks", icon: "Sparkles",   a: "blue"    },
  { kind: "aiPricing",  label: "Price Intelligence", desc: "Forecasts & smart pricing",  icon: "TrendingUp", a: "primary" },
  { kind: "aiForecast", label: "Demand & Supply", desc: "Market outlook by category",    icon: "Activity",   a: "orange"  },
  { kind: "aiMatch",    label: "Matchmaking",     desc: "Buyer & seller scoring",        icon: "Handshake",  a: "primary" },
  { kind: "aiFraud",    label: "Fraud & Risk",    desc: "Flagged listings & risk",       icon: "ShieldAlert",a: "red"     },
  { kind: "aiBI",       label: "Business Intelligence", desc: "Executive dashboards",    icon: "BarChart3",  a: "blue"    },
];

const ALERT_ICON = { demand: "Activity", price: "TrendingUp", fraud: "ShieldAlert", inventory: "Package", buyer: "Handshake" };

export default function AICommerceHub() {
  const { pop, push, toast } = useApp();
  const [hasData, setHasData] = useState(null);
  const [exec, setExec] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((n) => n + 1);

  useEffect(() => {
    seedAiCommerce.hasData().then(setHasData);
    businessIntelligence.executive().then(setExec).catch(() => setExec(null));
    commerceAutomation.list().then(setAlerts);
  }, [tick]);

  const loadDemo = async () => {
    setBusy(true);
    const r = await seedAiCommerce.load();
    await commerceAutomation.run();
    setBusy(false);
    toast(`AI commerce ready — ${r.orders} sample orders analysed`, "success");
    refresh();
  };

  const runScan = async () => {
    setBusy(true);
    const raised = await commerceAutomation.run();
    setBusy(false);
    toast(raised.length ? `${raised.length} new AI alert${raised.length > 1 ? "s" : ""}` : "No new alerts — all clear", "info");
    refresh();
  };

  const clearDemo = async () => {
    await seedAiCommerce.clear();
    await commerceAutomation.clearAll();
    toast("Demo data cleared", "info");
    refresh();
  };

  const unread = alerts.filter((a) => !a.read);

  return (
    <>
      <AppBar title="AI Commerce" onBack={pop} />
      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 16,
        animation: "ag-fade .25s var(--ag-ease)" }}>

        {hasData === false ? (
          <EmptyState icon="BrainCircuit" title="AI Commerce Platform"
            body="The intelligent decision engine for the marketplace — recommendations, price forecasts, buyer/seller matching, demand outlook, fraud detection and business intelligence, all explainable. Load demo data to see it work."
            action={busy ? "Analysing…" : "Load demo data"} onAction={busy ? undefined : loadDemo} />
        ) : (
          <>
            {/* headline BI tiles */}
            {exec && (
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
                {[
                  { label: "Revenue", value: compact(exec.sales.revenue), icon: "IndianRupee" },
                  { label: "Orders", value: exec.sales.orders, icon: "Package" },
                  { label: "Hot leads", value: exec.customer.hotLeads, icon: "Flame" },
                  { label: "Fraud flags", value: exec.operational.fraudFlags, icon: "ShieldAlert" },
                ].map((s) => (
                  <div key={s.label} style={{ flexShrink: 0, background: T.surface, border: `1px solid ${T.line}`,
                    borderRadius: T.rMd, padding: "10px 14px", minWidth: 104 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name={s.icon} size={14} color={T.blue} />
                      <span style={{ fontSize: 17, fontWeight: 800, color: T.ink, fontFamily: T.display }}>{s.value}</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Ask the advisor */}
            <button onClick={() => push({ kind: "chat", props: { agentId: "commerceAdvisor" } })}
              style={{ width: "100%", padding: "14px 18px", borderRadius: T.rLg, cursor: "pointer",
                background: `linear-gradient(135deg, #4338ca, #3730a3)`, border: "none", fontFamily: T.body,
                textAlign: "left", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,.15)",
                display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Icon name="BrainCircuit" size={22} color="#fff" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Ask the Commerce Advisor</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.75)", marginTop: 2 }}>
                  "What price for my paddy?" · "Which buyers want potato?"
                </div>
              </div>
              <Icon name="ChevronRight" size={18} color="rgba(255,255,255,.7)" />
            </button>

            {/* AI alerts */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>
                  AI Alerts {unread.length > 0 && <span style={{ color: T.red }}>· {unread.length} new</span>}
                </span>
                <button onClick={runScan} disabled={busy}
                  style={{ background: "none", border: "none", cursor: "pointer", color: T.blue, fontSize: 12,
                    display: "flex", alignItems: "center", gap: 4 }}>
                  <Icon name="RefreshCw" size={13} /> Run AI scan
                </button>
              </div>
              {alerts.length === 0 ? (
                <Card pad={13}><span style={{ fontSize: 12.5, color: T.inkFaint }}>No alerts yet — run an AI scan.</span></Card>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {alerts.slice(0, 5).map((a) => (
                    <Card key={a.id} pad={12} onClick={() => { commerceAutomation.markRead(a.id).then(refresh); }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <Icon name={ALERT_ICON[a.kind] || "Bell"} size={17} color={a.read ? T.inkFaint : T.blue} style={{ marginTop: 1 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink }}>{a.title}</div>
                          <div style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 1 }}>{a.body}</div>
                        </div>
                        {!a.read && <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.blue, flexShrink: 0, marginTop: 4 }} />}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* modules */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {MODULES.map((m) => (
                <Card key={m.kind} onClick={() => push({ kind: m.kind })} pad={13}>
                  <IconTile name={m.icon} a={m.a} size={40} iconSize={20} />
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink, marginTop: 9 }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 2 }}>{m.desc}</div>
                </Card>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: T.surface2,
              borderRadius: T.rMd, padding: "10px 12px" }}>
              <Icon name="Info" size={15} color={T.inkSoft} style={{ marginTop: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 11.5, color: T.inkSoft, lineHeight: 1.5 }}>
                Every prediction is a data-reasoned estimate with an explainable basis and confidence — not a live market quote. Real ML models and vector search are planned for the backend phase.
              </span>
            </div>

            <Button variant="soft" full icon="Trash2" onClick={clearDemo}>Clear demo data</Button>
          </>
        )}
      </div>
    </>
  );
}
