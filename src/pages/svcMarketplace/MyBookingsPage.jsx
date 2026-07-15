import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar, Card, Chip, EmptyState, Button, IconTile } from "../../components/index.js";
import { BottomSheet, Dialog } from "../../components/overlays.jsx";
import { Input } from "../../components/inputs.jsx";
import { Pill } from "../../components/erp/RecordList.jsx";
import { useApp } from "../../store/AppStore.jsx";
import RatingStars from "../../components/marketplace/RatingStars.jsx";
import TimeSlotPicker from "../../components/svcMarketplace/TimeSlotPicker.jsx";
import { bookingService } from "../../services/svcMarketplace/bookingService.js";
import { availabilityService } from "../../services/svcMarketplace/availabilityService.js";
import { svcReviewService } from "../../services/svcMarketplace/svcReviewService.js";
import { BOOKING_STATUS, categoryMeta } from "../../services/svcMarketplace/constantsSvc.js";
import { rupee } from "../../utils/format.js";
import { accent } from "../../components/primitives.jsx";

const FILTERS = [
  { id: "all",       label: "All" },
  { id: "upcoming",  label: "Upcoming" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

export default function MyBookingsPage() {
  const { pop, push, toast } = useApp();
  const [bookings, setBookings] = useState(null);
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const [reschedule, setReschedule] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState(null);
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [rescheduleStart, setRescheduleStart] = useState(null);
  const [rescheduleEnd, setRescheduleEnd] = useState(null);
  const [reviewSheet, setReviewSheet] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((n) => n + 1);

  useEffect(() => { bookingService.getAll().then(setBookings); }, [tick]);

  const filtered = (bookings || []).filter((b) => {
    if (filter === "upcoming") return ["pending", "confirmed", "in_progress"].includes(b.status);
    if (filter === "completed") return b.status === "completed";
    if (filter === "cancelled") return ["cancelled", "no_show"].includes(b.status);
    return true;
  });

  const handleCancel = async (b) => {
    await bookingService.cancel(b.id);
    toast("Booking cancelled", "info");
    setCancelConfirm(null); setDetail(null); refresh();
  };

  const openReschedule = (b) => {
    setReschedule(b); setRescheduleDate(null); setRescheduleSlots([]);
    setRescheduleStart(null); setRescheduleEnd(null); setDetail(null);
  };

  const pickRescheduleDate = async (d) => {
    setRescheduleDate(d);
    const dateStr = d.toISOString().slice(0, 10);
    const slots = await availabilityService.getAvailableSlots(reschedule.providerId, dateStr);
    setRescheduleSlots(slots);
    setRescheduleStart(null); setRescheduleEnd(null);
  };

  const confirmReschedule = async () => {
    if (!rescheduleDate || !rescheduleStart) { toast("Pick date and time", "error"); return; }
    try {
      await bookingService.reschedule(reschedule.id, rescheduleDate.toISOString().slice(0, 10), rescheduleStart, rescheduleEnd);
      toast("Booking rescheduled", "success");
      setReschedule(null); refresh();
    } catch (e) { toast(e.message, "error"); }
  };

  const submitReview = async () => {
    if (!reviewRating) { toast("Select a rating", "error"); return; }
    await svcReviewService.add({
      serviceId: reviewSheet.serviceId, providerId: reviewSheet.providerId,
      rating: reviewRating, text: reviewText,
    });
    toast("Review submitted", "success");
    setReviewSheet(null); setReviewRating(0); setReviewText(""); refresh();
  };

  const nextDays = [];
  for (let i = 0; i < 14; i++) { const d = new Date(); d.setDate(d.getDate() + i); nextDays.push(d); }

  return (
    <>
      <AppBar title="My Bookings" onBack={pop} />
      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 14,
        animation: "ag-fade .25s var(--ag-ease)" }}>

        <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
          {FILTERS.map((f) => (
            <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</Chip>
          ))}
        </div>

        {bookings === null ? null : filtered.length === 0 ? (
          <EmptyState icon="CalendarClock" title="No bookings"
            body={filter === "all" ? "Browse the Service Marketplace to book your first service." : `No ${filter} bookings.`} />
        ) : (
          filtered.map((b) => {
            const st = BOOKING_STATUS[b.status] || { label: b.status, a: "yellow" };
            return (
              <Card key={b.id} pad={14} onClick={() => setDetail(b)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>{b.serviceName}</div>
                    <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 2 }}>{b.providerName}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, fontSize: 12, color: T.inkSoft }}>
                      <Icon name="Calendar" size={13} /> {b.date}
                      <Icon name="Clock" size={13} style={{ marginLeft: 4 }} /> {b.startTime}–{b.endTime}
                    </div>
                  </div>
                  <Pill label={st.label} a={st.a} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: T.ink, marginTop: 8 }}>{rupee(b.price)}</div>
              </Card>
            );
          })
        )}
      </div>

      {/* detail sheet */}
      <BottomSheet open={!!detail} onClose={() => setDetail(null)} title="Booking Details">
        {detail && (() => {
          const st = BOOKING_STATUS[detail.status] || { label: detail.status, a: "yellow" };
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 4px" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.ink }}>{detail.serviceName}</div>
              <div style={{ fontSize: 13, color: T.inkSoft }}>{detail.providerName}</div>
              <Pill label={st.label} a={st.a} />
              <div style={{ display: "flex", gap: 16, fontSize: 12.5, color: T.inkSoft }}>
                <span><Icon name="Calendar" size={13} /> {detail.date}</span>
                <span><Icon name="Clock" size={13} /> {detail.startTime}–{detail.endTime}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>{rupee(detail.price)}</div>
              {detail.notes && <div style={{ fontSize: 12, color: T.inkSoft }}>Notes: {detail.notes}</div>}
              {detail.location && <div style={{ fontSize: 12, color: T.inkSoft }}>Location: {detail.location}</div>}

              {/* timeline */}
              {detail.timeline?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.ink, marginBottom: 6 }}>Timeline</div>
                  {detail.timeline.map((t, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, fontSize: 11.5, color: T.inkSoft, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, textTransform: "capitalize" }}>{t.status}</span>
                      <span>{new Date(t.at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                {bookingService.canReschedule(detail) && (
                  <Button variant="soft" full icon="CalendarClock" onClick={() => openReschedule(detail)}>Reschedule</Button>
                )}
                {bookingService.canCancel(detail) && (
                  <Button variant="soft" full icon="X" style={{ color: T.red }}
                    onClick={() => setCancelConfirm(detail)}>Cancel</Button>
                )}
                {detail.status === "completed" && (
                  <Button variant="soft" full icon="Star"
                    onClick={() => { setReviewSheet(detail); setDetail(null); }}>Review</Button>
                )}
              </div>
            </div>
          );
        })()}
      </BottomSheet>

      {/* cancel confirm */}
      <Dialog open={!!cancelConfirm} onClose={() => setCancelConfirm(null)}
        title="Cancel Booking?" icon="X" danger
        body={`Cancel ${cancelConfirm?.serviceName} on ${cancelConfirm?.date}?`}
        confirmLabel="Yes, Cancel" onConfirm={() => handleCancel(cancelConfirm)} />

      {/* reschedule sheet */}
      <BottomSheet open={!!reschedule} onClose={() => setReschedule(null)} title="Reschedule Booking">
        {reschedule && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "0 4px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{reschedule.serviceName}</div>
            <div style={{ fontSize: 12, color: T.inkSoft }}>Current: {reschedule.date} at {reschedule.startTime}</div>

            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink }}>New Date</div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
              {nextDays.map((d) => {
                const active = rescheduleDate && d.toDateString() === rescheduleDate.toDateString();
                return (
                  <button key={d.toISOString()} onClick={() => pickRescheduleDate(d)}
                    style={{ padding: "8px 12px", borderRadius: 10, fontSize: 11, fontWeight: 700,
                      border: `1.5px solid ${active ? T.primary : T.line}`,
                      background: active ? T.primarySoft : T.surface, color: active ? T.primary : T.ink,
                      cursor: "pointer", flexShrink: 0, fontFamily: "inherit" }}>
                    {d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" })}
                  </button>
                );
              })}
            </div>

            {rescheduleDate && (
              <>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink }}>New Time</div>
                <TimeSlotPicker slots={rescheduleSlots} selected={rescheduleStart}
                  onSelect={(s, e) => { setRescheduleStart(s); setRescheduleEnd(e); }} />
              </>
            )}

            <Button full icon="CalendarClock" disabled={!rescheduleDate || !rescheduleStart}
              onClick={confirmReschedule}>Confirm Reschedule</Button>
          </div>
        )}
      </BottomSheet>

      {/* review sheet */}
      <BottomSheet open={!!reviewSheet} onClose={() => setReviewSheet(null)} title="Write a Review">
        {reviewSheet && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "0 4px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{reviewSheet.serviceName}</div>
            <RatingStars value={reviewRating} size={24} onChange={setReviewRating} />
            <Input label="Your review (optional)" value={reviewText}
              onChange={(v) => setReviewText(v)} placeholder="How was the service?" />
            <Button full icon="Send" onClick={submitReview}>Submit Review</Button>
          </div>
        )}
      </BottomSheet>
    </>
  );
}
