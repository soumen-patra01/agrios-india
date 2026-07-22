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
  const { pop, toast, tc } = useApp();
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
    if (!form.title || !form.quantityKg) { toast(tc({en:"Fill title and quantity", hi:"शीर्षक और मात्रा भरें", bn:"শিরোনাম এবং পরিমাণ পূরণ করুন"}), "error"); return; }
    await procurementService.create(form);
    toast(tc({en:"Tender published", hi:"निविदा प्रकाशित", bn:"টেন্ডার প্রকাশিত"}), "success"); setForm(EMPTY); setOpen(false); refresh();
  };

  const addQuote = async () => {
    if (!q.supplierName || !q.price) { toast(tc({en:"Enter supplier and price", hi:"आपूर्तिकर्ता और मूल्य दर्ज करें", bn:"সরবরাহকারী এবং মূল্য লিখুন"}), "error"); return; }
    await procurementService.addQuotation(detail.id, q);
    toast(tc({en:"Quotation added", hi:"कोटेशन जोड़ा गया", bn:"কোটেশন যোগ করা হয়েছে"}), "success"); setQ(EMPTY_Q); await reload(detail.id); refresh();
  };

  const award = async (quotationId) => { await procurementService.award(detail.id, quotationId); toast(tc({en:"Awarded", hi:"आवंटित", bn:"বরাদ্দ করা হয়েছে"}), "success"); await reload(detail.id); refresh(); };

  return (
    <>
      <AppBar title={tc({en:"Procurement", hi:"खरीद", bn:"ক্রয়"})} onBack={pop}
        action={<Button size="sm" icon="Plus" onClick={() => setOpen(true)}>{tc({en:"New", hi:"नया", bn:"নতুন"})}</Button>} />
      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 10,
        animation: "ag-fade .25s var(--ag-ease)" }}>
        {list === null ? null : list.length === 0 ? (
          <EmptyState icon="ClipboardList" title={tc({en:"No tenders", hi:"कोई निविदा नहीं", bn:"কোনো টেন্ডার নেই"})}
            body={tc({en:"Publish a procurement tender (government, FPO, cooperative or private), collect quotations, and award to the best supplier.", hi:"एक खरीद निविदा (सरकारी, एफपीओ, सहकारी या निजी) प्रकाशित करें, कोटेशन एकत्र करें, और सर्वश्रेष्ठ आपूर्तिकर्ता को आवंटित करें।", bn:"একটি ক্রয় টেন্ডার (সরকারি, এফপিও, সমবায় বা ব্যক্তিগত) প্রকাশ করুন, কোটেশন সংগ্রহ করুন এবং সেরা সরবরাহকারীকে বরাদ্দ করুন।"})}
            action={tc({en:"New tender", hi:"नई निविदा", bn:"নতুন টেন্ডার"})} onAction={() => setOpen(true)} />
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
                  <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 2 }}>{p.quotations?.length || 0} {tc({en:"quotations", hi:"कोटेशन", bn:"কোটেশন"})}</div>
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
              <span style={{ fontSize: 12.5, color: T.inkSoft }}>{detail.buyerName} · {tc({en:"target", hi:"लक्ष्य", bn:"লক্ষ্য"})} {rupee(detail.targetPrice)}/kg</span>
              <StatusPill status={detail.status} map={PROCUREMENT_STATUS} />
            </div>

            {detail.poNumber && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.primarySoft, borderRadius: T.rMd, padding: "10px 12px" }}>
                <Icon name="BadgeCheck" size={16} color={T.primary} />
                <span style={{ fontSize: 12.5, color: T.ink }}>{tc({en:"Awarded to", hi:"आवंटित किया गया", bn:"বরাদ্দ করা হয়েছে"})} <b>{detail.awardedTo}</b> · {detail.poNumber}</span>
              </div>
            )}

            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 8 }}>{tc({en:"Quotations (cheapest first)", hi:"कोटेशन (सबसे सस्ता पहले)", bn:"কোটেশন (সবচেয়ে সস্তা প্রথমে)"})}</div>
              {quotes.length === 0 ? <div style={{ fontSize: 12.5, color: T.inkFaint }}>{tc({en:"No quotations yet.", hi:"अभी तक कोई कोटेशन नहीं।", bn:"এখনও কোনো কোটেশন নেই।"})}</div> : (
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
                        <Button size="sm" icon="Check" onClick={() => award(qt.id)}>{tc({en:"Award", hi:"आवंटित करें", bn:"বরাদ্দ করুন"})}</Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {detail.status !== "awarded" && (
              <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{tc({en:"Add quotation", hi:"कोटेशन जोड़ें", bn:"কোটেশন যোগ করুন"})}</div>
                <Input label={tc({en:"Supplier", hi:"आपूर्तिकर्ता", bn:"সরবরাহকারী"})} value={q.supplierName} onChange={(v) => setQ({ ...q, supplierName: v })} icon="Building2" />
                <Input label={tc({en:"Price (₹/kg)", hi:"मूल्य (₹/किग्रा)", bn:"মূল্য (₹/কেজি)"})} value={q.price} onChange={(v) => setQ({ ...q, price: v })} icon="IndianRupee" type="number" />
                <Input label={tc({en:"Note (optional)", hi:"नोट (वैकल्पिक)", bn:"নোট (ঐচ্ছিক)"})} value={q.note} onChange={(v) => setQ({ ...q, note: v })} icon="FileText" />
                <Button full icon="Plus" onClick={addQuote}>{tc({en:"Submit quotation", hi:"कोटेशन जमा करें", bn:"কোটেশন জমা দিন"})}</Button>
              </div>
            )}
          </div>
        )}
      </BottomSheet>

      {/* create */}
      <BottomSheet open={open} onClose={() => setOpen(false)} title={tc({en:"New Tender", hi:"नई निविदा", bn:"নতুন টেন্ডার"})}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label={tc({en:"Title", hi:"शीर्षक", bn:"শিরোনাম"})} value={form.title} onChange={(v) => setForm({ ...form, title: v })} icon="ClipboardList" />
          <Dropdown label={tc({en:"Type", hi:"प्रकार", bn:"ধরন"})} value={form.type} onChange={(v) => setForm({ ...form, type: v })}
            options={PROCUREMENT_TYPES.map((t) => ({ value: t.id, label: t.label }))} />
          <Input label={tc({en:"Buyer", hi:"खरीदार", bn:"ক্রেতা"})} value={form.buyerName} onChange={(v) => setForm({ ...form, buyerName: v })} icon="Building2" />
          <Dropdown label={tc({en:"Commodity", hi:"वस्तु", bn:"পণ্য"})} value={form.commodity} onChange={(v) => setForm({ ...form, commodity: v })}
            options={COMMODITIES.map((c) => ({ value: c, label: c }))} />
          <Input label={tc({en:"Quantity (kg)", hi:"मात्रा (किग्रा)", bn:"পরিমাণ (কেজি)"})} value={form.quantityKg} onChange={(v) => setForm({ ...form, quantityKg: v })} icon="Scale" type="number" />
          <Input label={tc({en:"Target Price (₹/kg)", hi:"लक्ष्य मूल्य (₹/किग्रा)", bn:"লক্ষ্য মূল্য (₹/কেজি)"})} value={form.targetPrice} onChange={(v) => setForm({ ...form, targetPrice: v })} icon="IndianRupee" type="number" />
          <Button full icon="Check" onClick={create}>{tc({en:"Publish tender", hi:"निविदा प्रकाशित करें", bn:"টেন্ডার প্রকাশ করুন"})}</Button>
        </div>
      </BottomSheet>
    </>
  );
}
