import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar, Card, Button, EmptyState } from "../../components/index.js";
import { BottomSheet } from "../../components/overlays.jsx";
import { Input, Dropdown } from "../../components/inputs.jsx";
import { useApp } from "../../store/AppStore.jsx";
import StatusPill from "../../components/logistics/StatusPill.jsx";
import CapacityBar from "../../components/logistics/CapacityBar.jsx";
import { contractService, CONTRACT_TEMPLATES } from "../../services/logistics/contractService.js";
import { CONTRACT_STATUS, COMMODITIES, QUALITY_GRADES } from "../../services/logistics/constantsLog.js";
import { rupee, compact } from "../../utils/format.js";

const EMPTY = { title: "", buyerName: "", farmerName: "", commodity: "Paddy", quantityKg: "", pricePerKg: "", qualityGrade: "A / FAQ", deliveryDate: "", templateId: "seasonal" };

export default function ContractsPage() {
  const { pop, toast } = useApp();
  const [list, setList] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [detail, setDetail] = useState(null);
  const [dispute, setDispute] = useState("");
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((n) => n + 1);

  useEffect(() => { contractService.getAll().then(setList); }, [tick]);

  const reloadDetail = async (id) => setDetail(await contractService.getById(id));

  const create = async () => {
    if (!form.title || !form.quantityKg || !form.pricePerKg) { toast("Fill title, quantity and price", "error"); return; }
    await contractService.create(form);
    toast("Contract offered", "success"); setForm(EMPTY); setOpen(false); refresh();
  };

  const toggle = async (i) => { await contractService.toggleMilestone(detail.id, i); await reloadDetail(detail.id); refresh(); };
  const accept = async () => { await contractService.accept(detail.id); await reloadDetail(detail.id); toast("Contract activated", "success"); refresh(); };
  const inspect = async (status) => { await contractService.recordInspection(detail.id, status, ""); await reloadDetail(detail.id); toast(`Inspection ${status}`, "info"); refresh(); };
  const raiseDispute = async () => {
    if (!dispute.trim()) return;
    await contractService.raiseDispute(detail.id, dispute.trim());
    await reloadDetail(detail.id); setDispute(""); toast("Dispute raised", "info"); refresh();
  };

  return (
    <>
      <AppBar title="Contract Farming" onBack={pop}
        action={<Button size="sm" icon="Plus" onClick={() => setOpen(true)}>New</Button>} />
      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 12,
        animation: "ag-fade .25s var(--ag-ease)" }}>

        {list === null ? null : list.length === 0 ? (
          <EmptyState icon="FileSignature" title="No contracts"
            body="Create a digital agreement between a buyer and a farmer with milestones, quality standards and payment terms."
            action="New contract" onAction={() => setOpen(true)} />
        ) : list.map((c) => (
          <Card key={c.id} pad={14} onClick={() => setDetail(c)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{c.title}</div>
                <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>{c.buyerName} ↔ {c.farmerName}</div>
                <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 2 }}>
                  {c.commodity} · {(c.quantityKg / 1000).toLocaleString("en-IN")} t · {rupee(c.value)}
                </div>
              </div>
              <StatusPill status={c.status} map={CONTRACT_STATUS} />
            </div>
            <div style={{ marginTop: 10 }}>
              <CapacityBar used={contractService.progress(c)} total={100} showLabel={false} height={6} />
              <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 4 }}>{contractService.progress(c)}% complete</div>
            </div>
          </Card>
        ))}
      </div>

      {/* detail */}
      <BottomSheet open={!!detail} onClose={() => setDetail(null)} title={detail?.title}>
        {detail && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontSize: 12.5, color: T.inkSoft }}>{detail.buyerName} ↔ {detail.farmerName}</div>
              <StatusPill status={detail.status} map={CONTRACT_STATUS} />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 12, color: T.inkSoft }}>
              <span>{detail.commodity}</span><span>·</span>
              <span>{(detail.quantityKg / 1000).toLocaleString("en-IN")} t</span><span>·</span>
              <span>{rupee(detail.pricePerKg)}/kg</span><span>·</span>
              <span>{detail.qualityGrade}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>Contract value {rupee(detail.value)}</div>

            {detail.inspection && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: detail.inspection.status === "passed" ? T.primarySoft : T.redSoft,
                borderRadius: T.rMd, padding: "8px 12px" }}>
                <Icon name={detail.inspection.status === "passed" ? "CheckCircle2" : "XCircle"} size={16}
                  color={detail.inspection.status === "passed" ? T.primary : T.red} />
                <span style={{ fontSize: 12.5, color: T.ink }}>Inspection {detail.inspection.status}</span>
              </div>
            )}

            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Milestones</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {detail.milestones.map((m, i) => (
                  <button key={i} onClick={() => toggle(i)} disabled={detail.status !== "active"}
                    style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none",
                      cursor: detail.status === "active" ? "pointer" : "default", padding: 0, textAlign: "left" }}>
                    <Icon name={m.done ? "CheckCircle2" : "Circle"} size={20} color={m.done ? T.primary : T.line} />
                    <span style={{ fontSize: 13, color: m.done ? T.inkSoft : T.ink, textDecoration: m.done ? "line-through" : "none" }}>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {detail.disputeNote && (
              <div style={{ background: T.redSoft, borderRadius: T.rMd, padding: "8px 12px", fontSize: 12, color: T.red }}>
                Dispute: {detail.disputeNote}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {detail.status === "offered" && <Button full icon="Check" onClick={accept}>Accept & activate</Button>}
              {detail.status === "active" && !detail.inspection && (
                <div style={{ display: "flex", gap: 8 }}>
                  <Button size="sm" variant="outline" icon="CheckCircle2" onClick={() => inspect("passed")}>Inspection pass</Button>
                  <Button size="sm" variant="outline" icon="XCircle" onClick={() => inspect("failed")}>Fail</Button>
                </div>
              )}
              {["offered", "active"].includes(detail.status) && (
                <div style={{ display: "flex", gap: 8 }}>
                  <Input value={dispute} onChange={(v) => setDispute(v)} placeholder="Raise a dispute…" icon="AlertTriangle" />
                  <Button variant="danger" icon="Send" onClick={raiseDispute}>Dispute</Button>
                </div>
              )}
            </div>
          </div>
        )}
      </BottomSheet>

      {/* create */}
      <BottomSheet open={open} onClose={() => setOpen(false)} title="New Contract">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} icon="FileSignature" />
          <Input label="Buyer" value={form.buyerName} onChange={(v) => setForm({ ...form, buyerName: v })} icon="Building2" />
          <Input label="Farmer / FPO" value={form.farmerName} onChange={(v) => setForm({ ...form, farmerName: v })} icon="Sprout" />
          <Dropdown label="Commodity" value={form.commodity} onChange={(v) => setForm({ ...form, commodity: v })}
            options={COMMODITIES.map((c) => ({ value: c, label: c }))} />
          <Input label="Quantity (kg)" value={form.quantityKg} onChange={(v) => setForm({ ...form, quantityKg: v })} icon="Scale" type="number" />
          <Input label="Price (₹/kg)" value={form.pricePerKg} onChange={(v) => setForm({ ...form, pricePerKg: v })} icon="IndianRupee" type="number" />
          <Dropdown label="Quality Grade" value={form.qualityGrade} onChange={(v) => setForm({ ...form, qualityGrade: v })}
            options={QUALITY_GRADES.map((g) => ({ value: g, label: g }))} />
          <Dropdown label="Template" value={form.templateId} onChange={(v) => setForm({ ...form, templateId: v })}
            options={CONTRACT_TEMPLATES.map((t) => ({ value: t.id, label: t.label }))} />
          <Input label="Delivery Date" value={form.deliveryDate} onChange={(v) => setForm({ ...form, deliveryDate: v })} icon="Calendar" type="date" />
          <Button full icon="Check" onClick={create}>Create contract</Button>
        </div>
      </BottomSheet>
    </>
  );
}
