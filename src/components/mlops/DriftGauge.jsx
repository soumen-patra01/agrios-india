import { T } from "../../theme/ThemeProvider.jsx";
import { DRIFT_SEVERITY } from "../../services/mlops/drift/driftDetector.js";

const SEV_ORDER = ["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"];
const SEVERITY_ANGLES = { NONE: 5, LOW: 25, MEDIUM: 50, HIGH: 75, CRITICAL: 95 };

function polarToXY(angleDeg, r, cx = 60, cy = 55) {
  const rad = ((angleDeg - 180) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export default function DriftGauge({ severity = "NONE", label = "Drift Level", size = 120 }) {
  const info = DRIFT_SEVERITY[severity] || DRIFT_SEVERITY.NONE;
  const pct = SEVERITY_ANGLES[severity] || 0;
  const angle = pct * 1.8;

  const r = 44, cx = 60, cy = 58;
  const start = polarToXY(0, r, cx, cy);
  const end = polarToXY(angle, r, cx, cy);
  const large = angle > 180 ? 1 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={size} height={size * 0.65} viewBox="0 0 120 78">
        {/* Background arc */}
        <path d={`M ${polarToXY(0, r, cx, cy).x} ${polarToXY(0, r, cx, cy).y} A ${r} ${r} 0 0 1 ${polarToXY(180, r, cx, cy).x} ${polarToXY(180, r, cx, cy).y}`}
          fill="none" stroke={T.line || "#e5e7eb"} strokeWidth="8" strokeLinecap="round" />

        {/* Colored fill arc */}
        {angle > 0 && (
          <path d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`}
            fill="none" stroke={info.color} strokeWidth="8" strokeLinecap="round" />
        )}

        {/* Needle */}
        <line
          x1={cx} y1={cy}
          x2={polarToXY(angle, r - 10, cx, cy).x}
          y2={polarToXY(angle, r - 10, cx, cy).y}
          stroke={info.color} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="4" fill={info.color} />

        {/* Labels */}
        <text x={polarToXY(0, r + 8, cx, cy).x} y={polarToXY(0, r + 8, cx, cy).y}
          textAnchor="start" fontSize="8" fill={T.inkFaint || "#9ca3af"}>None</text>
        <text x={polarToXY(180, r + 8, cx, cy).x} y={polarToXY(180, r + 8, cx, cy).y}
          textAnchor="end" fontSize="8" fill={T.inkFaint || "#9ca3af"}>Crit</text>
      </svg>

      <div style={{ marginTop: 4, textAlign: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: info.color }}>{info.label}</div>
        <div style={{ fontSize: 11, color: T.inkSoft, fontFamily: T.body }}>{label}</div>
      </div>
    </div>
  );
}
