import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar, Card, Button, IconTile, Chip, Dropdown } from "../../components/index.js";
import { Dialog } from "../../components/overlays.jsx";
import { Input } from "../../components/inputs.jsx";
import { useApp } from "../../store/AppStore.jsx";
import TimeSlotPicker from "../../components/svcMarketplace/TimeSlotPicker.jsx";
import { svcCatalogService } from "../../services/svcMarketplace/svcCatalogService.js";
import { providerService } from "../../services/svcMarketplace/providerService.js";
import { availabilityService } from "../../services/svcMarketplace/availabilityService.js";
import { bookingService } from "../../services/svcMarketplace/bookingService.js";
import { categoryMeta, BOOKING_TYPES, PAYMENT_METHODS, PRICING_TYPES } from "../../services/svcMarketplace/constantsSvc.js";
import { rupee } from "../../utils/format.js";
import { accent } from "../../components/primitives.jsx";

const nextDays = (n) => {
  const days = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
};

const fmtShort = (d) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });

export default function BookingPage({ serviceId, providerId }) {
  const { pop, push, toast } = useApp();
  const [svc, setSvc] = useState(null);
  const [provider, setProvider] = useState(null);
  const [date, setDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selStart, setSelStart] = useState(null);
  const [selEnd, setSelEnd] = useState(null);
  const [bookingType, setBookingType] = useState("scheduled");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("");
  const [payment, setPayment] = useState("cod");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const days = nextDays(14);

  useEffect(() => {
    svcCatalogService.getById(serviceId).then(setSvc);
    providerService.getById(providerId).then(setProvider);
  }, [serviceId, providerId]);

  useEffect(() => {
    if (!date || !providerId) return;
    const dateStr = date.toISOString().slice(0, 10);
    availabilityService.getAvailableSlots(providerId, dateStr).then(setSlots);
    setSelStart(null); setSelEnd(null);
  }, [date, providerId]);

  const handleBook = async () => {
    if (!date || !selStart) { toast("Pick a date and time slot", "error"); return; }
    setSubmitting(true);
    try {
      await bookingService.create({
        serviceId, serviceName: svc.title, providerId, providerName: provider.name,
        bookingType, date: date.toISOString().slice(0, 10),
        startTime: selStart, endTime: selEnd,
        pricingType: svc.pricingType, price: svc.price,
        notes, location, paymentMethod: payment,
      });
      setSuccess(true);
    } catch (e) {
      toast(e.message || "Booking failed", "error");
    }
    setSubmitting(false);
  };

  if (!svc || !provider) return null;
  const meta = categoryMeta(svc.category);
  const c = accent(meta.accent);
  const pricingLabel = PRICING_TYPES.find((p) => p.id === svc.pricingType)?.label || svc.pricingType;

  return (
    <>
      <AppBar title="Book Service" onBack={pop} />
      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 16,
        animation: "ag-fade .25s var(--ag-ease)" }}>

        {/* service summary */}
        <Card pad={14}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <IconTile name={meta.icon} a={meta.accent} size={42} iconSize={20} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{svc.title}</div>
              <div style={{ fontSize: 11, color: T.inkSoft }}>{provider.name}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginTop: 4 }}>
                {svc.price > 0 ? rupee(svc.price) : "Free"}{" "}
                <span style={{ fontSize: 11, color: T.inkFaint, fontWeight: 500 }}>{pricingLabel}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* booking type */}
        <Dropdown label="Booking Type" value={bookingType}
          onChange={(v) => setBookingType(v)}
          options={BOOKING_TYPES.map((b) => ({ value: b.id, label: b.label }))} />

        {/* date picker */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Select Date</div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {days.map((d) => {
              const active = date && d.toDateString() === date.toDateString();
              return (
                <button key={d.toISOString()} onClick={() => setDate(d)}
                  style={{ padding: "10px 14px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                    border: `1.5px solid ${active ? T.primary : T.line}`,
                    background: active ? T.primarySoft : T.surface, color: active ? T.primary : T.ink,
                    cursor: "pointer", flexShrink: 0, fontFamily: "inherit",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <span>{fmtShort(d)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* time slots */}
        {date && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Select Time</div>
            <TimeSlotPicker slots={slots} selected={selStart}
              onSelect={(start, end) => { setSelStart(start); setSelEnd(end); }} />
          </div>
        )}

        <Input label="Location / Address" value={location} onChange={(v) => setLocation(v)}
          icon="MapPin" placeholder="Your farm or meeting point" />

        <Input label="Notes (optional)" value={notes} onChange={(v) => setNotes(v)}
          icon="FileText" placeholder="Special instructions…" />

        {/* payment */}
        <Dropdown label="Payment Method" value={payment}
          onChange={(v) => setPayment(v)}
          options={PAYMENT_METHODS.map((p) => ({ value: p.id, label: p.label }))} />

        <div style={{ fontSize: 11, color: T.inkFaint, padding: "0 4px", lineHeight: 1.5 }}>
          No money is collected through the app. Payment is settled directly with the service provider.
        </div>

        <Button full icon="CalendarClock" disabled={submitting || !date || !selStart}
          onClick={handleBook}>
          {submitting ? "Booking…" : "Confirm Booking"}
        </Button>
      </div>

      <Dialog open={success} title="Booking Confirmed!" icon="CalendarClock"
        onClose={() => { setSuccess(false); push({ kind: "svcMyBookings" }); pop(); pop(); }}
        body={`Your ${svc.title} with ${provider.name} on ${date ? date.toLocaleDateString("en-IN") : ""} at ${selStart} has been booked.`}
        confirmLabel="View My Bookings"
        onConfirm={() => { setSuccess(false); push({ kind: "svcMyBookings" }); pop(); pop(); }} />
    </>
  );
}
