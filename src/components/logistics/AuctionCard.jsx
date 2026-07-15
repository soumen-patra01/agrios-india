import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../Icon.jsx";
import { Card } from "../primitives.jsx";
import StatusPill from "./StatusPill.jsx";
import { AUCTION_STATUS } from "../../services/logistics/constantsLog.js";
import { rupee } from "../../utils/format.js";

export default function AuctionCard({ auction: a, onClick }) {
  const reverse = a.type === "reverse";
  return (
    <Card pad={13} onClick={onClick}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: reverse ? T.orangeSoft : T.primarySoft,
          display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Icon name="Gavel" size={20} color={reverse ? T.orange : T.primary} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.ink, overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
          <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>
            {reverse ? "Reverse" : "Forward"} · {a.commodity}
            {a.quantityKg ? ` · ${(a.quantityKg / 1000).toLocaleString("en-IN")} t` : ""}
          </div>
          <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 3 }}>
            {reverse ? "Lowest quote" : "Highest bid"}: <span style={{ color: T.primary, fontWeight: 700 }}>{rupee(a.currentPrice)}</span>
          </div>
        </div>
        <StatusPill status={a.status} map={AUCTION_STATUS} />
      </div>
    </Card>
  );
}
