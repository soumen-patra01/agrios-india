import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../Icon.jsx";
import { Card } from "../primitives.jsx";
import StatusPill from "./StatusPill.jsx";
import { SHIPMENT_STATUS } from "../../services/logistics/constantsLog.js";
import { rupee } from "../../utils/format.js";

export default function ShipmentCard({ shipment: s, onClick }) {
  return (
    <Card pad={13} onClick={onClick}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: T.primarySoft,
          display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Icon name="Package" size={20} color={T.primary} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: T.ink }}>{s.commodity}</span>
            <span style={{ fontSize: 11, color: T.inkFaint }}>· {s.ref}</span>
          </div>
          <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2, overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {s.pickup?.name} → {s.drop?.name}
          </div>
          <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 2 }}>
            {(s.quantityKg / 1000).toLocaleString("en-IN")} t · {s.distanceKm} km
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
          <StatusPill status={s.status} map={SHIPMENT_STATUS} />
          <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{rupee(s.price)}</span>
        </div>
      </div>
    </Card>
  );
}
