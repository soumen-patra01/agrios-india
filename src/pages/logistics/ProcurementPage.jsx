import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar, Card, Button, EmptyState } from "../../components/index.js";
import { BottomSheet } from "../../components/overlays.jsx";
import { Input, Dropdown } from "../../components/inputs.jsx";
import { useApp } from "../../store/AppStore.jsx";
import StatusPill from "../../components/logistics/StatusPill.jsx";
import { procurementService } from "../../services/logistics/procurementService.js";
import { PROCUREMENT_TYPES, PROCUREMENT_STATUS, COMMODITIES, procurementMeta } from "../../services/logistics/constantsLog.js";
import { rupee } from "../../utils/format.js";

const EMPTY = { title: "", type: "government", buyerName: "", commodity: "Paddy", quantityKg: "", targetPrice: "" };
const EMPTY_Q = { supplierName: "", price: "", note: "" };

export default function ProcurementPage() {
  const { pop, toast } = useApp();
  const [list, setList] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [detail, setDetail] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [q, setQ] = useState(EMPTY_Q);
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((n) => n + 1);

  useEffect(() => { procurementService.getAll().then(setList); }, [tick]);

  const openDetail = async (p) => { setDetail(p); setQuotes(await procurementService.compare(p.id)); setQ(EMPTY_Q); };
  const reload = async (id) => { setDetail(await procurementService.getById(id)); setQuotes(await procurementService.compare(id)); };

  const create = async () => {
    if (!form.title || !form.quantityKg) { toast("Fill title and quantity", "error"); return; }
    await procurementService.create(form);
    toast("Tender published", "success"); setForm(EMPTY); setOpen(false); refresh();
  };

  const addQuote = async () => {
    if (!q.supplierName || !q.price) { toast("Enter supplier and price", "error"); return; }
    await procurementService.addQuotation(detail.id, q);
    toast("Quotation added", "success"); setQ(EMPTY_Q); await reload(detail.id); refresh();
  };

  const award = async (quotationId) => { await procurementService.award(detail.id, quotationId); toast("Awarded", "success"); await reload(detail.id); refresh(); };

  return (
    <>
      <AppBar title="Procurement" onBack={pop}
        action={<Button size="sm" icon="Plus" onClick={() => setOpen(true)}>New</Button>} />
      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 10,
        animation: "ag-fade .25s var(--ag-ease)" }}>
        {list === null ? null : list.length === 0 ? (
          <EmptyState icon="ClipboardList" title="No tenders"
            body="Publish a procurement tender (government, FPO, cooperative or private), collect quotations, and award to the best supplier."
            action="New tender" onAction={() => setOpen(true)} />
        ) : list.map((p) => {
          const meta = procurementMeta(p.type);
          return (
            <Card key={p.id} pad={14} onClick={() => openDetail(p)}>
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: T.blueSoft, display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <Icon name={meta.icon} size={20} color={T.blue} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>
                    {meta.label} · {(p.quantityKg / 1000).toLocaleString("en-IN")} t {p.commodity}
                  </div>
                  <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 2 }}>{p.quotations?.length || 0} quotations</div>
                </div>
                <StatusPill status={p.status} map={PROCUREMENT_STATUS} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* detail */}
      <BottomSheet open={!!detail} onClose={() => setDetail(null)} title={detail?.title}>
        {detail && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12.5, color: T.inkSoft }}>{detail.buyerName} · target {rupee(detail.targetPrice)}/kg</span>
              <StatusPill status={detail.status} map={PROCUREMENT_STATUS} />
            </div>

            {detail.poNumber && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.primarySoft, borderRadius: T.rMd, padding: "10px 12px" }}>
                <Icon name="BadgeCheck" size={16} color={T.primary} />
                <span style={{ fontSize: 12.5, color: T.ink }}>Awarded to <b>{detail.awardedTo}</b> · {detail.poNumber}</span>
              </div>
            )}

            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Quotations (cheapest first)</div>
              {quotes.length === 0 ? <div style={{ fontSize: 12.5, color: T.inkFaint }}>No quotations yet.</div> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {quotes.map((qt, i) => (
                    <div key={qt.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                      background: i === 0 ? T.primarySoft : T.surface2, borderRadius: T.rMd }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{qt.supplierName}</div>
                        {qt.note && <div style={{ fontSize: 11, color: T.inkSoft }}>{qt.note}</div>}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.primary }}>{rupee(qt.price)}/kg</span>
                      {detail.status !== "awarded" && (
                        <Button size="sm" icon="Check" onClick={() => award(qt.id)}>Award</Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {detail.status !== "awarded" && (
              <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>Add quotation</div>
                <Input label="Supplier" value={q.supplierName} onChange={(v) => setQ({ ...q, supplierName: v })} icon="Building2" />
                <Input label="Price (₹/kg)" value={q.price} onChange={(v) => setQ({ ...q, price: v })} icon="IndianRupee" type="number" />
                <Input label="Note (optional)" value={q.note} onChange={(v) => setQ({ ...q, note: v })} icon="FileText" />
                <Button full icon="Plus" onClick={addQuote}>Submit quotation</Button>
              </div>
            )}
          </div>
        )}
      </BottomSheet>

      {/* create */}
      <BottomSheet open={open} onClose={() => setOpen(false)} title="New Tender">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} icon="ClipboardList" />
          <Dropdown label="Type" value={form.type} onChange={(v) => setForm({ ...form, type: v })}
            options={PROCUREMENT_TYPES.map((t) => ({ value: t.id, label: t.label }))} />
          <Input label="Buyer" value={form.buyerName} onChange={(v) => setForm({ ...form, buyerName: v })} icon="Building2" />
          <Dropdown label="Commodity" value={form.commodity} onChange={(v) => setForm({ ...form, commodity: v })}
            options={COMMODITIES.map((c) => ({ value: c, label: c }))} />
          <Input label="Quantity (kg)" value={form.quantityKg} onChange={(v) => setForm({ ...form, quantityKg: v })} icon="Scale" type="number" />
          <Input label="Target Price (₹/kg)" value={form.targetPrice} onChange={(v) => setForm({ ...form, targetPrice: v })} icon="IndianRupee" type="number" />
          <Button full icon="Check" onClick={create}>Publish tender</Button>
        </div>
      </BottomSheet>
    </>
  );
}
