import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar, Card, Chip, Button, BottomSheet, Dialog, Input, EmptyState } from "../../components/index.js";
import { useApp } from "../../store/AppStore.jsx";
import { Pill } from "../../components/erp/RecordList.jsx";
import RatingStars from "../../components/marketplace/RatingStars.jsx";
import { accent } from "../../components/primitives.jsx";
import { mpOrderService } from "../../services/marketplace/mpOrderService.js";
import { reviewService } from "../../services/marketplace/reviewService.js";
import { ORDER_STATUS } from "../../services/marketplace/constantsMp.js";
import { rupee } from "../../utils/format.js";

const FILTERS = [
  { id: "all",       label: {en:"All",hi:"सभी",bn:"সব"} },
  { id: "active",    label: {en:"Active",hi:"सक्रिय",bn:"সক্রিয়"} },
  { id: "delivered", label: {en:"Delivered",hi:"डिलीवर हुआ",bn:"ডেলিভারি হয়েছে"} },
  { id: "closed",    label: {en:"Cancelled / Returned",hi:"रद्द / वापस",bn:"বাতিল / ফেরত"} },
];
const ACTIVE = ["pending", "processing", "packed", "shipped"];

export default function MyOrdersPage() {
  const { pop, toast, tc } = useApp();
  const [orders, setOrders] = useState(null);
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState(null);       // order for detail sheet
  const [cancelId, setCancelId] = useState(null);
  const [review, setReview] = useState(null);       // { order, item }
  const [reviewForm, setReviewForm] = useState({ rating: 5, text: "" });
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((n) => n + 1);

  useEffect(() => { mpOrderService.getAll().then(setOrders); }, [tick]);

  if (orders === null) return <><AppBar title={tc({en:"My Orders",hi:"मेरे ऑर्डर",bn:"আমার অর্ডার"})} onBack={pop} /></>;

  const list = orders.filter((o) =>
    filter === "all" ? true :
    filter === "active" ? ACTIVE.includes(o.status) :
    filter === "delivered" ? o.status === "delivered" :
    ["cancelled", "returned", "refundRequested", "refundApproved"].includes(o.status));

  const statusPill = (s) => {
    const meta = ORDER_STATUS[s] || { label: s, a: "primary" };
    const c = accent(meta.a);
    return <Pill fg={c.fg} bg={c.bg}>{meta.label.toUpperCase()}</Pill>;
  };

  const doCancel = async () => {
    await mpOrderService.setStatus(cancelId, "cancelled");
    setCancelId(null); setDetail(null); refresh();
    toast(tc({en:"Order cancelled",hi:"ऑर्डर रद्द किया गया",bn:"অর্ডার বাতিল করা হয়েছে"}), "info");
  };

  const submitReview = async () => {
    await reviewService.add({
      productId: review.item.productId, sellerId: review.order.sellerId,
      rating: reviewForm.rating, text: reviewForm.text,
    });
    setReview(null); setReviewForm({ rating: 5, text: "" });
    toast(tc({en:"Review posted",hi:"समीक्षा पोस्ट की गई",bn:"পর্যালোচনা পোস্ট হয়েছে"}), "success");
  };

  return (
    <>
      <AppBar title={tc({en:"My Orders",hi:"मेरे ऑर्डर",bn:"আমার অর্ডার"})} onBack={pop} />
      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 10,
        animation: "ag-fade .25s var(--ag-ease)" }}>

        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {FILTERS.map((f) => (
            <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>{tc(f.label)}</Chip>
          ))}
        </div>

        {list.length === 0 ? (
          <EmptyState icon="ClipboardList" title={tc({en:"No orders here",hi:"यहाँ कोई ऑर्डर नहीं",bn:"এখানে কোনো অর্ডার নেই"})}
            body={tc({en:"Orders you place in the marketplace will appear in this list.",hi:"बाज़ार में दिए गए आपके ऑर्डर यहाँ दिखाई देंगे।",bn:"বাজারে দেওয়া আপনার অর্ডার এই তালিকায় দেখা যাবে।"})} />
        ) : list.map((o) => (
          <Card key={o.id} pad={13} onClick={() => setDetail(o)}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: T.ink }}>#{o.id.slice(-6).toUpperCase()}</span>
              {statusPill(o.status)}
              <span style={{ marginLeft: "auto", fontSize: 13.5, fontWeight: 800 }}>{rupee(o.total)}</span>
            </div>
            <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 5 }}>
              {o.sellerName || tc({en:"Seller",hi:"विक्रेता",bn:"বিক্রেতা"})} · {o.items.length} {tc({en:o.items.length > 1 ? "items" : "item",hi:"आइटम",bn:"আইটেম"})} · {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </div>
            <div style={{ fontSize: 12, color: T.inkFaint, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {o.items.map((i) => i.name).join(", ")}
            </div>
          </Card>
        ))}
      </div>

      {/* order detail */}
      <BottomSheet open={!!detail} onClose={() => setDetail(null)}
        title={detail ? `${tc({en:"Order",hi:"ऑर्डर",bn:"অর্ডার"})} #${detail.id.slice(-6).toUpperCase()}` : ""}>
        {detail && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {statusPill(detail.status)}
              <span style={{ fontSize: 12, color: T.inkSoft }}>{detail.sellerName}</span>
              <span style={{ marginLeft: "auto", fontWeight: 800 }}>{rupee(detail.total)}</span>
            </div>

            {detail.items.map((i, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, padding: "6px 0", borderBottom: `1px solid ${T.lineSoft}` }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{i.name}</div>
                  <div style={{ fontSize: 11.5, color: T.inkSoft }}>{i.qty} {i.unit} × {rupee(i.unitPrice)}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <b>{rupee(i.lineTotal)}</b>
                  {detail.status === "delivered" && (
                    <Button size="sm" variant="soft" onClick={() => setReview({ order: detail, item: i })}>{tc({en:"Review",hi:"समीक्षा",bn:"পর্যালোচনা"})}</Button>
                  )}
                </div>
              </div>
            ))}

            {/* timeline */}
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>{tc({en:"Timeline",hi:"समयरेखा",bn:"সময়রেখা"})}</div>
              {(detail.timeline || []).map((tl, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "4px 0" }}>
                  <Icon name="CheckCircle2" size={14} color={T.primary} />
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>{(ORDER_STATUS[tl.status] || {}).label || tl.status}</span>
                  <span style={{ marginLeft: "auto", fontSize: 11.5, color: T.inkFaint }}>
                    {new Date(tl.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>

            {mpOrderService.canCancel(detail) && (
              <Button variant="danger" full onClick={() => setCancelId(detail.id)}>{tc({en:"Cancel order",hi:"ऑर्डर रद्द करें",bn:"অর্ডার বাতিল করুন"})}</Button>
            )}
            {mpOrderService.canReturn(detail) && (
              <Button variant="outline" full onClick={async () => {
                await mpOrderService.setStatus(detail.id, "returned");
                setDetail(null); refresh(); toast(tc({en:"Return recorded — stock restored to seller",hi:"वापसी दर्ज की गई — स्टॉक विक्रेता को वापस किया गया",bn:"ফেরত রেকর্ড করা হয়েছে — স্টক বিক্রেতার কাছে ফেরত দেওয়া হয়েছে"}), "info");
              }}>{tc({en:"Return order",hi:"ऑर्डर वापस करें",bn:"অর্ডার ফেরত দিন"})}</Button>
            )}
          </div>
        )}
      </BottomSheet>

      {/* review sheet */}
      <BottomSheet open={!!review} onClose={() => setReview(null)}
        title={review ? `${tc({en:"Review",hi:"समीक्षा",bn:"পর্যালোচনা"})}: ${review.item.name}` : ""}>
        {review && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ textAlign: "center" }}>
              <RatingStars value={reviewForm.rating} size={26}
                onChange={(r) => setReviewForm((f) => ({ ...f, rating: r }))} />
            </div>
            <Input label={tc({en:"Your review (optional)",hi:"आपकी समीक्षा (वैकल्पिक)",bn:"আপনার পর্যালোচনা (ঐচ্ছিক)"})} placeholder={tc({en:"How was the product?",hi:"उत्पाद कैसा था?",bn:"পণ্যটি কেমন ছিল?"})}
              value={reviewForm.text} onChange={(v) => setReviewForm((f) => ({ ...f, text: v }))} />
            <Button full onClick={submitReview}>{tc({en:"Post review",hi:"समीक्षा पोस्ट करें",bn:"পর্যালোচনা পোস্ট করুন"})}</Button>
          </div>
        )}
      </BottomSheet>

      <Dialog open={!!cancelId} onClose={() => setCancelId(null)} danger icon="AlertTriangle"
        title={tc({en:"Cancel this order?",hi:"क्या इस ऑर्डर को रद्द करें?",bn:"এই অর্ডারটি বাতিল করবেন?"})} body={tc({en:"Reserved stock will be released back to the seller.",hi:"आरक्षित स्टॉक विक्रेता को वापस कर दिया जाएगा।",bn:"সংরক্ষিত স্টক বিক্রেতার কাছে ফেরত দেওয়া হবে।"})}
        confirmLabel={tc({en:"Cancel order",hi:"ऑर्डर रद्द करें",bn:"অর্ডার বাতিল করুন"})} cancelLabel={tc({en:"Keep",hi:"रखें",bn:"রাখুন"})} onConfirm={doCancel} />
    </>
  );
}
