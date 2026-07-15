import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar, Card, Button, IconTile, SectionHeader, EmptyState, Chip } from "../../components/index.js";
import { useApp } from "../../store/AppStore.jsx";
import RatingStars from "../../components/marketplace/RatingStars.jsx";
import { svcCatalogService } from "../../services/svcMarketplace/svcCatalogService.js";
import { providerService } from "../../services/svcMarketplace/providerService.js";
import { svcReviewService } from "../../services/svcMarketplace/svcReviewService.js";
import { availabilityService } from "../../services/svcMarketplace/availabilityService.js";
import { categoryMeta, PRICING_TYPES } from "../../services/svcMarketplace/constantsSvc.js";
import { rupee } from "../../utils/format.js";
import { accent } from "../../components/primitives.jsx";

const fmtDate = (d) => d.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });

export default function ServiceDetail({ serviceId }) {
  const { pop, push } = useApp();
  const [svc, setSvc] = useState(null);
  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ avg: 0, count: 0 });
  const [preview, setPreview] = useState([]);

  useEffect(() => {
    svcCatalogService.getById(serviceId).then(async (s) => {
      if (!s) return;
      setSvc(s);
      providerService.getById(s.providerId).then(setProvider);
      svcReviewService.forService(s.id).then(setReviews);
      svcReviewService.serviceStats(s.id).then(setStats);
      // availability preview for next 3 days
      const days = [];
      for (let i = 0; i < 3; i++) {
        const d = new Date(); d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().slice(0, 10);
        const slots = await availabilityService.getAvailableSlots(s.providerId, dateStr);
        const free = slots.filter((sl) => sl.available).length;
        days.push({ date: d, dateStr, free });
      }
      setPreview(days);
    });
  }, [serviceId]);

  if (!svc) return null;
  const meta = categoryMeta(svc.category);
  const c = accent(meta.accent);
  const pricingLabel = PRICING_TYPES.find((p) => p.id === svc.pricingType)?.label || svc.pricingType;

  return (
    <>
      <AppBar title="Service Detail" onBack={pop} />
      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 16,
        animation: "ag-fade .25s var(--ag-ease)" }}>

        {/* hero */}
        <div style={{ background: c.bg, borderRadius: 16, padding: 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <Icon name={meta.icon} size={48} color={c.fg} strokeWidth={1.5} />
          <Chip icon={meta.icon} active>{meta.label}</Chip>
        </div>

        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, lineHeight: 1.3 }}>{svc.title}</div>
          <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 4 }}>{svc.description}</div>
        </div>

        {/* pricing */}
        <Card pad={14}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: T.ink }}>{svc.price > 0 ? rupee(svc.price) : "Free"}</span>
            <span style={{ fontSize: 12, color: T.inkSoft }}>{pricingLabel}</span>
          </div>
          {svc.duration > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6, fontSize: 12, color: T.inkSoft }}>
              <Icon name="Clock" size={14} /> {svc.duration} minutes
            </div>
          )}
        </Card>

        {/* provider card */}
        {provider && (
          <Card pad={14} onClick={() => push({ kind: "svcProvider", props: { providerId: provider.id } })}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <IconTile name={provider.icon || "Handshake"} a={provider.accent || "primary"} size={42} iconSize={20} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink, display: "flex", alignItems: "center", gap: 5 }}>
                  {provider.name}
                  {provider.verificationStatus === "verified" && <Icon name="BadgeCheck" size={14} color={T.blue} />}
                </div>
                <div style={{ fontSize: 11, color: T.inkSoft }}>{provider.tagline}</div>
                <RatingStars value={provider.rating || 0} count={provider.reviewCount ?? 0} size={11} />
              </div>
              <Icon name="ChevronRight" size={16} color={T.inkFaint} />
            </div>
          </Card>
        )}

        {/* availability preview */}
        {preview.length > 0 && (
          <div>
            <SectionHeader title="Availability" />
            <div style={{ display: "flex", gap: 10 }}>
              {preview.map((d) => (
                <Card key={d.dateStr} pad={12} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: T.inkSoft }}>{fmtDate(d.date)}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: d.free > 0 ? T.primary : T.red, marginTop: 4 }}>{d.free}</div>
                  <div style={{ fontSize: 10, color: T.inkFaint }}>slots free</div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* requirements & deliverables */}
        {svc.requirements?.length > 0 && (
          <div>
            <SectionHeader title="Requirements" />
            {svc.requirements.map((r, i) => (
              <div key={i} style={{ fontSize: 12.5, color: T.inkSoft, paddingLeft: 12, marginBottom: 4 }}>• {r}</div>
            ))}
          </div>
        )}
        {svc.deliverables?.length > 0 && (
          <div>
            <SectionHeader title="Deliverables" />
            {svc.deliverables.map((d, i) => (
              <div key={i} style={{ fontSize: 12.5, color: T.inkSoft, paddingLeft: 12, marginBottom: 4 }}>• {d}</div>
            ))}
          </div>
        )}

        {/* book now */}
        <Button full icon="CalendarClock" onClick={() => push({ kind: "svcBooking", props: { serviceId: svc.id, providerId: svc.providerId } })}>
          Book Now
        </Button>

        {/* reviews */}
        <div>
          <SectionHeader title={`Reviews (${stats.count})`} />
          {stats.count > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: T.ink }}>{stats.avg}</span>
              <RatingStars value={stats.avg} size={15} />
              <span style={{ fontSize: 12, color: T.inkSoft }}>({stats.count})</span>
            </div>
          )}
          {reviews.length === 0 ? (
            <EmptyState icon="Star" title="No reviews yet" body="Be the first to review after a completed booking." />
          ) : reviews.map((r) => (
            <Card key={r.id} pad={12} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <RatingStars value={r.rating} size={12} />
                {r.verified && <span style={{ fontSize: 10, color: T.primary, fontWeight: 700 }}>Verified</span>}
              </div>
              <div style={{ fontSize: 12.5, color: T.ink }}>{r.text}</div>
              <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 4 }}>— {r.author}</div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
