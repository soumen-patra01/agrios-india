import { useEffect, useState } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar } from "../../components/index.js";
import { useApp } from "../../store/AppStore.jsx";
import { datasetRegistry } from "../../services/mlops/datasets/datasetRegistry.js";
import { datasetVersioning } from "../../services/mlops/datasets/datasetVersioning.js";
import { datasetValidator } from "../../services/mlops/datasets/datasetValidator.js";
import { datasetStats } from "../../services/mlops/datasets/datasetStats.js";
import { annotationMetrics } from "../../services/mlops/annotations/annotationMetrics.js";

export default function DatasetDetail({ datasetId }) {
  const { pop, push, tc } = useApp();
  const [dataset, setDataset] = useState(null);
  const [versions, setVersions] = useState([]);
  const [tags, setTags] = useState([]);
  const [stats, setStats] = useState(null);
  const [validation, setValidation] = useState(null);
  const [annMetrics, setAnnMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    if (!datasetId) return;
    Promise.all([
      datasetRegistry.getById(datasetId),
      datasetVersioning.getVersionHistory(datasetId),
      datasetVersioning.getTags(datasetId),
      datasetStats.computeSummary(datasetId),
      datasetValidator.runFullValidation(datasetId),
      annotationMetrics.getDatasetMetrics(datasetId),
    ]).then(([ds, vers, tgs, st, val, ann]) => {
      setDataset(ds); setVersions(vers); setTags(tgs);
      setStats(st); setValidation(val); setAnnMetrics(ann);
    }).finally(() => setLoading(false));
  }, [datasetId]);

  const bumpVersion = async (part) => {
    if (!dataset) return;
    await datasetVersioning.createVersion(datasetId, { bumpPart: part });
    const [ds, vers] = await Promise.all([
      datasetRegistry.getById(datasetId),
      datasetVersioning.getVersionHistory(datasetId),
    ]);
    setDataset(ds); setVersions(vers);
  };

  if (loading) return (
    <>
      <AppBar title={tc({en:"Dataset Detail",hi:"डेटासेट विवरण",bn:"ডেটাসেট বিবরণ"})} onBack={pop} />
      <div style={{ textAlign: "center", padding: "48px 0", color: T.inkSoft }}>
        <Icon name="RefreshCw" size={24} style={{ animation: "ag-blink 1.2s infinite" }} />
      </div>
    </>
  );
  if (!dataset) return (
    <>
      <AppBar title={tc({en:"Dataset Detail",hi:"डेटासेट विवरण",bn:"ডেটাসেট বিবরণ"})} onBack={pop} />
      <div style={{ padding: 24, color: T.inkSoft }}>{tc({en:"Dataset not found.",hi:"डेटासेट नहीं मिला।",bn:"ডেটাসেট পাওয়া যায়নি।"})}</div>
    </>
  );

  const TABS = ["overview", "versions", "annotations", "validation"];

  return (
    <>
      <AppBar title={dataset.name} onBack={pop} />
      <div style={{ padding: "12px 16px 32px", animation: "ag-fade .22s var(--ag-ease)" }}>

        {/* Header card */}
        <div style={{ background: T.surface, borderRadius: T.rLg, border: `1px solid ${T.line}`,
          padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <Icon name="Database" size={20} color="var(--ag-primary)" />
            <span style={{ fontFamily: "monospace", fontSize: 13, color: T.inkSoft }}>v{dataset.version}</span>
            {dataset.qualityScore != null && (
              <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700,
                color: dataset.qualityScore >= 70 ? "var(--ag-primary)" : "var(--ag-orange)" }}>
                {tc({en:"Quality:",hi:"गुणवत्ता:",bn:"গুণমান:"})} {dataset.qualityScore}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: T.inkSoft }}>{dataset.category.replace(/_/g, " ")} · {dataset.license}</div>
          {dataset.description && <div style={{ fontSize: 13, color: T.ink, marginTop: 6 }}>{dataset.description}</div>}

          {/* Stats row */}
          <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
            {[
              { label: tc({en:"Images",hi:"छवियाँ",bn:"ছবি"}), value: dataset.imageCount },
              { label: tc({en:"Annotations",hi:"एनोटेशन",bn:"অ্যানোটেশন"}), value: dataset.annotationCount },
              { label: tc({en:"Coverage",hi:"कवरेज",bn:"কভারেজ"}), value: stats ? stats.coverageRate + "%" : "—" },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.ink }}>{s.value}</div>
                <div style={{ fontSize: 11, color: T.inkFaint }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, borderBottom: `1px solid ${T.line}`, marginBottom: 14 }}>
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "8px 12px", fontSize: 13, cursor: "pointer", background: "none",
              border: "none", fontFamily: T.body, textTransform: "capitalize", fontWeight: tab === t ? 700 : 400,
              color: tab === t ? "var(--ag-primary)" : T.inkSoft,
              borderBottom: tab === t ? "2px solid var(--ag-primary)" : "2px solid transparent",
              marginBottom: -1,
            }}>
              {tc({
                overview: {en:"overview",hi:"अवलोकन",bn:"ওভারভিউ"},
                versions: {en:"versions",hi:"संस्करण",bn:"সংস্করণ"},
                annotations: {en:"annotations",hi:"एनोटेशन",bn:"অ্যানোটেশন"},
                validation: {en:"validation",hi:"सत्यापन",bn:"যাচাইকরণ"},
              }[t])}
            </button>
          ))}
        </div>

        {/* Tab: overview */}
        {tab === "overview" && (
          <div>
            {tags.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                {tags.map((tag) => (
                  <span key={tag.id} style={{ fontSize: 12, background: tag.color + "22", color: tag.color,
                    borderRadius: 99, padding: "3px 10px", border: `1px solid ${tag.color}44` }}>
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              {["patch", "minor", "major"].map((part) => (
                <button key={part} onClick={() => bumpVersion(part)}
                  style={{ flex: 1, padding: "9px", borderRadius: T.rMd, fontSize: 12, cursor: "pointer",
                    border: `1px solid ${T.line}`, background: T.surface, color: T.ink, fontFamily: T.body }}>
                  + {tc({
                    patch: {en:"patch",hi:"पैच",bn:"প্যাচ"},
                    minor: {en:"minor",hi:"माइनर",bn:"মাইনর"},
                    major: {en:"major",hi:"मेजर",bn:"মেজর"},
                  }[part])}
                </button>
              ))}
            </div>
            <button onClick={() => push({ kind: "annotationWorkspace", props: { datasetId } })}
              style={{ width: "100%", marginTop: 8, padding: "11px", borderRadius: T.rMd, border: "none",
                background: "var(--ag-primary)", color: "#fff", fontWeight: 600, cursor: "pointer", fontFamily: T.body }}>
              {tc({en:"Open Annotation Workspace",hi:"एनोटेशन वर्कस्पेस खोलें",bn:"অ্যানোটেশন ওয়ার্কস্পেস খুলুন"})}
            </button>
          </div>
        )}

        {/* Tab: versions */}
        {tab === "versions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {versions.length === 0 ? (
              <div style={{ color: T.inkSoft, fontSize: 14, textAlign: "center", padding: 24 }}>{tc({en:"No version history yet.",hi:"अभी तक कोई संस्करण इतिहास नहीं है।",bn:"এখনও কোনো সংস্করণ ইতিহাস নেই।"})}</div>
            ) : versions.map((v) => (
              <div key={v.id} style={{ background: T.surface, borderRadius: T.rMd, border: `1px solid ${T.line}`, padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: T.ink }}>v{v.version}</span>
                  <span style={{ fontSize: 11, color: T.inkFaint }}>{new Date(v.createdAt).toLocaleDateString()}</span>
                </div>
                {v.notes && <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 4 }}>{v.notes}</div>}
                <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 2 }}>
                  {v.imageCount} {tc({en:"images",hi:"छवियाँ",bn:"ছবি"})} · {v.annotationCount} {tc({en:"annotations",hi:"एनोटेशन",bn:"অ্যানোটেশন"})}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: annotations */}
        {tab === "annotations" && annMetrics && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              {[
                { label: tc({en:"Total",hi:"कुल",bn:"মোট"}), value: annMetrics.total },
                { label: tc({en:"Approved",hi:"स्वीकृत",bn:"অনুমোদিত"}), value: annMetrics.byStatus?.approved || 0 },
                { label: tc({en:"Pending",hi:"लंबित",bn:"মুলতুবি"}), value: annMetrics.pendingReviews },
                { label: tc({en:"Approval %",hi:"स्वीकृति %",bn:"অনুমোদন %"}), value: Math.round(annMetrics.approvalRate * 100) + "%" },
              ].map((m) => (
                <div key={m.label} style={{ background: T.surface, borderRadius: T.rMd, border: `1px solid ${T.line}`,
                  padding: "12px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: T.ink }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: T.inkFaint }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: validation */}
        {tab === "validation" && validation && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <Icon name={validation.valid ? "CheckCircle2" : "AlertTriangle"} size={20}
                color={validation.valid ? "var(--ag-primary)" : "var(--ag-orange)"} />
              <span style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>
                {validation.valid
                  ? tc({en:"Validation Passed",hi:"सत्यापन सफल",bn:"যাচাইকরণ সফল"})
                  : tc({en:"Issues Found",hi:"समस्याएँ मिलीं",bn:"সমস্যা পাওয়া গেছে"})}
              </span>
              <span style={{ marginLeft: "auto", fontSize: 14, fontWeight: 700, color: "var(--ag-primary)" }}>
                {tc({en:"Score:",hi:"स्कोर:",bn:"স্কোর:"})} {validation.qualityScore}/100
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {validation.qualityChecks?.map((c) => (
                <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                  background: T.surface, borderRadius: T.rMd, border: `1px solid ${T.line}` }}>
                  <Icon name={c.pass ? "CheckCircle2" : "XCircle"} size={16}
                    color={c.pass ? "var(--ag-primary)" : T.inkFaint} />
                  <span style={{ fontSize: 13, color: c.pass ? T.ink : T.inkSoft }}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
