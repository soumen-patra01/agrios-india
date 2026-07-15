import { T } from "../../theme/ThemeProvider.jsx";

/* Circular 0–100 score ring. Green (strong) → orange → red (weak/risky).
   Pass `invert` for risk scores where high = bad. */
export default function ScoreBadge({ score = 0, size = 44, invert = false, label }) {
  const good = invert ? 100 - score : score;
  const color = good >= 66 ? T.primary : good >= 33 ? T.orange : T.red;
  const r = size / 2 - 3;
  const c = 2 * Math.PI * r;
  const off = c * (1 - score / 100);
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.surface2} strokeWidth="3" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center",
          fontSize: size * 0.3, fontWeight: 800, color, fontFamily: T.display }}>
          {Math.round(score)}
        </div>
      </div>
      {label && <span style={{ fontSize: 10, color: T.inkSoft }}>{label}</span>}
    </div>
  );
}
