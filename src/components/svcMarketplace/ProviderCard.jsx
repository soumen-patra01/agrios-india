import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../Icon.jsx";
import { Card, accent } from "../primitives.jsx";
import RatingStars from "../marketplace/RatingStars.jsx";
import { categoryMeta } from "../../services/svcMarketplace/constantsSvc.js";

export default function ProviderCard({ provider, onClick }) {
  const spec = provider.specializations?.[0];
  const meta = spec ? categoryMeta(spec) : { icon: provider.icon || "Handshake", accent: provider.accent || "primary" };
  const c = accent(meta.accent);

  return (
    <Card pad={0} onClick={onClick} style={{ overflow: "hidden" }}>
      <div style={{ background: c.bg, height: 72, display: "grid", placeItems: "center", position: "relative" }}>
        <Icon name={meta.icon} size={32} color={c.fg} strokeWidth={1.6} />
        {provider.verificationStatus === "verified" && (
          <span style={{ position: "absolute", top: 6, right: 6 }}>
            <Icon name="BadgeCheck" size={15} color={T.blue} />
          </span>
        )}
      </div>
      <div style={{ padding: "10px 12px 12px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, lineHeight: 1.3,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {provider.name}
        </div>
        <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 2, overflow: "hidden",
          textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {provider.tagline || provider.type}
        </div>
        <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 6 }}>
          <RatingStars value={provider.rating || 0} count={provider.reviewCount ?? 0} size={11} />
        </div>
        {provider.completedBookings > 0 && (
          <div style={{ fontSize: 10.5, color: T.inkFaint, marginTop: 4 }}>
            {provider.completedBookings} bookings completed
          </div>
        )}
      </div>
    </Card>
  );
}
