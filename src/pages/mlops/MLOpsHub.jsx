import { useEffect, useState } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar } from "../../components/index.js";
import { useApp } from "../../store/AppStore.jsx";
import MetricCard from "../../components/mlops/MetricCard.jsx";
import DriftGauge from "../../components/mlops/DriftGauge.jsx";
import ApprovalBanner from "../../components/mlops/ApprovalBanner.jsx";
import { mlAnalytics } from "../../services/mlops/analytics/mlAnalytics.js";
import { auditLog } from "../../services/mlops/governance/auditLog.js";

export default function MLOpsHub() {
  const { pop, push, tc } = useApp();

  const QUICK_ACTIONS = [
    { label: tc({en: "Datasets", hi: "डेटासेट", bn: "ডেটাসেট"}),     icon: "Database",       kind: "datasetBrowser",   color: "var(--ag-primary)" },
    { label: tc({en: "Annotate", hi: "एनोटेट", bn: "অ্যানোটেট"}),     icon: "Crosshair",      kind: "annotationWorkspace", color: "#8b5cf6" },
    { label: tc({en: "Models", hi: "मॉडल", bn: "মডেল"}),       icon: "Layers",         kind: "modelRegistryPage", color: "#0ea5e9" },
    { label: tc({en: "Experiments", hi: "प्रयोग", bn: "পরীক্ষা"}),  icon: "FlaskConical",   kind: "experimentList",   color: "#f59e0b" },
    { label: tc({en: "Training", hi: "प्रशिक्षण", bn: "প্রশিক্ষণ"}),     icon: "PlayCircle",     kind: "trainingDashboard", color: "#22c55e" },
    { label: tc({en: "Monitoring", hi: "निगरानी", bn: "পর্যবেক্ষণ"}),   icon: "Activity",       kind: "monitoringDashboard",color: "#ef4444" },
  ];
  const [data, setData] = useState(null);
  const [recentAudit, setRecentAudit] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      mlAnalytics.getDashboardData(),
      auditLog.getAll({ limit: 5 }),
    ]).then(([d, audit]) => {
      setData(d);
      setRecentAudit(audit);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const pending = (data?.counts?.pendingPromotions || 0) + (data?.counts?.pendingApprovals || 0) + (data?.counts?.pendingAnnotations || 0);

  return (
    <>
      <AppBar title={tc({en: "MLOps Platform", hi: "MLOps प्लेटफ़ॉर्म", bn: "MLOps প্ল্যাটফর্ম"})} onBack={pop} />

      <div style={{ padding: "12px 16px 32px", animation: "ag-fade .22s var(--ag-ease)" }}>

        <ApprovalBanner count={pending} label={tc({en: "items need review", hi: "आइटम समीक्षा चाहिए", bn: "আইটেম পর্যালোচনা প্রয়োজন"})}
          onAction={() => push({ kind: "modelRegistryPage" })} />

        {/* Hero metrics */}
        {!loading && data && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
            <MetricCard label={tc({en: "Datasets", hi: "डेटासेट", bn: "ডেটাসেট"})}    value={data.counts.datasets}    icon="Database"     color="var(--ag-primary)" />
            <MetricCard label={tc({en: "Models", hi: "मॉडल", bn: "মডেল"})}      value={data.counts.models}      icon="Layers"       color="#0ea5e9" />
            <MetricCard label={tc({en: "Experiments", hi: "प्रयोग", bn: "পরীক্ষা"})} value={data.counts.experiments} icon="FlaskConical" color="#f59e0b" />
            <MetricCard label={tc({en: "Diagnoses", hi: "निदान", bn: "রোগনির্ণয়"})}   value={data.businessKPIs?.totalDiagnoses ?? 0} icon="Microscope" color="#8b5cf6" />
          </div>
        )}

        {/* Drift status */}
        {!loading && data && (
          <div style={{ background: T.surface, borderRadius: T.rLg, padding: "14px 16px",
            border: `1px solid ${T.line}`, marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
            <DriftGauge severity={data.driftStatus.severity} label={tc({en: "Model Drift", hi: "मॉडल ड्रिफ्ट", bn: "মডেল ড্রিফট"})} size={100} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 4 }}>{tc({en: "Drift Detection", hi: "ड्रिफ्ट पहचान", bn: "ড্রিফট সনাক্তকরণ"})}</div>
              <div style={{ fontSize: 12, color: T.inkSoft }}>
                {data.driftStatus.detected
                  ? tc({en: "Drift detected — review monitoring dashboard", hi: "ड्रिफ्ट पाया गया — निगरानी डैशबोर्ड देखें", bn: "ড্রিফট সনাক্ত — পর্যবেক্ষণ ড্যাশবোর্ড দেখুন"})
                  : tc({en: "Model behavior is stable", hi: "मॉडल व्यवहार स्थिर है", bn: "মডেল আচরণ স্থিতিশীল"})}
              </div>
              <button onClick={() => push({ kind: "monitoringDashboard" })}
                style={{ marginTop: 8, fontSize: 12, color: "var(--ag-primary)", background: "none",
                  border: "none", cursor: "pointer", padding: 0, fontFamily: T.body }}>
                {tc({en: "View monitoring", hi: "निगरानी देखें", bn: "পর্যবেক্ষণ দেখুন"})} →
              </button>
            </div>
          </div>
        )}

        {/* Quick actions grid */}
        <div style={{ fontSize: 12, fontWeight: 600, color: T.inkSoft, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {tc({en: "Quick Access", hi: "त्वरित पहुँच", bn: "দ্রুত অ্যাক্সেস"})}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 20 }}>
          {QUICK_ACTIONS.map((a) => (
            <button key={a.kind} onClick={() => push({ kind: a.kind })} style={{
              background: T.surface, borderRadius: T.rLg, border: `1px solid ${T.line}`,
              padding: "14px 8px", cursor: "pointer", display: "flex", flexDirection: "column",
              alignItems: "center", gap: 6,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: a.color + "18",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={a.icon} size={18} color={a.color} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: T.ink, fontFamily: T.body }}>{a.label}</span>
            </button>
          ))}
        </div>

        {/* Recent activity */}
        {recentAudit.length > 0 && (
          <>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.inkSoft, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {tc({en: "Recent Activity", hi: "हालिया गतिविधि", bn: "সাম্প্রতিক কার্যকলাপ"})}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {recentAudit.map((entry, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                  background: T.surface, borderRadius: T.rMd, border: `1px solid ${T.line}` }}>
                  <Icon name="GitMerge" size={14} color={T.inkFaint} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.ink }}>{entry.action}</span>
                    <span style={{ fontSize: 11, color: T.inkSoft }}> {tc({en: "on", hi: "पर", bn: "এ"})} {entry.entity} {entry.entityId?.slice(0, 10)}</span>
                  </div>
                  <span style={{ fontSize: 11, color: T.inkFaint, flexShrink: 0 }}>
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "48px 0", color: T.inkSoft }}>
            <Icon name="RefreshCw" size={24} style={{ animation: "ag-blink 1.2s infinite" }} />
          </div>
        )}
      </div>
    </>
  );
}
