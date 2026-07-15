import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar, Card, Button, EmptyState } from "../../components/index.js";
import { BottomSheet } from "../../components/overlays.jsx";
import { Input, Dropdown } from "../../components/inputs.jsx";
import { useApp } from "../../store/AppStore.jsx";
import StatusPill from "../../components/logistics/StatusPill.jsx";
import CapacityBar from "../../components/logistics/CapacityBar.jsx";
import { exportService } from "../../services/logistics/exportService.js";
import { EXPORT_STATUS, COMMODITIES } from "../../services/logistics/constantsLog.js";
import { rupee } from "../../utils/format.js";

const EMPTY = { buyerName: "", destinationCountry: "", commodity: "Mango", quantityKg: "", value: "" };

export default function ExportPage() {
  const { pop, toast } = useApp();
  const [list, setList] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [detail, setDetail] = useState(null);
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((n) => n + 1);

  useEffect(() => { exportService.getAll().then(setList); }, [tick]);

  const reload = async (id) => setDetail(await exportService.getById(id));

  const create = async () => {
    if (!form.buyerName || !form.destinationCountry) { toast("Enter buyer and destination", "error"); return; }
    await exportService.create(form);
    toast("Export order created", "success"); setForm(EMPTY); setOpen(false); refresh();
  };

  const toggleDoc = async (name) => { await exportService.toggleDoc(detail.id, name); await reload(detail.id); refresh(); };
  const advance = async (status) => { await exportService.setStatus(detail.id, status); await reload(detail.id); toast("Status updated", "success"); refresh(); };

  return (
    <>
      <AppBar title="Export" onBack={pop}
        action={<Button size="sm" icon="Plus" onClick={() => setOpen(true)}>New</Button>} />
      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 10,
        animation: "ag-fade .25s var(--ag-ease)" }}>
        {list === null ? null : list.length === 0 ? (
          <EmptyState icon="Container" title="No export orders"
            body="Create an export order, complete the document checklist, and track compliance to shipment. Customs & port integration is planned for a later phase."
            action="New export order" onAction={() => setOpen(true)} />
        ) : list.map((o) => {
          const comp = exportService.compliance(o);
          return (
            <Card key={o.id} pad={14} onClick={() => setDetail(o)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{o.commodity} → {o.destinationCountry}</div>
                  <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>{o.buyerName} · {(o.quantityKg / 1000).toLocaleString("en-IN")} t</div>
                  <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 2 }}>${o.value.toLocaleString("en-US")} · via {o.portOfLoading}</div>
                </div>
                <StatusPill status={o.status} map={EXPORT_STATUS} />
              </div>
              <div style={{ marginTop: 10 }}>
                <CapacityBar used={comp.done} total={comp.total} showLabel={false} height={6} />
                <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 4 }}>Docs {comp.done}/{comp.total} · {comp.percent}% ready</div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* detail */}
      <BottomSheet open={!!detail} onClose={() => setDetail(null)} title={detail ? `${detail.commodity} → ${detail.destinationCountry}` : ""}>
        {detail && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12.5, color: T.inkSoft }}>{detail.buyerName} · ${detail.value.toLocaleString("en-US")}</span>
              <StatusPill status={detail.status} map={EXPORT_STATUS} />
            </div>
            {detail.containerNo && (
              <div style={{ fontSize: 12.5, color: T.inkSoft }}>Container <b style={{ color: T.ink }}>{detail.containerNo}</b> · Port {detail.portOfLoading}</div>
            )}

            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Document checklist</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(detail.docs).map(([name, done]) => (
                  <button key={name} onClick={() => toggleDoc(name)}
                    style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}>
                    <Icon name={done ? "CheckCircle2" : "Circle"} size={19} color={done ? T.primary : T.line} />
                    <span style={{ fontSize: 13, color: done ? T.inkSoft : T.ink }}>{name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {detail.status === "documented" && <Button size="sm" variant="outline" icon="ShieldCheck" onClick={() => advance("cleared")}>Mark cleared</Button>}
              {detail.status === "cleared" && <Button size="sm" variant="outline" icon="Container" onClick={() => advance("shipped")}>Mark shipped</Button>}
              {detail.status === "shipped" && <Button size="sm" variant="outline" icon="CheckCircle2" onClick={() => advance("delivered")}>Mark delivered</Button>}
            </div>
          </div>
        )}
      </BottomSheet>

      {/* create */}
      <BottomSheet open={open} onClose={() => setOpen(false)} title="New Export Order">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label="Buyer" value={form.buyerName} onChange={(v) => setForm({ ...form, buyerName: v })} icon="Building2" />
          <Input label="Destination Country" value={form.destinationCountry} onChange={(v) => setForm({ ...form, destinationCountry: v })} icon="MapPin" />
          <Dropdown label="Commodity" value={form.commodity} onChange={(v) => setForm({ ...form, commodity: v })}
            options={COMMODITIES.map((c) => ({ value: c, label: c }))} />
          <Input label="Quantity (kg)" value={form.quantityKg} onChange={(v) => setForm({ ...form, quantityKg: v })} icon="Scale" type="number" />
          <Input label="Order Value (USD)" value={form.value} onChange={(v) => setForm({ ...form, value: v })} icon="IndianRupee" type="number" />
          <Button full icon="Check" onClick={create}>Create order</Button>
        </div>
      </BottomSheet>
    </>
  );
}
