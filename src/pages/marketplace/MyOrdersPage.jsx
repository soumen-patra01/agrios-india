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
  { id: "all",       label: "All" },
  { id: "active",    label: "Active" },
  { id: "delivered", label: "Delivered" },
  { id: "closed",    label: "Cancelled / Returned" },
];
const ACTIVE = ["pending", "processing", "packed", "shipped"];

export default function MyOrdersPage() {
  const { pop, toast } = useApp();
  const [orders, setOrders] = useState(null);
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState(null);       // order for detail sheet
  const [cancelId, setCancelId] = useState(null);
  const [review, setReview] = useState(null);       // { order, item }
  const [reviewForm, setReviewForm] = useState({ rating: 5, text: "" });
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((n) => n + 1);

  useEffect(() => { mpOrderService.getAll().then(setOrders); }, [tick]);

  if (orders === null) return <><AppBar title="My Orders" onBack={pop} /></>;

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
    toast("Order cancelled", "info");
  };

  const submitReview = async () => {
    await reviewService.add({
      productId: review.item.productId, sellerId: review.order.sellerId,
      rating: reviewForm.rating, text: reviewForm.text,
    });
    setReview(null); setReviewForm({ rating: 5, text: "" });
    toast("Review posted", "success");
  };

  return (
    <>
      <AppBar title="My Orders" onBack={pop} />
      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 10,
        animation: "ag-fade .25s var(--ag-ease)" }}>

        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {FILTERS.map((f) => (
            <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</Chip>
          ))}
        </div>

        {list.length === 0 ? (
          <EmptyState icon="ClipboardList" title="No orders here"
            body="Orders you place in the marketplace will appear in this list." />
        ) : list.map((o) => (
          <Card key={o.id} pad={13} onClick={() => setDetail(o)}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: T.ink }}>#{o.id.slice(-6).toUpperCase()}</span>
              {statusPill(o.status)}
              <span style={{ marginLeft: "auto", fontSize: 13.5, fontWeight: 800 }}>{rupee(o.total)}</span>
            </div>
            <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 5 }}>
              {o.sellerName || "Seller"} · {o.items.length} item{o.items.length > 1 ? "s" : ""} · {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </div>
            <div style={{ fontSize: 12, color: T.inkFaint, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {o.items.map((i) => i.name).join(", ")}
            </div>
          </Card>
        ))}
      </div>

      {/* order detail */}
      <BottomSheet open={!!detail} onClose={() => setDetail(null)}
        title={detail ? `Order #${detail.id.slice(-6).toUpperCase()}` : ""}>
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
                    <Button size="sm" variant="soft" onClick={() => setReview({ order: detail, item: i })}>Review</Button>
                  )}
                </div>
              </div>
            ))}

            {/* timeline */}
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Timeline</div>
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
              <Button variant="danger" full onClick={() => setCancelId(detail.id)}>Cancel order</Button>
            )}
            {mpOrderService.canReturn(detail) && (
              <Button variant="outline" full onClick={async () => {
                await mpOrderService.setStatus(detail.id, "returned");
                setDetail(null); refresh(); toast("Return recorded — stock restored to seller", "info");
              }}>Return order</Button>
            )}
          </div>
        )}
      </BottomSheet>

      {/* review sheet */}
      <BottomSheet open={!!review} onClose={() => setReview(null)}
        title={review ? `Review: ${review.item.name}` : ""}>
        {review && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ textAlign: "center" }}>
              <RatingStars value={reviewForm.rating} size={26}
                onChange={(r) => setReviewForm((f) => ({ ...f, rating: r }))} />
            </div>
            <Input label="Your review (optional)" placeholder="How was the product?"
              value={reviewForm.text} onChange={(v) => setReviewForm((f) => ({ ...f, text: v }))} />
            <Button full onClick={submitReview}>Post review</Button>
          </div>
        )}
      </BottomSheet>

      <Dialog open={!!cancelId} onClose={() => setCancelId(null)} danger icon="AlertTriangle"
        title="Cancel this order?" body="Reserved stock will be released back to the seller."
        confirmLabel="Cancel order" cancelLabel="Keep" onConfirm={doCancel} />
    </>
  );
}
