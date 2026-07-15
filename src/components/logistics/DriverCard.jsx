import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../Icon.jsx";
import { Card } from "../primitives.jsx";
import { Pill } from "../erp/RecordList.jsx";
import RatingStars from "../marketplace/RatingStars.jsx";
import { DRIVER_STATUS } from "../../services/logistics/constantsLog.js";
import { accent } from "../primitives.jsx";

export default function DriverCard({ driver: d, onClick, onDelete }) {
  const meta = DRIVER_STATUS[d.status] || DRIVER_STATUS.available;
  const c = accent(meta.a);
  const verified = d.licenseVerified && d.identityVerified;

  return (
    <Card pad={13} onClick={onClick}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: T.blueSoft,
          display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Icon name="User" size={20} color={T.blue} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: T.ink }}>{d.name}</span>
            {verified && <Icon name="BadgeCheck" size={14} color={T.blue} />}
          </div>
          <div style={{ marginTop: 3 }}>
            <RatingStars value={d.rating || 0} count={d.reviewCount ?? 0} size={11} />
          </div>
          <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 3 }}>
            {d.completedTrips || 0} trips · {d.languages?.join(", ") || "—"}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <Pill fg={c.fg} bg={c.bg}>{meta.label}</Pill>
          {onDelete && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: T.inkFaint, padding: 2 }}>
              <Icon name="Trash2" size={15} />
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
