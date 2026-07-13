import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../Icon.jsx";

export default function MetricCard({ label, value, unit = "", icon, color, trend, sparkline = [], size = "md" }) {
  const isSmall = size === "sm";
  const trendUp = trend > 0;
  const trendNeutral = trend === 0 || trend == null;

  return (
    <div style={{
      background: T.surface, borderRadius: T.rLg, padding: isSmall ? "12px 14px" : "16px 18px",
      border: `1px solid ${T.line}`, flex: 1, minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: T.inkSoft, fontFamily: T.body }}>{label}</span>
        {icon && <Icon name={icon} size={15} color={color || T.inkFaint} />}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: isSmall ? 20 : 26, fontWeight: 700, color: color || T.ink, fontFamily: T.body, lineHeight: 1 }}>
          {value ?? "—"}
        </span>
        {unit && <span style={{ fontSize: 11, color: T.inkSoft }}>{unit}</span>}
      </div>

      {!trendNeutral && (
        <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 6 }}>
          <Icon name={trendUp ? "TrendingUp" : "TrendingDown"} size={12}
            color={trendUp ? "var(--ag-primary)" : "var(--ag-red)"} />
          <span style={{ fontSize: 11, color: trendUp ? "var(--ag-primary)" : "var(--ag-red)", fontFamily: T.body }}>
            {Math.abs(trend).toFixed(1)}%
          </span>
        </div>
      )}

      {sparkline.length > 1 && (
        <svg width="100%" height="28" viewBox={`0 0 ${sparkline.length - 1} 28`} style={{ marginTop: 6, overflow: "visible" }}
          preserveAspectRatio="none">
          <polyline
            points={sparkline.map((v, i) => {
              const max = Math.max(...sparkline); const min = Math.min(...sparkline);
              const y = max === min ? 14 : 28 - ((v - min) / (max - min)) * 24 - 2;
              return `${i},${y}`;
            }).join(" ")}
            fill="none" stroke={color || "var(--ag-primary)"} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
}
