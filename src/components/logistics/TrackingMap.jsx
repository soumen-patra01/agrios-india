import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../Icon.jsx";

/* Lightweight schematic map — projects pickup, drop, and the recorded trail
   into an SVG viewbox. No external map tiles (CSP-safe, offline). For a true
   basemap, swap in components/MapView with mapsService URLs later. */
export default function TrackingMap({ pickup, drop, trail = [], height = 180 }) {
  if (!pickup || !drop) return null;

  const pts = [pickup, drop, ...trail].filter((p) => p && p.lat != null);
  const lats = pts.map((p) => p.lat);
  const lons = pts.map((p) => p.lon);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const pad = 0.12;
  const W = 320, H = height;

  const project = (p) => {
    const spanLat = (maxLat - minLat) || 1;
    const spanLon = (maxLon - minLon) || 1;
    const x = ((p.lon - minLon) / spanLon) * (W * (1 - 2 * pad)) + W * pad;
    const y = H - (((p.lat - minLat) / spanLat) * (H * (1 - 2 * pad)) + H * pad);
    return { x, y };
  };

  const a = project(pickup), b = project(drop);
  const last = trail.length ? project(trail[trail.length - 1]) : a;
  const trailPath = [a, ...trail.map(project)].map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");

  return (
    <div style={{ borderRadius: T.rMd, overflow: "hidden", border: `1px solid ${T.line}`, background: T.surface2 }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: "block" }}>
        {/* planned route */}
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={T.line} strokeWidth="2" strokeDasharray="4 4" />
        {/* travelled trail */}
        {trail.length > 0 && <path d={trailPath} fill="none" stroke={T.primary} strokeWidth="3" strokeLinecap="round" />}
        {/* pickup */}
        <circle cx={a.x} cy={a.y} r="6" fill={T.primary} />
        <text x={a.x + 9} y={a.y + 4} fontSize="10" fill={T.inkSoft}>{pickup.name}</text>
        {/* drop */}
        <circle cx={b.x} cy={b.y} r="6" fill={T.orange} />
        <text x={b.x + 9} y={b.y + 4} fontSize="10" fill={T.inkSoft} textAnchor={b.x > W - 60 ? "end" : "start"}>{drop.name}</text>
        {/* vehicle marker */}
        <circle cx={last.x} cy={last.y} r="10" fill={T.blue} opacity="0.18" />
        <circle cx={last.x} cy={last.y} r="4" fill={T.blue} />
      </svg>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", fontSize: 11, color: T.inkSoft }}>
        <Icon name="Navigation" size={12} color={T.blue} />
        {trail.length ? `${trail.length} tracking points` : "Awaiting first ping"}
      </div>
    </div>
  );
}
