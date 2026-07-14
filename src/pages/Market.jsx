import { T } from "../theme/ThemeProvider.jsx";
import Icon from "../components/Icon.jsx";
import { AppBar, Card, SectionHeader, IconTile } from "../components/index.js";
import { useApp } from "../store/AppStore.jsx";
import { MARKET_SECTIONS } from "../constants/content.js";
import { marketService } from "../services/market/marketService.js";

/* Top crops shown in the Market tab price strip (curated MSP snapshot). */
const TOP_CROPS = ["paddy", "wheat", "mustard", "arhar", "potato", "milk"];

export default function Market() {
  const { t, push } = useApp();
  const open = (title, icon, a) => push({ kind: "feature", props: { title, desc: "Browse and connect — arriving in a later phase.", icon, a } });

  const topCrops = TOP_CROPS.map((id) => marketService.allCrops.find((c) => c.id === id)).filter(Boolean);

  return (
    <>
      <AppBar title={t("marketTitle")} large action={
        <button onClick={() => push({ kind: "mandiPrices" })} style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 12, padding: 8, cursor: "pointer", color: T.ink, display: "flex" }}>
          <Icon name="Search" size={19} />
        </button>
      } />
      <div style={{ padding: "4px 16px 24px", display: "flex", flexDirection: "column", gap: 20, animation: "ag-fade .25s var(--ag-ease)" }}>

        {/* MSP price strip */}
        <div>
          <SectionHeader title={t("prices")} action={t("seeAll")} onAction={() => push({ kind: "mandiPrices" })} />
          <Card pad={6}>
            {topCrops.map((p, i) => (
              <div key={p.id} onClick={() => push({ kind: "mandiPrices" })}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderTop: i ? `1px solid ${T.lineSoft}` : "none", cursor: "pointer" }}>
                <IconTile name={p.icon} a={marketService.categories.find((c) => c.id === p.category)?.accent || "primary"} size={38} iconSize={18} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: T.inkSoft }}>MSP / seasonal band</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {p.msp ? (
                    <div style={{ fontSize: 14.5, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                      ₹{p.msp.toLocaleString("en-IN")}<span style={{ fontSize: 11, color: T.inkFaint, fontWeight: 500 }}>/{p.unit}</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12.5, color: T.inkSoft }}>Market price</div>
                  )}
                  <div style={{ fontSize: 11, color: T.inkSoft }}>
                    ₹{p.bandLow.toLocaleString("en-IN")}–{p.bandHigh.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            ))}
          </Card>
          <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 6, paddingLeft: 2 }}>
            MSP 2024-25 · seasonal bands · <strong>not today's live rate</strong>
          </div>
        </div>

        {/* market sections grid */}
        <div>
          <SectionHeader title={t("marketTitle")} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {MARKET_SECTIONS.map((s) => {
              /* Tiles now route into the marketplace (with a category preset
                 where one applies). "buyers" waits for the shared backend. */
              const go = {
                prices:      () => push({ kind: "mandiPrices" }),
                marketplace: () => push({ kind: "marketplace" }),
                sellers:     () => push({ kind: "marketplace" }),
                equipment:   () => push({ kind: "marketplace", props: { category: "equipment" } }),
                seeds:       () => push({ kind: "marketplace", props: { category: "seeds" } }),
                feed:        () => push({ kind: "marketplace", props: { category: "feed" } }),
                medicine:    () => push({ kind: "marketplace", props: { category: "medicine" } }),
              }[s.id];
              return (
                <Card key={s.id}
                  onClick={() => go ? go() : open(s.title, s.icon, s.accent)}
                  pad={15} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <IconTile name={s.icon} a={s.accent} size={44} iconSize={21} />
                  <div style={{ fontFamily: T.display, fontSize: 14.5, fontWeight: 700, lineHeight: 1.2 }}>{s.title}</div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
