/* Dependency-free SVG charts for the weather dashboard. No chart library — keeps
   the bundle light for rural connections. Renders React/SVG elements only. */
import { T } from "../theme/ThemeProvider.jsx";

/* Smooth-ish line chart with an optional area fill. `data` = [{ label, value }]. */
export function LineChart({ data = [], height = 120, color = T.blue, fill = true, unit = "" }) {
  if (data.length < 2) return null;
  const W = 320, H = height, padX = 8, padY = 18;
  const values = data.map((d) => d.value).filter((v) => v != null);
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;

  const x = (i) => padX + (i * (W - padX * 2)) / (data.length - 1);
  const y = (v) => padY + (1 - (v - min) / span) * (H - padY * 2);

  const pts = data.map((d, i) => [x(i), y(d.value)]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${H - padY} L${pts[0][0].toFixed(1)},${H - padY} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" role="img" aria-label="trend chart">
      {fill && <path d={area} fill={color} opacity="0.12" />}
      <path d={line} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <g key={i}>
          {(i === 0 || i === pts.length - 1 || data[i].peak) && (
            <>
              <circle cx={p[0]} cy={p[1]} r="2.6" fill={color} />
              <text x={p[0]} y={p[1] - 6} fontSize="9" fill={T.inkSoft} textAnchor="middle">
                {Math.round(data[i].value)}{unit}
              </text>
            </>
          )}
        </g>
      ))}
    </svg>
  );
}
