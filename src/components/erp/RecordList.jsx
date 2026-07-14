import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../Icon.jsx";
import { Card } from "../index.js";

/* Generic record list used by ERP screens: icon tile + title + subtitle +
   optional right slot + delete button. Keeps the 16 ERP pages small. */
export function RecordRow({ icon, iconColor = T.primary, iconBg = T.primarySoft,
  title, subtitle, right, onClick, onDelete, badge }) {
  return (
    <Card pad={13} onClick={onClick}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        {icon && (
          <div style={{ width: 40, height: 40, borderRadius: 10, background: iconBg,
            display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name={icon} size={20} color={iconColor} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.ink, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
            {badge}
          </div>
          {subtitle && <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>{subtitle}</div>}
        </div>
        {right}
        {onDelete && (
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: T.inkFaint, padding: 4, flexShrink: 0 }}>
            <Icon name="Trash2" size={15} />
          </button>
        )}
      </div>
    </Card>
  );
}

export function EmptyHint({ icon, text }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px", color: T.inkFaint }}>
      <Icon name={icon} size={36} color={T.line} />
      <div style={{ marginTop: 12, fontSize: 13 }}>{text}</div>
    </div>
  );
}

/* Small colored pill for statuses. */
export function Pill({ children, fg = T.primary, bg = T.primarySoft }) {
  return (
    <span style={{ background: bg, color: fg, borderRadius: 6, padding: "1px 7px",
      fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
      {children}
    </span>
  );
}
