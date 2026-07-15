import { T } from "../../theme/ThemeProvider.jsx";

/* kg → tonnes, at most one decimal, grouped. */
export const tonnes = (kg) =>
  (Math.round((kg || 0) / 100) / 10).toLocaleString("en-IN", { maximumFractionDigits: 1 });

/* Horizontal capacity/utilisation bar. */
export default function CapacityBar({ used, total, height = 8, showLabel = true }) {
  const pct = total ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const color = pct >= 90 ? T.red : pct >= 70 ? T.orange : T.primary;
  return (
    <div>
      <div style={{ height, borderRadius: height, background: T.surface2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: height,
          transition: "width .3s var(--ag-ease)" }} />
      </div>
      {showLabel && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: 11, color: T.inkSoft }}>
            {tonnes(used)} / {tonnes(total)} t
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color }}>{pct}%</span>
        </div>
      )}
    </div>
  );
}
