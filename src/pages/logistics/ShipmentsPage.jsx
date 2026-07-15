import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import { AppBar, Chip, Button, EmptyState } from "../../components/index.js";
import { BottomSheet } from "../../components/overlays.jsx";
import { Input, Dropdown } from "../../components/inputs.jsx";
import { useApp } from "../../store/AppStore.jsx";
import ShipmentCard from "../../components/logistics/ShipmentCard.jsx";
import { shipmentService } from "../../services/logistics/shipmentService.js";
import { COMMODITIES, PLACES, PAYMENT_TERMS, placeById } from "../../services/logistics/constantsLog.js";
import { routingService } from "../../services/logistics/routingService.js";
import { rupee } from "../../utils/format.js";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "active", label: "Active" },
  { id: "delivered", label: "Delivered" },
];

const EMPTY = { commodity: "Paddy", quantityKg: "", pickup: "barasat", drop: "kolkata", price: "", paymentTerm: "onDelivery", notes: "" };

export default function ShipmentsPage() {
  const { pop, push, toast } = useApp();
  const [list, setList] = useState(null);
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((n) => n + 1);

  useEffect(() => { shipmentService.getAll().then(setList); }, [tick]);

  const est = routingService.estimate(placeById(form.pickup), placeById(form.drop));

  const create = async () => {
    if (!form.quantityKg || !form.price) { toast("Enter quantity and price", "error"); return; }
    if (form.pickup === form.drop) { toast("Pickup and drop must differ", "error"); return; }
    await shipmentService.create({
      commodity: form.commodity, quantityKg: form.quantityKg,
      pickup: placeById(form.pickup), drop: placeById(form.drop),
      price: form.price, paymentTerm: form.paymentTerm, notes: form.notes,
    });
    toast("Shipment created", "success");
    setForm(EMPTY); setOpen(false); refresh();
  };

  const shown = (list || []).filter((s) => {
    if (filter === "all") return true;
    if (filter === "active") return ["assigned", "picked_up", "in_transit"].includes(s.status);
    if (filter === "delivered") return s.status === "delivered";
    return s.status === filter;
  });

  return (
    <>
      <AppBar title="Shipments" onBack={pop} action={<Button size="sm" icon="Plus" onClick={() => setOpen(true)}>New</Button>} />
      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 14,
        animation: "ag-fade .25s var(--ag-ease)" }}>

        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {FILTERS.map((f) => (
            <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</Chip>
          ))}
        </div>

        {list === null ? null : shown.length === 0 ? (
          <EmptyState icon="Package" title="No shipments"
            body={filter === "all" ? "Create a shipment to move produce to market or a buyer." : "No shipments in this filter."}
            action={filter === "all" ? "New shipment" : undefined} onAction={filter === "all" ? () => setOpen(true) : undefined} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {shown.map((s) => (
              <ShipmentCard key={s.id} shipment={s} onClick={() => push({ kind: "logShipmentDetail", props: { shipmentId: s.id } })} />
            ))}
          </div>
        )}
      </div>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="New Shipment">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Dropdown label="Commodity" value={form.commodity} onChange={(v) => setForm({ ...form, commodity: v })}
            options={COMMODITIES.map((c) => ({ value: c, label: c }))} />
          <Input label="Quantity (kg)" value={form.quantityKg} onChange={(v) => setForm({ ...form, quantityKg: v })} icon="Scale" type="number" />
          <Dropdown label="Pickup" value={form.pickup} onChange={(v) => setForm({ ...form, pickup: v })}
            options={PLACES.map((p) => ({ value: p.id, label: p.name }))} />
          <Dropdown label="Drop" value={form.drop} onChange={(v) => setForm({ ...form, drop: v })}
            options={PLACES.map((p) => ({ value: p.id, label: p.name }))} />
          <div style={{ background: T.surface2, borderRadius: T.rMd, padding: "10px 14px", fontSize: 12, color: T.inkSoft }}>
            Est. distance <b style={{ color: T.ink }}>{est.distanceKm} km</b> · ETA <b style={{ color: T.ink }}>{Math.round(est.etaMinutes / 60 * 10) / 10} h</b> · fuel ~<b style={{ color: T.ink }}>{rupee(est.fuelCost)}</b>
          </div>
          <Input label="Offered Price (₹)" value={form.price} onChange={(v) => setForm({ ...form, price: v })} icon="IndianRupee" type="number" />
          <Dropdown label="Payment Term" value={form.paymentTerm} onChange={(v) => setForm({ ...form, paymentTerm: v })}
            options={PAYMENT_TERMS.map((p) => ({ value: p.id, label: p.label }))} />
          <Input label="Notes (optional)" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} icon="FileText" />
          <div style={{ fontSize: 11, color: T.inkFaint, lineHeight: 1.5 }}>
            No money is collected in-app — payment settles directly with the transporter.
          </div>
          <Button full icon="Check" onClick={create}>Create Shipment</Button>
        </div>
      </BottomSheet>
    </>
  );
}
