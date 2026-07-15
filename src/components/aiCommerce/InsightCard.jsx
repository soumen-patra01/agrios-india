import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../Icon.jsx";
import { Card } from "../primitives.jsx";
import ScoreBadge from "./ScoreBadge.jsx";
import ConfidenceBar from "./ConfidenceBar.jsx";
import ReasonList from "./ReasonList.jsx";

/* Explainable insight container: headline + score ring + confidence + reasons.
   The reusable unit behind most AI-commerce screens. */
export default function InsightCard({ icon, title, subtitle, score, invert, confidence, reasons, children, accent = "blue" }) {
  return (
    <Card pad={15}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {icon && (
          <div style={{ width: 38, height: 38, borderRadius: 10, background: T[`${accent}Soft`] || T.blueSoft,
            display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name={icon} size={19} color={T[accent] || T.blue} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: T.ink }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 1 }}>{subtitle}</div>}
        </div>
        {score != null && <ScoreBadge score={score} invert={invert} />}
      </div>

      {children && <div style={{ marginTop: 12 }}>{children}</div>}

      {confidence && <div style={{ marginTop: 12 }}><ConfidenceBar confidence={confidence} /></div>}
      {reasons?.length > 0 && (
        <div style={{ marginTop: 12, borderTop: `1px solid ${T.line}`, paddingTop: 12 }}>
          <ReasonList reasons={reasons} />
        </div>
      )}
    </Card>
  );
}
