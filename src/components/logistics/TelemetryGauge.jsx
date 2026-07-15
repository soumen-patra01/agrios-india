import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../Icon.jsx";
import { kindMeta } from "../../services/logistics/telemetryService.js";

/* Single sensor readout with breach highlighting. */
export default function TelemetryGauge({ kind, reading, breach, band }) {
  const meta = kindMeta(kind);
  const color = breach ? T.red : T.blue;
  const bg = breach ? T.redSoft : T.blueSoft;
  return (
    <div style={{ flex: 1, minWidth: 120, background: bg, borderRadius: T.rMd, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Icon name={meta.icon} size={15} color={color} />
        <span style={{ fontSize: 11.5, color: T.inkSoft }}>{meta.label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: T.display, marginTop: 4 }}>
        {reading ? `${reading.value}${meta.unit}` : "—"}
      </div>
      {band && (
        <div style={{ fontSize: 10.5, color: breach ? T.red : T.inkFaint, marginTop: 2 }}>
          {breach ? "Out of band · " : "Target "}{band.min}–{band.max}{meta.unit}
        </div>
      )}
    </div>
  );
}
