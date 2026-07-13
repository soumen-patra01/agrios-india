import { useState } from "react";
import { T } from "../theme/ThemeProvider.jsx";
import Icon from "../components/Icon.jsx";
import { Button, accent } from "../components/index.js";
import { useApp } from "../store/AppStore.jsx";
import { ONBOARDING } from "../constants/content.js";

export default function Onboarding() {
  const { finishOnboarding, t } = useApp();
  const [i, setI] = useState(0);
  const slide = ONBOARDING[i];
  const c = accent(slide.accent);
  const last = i === ONBOARDING.length - 1;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "18px 22px 24px" }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={finishOnboarding} style={{ background: "none", border: "none", cursor: "pointer", color: T.inkSoft, fontFamily: T.body, fontSize: 14, fontWeight: 600, padding: 8 }}>
          {t("skip")}
        </button>
      </div>

      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", animation: "ag-rise .35s var(--ag-ease)" }}>
        <div style={{ width: 128, height: 128, borderRadius: 40, background: c.bg, color: c.fg, display: "grid", placeItems: "center", marginBottom: 30, boxShadow: T.shadowMd }}>
          <Icon name={slide.icon} size={60} strokeWidth={1.9} />
        </div>
        <h1 style={{ fontFamily: T.display, fontSize: 27, fontWeight: 800, margin: "0 0 12px", color: T.ink, maxWidth: 320, lineHeight: 1.2 }}>{slide.title}</h1>
        <p style={{ fontSize: 15, color: T.inkSoft, lineHeight: 1.6, maxWidth: 320, margin: 0 }}>{slide.body}</p>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 7, marginBottom: 22 }}>
        {ONBOARDING.map((_, k) => (
          <div key={k} style={{ height: 7, width: k === i ? 24 : 7, borderRadius: 4, background: k === i ? T.primary : T.line, transition: "all .3s var(--ag-ease)" }} />
        ))}
      </div>

      <Button full size="lg" icon={last ? "Check" : undefined} onClick={() => (last ? finishOnboarding() : setI(i + 1))}>
        {last ? t("getStarted") : t("next")}
      </Button>
    </div>
  );
}
