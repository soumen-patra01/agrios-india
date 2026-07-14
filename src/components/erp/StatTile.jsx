import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../Icon.jsx";

const FG = { primary: T.primary, blue: T.blue, orange: T.orange, red: T.red, yellow: T.yellow };
const BG = { primary: T.primarySoft, blue: T.blueSoft, orange: T.orangeSoft, red: T.redSoft, yellow: T.yellowSoft };

/* Compact stat pill used across every ERP screen. */
export default function StatTile({ label, value, icon, a = "primary", minWidth = 100 }) {
  return (
    <div style={{ flexShrink: 0, background: BG[a] || T.primarySoft, borderRadius: T.rMd,
      padding: "10px 14px", minWidth }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {icon && <Icon name={icon} size={14} color={FG[a] || T.primary} />}
        <div style={{ fontSize: 18, fontWeight: 700, color: FG[a] || T.primary, fontFamily: T.display }}>
          {value}
        </div>
      </div>
      <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 2 }}>{label}</div>
    </div>
  );
}
