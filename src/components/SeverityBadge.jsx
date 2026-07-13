/* SeverityBadge — compact pill showing severity level with color and icon. */

import Icon from "./Icon.jsx";

export default function SeverityBadge({ severity, size = "md", pulse = false }) {
  if (!severity) return null;

  const { label, color, bg, icon } = severity;
  const isEmergency = severity.level === "Critical";

  const pad  = size === "sm" ? "2px 8px"  : "4px 12px";
  const fs   = size === "sm" ? 11         : 13;
  const ico  = size === "sm" ? 12         : 14;

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: pad, borderRadius: 999, background: bg,
      border: `1px solid ${color}33`,
      animation: (pulse || isEmergency) ? "ag-blink 1.4s infinite" : "none",
    }}>
      <Icon name={icon || "AlertCircle"} size={ico} style={{ color }} />
      <span style={{ fontSize: fs, fontWeight: 700, color }}>{label}</span>
    </span>
  );
}
