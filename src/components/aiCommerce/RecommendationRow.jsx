import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../Icon.jsx";
import { Card, IconTile } from "../primitives.jsx";
import { categoryMeta } from "../../services/marketplace/constantsMp.js";
import { rupee } from "../../utils/format.js";

/* Compact recommended-product row: category icon, name, price, match score and
   the single strongest reason (explainable at a glance). */
export default function RecommendationRow({ product, score, reasons = [], onClick }) {
  const meta = categoryMeta(product.category);
  const topReason = reasons[0]?.label;
  return (
    <Card pad={12} onClick={onClick}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <IconTile name={meta.icon} a={meta.accent} size={40} iconSize={19} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink, overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.ink, marginTop: 1 }}>{rupee(product.price)}
            <span style={{ fontSize: 10.5, color: T.inkFaint, fontWeight: 400 }}> /{product.unit}</span></div>
          {topReason && (
            <div style={{ fontSize: 10.5, color: T.primary, marginTop: 2, display: "flex", alignItems: "center", gap: 3 }}>
              <Icon name="Sparkles" size={10} color={T.primary} /> {topReason}
            </div>
          )}
        </div>
        {score != null && (
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.blue, fontFamily: T.display }}>{Math.round(score)}</div>
            <div style={{ fontSize: 9, color: T.inkFaint }}>match</div>
          </div>
        )}
      </div>
    </Card>
  );
}
