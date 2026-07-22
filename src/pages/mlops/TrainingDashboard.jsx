import { useEffect, useState, useRef } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar, EmptyState } from "../../components/index.js";
import { useApp } from "../../store/AppStore.jsx";
import PipelineStepBar from "../../components/mlops/PipelineStepBar.jsx";
import ApprovalBanner from "../../components/mlops/ApprovalBanner.jsx";
import { trainingPipeline } from "../../services/mlops/training/trainingPipeline.js";
import { createSimulatedRunner } from "../../services/mlops/training/pipelineRunner.js";
import { mlModelRegistry } from "../../services/mlops/registry/mlModelRegistry.js";
import { datasetRegistry } from "../../services/mlops/datasets/datasetRegistry.js";
import { promotionEngine } from "../../services/mlops/deployment/promotionEngine.js";

export default function TrainingDashboard() {
  const { pop, tc } = useApp();
  const [pipelines, setPipelines] = useState([]);
  const [models, setModels] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", modelId: "", datasetId: "" });
  const runnerRef = useRef(null);

  const reload = () => {
    setPipelines(trainingPipeline.getAll());
    setPendingCount(promotionEngine.getPendingCount());
  };

  useEffect(() => {
    Promise.all([mlModelRegistry.getAll(), datasetRegistry.getAll()])
      .then(([m, d]) => { setModels(m); setDatasets(d); })
      .finally(() => { reload(); setLoading(false); });
  }, []);

  const createPipeline = () => {
    if (!form.name.trim()) return;
    trainingPipeline.create({ name: form.name, modelId: form.modelId, datasetId: form.datasetId });
    setCreating(false);
    setForm({ name: "", modelId: "", datasetId: "" });
    reload();
  };

  const runPipeline = (pipelineId) => {
    const runner = createSimulatedRunner(pipelineId);
    runnerRef.current = runner;
    runner.addEventListener("step_start", () => reload());
    runner.addEventListener("step_complete", () => reload());
    runner.addEventListener("step_error", () => reload());
    runner.addEventListener("pipeline_done", () => reload());
    runner.start().catch(console.error);
  };

  const approvePromotion = async (reqId) => {
    await promotionEngine.approve(reqId);
    reload();
  };

  const promotionQueue = promotionEngine.getQueue({ status: "pending" });

  return (
    <>
      <AppBar title={tc({ en: "Training & Deployment", hi: "प्रशिक्षण और परिनियोजन", bn: "প্রশিক্ষণ ও ডিপ্লয়মেন্ট" })} onBack={pop}
        action={<button onClick={() => setCreating(true)} style={{ background: "none", border: "none",
          cursor: "pointer", color: "var(--ag-primary)" }}><Icon name="Plus" size={22} /></button>} />

      <div style={{ padding: "12px 16px 32px", animation: "ag-fade .22s var(--ag-ease)" }}>

        <ApprovalBanner count={pendingCount} label={tc({ en: "promotion requests pending", hi: "प्रमोशन अनुरोध लंबित हैं", bn: "প্রমোশন অনুরোধ মুলতুবি আছে" })} />

        {/* Promotion queue */}
        {promotionQueue.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.inkSoft, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {tc({ en: "Promotion Queue", hi: "प्रमोशन कतार", bn: "প্রমোশন সারি" })}
            </div>
            {promotionQueue.map((req) => (
              <div key={req.id} style={{ background: "#fef9c3", border: "1px solid #f59e0b",
                borderRadius: T.rMd, padding: "10px 14px", marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#92400e", marginBottom: 4 }}>
                  {req.fromStage} → {req.toStage}
                </div>
                <div style={{ fontSize: 12, color: "#b45309", marginBottom: 8 }}>
                  {tc({ en: "Model", hi: "मॉडल", bn: "মডেল" })}: {req.modelId.slice(0, 20)}… · {tc({ en: "by", hi: "द्वारा", bn: "দ্বারা" })} {req.requestedBy}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { approvePromotion(req.id); }}
                    style={{ flex: 1, padding: "7px", borderRadius: T.rMd, border: "none",
                      background: "var(--ag-primary)", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 12, fontFamily: T.body }}>
                    {tc({ en: "Approve", hi: "स्वीकृत करें", bn: "অনুমোদন করুন" })}
                  </button>
                  <button onClick={() => { promotionEngine.reject(req.id); reload(); }}
                    style={{ flex: 1, padding: "7px", borderRadius: T.rMd, border: `1px solid ${T.line}`,
                      background: T.surface, color: T.ink, cursor: "pointer", fontSize: 12, fontFamily: T.body }}>
                    {tc({ en: "Reject", hi: "अस्वीकार करें", bn: "প্রত্যাখ্যান করুন" })}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create pipeline form */}
        {creating && (
          <div style={{ background: T.surface, borderRadius: T.rLg, border: `1px solid ${T.line}`,
            padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 12 }}>{tc({ en: "New Training Pipeline", hi: "नई प्रशिक्षण पाइपलाइन", bn: "নতুন প্রশিক্ষণ পাইপলাইন" })}</div>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={tc({ en: "Pipeline name", hi: "पाइपलाइन का नाम", bn: "পাইপলাইনের নাম" })}
              style={{ width: "100%", padding: "9px 12px", borderRadius: T.rMd, border: `1px solid ${T.line}`,
                background: T.bg, color: T.ink, fontSize: 14, fontFamily: T.body, marginBottom: 8, boxSizing: "border-box" }} />
            <select value={form.modelId} onChange={(e) => setForm({ ...form, modelId: e.target.value })}
              style={{ width: "100%", padding: "9px 12px", borderRadius: T.rMd, border: `1px solid ${T.line}`,
                background: T.bg, color: T.ink, fontSize: 14, fontFamily: T.body, marginBottom: 8 }}>
              <option value="">{tc({ en: "Select model (optional)", hi: "मॉडल चुनें (वैकल्पिक)", bn: "মডেল নির্বাচন করুন (ঐচ্ছিক)" })}</option>
              {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <select value={form.datasetId} onChange={(e) => setForm({ ...form, datasetId: e.target.value })}
              style={{ width: "100%", padding: "9px 12px", borderRadius: T.rMd, border: `1px solid ${T.line}`,
                background: T.bg, color: T.ink, fontSize: 14, fontFamily: T.body, marginBottom: 12 }}>
              <option value="">{tc({ en: "Select dataset (optional)", hi: "डेटासेट चुनें (वैकल्पिक)", bn: "ডেটাসেট নির্বাচন করুন (ঐচ্ছিক)" })}</option>
              {datasets.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={createPipeline} style={{ flex: 1, padding: "10px", borderRadius: T.rMd, border: "none",
                background: "var(--ag-primary)", color: "#fff", fontWeight: 600, cursor: "pointer", fontFamily: T.body }}>
                {tc({ en: "Create Pipeline", hi: "पाइपलाइन बनाएं", bn: "পাইপলাইন তৈরি করুন" })}
              </button>
              <button onClick={() => setCreating(false)} style={{ padding: "10px 16px", borderRadius: T.rMd,
                border: `1px solid ${T.line}`, background: T.surface, color: T.ink, cursor: "pointer", fontFamily: T.body }}>
                {tc({ en: "Cancel", hi: "रद्द करें", bn: "বাতিল করুন" })}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: T.inkSoft }}>
            <Icon name="RefreshCw" size={24} style={{ animation: "ag-blink 1.2s infinite" }} />
          </div>
        ) : pipelines.length === 0 ? (
          <EmptyState icon="PlayCircle" title={tc({ en: "No pipelines yet", hi: "अभी तक कोई पाइपलाइन नहीं", bn: "এখনও কোনো পাইপলাইন নেই" })}
            body={tc({ en: "Create a training pipeline to orchestrate data prep, training, validation, and packaging.", hi: "डेटा तैयार करने, प्रशिक्षण, सत्यापन और पैकेजिंग को व्यवस्थित करने के लिए एक प्रशिक्षण पाइपलाइन बनाएं।", bn: "ডেটা প্রস্তুতি, প্রশিক্ষণ, যাচাইকরণ ও প্যাকেজিং সমন্বয় করতে একটি প্রশিক্ষণ পাইপলাইন তৈরি করুন।" })} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pipelines.map((p) => (
              <div key={p.id} style={{ background: T.surface, borderRadius: T.rLg,
                border: `1px solid ${T.line}`, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: T.inkFaint }}>{new Date(p.createdAt).toLocaleDateString()} · {p.status}</div>
                  </div>
                  {p.status === "pending" && (
                    <button onClick={() => runPipeline(p.id)}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
                        borderRadius: T.rMd, border: "none", background: "var(--ag-primary)", color: "#fff",
                        fontWeight: 600, cursor: "pointer", fontSize: 12, fontFamily: T.body }}>
                      <Icon name="PlayCircle" size={14} color="#fff" />
                      {tc({ en: "Run", hi: "चलाएं", bn: "চালান" })}
                    </button>
                  )}
                </div>
                <PipelineStepBar steps={p.steps} />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
