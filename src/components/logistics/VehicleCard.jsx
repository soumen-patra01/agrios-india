import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../Icon.jsx";
import { Card, accent } from "../primitives.jsx";
import { Pill } from "../erp/RecordList.jsx";
import { vehicleMeta } from "../../services/logistics/constantsLog.js";
import { fleetService } from "../../services/logistics/fleetService.js";

export default function VehicleCard({ vehicle: v, onClick, onDelete }) {
  const meta = vehicleMeta(v.category);
  const c = accent(meta.accent);
  const alerts = fleetService.documentAlerts(v);

  return (
    <Card pad={13} onClick={onClick}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: c.bg,
          display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Icon name={meta.icon} size={20} color={c.fg} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.ink }}>{v.regNumber}</div>
          <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>
            {meta.label} · {(v.capacityKg / 1000).toLocaleString("en-IN")} t
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
            <Pill fg={v.available ? T.primary : T.orange} bg={v.available ? T.primarySoft : T.orangeSoft}>
              {v.status === "on_trip" ? "On Trip" : v.available ? "Available" : "Off Duty"}
            </Pill>
            {alerts.length > 0 && (
              <Pill fg={T.red} bg={T.redSoft}>
                {alerts.some((a) => a.level === "expired") ? "Doc expired" : "Doc due"}
              </Pill>
            )}
          </div>
        </div>
        {onDelete && (
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: T.inkFaint, padding: 4 }}>
            <Icon name="Trash2" size={15} />
          </button>
        )}
      </div>
    </Card>
  );
}
