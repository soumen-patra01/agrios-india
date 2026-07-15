import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar, Card, Chip, Button, EmptyState, IconTile, Dropdown } from "../../components/index.js";
import { BottomSheet, Dialog } from "../../components/overlays.jsx";
import { Input } from "../../components/inputs.jsx";
import { useApp } from "../../store/AppStore.jsx";
import StatTile from "../../components/erp/StatTile.jsx";
import { RecordRow, EmptyHint, Pill } from "../../components/erp/RecordList.jsx";
import RatingStars from "../../components/marketplace/RatingStars.jsx";
import { providerService } from "../../services/svcMarketplace/providerService.js";
import { svcCatalogService } from "../../services/svcMarketplace/svcCatalogService.js";
import { bookingService } from "../../services/svcMarketplace/bookingService.js";
import { availabilityService } from "../../services/svcMarketplace/availabilityService.js";
import { svcReviewService } from "../../services/svcMarketplace/svcReviewService.js";
import { SERVICE_CATEGORIES, PROVIDER_TYPES, PRICING_TYPES, BOOKING_STATUS, LANGUAGES, categoryMeta } from "../../services/svcMarketplace/constantsSvc.js";
import { rupee, compact } from "../../utils/format.js";
import { accent } from "../../components/primitives.jsx";

