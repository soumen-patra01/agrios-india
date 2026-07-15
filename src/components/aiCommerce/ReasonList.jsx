import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../Icon.jsx";

/* Explainability panel — renders the reasons behind a prediction/score.
   Accepts reasons as [{ label, contribution }] or [{ label, weight }]. */
export default function ReasonList({ reasons = [], title = "Why" }) {
  if (!reasons.length) return null;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <Icon name="Lightbulb" size={14} color={T.inkSoft} />
        <span style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft }}>{title}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {reasons.map((r, i) => (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12, color: T.ink }}>
              <span style={{ minWidth: 0 }}>{r.label}</span>
              {r.contribution != null && <span style={{ color: T.inkFaint, flexShrink: 0 }}>{r.contribution}%</span>}
            </div>
            {r.contribution != null && (
              <div style={{ height: 4, borderRadius: 4, background: T.surface2, marginTop: 3, overflow: "hidden" }}>
                <div style={{ width: `${r.contribution}%`, height: "100%", background: T.primary, borderRadius: 4 }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
