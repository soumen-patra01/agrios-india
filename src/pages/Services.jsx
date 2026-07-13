import { useState } from "react";
import { T } from "../theme/ThemeProvider.jsx";
import { AppBar, SearchBar, Card, IconTile } from "../components/index.js";
import Icon from "../components/Icon.jsx";
import { EmptyState } from "../components/index.js";
import { useApp } from "../store/AppStore.jsx";
import { SERVICES } from "../constants/content.js";

export default function Services() {
  const { t, push } = useApp();
  const [q, setQ] = useState("");
  const list = SERVICES.filter((x) => (x.title + x.desc).toLowerCase().includes(q.toLowerCase()));
  const open = (x) => push({ kind: "feature", props: { title: x.title, desc: x.desc, icon: x.icon, a: x.accent } });

  return (
    <>
      <AppBar title={t("servicesTitle")} large />
      <div style={{ padding: "4px 16px 24px", display: "flex", flexDirection: "column", gap: 16, animation: "ag-fade .25s var(--ag-ease)" }}>
        <SearchBar value={q} onChange={setQ} placeholder="Search services…" />
        {list.length === 0 ? (
          <EmptyState icon="SearchX" title="No services found" body={`Nothing matches "${q}". Try a different word.`} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {list.map((s) => (
              <Card key={s.id} onClick={() => open(s)} pad={14} style={{ display: "flex", alignItems: "center", gap: 13 }}>
                <IconTile name={s.icon} a={s.accent} size={46} iconSize={22} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 700 }}>{s.title}</div>
                  <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 2 }}>{s.desc}</div>
                </div>
                <Icon name="ChevronRight" size={19} style={{ color: T.inkFaint }} />
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
