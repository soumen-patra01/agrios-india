import { useEffect, useState } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar } from "../../components/index.js";
import { useApp } from "../../store/AppStore.jsx";
import MetricCard from "../../components/mlops/MetricCard.jsx";
import DriftGauge from "../../components/mlops/DriftGauge.jsx";
import { inferenceMonitor } from "../../services/mlops/monitoring/inferenceMonitor.js";
import { alertEngine } from "../../services/mlops/monitoring/alertEngine.js";
import { performanceTracker } from "../../services/mlops/monitoring/performanceTracker.js";
import { driftReporter } from "../../services/mlops/drift/driftReporter.js";

function SimpleLineChart({ data = [], color = "var(--ag-primary)", label }) {
  const { tc } = useApp();
  if (data.length < 2) return <div style={{ height: 60, color: T.inkFaint, fontSize: 12, display: "flex", alignItems: "center" }}>{tc({en:"Not enough data",hi:"पर्याप्त डेटा नहीं है",bn:"পর্যাপ্ত ডেটা নেই"})}</div>;
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 300, h = 60;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * (h - 8) - 4}`).join(" ");
  return (
    <div>
      {label && <div style={{ fontSize: 11, color: T.inkSoft, marginBottom: 4 }}>{label}</div>}
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function MonitoringDashboard() {
  const { pop, tc } = useApp();
  const [stats, setStats] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [driftReport, setDriftReport] = useState(null);
  const [latencyHistory, setLatencyHistory] = useState([]);
  const [confidenceHistory, setConfidenceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [thresholds, setThresholds] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [s, k, drift, lat, conf] = await Promise.all([
        inferenceMonitor.getStats(null, 24),
        performanceTracker.getBusinessKPIs(),
        driftReporter.generateReport(),
        inferenceMonitor.getTimeSeries(null, "latencyMs", 60, 24),
        inferenceMonitor.getTimeSeries(null, "confidence", 60, 24),
      ]);
      if (s) {
        const active = alertEngine.check(s);
      }
      setStats(s);
      setKpis(k);
      setDriftReport(drift);
      setLatencyHistory(lat);
      setConfidenceHistory(conf);
      setAlerts(alertEngine.getActive());
      setThresholds(alertEngine.getThresholds());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <>
      <AppBar title={tc({en:"Monitoring Dashboard",hi:"मॉनिटरिंग डैशबोर्ड",bn:"মনিটরিং ড্যাশবোর্ড"})} onBack={pop}
        action={<button onClick={load} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ag-primary)" }}>
          <Icon name="RefreshCw" size={18} /></button>} />

      <div style={{ padding: "12px 16px 32px", animation: "ag-fade .22s var(--ag-ease)" }}>

        {/* Active alerts */}
        {alerts.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            {alerts.map((alert) => (
              <div key={alert.id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                background: alert.severity === "critical" ? "#fee2e2" : "#fef9c3",
                border: `1px solid ${alert.severity === "critical" ? "var(--ag-red)" : "#f59e0b"}`,
                borderRadius: T.rMd, marginBottom: 6,
              }}>
                <Icon name="AlertTriangle" size={16} color={alert.severity === "critical" ? "var(--ag-red)" : "#b45309"} />
                <span style={{ flex: 1, fontSize: 13, color: alert.severity === "critical" ? "#991b1b" : "#92400e" }}>{alert.message}</span>
                <button onClick={() => { alertEngine.dismiss(alert.id); setAlerts(alertEngine.getActive()); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: T.inkFaint, padding: 2 }}>
                  <Icon name="X" size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: T.inkSoft }}>
            <Icon name="RefreshCw" size={24} style={{ animation: "ag-blink 1.2s infinite" }} />
          </div>
        ) : (
          <>
            {/* Inference metrics */}
            <div style={{ fontSize: 12, fontWeight: 600, color: T.inkSoft, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {tc({en:"Inference (24h)",hi:"इनफरेंस (24 घंटे)",bn:"ইনফারেন্স (২৪ ঘণ্টা)"})}
            </div>
            {stats ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                <MetricCard label={tc({en:"Total Requests",hi:"कुल अनुरोध",bn:"মোট রিকোয়েস্ট"})} value={stats.total} icon="Activity" />
                <MetricCard label={tc({en:"Error Rate",hi:"त्रुटि दर",bn:"এরর রেট"})} value={(stats.errorRate * 100).toFixed(1)} unit="%" icon="AlertTriangle"
                  color={stats.errorRate > 0.05 ? "var(--ag-red)" : "var(--ag-primary)"} />
                <MetricCard label={tc({en:"Avg Latency",hi:"औसत लेटेंसी",bn:"গড় লেটেন্সি"})} value={stats.avgLatencyMs} unit="ms" icon="Hourglass"
                  color={stats.avgLatencyMs > 3000 ? "var(--ag-orange)" : "var(--ag-primary)"} />
                <MetricCard label={tc({en:"Avg Confidence",hi:"औसत विश्वसनीयता",bn:"গড় কনফিডেন্স"})} value={(stats.avgConfidence * 100).toFixed(1)} unit="%" icon="Target"
                  color={stats.avgConfidence < 0.55 ? "var(--ag-orange)" : "var(--ag-primary)"} />
              </div>
            ) : (
              <div style={{ padding: "20px 0", color: T.inkSoft, fontSize: 14, textAlign: "center", marginBottom: 16 }}>
                {tc({en:"No inference data yet. Run a diagnosis to populate monitoring.",hi:"अभी तक कोई इनफरेंस डेटा नहीं है। मॉनिटरिंग डेटा दर्ज करने के लिए एक निदान चलाएँ।",bn:"এখনও কোনো ইনফারেন্স ডেটা নেই। মনিটরিং ডেটা তৈরি করতে একটি রোগ নির্ণয় চালান।"})}
              </div>
            )}

            {/* Time series charts */}
            {latencyHistory.length > 0 && (
              <div style={{ background: T.surface, borderRadius: T.rLg, border: `1px solid ${T.line}`,
                padding: "14px 16px", marginBottom: 14 }}>
                <SimpleLineChart data={latencyHistory} color="var(--ag-primary)" label={tc({en:"Inference Latency (ms)",hi:"इनफरेंस लेटेंसी (ms)",bn:"ইনফারেন্স লেটেন্সি (ms)"})} />
              </div>
            )}
            {confidenceHistory.length > 0 && (
              <div style={{ background: T.surface, borderRadius: T.rLg, border: `1px solid ${T.line}`,
                padding: "14px 16px", marginBottom: 14 }}>
                <SimpleLineChart data={confidenceHistory} color="#8b5cf6" label={tc({en:"Avg Confidence",hi:"औसत विश्वसनीयता",bn:"গড় কনফিডেন্স"})} />
              </div>
            )}

            {/* Drift */}
            {driftReport && (
              <div style={{ background: T.surface, borderRadius: T.rLg, border: `1px solid ${T.line}`,
                padding: "14px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 14 }}>
                <DriftGauge severity={driftReport.overallSeverity} size={90} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 4 }}>{tc({en:"Drift Report",hi:"ड्रिफ्ट रिपोर्ट",bn:"ড্রিফট রিপোর্ট"})}</div>
                  {driftReport.recommendations?.slice(0, 2).map((r, i) => (
                    <div key={i} style={{ fontSize: 12, color: T.inkSoft, marginBottom: 2 }}>• {r}</div>
                  ))}
                  <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 4 }}>
                    {driftReport.samples} {tc({en:"samples analyzed",hi:"नमूनों का विश्लेषण किया गया",bn:"নমুনা বিশ্লেষণ করা হয়েছে"})}
                  </div>
                </div>
              </div>
            )}

            {/* Business KPIs */}
            {kpis && (
              <>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.inkSoft, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {tc({en:"Business KPIs",hi:"बिज़नेस KPI",bn:"বিজনেস KPI"})}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                  <MetricCard label={tc({en:"Total Diagnoses",hi:"कुल निदान",bn:"মোট রোগ নির্ণয়"})} value={kpis.totalDiagnoses} icon="Microscope" color="#8b5cf6" />
                  <MetricCard label={tc({en:"Last 7 Days",hi:"पिछले 7 दिन",bn:"গত ৭ দিন"})} value={kpis.diagnosesLast7Days} icon="CalendarDays" color="#0ea5e9" />
                  <MetricCard label={tc({en:"Daily Avg",hi:"दैनिक औसत",bn:"দৈনিক গড়"})} value={kpis.avgDiagnosesPerDay} icon="BarChart2" color="#22c55e" />
                  <MetricCard label={tc({en:"Vision Success",hi:"विज़न सफलता",bn:"ভিশন সাফল্য"})} value={kpis.visionStats?.successRate ? (kpis.visionStats.successRate * 100).toFixed(1) : "—"} unit="%" icon="CheckCircle2" />
                </div>
              </>
            )}

            {/* Thresholds */}
            {thresholds && (
              <div style={{ background: T.surface, borderRadius: T.rLg, border: `1px solid ${T.line}`, padding: "14px 16px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 10 }}>{tc({en:"Alert Thresholds",hi:"अलर्ट थ्रेशोल्ड",bn:"অ্যালার্ট থ্রেশহোল্ড"})}</div>
                {[
                  { label: tc({en:"Max Latency",hi:"अधिकतम लेटेंसी",bn:"সর্বোচ্চ লেটেন্সি"}),      value: thresholds.maxLatencyMs + "ms" },
                  { label: tc({en:"Min Confidence",hi:"न्यूनतम विश्वसनीयता",bn:"সর্বনিম্ন কনফিডেন্স"}),   value: (thresholds.minConfidence * 100).toFixed(0) + "%" },
                  { label: tc({en:"Max Error Rate",hi:"अधिकतम त्रुटि दर",bn:"সর্বোচ্চ এরর রেট"}),   value: (thresholds.maxErrorRate * 100).toFixed(0) + "%" },
                ].map((t) => (
                  <div key={t.label} style={{ display: "flex", justifyContent: "space-between",
                    fontSize: 13, color: T.ink, padding: "4px 0", borderBottom: `1px solid ${T.lineSoft || T.line}` }}>
                    <span style={{ color: T.inkSoft }}>{t.label}</span>
                    <span style={{ fontWeight: 600 }}>{t.value}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
