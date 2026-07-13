import { useEffect, useState } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar, EmptyState } from "../../components/index.js";
import { useApp } from "../../store/AppStore.jsx";
import { experimentTracker } from "../../services/mlops/experiments/experimentTracker.js";
import { mlModelRegistry } from "../../services/mlops/registry/mlModelRegistry.js";

function StatusBadge({ status }) {
  const config = {
    created:   { color: T.inkSoft,           bg: T.lineSoft || "#f3f4f6" },
    running:   { color: "var(--ag-primary)",  bg: "var(--ag-primary-soft)" },
    completed: { color: "#166534",            bg: "#dcfce7" },
    failed:    { color: "var(--ag-red)",      bg: "#fee2e2" },
  };
  const { color, bg } = config[status] || config.created;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color, background: bg,
      borderRadius: 99, padding: "2px 9px" }}>
      {status}
    </span>
  );
}

export default function ExperimentList() {
  const { pop, push } = useApp();
  const [experiments, setExperiments] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modelFilter, setModelFilter] = useState("all");
  const [selected, setSelected] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newExp, setNewExp] = useState({ name: "", description: "" });

  const load = async () => {
    setLoading(true);
    const [exps, mdls] = await Promise.all([
      experimentTracker.getAll(),
      mlModelRegistry.getAll(),
    ]);
    setExperiments(exps);
    setModels(mdls);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = modelFilter === "all" ? experiments : experiments.filter((e) => e.modelId === modelFilter);

  const createExp = async () => {
    if (!newExp.name.trim()) return;
    await experimentTracker.create(newExp);
    setCreating(false);
    setNewExp({ name: "", description: "" });
    load();
  };

  const toggleSelect = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : prev.length < 4 ? [...prev, id] : prev);
  };

  return (
    <>
      <AppBar title="Experiments" onBack={pop}
        action={<button onClick={() => setCreating(true)} style={{ background: "none", border: "none",
          cursor: "pointer", color: "var(--ag-primary)" }}><Icon name="Plus" size={22} /></button>} />

      <div style={{ padding: "12px 16px 32px", animation: "ag-fade .22s var(--ag-ease)" }}>

        {selected.length >= 2 && (
          <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.rMd,
            padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: T.ink }}>{selected.length} selected for comparison</span>
            <button onClick={async () => {
              const result = await experimentTracker.compare(selected);
              push({ kind: "experimentComparison", props: { experiments: result } });
            }} style={{ fontSize: 12, fontWeight: 600, color: "var(--ag-primary)", background: "none",
              border: "1.5px solid var(--ag-primary)", borderRadius: T.rMd, padding: "5px 12px", cursor: "pointer", fontFamily: T.body }}>
              Compare →
            </button>
          </div>
        )}

        {creating && (
          <div style={{ background: T.surface, borderRadius: T.rLg, border: `1px solid ${T.line}`,
            padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 12 }}>New Experiment</div>
            <input value={newExp.name} onChange={(e) => setNewExp({ ...newExp, name: e.target.value })}
              placeholder="Experiment name"
              style={{ width: "100%", padding: "9px 12px", borderRadius: T.rMd, border: `1px solid ${T.line}`,
                background: T.bg, color: T.ink, fontSize: 14, fontFamily: T.body, marginBottom: 8, boxSizing: "border-box" }} />
            <input value={newExp.description} onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
              placeholder="Description (optional)"
              style={{ width: "100%", padding: "9px 12px", borderRadius: T.rMd, border: `1px solid ${T.line}`,
                background: T.bg, color: T.ink, fontSize: 14, fontFamily: T.body, marginBottom: 12, boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={createExp} style={{ flex: 1, padding: "10px", borderRadius: T.rMd, border: "none",
                background: "var(--ag-primary)", color: "#fff", fontWeight: 600, cursor: "pointer", fontFamily: T.body }}>
                Create
              </button>
              <button onClick={() => setCreating(false)} style={{ padding: "10px 16px", borderRadius: T.rMd,
                border: `1px solid ${T.line}`, background: T.surface, color: T.ink, cursor: "pointer", fontFamily: T.body }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Model filter */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 14, scrollbarWidth: "none" }}>
          {[{ id: "all", name: "All Models" }, ...models].map((m) => (
            <button key={m.id} onClick={() => setModelFilter(m.id)} style={{
              flexShrink: 0, padding: "5px 12px", borderRadius: 99, fontSize: 12, cursor: "pointer", fontFamily: T.body,
              border: `1.5px solid ${modelFilter === m.id ? "var(--ag-primary)" : T.line}`,
              background: modelFilter === m.id ? "var(--ag-primary-soft)" : T.surface,
              color: modelFilter === m.id ? "var(--ag-primary)" : T.inkSoft,
              fontWeight: modelFilter === m.id ? 600 : 400,
            }}>
              {m.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: T.inkSoft }}>
            <Icon name="RefreshCw" size={24} style={{ animation: "ag-blink 1.2s infinite" }} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="FlaskConical" title="No experiments"
            body="Create your first experiment to track hyperparameters and metrics." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((exp) => (
              <div key={exp.id} style={{ background: T.surface, borderRadius: T.rLg,
                border: `2px solid ${selected.includes(exp.id) ? "var(--ag-primary)" : T.line}`,
                padding: "14px 16px", cursor: "pointer" }}
                onClick={() => toggleSelect(exp.id)}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{exp.name}</span>
                  <StatusBadge status={exp.status} />
                </div>
                {exp.description && <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 6 }}>{exp.description}</div>}
                <div style={{ display: "flex", gap: 12, fontSize: 11, color: T.inkFaint }}>
                  <span>{Object.keys(exp.params).length} params</span>
                  <span>{Object.keys(exp.hyperparams).length} hyperparams</span>
                  <span style={{ marginLeft: "auto" }}>{new Date(exp.createdAt).toLocaleDateString()}</span>
                </div>
                {selected.includes(exp.id) && (
                  <div style={{ marginTop: 6, fontSize: 11, color: "var(--ag-primary)", fontWeight: 600 }}>
                    ✓ Selected for comparison
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
