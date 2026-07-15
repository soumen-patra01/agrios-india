import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar, SearchBar, Chip, Card, SectionHeader, EmptyState, Button, IconTile } from "../../components/index.js";
import { useApp } from "../../store/AppStore.jsx";
import ProviderCard from "../../components/svcMarketplace/ProviderCard.jsx";
import RatingStars from "../../components/marketplace/RatingStars.jsx";
import { svcCatalogService } from "../../services/svcMarketplace/svcCatalogService.js";
import { providerService } from "../../services/svcMarketplace/providerService.js";
import { svcReviewService } from "../../services/svcMarketplace/svcReviewService.js";
import { seedSvc } from "../../services/svcMarketplace/seedSvc.js";
import { SERVICE_CATEGORIES, categoryMeta } from "../../services/svcMarketplace/constantsSvc.js";
import { rupee } from "../../utils/format.js";
import { accent } from "../../components/primitives.jsx";

const QUICK_LINKS = [
  { kind: "svcMyBookings",  label: "My Bookings", icon: "CalendarClock", a: "blue"    },
  { kind: "svcProviderDash",label: "Provide",     icon: "Handshake",     a: "primary" },
];

export default function ServiceMarketplaceHub({ category: initCat = "all" } = {}) {
  const { pop, push, toast } = useApp();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState(initCat);
  const [services, setServices] = useState(null);
  const [providers, setProviders] = useState([]);
  const [seeding, setSeeding] = useState(false);
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((n) => n + 1);

  useEffect(() => {
    svcCatalogService.search({ q, category: cat }).then(setServices);
  }, [q, cat, tick]);

  useEffect(() => {
    providerService.getAll().then(setProviders);
  }, [tick]);

  const loadDemo = async () => {
    setSeeding(true);
    const r = await seedSvc.load();
    setSeeding(false);
    toast(`${r.services} services from ${r.providers} providers loaded`, "success");
    refresh();
  };

  const featured = (services || []).filter((s) => s.featured);
  const empty = services && services.length === 0 && q === "" && cat === "all";

  return (
    <>
      <AppBar title="Service Marketplace" onBack={pop} />

      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 16,
        animation: "ag-fade .25s var(--ag-ease)" }}>

        {/* quick links */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {QUICK_LINKS.map((l) => (
            <Card key={l.kind} onClick={() => push({ kind: l.kind })} pad={11}
              style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <IconTile name={l.icon} a={l.a} size={32} iconSize={16} />
              <span style={{ fontSize: 12, fontWeight: 700, color: T.ink }}>{l.label}</span>
            </Card>
          ))}
        </div>

        <SearchBar value={q} onChange={setQ} placeholder="Search vet, drone, machinery…" />

        <div style={{ display: "flex", gap: 8, overflowX: "auto", margin: "-4px 0", paddingBottom: 4 }}>
          <Chip active={cat === "all"} onClick={() => setCat("all")}>All</Chip>
          {SERVICE_CATEGORIES.map((c) => (
            <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)} icon={c.icon}>{c.label}</Chip>
          ))}
        </div>

        {services === null ? null : empty ? (
          <EmptyState icon="Handshake" title="No services yet"
            body="Load demo data to explore veterinary, drone, machinery, and other agricultural services. Become a provider to offer your own services."
            action={seeding ? "Loading…" : "Load demo data"} onAction={seeding ? undefined : loadDemo} />
        ) : (
          <>
            {/* providers strip */}
            {providers.length > 0 && cat === "all" && !q && (
              <div>
                <SectionHeader title="Service Providers" />
                <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                  {providers.map((p) => (
                    <div key={p.id} style={{ minWidth: 155, flexShrink: 0 }}>
                      <ProviderCard provider={p} onClick={() => push({ kind: "svcProvider", props: { providerId: p.id } })} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* featured strip */}
            {featured.length > 0 && !q && (
              <div>
                <SectionHeader title="Featured Services" />
                <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                  {featured.slice(0, 6).map((svc) => {
                    const meta = categoryMeta(svc.category);
                    const c = accent(meta.accent);
                    return (
                      <Card key={svc.id} pad={12} onClick={() => push({ kind: "svcDetail", props: { serviceId: svc.id } })}
                        style={{ minWidth: 200, flexShrink: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <IconTile name={meta.icon} a={meta.accent} size={30} iconSize={15} />
                          <span style={{ fontSize: 10.5, color: c.fg, fontWeight: 700, background: c.bg,
                            padding: "2px 7px", borderRadius: 6 }}>{meta.label}</span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, lineHeight: 1.3 }}>{svc.title}</div>
                        <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 2 }}>{svc.providerName}</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginTop: 6 }}>
                          {svc.price > 0 ? rupee(svc.price) : "Free"}{svc.pricingType !== "fixed" ? `/${svc.pricingType.replace("per", "").toLowerCase()}` : ""}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* all services */}
            <div>
              <SectionHeader title={cat === "all" ? "All Services" : (SERVICE_CATEGORIES.find((c) => c.id === cat)?.label || "Services")} />
              {services.length === 0 ? (
                <EmptyState icon="SearchX" title="Nothing found"
                  body={q ? `No services match "${q}".` : "No services in this category yet."} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {services.map((svc) => {
                    const meta = categoryMeta(svc.category);
                    return (
                      <Card key={svc.id} pad={14} onClick={() => push({ kind: "svcDetail", props: { serviceId: svc.id } })}>
                        <div style={{ display: "flex", gap: 12 }}>
                          <IconTile name={meta.icon} a={meta.accent} size={42} iconSize={20} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>{svc.title}</div>
                            <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 1 }}>{svc.providerName}</div>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 5 }}>
                              <span style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>
                                {svc.price > 0 ? rupee(svc.price) : "Free"}
                              </span>
                              <span style={{ fontSize: 10.5, color: T.inkFaint }}>
                                {svc.pricingType !== "fixed" ? `/${svc.pricingType.replace("per", "").toLowerCase()}` : ""}
                                {svc.duration > 0 ? ` · ${svc.duration} min` : ""}
                              </span>
                            </div>
                          </div>
                          <Icon name="ChevronRight" size={16} color={T.inkFaint} />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            <Button variant="soft" full icon="Trash2" onClick={async () => { await seedSvc.clear(); refresh(); toast("Demo data cleared", "info"); }}
              style={{ display: (services || []).some((s) => s.demo) ? "inline-flex" : "none" }}>
              Clear demo data
            </Button>
          </>
        )}
      </div>
    </>
  );
}
