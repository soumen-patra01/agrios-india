import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../Icon.jsx";

const STAGE_STYLES = {
  development: { bg: T.lineSoft || "#f3f4f6", color: "#6b7280", label: "Dev"     },
  testing:     { bg: "#fef9c3",               color: "#92400e", label: "Test"    },
  staging:     { bg: "#fff7ed",               color: "#c2410c", label: "Staging" },
  production:  { bg: "#dcfce7",               color: "#166534", label: "Prod"    },
  archived:    { bg: "#f3f4f6",               color: "#9ca3af", label: "Archived"},
};

export default function ModelVersionBadge({ version, stage, isChampion = false, isChallenger = false, inline = false }) {
  const stageStyle = STAGE_STYLES[stage] || STAGE_STYLES.development;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <span style={{
        fontFamily: "monospace", fontSize: 12, fontWeight: 600,
        background: T.lineSoft || "#f3f4f6", color: T.ink, borderRadius: 4,
        padding: "2px 7px", border: `1px solid ${T.line}`,
      }}>
        v{version}
      </span>

      <span style={{
        fontSize: 11, fontWeight: 600, borderRadius: 99,
        padding: "2px 8px", background: stageStyle.bg, color: stageStyle.color,
        border: `1px solid ${stageStyle.color}22`,
      }}>
        {stageStyle.label}
      </span>

      {isChampion && (
        <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600,
          color: "#b45309", background: "#fef3c7", borderRadius: 99, padding: "2px 8px" }}>
          <Icon name="Crown" size={11} color="#b45309" />
          Champion
        </span>
      )}

      {isChallenger && (
        <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600,
          color: "#6d28d9", background: "#ede9fe", borderRadius: 99, padding: "2px 8px" }}>
          <Icon name="Target" size={11} color="#6d28d9" />
          Challenger
        </span>
      )}
    </div>
  );
}