const EMPTY_SVC = { title: "", category: "vet", pricingType: "fixed", price: "", duration: "", description: "" };

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function ProviderDashboard() {
  const { pop, toast } = useApp();
  const [provider, setProvider] = useState(undefined);
  const [tab, setTab] = useState("services");
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [summary, setSummary] = useState({ total: 0, active: 0, completed: 0, earnings: 0 });
  const [reviews, setReviews] = useState([]);
  const [avail, setAvail] = useState([]);
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((n) => n + 1);

  const [regOpen, setRegOpen] = useState(false);
  const [reg, setReg] = useState({ name: "", type: "individual", tagline: "", village: "", district: "", phone: "" });
  const [regLangs, setRegLangs] = useState(["Bengali"]);
  const [regSpecs, setRegSpecs] = useState(["vet"]);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_SVC);
  const [editId, setEditId] = useState(null);
  const [delId, setDelId] = useState(null);

  const [availDay, setAvailDay] = useState(null);
  const [availSlots, setAvailSlots] = useState([]);

  useEffect(() => {
    providerService.getMine().then((p) => {
      setProvider(p || null);
      if (!p) return;
      svcCatalogService.byProvider(p.id).then(setServices);
      bookingService.byProvider(p.id).then(setBookings);
      bookingService.providerSummary(p.id).then(setSummary);
      svcReviewService.forProvider(p.id).then(setReviews);
      availabilityService.getForProvider(p.id).then(setAvail);
    });
  }, [tick]);

  const handleRegister = async () => {
    if (!reg.name) { toast("Enter your name", "error"); return; }
    await providerService.register({ ...reg, specializations: regSpecs, languages: regLangs });
    toast("Provider profile created!", "success");
    refresh();
  };

  const handleSaveSvc = async () => {
    if (!form.title || !form.price) { toast("Fill title and price", "error"); return; }
    if (editId) {
      await svcCatalogService.update(editId, form);
      toast("Service updated", "success");
    } else {
      await svcCatalogService.add({ ...form, providerId: provider.id, providerName: provider.name, status: "draft" });
      toast("Service added as draft", "success");
    }
    setFormOpen(false); setForm(EMPTY_SVC); setEditId(null); refresh();
  };

  const togglePublish = async (svc) => {
    const next = svc.status === "published" ? "draft" : "published";
    await svcCatalogService.setStatus(svc.id, next);
    toast(next === "published" ? "Service live!" : "Unpublished", "info");
    refresh();
  };

  const handleDelete = async () => {
    await svcCatalogService.remove(delId);
    setDelId(null); toast("Service deleted", "info"); refresh();
  };

  const advanceBooking = async (b) => {
    const next = bookingService.nextStatus(b.status);
    if (!next) return;
    await bookingService.setStatus(b.id, next);
    toast(`Booking → ${next}`, "success");
    refresh();
  };

  const openAvailEdit = (dayIdx) => {
    const existing = avail.find((a) => a.dayOfWeek === dayIdx);
    setAvailDay(dayIdx);
    setAvailSlots(existing?.slots?.map((s) => `${s.start}-${s.end}`) || []);
  };

  const addSlot = () => {
    setAvailSlots([...availSlots, "09:00-10:00"]);
  };

  const saveAvail = async () => {
    const slots = availSlots.filter(Boolean).map((s) => {
      const [start, end] = s.split("-");
      return { start: start.trim(), end: end.trim() };
    });
    await availabilityService.setForDay(provider.id, availDay, slots, 15);
    toast(`${DAYS[availDay]} availability saved`, "success");
    setAvailDay(null); refresh();
  };

  /* ---------- loading ---------- */
  if (provider === undefined) return <><AppBar title="Provide Services" onBack={pop} /></>;

  /* ---------- onboarding ---------- */
  if (provider === null) {
    return (
      <>
        <AppBar title="Provide Services" onBack={pop} />
        <div style={{ padding: "12px 16px 32px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: `linear-gradient(135deg, ${T.blue}, ${T.primary})`,
            borderRadius: 16, padding: 20, color: "#fff", textAlign: "center" }}>
            <Icon name="Handshake" size={40} color="#fff" />
            <div style={{ fontFamily: T.display, fontSize: 19, fontWeight: 800, marginTop: 10 }}>Become a Service Provider</div>
            <div style={{ fontSize: 12.5, opacity: .88, marginTop: 6, lineHeight: 1.5 }}>
              Offer veterinary, agronomist, drone, machinery, and other services to farmers nearby.
            </div>
          </div>

          {[
            { icon: "Stethoscope", title: "List your services", desc: "Set pricing, availability, and service details" },
            { icon: "CalendarClock", title: "Manage bookings", desc: "Accept, track, and complete service requests" },
            { icon: "Star", title: "Build reputation", desc: "Earn verified reviews from satisfied farmers" },
          ].map((f) => (
            <Card key={f.title} pad={14}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <IconTile name={f.icon} a="blue" size={38} iconSize={18} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{f.title}</div>
                  <div style={{ fontSize: 11.5, color: T.inkSoft }}>{f.desc}</div>
                </div>
              </div>
            </Card>
          ))}

          <Button full icon="Handshake" onClick={() => setRegOpen(true)}>Create Provider Profile</Button>
        </div>

        <BottomSheet open={regOpen} onClose={() => setRegOpen(false)} title="Provider Registration">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input label="Name / Business Name" value={reg.name} onChange={(v) => setReg({ ...reg, name: v })} icon="User" />
            <Dropdown label="Provider Type" value={reg.type} onChange={(v) => setReg({ ...reg, type: v })}
              options={PROVIDER_TYPES.map((t) => ({ value: t.id, label: t.label }))} />
            <Input label="Tagline" value={reg.tagline} onChange={(v) => setReg({ ...reg, tagline: v })} icon="FileText" placeholder="Short description…" />
            <Input label="Village" value={reg.village} onChange={(v) => setReg({ ...reg, village: v })} icon="MapPin" />
            <Input label="District" value={reg.district} onChange={(v) => setReg({ ...reg, district: v })} icon="Map" />
            <Input label="Phone" value={reg.phone} onChange={(v) => setReg({ ...reg, phone: v })} icon="Phone" />

            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink, marginBottom: 6 }}>Specializations</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {SERVICE_CATEGORIES.map((c) => (
                  <Chip key={c.id} active={regSpecs.includes(c.id)} icon={c.icon}
                    onClick={() => setRegSpecs(regSpecs.includes(c.id) ? regSpecs.filter((s) => s !== c.id) : [...regSpecs, c.id])}>
                    {c.label}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink, marginBottom: 6 }}>Languages</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {LANGUAGES.map((l) => (
                  <Chip key={l} active={regLangs.includes(l)}
                    onClick={() => setRegLangs(regLangs.includes(l) ? regLangs.filter((x) => x !== l) : [...regLangs, l])}>
                    {l}
                  </Chip>
                ))}
              </div>
            </div>

            <Button full icon="Check" onClick={handleRegister}>Register</Button>
          </div>
        </BottomSheet>
      </>
    );
  }

  /* ---------- dashboard ---------- */
  return (
    <>
      <AppBar title="Provider Dashboard" onBack={pop} />
      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 14,
        animation: "ag-fade .25s var(--ag-ease)" }}>

        {/* stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <StatTile label="Total Bookings" value={summary.total} a="blue" />
          <StatTile label="Active" value={summary.active} a="orange" />
          <StatTile label="Completed" value={summary.completed} a="primary" />
          <StatTile label="Earnings" value={rupee(summary.earnings)} a="primary" />
        </div>

        {/* tabs */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
          {["services", "bookings", "availability", "reviews"].map((t) => (
            <Chip key={t} active={tab === t} onClick={() => setTab(t)}>
              {t === "services" ? "My Services" : t === "bookings" ? "Bookings" : t === "availability" ? "Availability" : "Reviews"}
            </Chip>
          ))}
        </div>

        {/* -------- services tab -------- */}
        {tab === "services" && (
          <>
            <Button variant="soft" full icon="Plus" onClick={() => { setForm(EMPTY_SVC); setEditId(null); setFormOpen(true); }}>
              Add Service
            </Button>
            {services.length === 0 ? (
              <EmptyHint icon="Handshake" text="No services yet — add your first listing." />
            ) : services.map((svc) => {
              const meta = categoryMeta(svc.category);
              const st = svc.status === "published" ? { label: "Live", a: "primary" } : { label: "Draft", a: "yellow" };
              return (
                <RecordRow key={svc.id} icon={meta.icon} accent={meta.accent}
                  title={svc.title} subtitle={`${rupee(svc.price)} · ${PRICING_TYPES.find((p) => p.id === svc.pricingType)?.label || svc.pricingType}`}
                  trailing={<Pill label={st.label} a={st.a} />}
                  onClick={() => { setForm({ title: svc.title, category: svc.category, pricingType: svc.pricingType, price: svc.price, duration: svc.duration || "", description: svc.description || "" }); setEditId(svc.id); setFormOpen(true); }}
                  actions={[
                    { label: svc.status === "published" ? "Unpublish" : "Publish", onClick: () => togglePublish(svc) },
                    { label: "Delete", danger: true, onClick: () => setDelId(svc.id) },
                  ]} />
              );
            })}
          </>
        )}

        {/* -------- bookings tab -------- */}
        {tab === "bookings" && (
          bookings.length === 0 ? (
            <EmptyHint icon="CalendarClock" text="No incoming bookings yet." />
          ) : bookings.map((b) => {
            const st = BOOKING_STATUS[b.status] || { label: b.status, a: "yellow" };
            const next = bookingService.nextStatus(b.status);
            return (
              <Card key={b.id} pad={14}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{b.serviceName}</div>
                    <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 2 }}>
                      {b.date} · {b.startTime}–{b.endTime}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.ink, marginTop: 4 }}>{rupee(b.price)}</div>
                  </div>
                  <Pill label={st.label} a={st.a} />
                </div>
                {b.notes && <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 6 }}>Notes: {b.notes}</div>}
                {next && (
                  <Button variant="soft" full icon="ChevronRight" style={{ marginTop: 10 }}
                    onClick={() => advanceBooking(b)}>
                    Mark as {next.replace("_", " ")}
                  </Button>
                )}
              </Card>
            );
          })
        )}

        {/* -------- availability tab -------- */}
        {tab === "availability" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {DAYS.map((day, i) => {
              const dayAvail = avail.find((a) => a.dayOfWeek === i);
              const slotCount = dayAvail?.slots?.length || 0;
              return (
                <Card key={i} pad={14} onClick={() => openAvailEdit(i)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{day}</div>
                      <div style={{ fontSize: 11, color: T.inkSoft }}>
                        {slotCount > 0 ? `${slotCount} slots · ${dayAvail.slots[0].start}–${dayAvail.slots[slotCount - 1].end}` : "No availability set"}
                      </div>
                    </div>
                    <Icon name="ChevronRight" size={16} color={T.inkFaint} />
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* -------- reviews tab -------- */}
        {tab === "reviews" && (
          reviews.length === 0 ? (
            <EmptyHint icon="Star" text="No reviews yet." />
          ) : reviews.map((r) => (
            <Card key={r.id} pad={12}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <RatingStars value={r.rating} size={12} />
                {r.verified && <span style={{ fontSize: 10, color: T.primary, fontWeight: 700 }}>Verified</span>}
              </div>
              <div style={{ fontSize: 12.5, color: T.ink }}>{r.text}</div>
              <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 4 }}>— {r.author}</div>
            </Card>
          ))
        )}
      </div>

      {/* service add/edit sheet */}
      <BottomSheet open={formOpen} onClose={() => setFormOpen(false)} title={editId ? "Edit Service" : "Add Service"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label="Service Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} icon="FileText" />
          <Dropdown label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })}
            options={SERVICE_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))} />
          <Dropdown label="Pricing Type" value={form.pricingType} onChange={(v) => setForm({ ...form, pricingType: v })}
            options={PRICING_TYPES.map((p) => ({ value: p.id, label: p.label }))} />
          <Input label="Price (₹)" value={form.price} onChange={(v) => setForm({ ...form, price: v })} icon="Banknote" type="number" />
          <Input label="Duration (minutes)" value={form.duration} onChange={(v) => setForm({ ...form, duration: v })} icon="Clock" type="number" />
          <Input label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} icon="FileText" />
          <Button full icon="Check" onClick={handleSaveSvc}>{editId ? "Update" : "Add Service"}</Button>
        </div>
      </BottomSheet>

      {/* delete confirm */}
      <Dialog open={!!delId} onClose={() => setDelId(null)} title="Delete Service?" icon="Trash2" danger
        body="This service listing will be permanently removed."
        confirmLabel="Delete" onConfirm={handleDelete} />

      {/* availability edit sheet */}
      <BottomSheet open={availDay !== null} onClose={() => setAvailDay(null)} title={availDay !== null ? `${DAYS[availDay]} Slots` : ""}>
        {availDay !== null && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 12, color: T.inkSoft }}>
              Enter time slots as start-end (e.g., 09:00-10:00). One slot per row.
            </div>
            {availSlots.map((slot, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Input value={slot} onChange={(v) => {
                  const updated = [...availSlots];
                  updated[i] = v;
                  setAvailSlots(updated);
                }} placeholder="09:00-10:00" />
                <button onClick={() => setAvailSlots(availSlots.filter((_, j) => j !== i))}
                  style={{ background: "none", border: "none", cursor: "pointer", color: T.red, padding: 6 }}>
                  <Icon name="X" size={16} />
                </button>
              </div>
            ))}
            <Button variant="soft" full icon="Plus" onClick={addSlot}>Add Slot</Button>
            <Button full icon="Check" onClick={saveAvail}>Save {DAYS[availDay]}</Button>
          </div>
        )}
      </BottomSheet>
    </>
  );
}
