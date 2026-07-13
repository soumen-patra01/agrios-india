import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../Icon.jsx";

export default function ApprovalBanner({ count = 0, onAction, label = "items pending approval" }) {
  if (count === 0) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: "#fef3c7", border: "1px solid #f59e0b", borderRadius: T.rMd,
      padding: "10px 14px", marginBottom: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon name="BellRing" size={16} color="#b45309" />
        <span style={{ fontSize: 13, fontWeight: 600, color: "#92400e", fontFamily: T.body }}>
          {count} {label}
        </span>
      </div>
      {onAction && (
        <button onClick={onAction} style={{
          fontSize: 12, fontWeight: 600, color: "#b45309", background: "none",
          border: "1.5px solid #f59e0b", borderRadius: T.rMd, padding: "4px 12px",
          cursor: "pointer", fontFamily: T.body,
        }}>
          Review
        </button>
      )}
    </div>
  );
}
