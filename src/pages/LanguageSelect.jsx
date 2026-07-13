import { useState } from "react";
import { T } from "../theme/ThemeProvider.jsx";
import Icon from "../components/Icon.jsx";
import { Button } from "../components/index.js";
import { useApp } from "../store/AppStore.jsx";
import { LANGUAGES } from "../constants/languages.js";
import { storage } from "../utils/storage.js";

export default function LanguageSelect() {
  const { setLang, setStage, t } = useApp();
  const [sel, setSel] = useState(storage.get("lang", "en"));

  const cont = () => { setLang(sel); setStage(storage.get("onboarded") ? (storage.get("user") ? "app" : "auth") : "onboarding"); };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "40px 22px 24px" }}>
      <div style={{ width: 46, height: 46, borderRadius: 14, background: T.primarySoft, color: T.primary, display: "grid", placeItems: "center", marginBottom: 18 }}>
        <Icon name="Languages" size={24} />
      </div>
      <h1 style={{ fontFamily: T.display, fontSize: 27, fontWeight: 800, margin: "0 0 6px", color: T.ink }}>{t("chooseLang")}</h1>
      <p style={{ fontSize: 14, color: T.inkSoft, margin: "0 0 22px" }}>{t("chooseLangSub")}</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, flex: 1, alignContent: "start" }}>
        {LANGUAGES.map((l) => {
          const on = sel === l.code;
          return (
            <button key={l.code} onClick={() => setSel(l.code)}
              style={{ textAlign: "left", padding: "15px 16px", borderRadius: T.rLg, cursor: "pointer", fontFamily: T.body,
                border: `1.5px solid ${on ? T.primary : T.line}`, background: on ? T.primarySoft : T.surface,
                transition: "all .18s var(--ag-ease)", position: "relative" }}>
              <div style={{ fontFamily: T.display, fontSize: 18, fontWeight: 700, color: on ? T.primary : T.ink }}>{l.native}</div>
              <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 2 }}>{l.label}</div>
              {on && <span style={{ position: "absolute", top: 12, right: 12, color: T.primary, display: "flex" }}><Icon name="CheckCircle2" size={18} /></span>}
            </button>
          );
        })}
      </div>

      <Button full size="lg" onClick={cont} style={{ marginTop: 20 }}>{t("continue")}</Button>
    </div>
  );
}
