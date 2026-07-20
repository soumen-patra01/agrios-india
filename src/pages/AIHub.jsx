import { useState } from "react";
import { T } from "../theme/ThemeProvider.jsx";
import Icon from "../components/Icon.jsx";
import { AppBar, SearchBar, Card, accent } from "../components/index.js";
import { useApp } from "../store/AppStore.jsx";
import { AI_TOOLS } from "../constants/content.js";

export default function AIHub() {
  const { t, tc, push } = useApp();
  const [q, setQ] = useState("");
  const list = AI_TOOLS.filter((x) => {
    const title = typeof x.title === "object" ? Object.values(x.title).join(" ") : x.title;
    const desc = typeof x.desc === "object" ? Object.values(x.desc).join(" ") : x.desc;
    return (title + desc).toLowerCase().includes(q.toLowerCase());
  });
  const open = (x) => push({ kind: "chat", props: { agentId: x.agentId } });

  return (
    <>
      <AppBar title={t("aiTitle")} large />
      <div style={{ padding: "4px 16px 24px", display: "flex", flexDirection: "column", gap: 16, animation: "ag-fade .25s var(--ag-ease)" }}>
        {/* hero */}
        <div style={{ borderRadius: T.rXl, padding: 20, color: "#fff", position: "relative", overflow: "hidden",
          background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`, boxShadow: T.shadowMd }}>
          <div style={{ position: "absolute", right: -10, bottom: -20, opacity: .16 }}><Icon name="Sparkles" size={120} /></div>
          <div style={{ fontFamily: T.display, fontSize: 22, fontWeight: 800, position: "relative" }}>{t("aiSub")}</div>
          <div style={{ fontSize: 13.5, opacity: .92, marginTop: 6, maxWidth: 260, position: "relative" }}>
            Ten specialists that understand Indian farming — from diagnosis to loans.
          </div>
        </div>

        <SearchBar value={q} onChange={setQ} placeholder="Search assistants…" />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {list.map((x) => {
            const c = accent(x.accent);
            return (
              <Card key={x.id} onClick={() => open(x)} pad={15} style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 132 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: c.bg, color: c.fg, display: "grid", placeItems: "center" }}>
                  <Icon name={x.icon} size={22} strokeWidth={2.1} />
                </div>
                <div>
                  <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>{tc(x.title)}</div>
                  <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 4, lineHeight: 1.4 }}>{tc(x.desc)}</div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
