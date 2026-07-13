import { T } from "../theme/ThemeProvider.jsx";
import Icon from "../components/Icon.jsx";
import { AppBar, Card, SectionHeader, IconTile } from "../components/index.js";
import { useApp } from "../store/AppStore.jsx";
import { MARKET_SECTIONS, PRICES } from "../constants/content.js";
import { rupee } from "../utils/format.js";

export default function Market() {
  const { t, push } = useApp();
  const open = (title, icon, a) => push({ kind: "feature", props: { title, desc: "Browse and connect — arriving in a later phase.", icon, a } });

  return (
    <>
      <AppBar title={t("marketTitle")} large action={
        <button onClick={() => open("Search market", "Search", "primary")} style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 12, padding: 8, cursor: "pointer", color: T.ink, display: "flex" }}>
          <Icon name="Search" size={19} />
        </button>
      } />
      <div style={{ padding: "4px 16px 24px", display: "flex", flexDirection: "column", gap: 20, animation: "ag-fade .25s var(--ag-ease)" }}>
        {/* live prices strip */}
        <div>
          <SectionHeader title={t("prices")} action={t("seeAll")} onAction={() => open("Today's prices", "LineChart", "primary")} />
          <Card pad={6}>
            {PRICES.map((p, i) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderTop: i ? `1px solid ${T.lineSoft}` : "none" }}>
                <IconTile name={p.crop === "Milk" ? "Milk" : "Wheat"} a="primary" size={38} iconSize={18} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{p.crop}</div>
                  <div style={{ fontSize: 12, color: T.inkSoft }}>{p.mandi} mandi</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700 }}>{rupee(p.price)}<span style={{ fontSize: 11, color: T.inkFaint, fontWeight: 500 }}>/{p.unit}</span></div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: p.up ? T.primary : T.red, display: "flex", gap: 2, justifyContent: "flex-end" }}>
                    <Icon name={p.up ? "TrendingUp" : "TrendingDown"} size={12} /> {p.change}%
                  </div>
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* market sections grid */}
        <div>
          <SectionHeader title={t("marketTitle")} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {MARKET_SECTIONS.map((s) => (
              <Card key={s.id} onClick={() => open(s.title, s.icon, s.accent)} pad={15} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <IconTile name={s.icon} a={s.accent} size={44} iconSize={21} />
                <div style={{ fontFamily: T.display, fontSize: 14.5, fontWeight: 700, lineHeight: 1.2 }}>{s.title}</div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
