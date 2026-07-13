import { useState } from "react";
import { T } from "../theme/ThemeProvider.jsx";
import Icon from "../components/Icon.jsx";
import { Button, OtpInput } from "../components/index.js";
import { useApp } from "../store/AppStore.jsx";

const DEMO_CODE = "123456";

export default function OtpVerify({ phone, onBack }) {
  const { login, t } = useApp();
  const [code, setCode] = useState("");
  const ok = code.length === 6;

  const verify = () => login({ phone, name: "", joined: Date.now() });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "44px 22px 24px" }}>
      <h1 style={{ fontFamily: T.display, fontSize: 26, fontWeight: 800, margin: "0 0 6px", textAlign: "center", color: T.ink }}>{t("otpTitle")}</h1>
      <p style={{ fontSize: 14, color: T.inkSoft, margin: "0 0 24px", textAlign: "center" }}>
        {t("otpSub")} <b style={{ color: T.ink }}>+91 {phone}</b>
      </p>

      {/* Demo notice — real SMS gateway connects in Phase 2 */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", borderRadius: 14,
        background: T.yellowSoft, border: `1px solid ${T.yellow}33`, marginBottom: 24 }}>
        <Icon name="Info" size={16} style={{ color: T.yellow, flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.5 }}>
          <b>Demo mode</b> — SMS is not sent yet. Use code{" "}
          <button onClick={() => setCode(DEMO_CODE)}
            style={{ background: T.yellow, color: "#fff", border: "none", borderRadius: 6,
              padding: "2px 8px", cursor: "pointer", fontFamily: T.body, fontSize: 13, fontWeight: 700 }}>
            {DEMO_CODE}
          </button>
          {" "}to continue.
        </div>
      </div>

      <OtpInput value={code} onChange={setCode} />

      <div style={{ flex: 1 }} />
      <Button full size="lg" disabled={!ok} onClick={verify}>{t("verify")}</Button>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: T.inkSoft,
        fontFamily: T.body, fontSize: 13.5, fontWeight: 600, marginTop: 14, padding: 8 }}>
        {t("changeNumber")}
      </button>
    </div>
  );
}
