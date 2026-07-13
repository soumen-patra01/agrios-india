import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../Icon.jsx";

const STATUS_CONFIG = {
  pending:   { icon: "Hourglass",   color: T.inkFaint || "#9ca3af", bg: "transparent" },
  running:   { icon: "PlayCircle",  color: "var(--ag-primary)",     bg: "var(--ag-primary-soft)" },
  completed: { icon: "CheckCircle2",color: "var(--ag-primary)",     bg: "#dcfce7" },
  failed:    { icon: "XCircle",     color: "var(--ag-red)",         bg: "#fee2e2" },
  skipped:   { icon: "ArrowRight",  color: T.inkSoft || "#6b7280",  bg: "transparent" },
};

export default function PipelineStepBar({ steps = [], compact = false }) {
  return (
    <div style={{ display: "flex", flexDirection: compact ? "row" : "column", gap: compact ? 0 : 2 }}>
      {steps.map((step, idx) => {
        const cfg = STATUS_CONFIG[step.status] || STATUS_CONFIG.pending;
        const isLast = idx === steps.length - 1;

        if (compact) {
          return (
            <div key={step.id} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
                width: 24, height: 24, borderRadius: "50%", background: cfg.bg,
                border: `1.5px solid ${cfg.color}`, flexShrink: 0 }}>
                <Icon name={cfg.icon} size={12} color={cfg.color} />
              </div>
              {!isLast && (
                <div style={{ flex: 1, height: 2, background: step.status === "completed" ? "var(--ag-primary)" : T.line }} />
              )}
            </div>
          );
        }

        return (
          <div key={step.id} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
                width: 28, height: 28, borderRadius: "50%", background: cfg.bg,
                border: `1.5px solid ${cfg.color}` }}>
                <Icon name={cfg.icon} size={14} color={cfg.color}
                  style={step.status === "running" ? { animation: "ag-blink 1.2s infinite" } : {}} />
              </div>
              {!isLast && <div style={{ width: 2, flex: 1, minHeight: 16, background: T.line, margin: "3px 0" }} />}
            </div>

            <div style={{ paddingBottom: isLast ? 0 : 12, flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.ink, fontFamily: T.body }}>{step.label}</span>
                {step.startedAt && (
                  <span style={{ fontSize: 11, color: T.inkFaint }}>
                    {step.completedAt
                      ? `${Math.round((new Date(step.completedAt) - new Date(step.startedAt)) / 1000)}s`
                      : "running…"}
                  </span>
                )}
              </div>
              {step.logs?.length > 0 && (
                <div style={{ marginTop: 4, fontSize: 11, color: T.inkSoft, fontFamily: "monospace",
                  background: T.lineSoft || "#f9fafb", borderRadius: 4, padding: "4px 8px",
                  maxHeight: 60, overflow: "auto" }}>
                  {step.logs.slice(-3).map((l, i) => <div key={i}>{l.msg}</div>)}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
