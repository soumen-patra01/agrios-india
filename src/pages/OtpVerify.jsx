import { useEffect, useState } from "react";
import { T } from "../theme/ThemeProvider.jsx";
import { Button, OtpInput } from "../components/index.js";
import { useApp } from "../store/AppStore.jsx";

export default function OtpVerify({ phone, onBack }) {
  const { login, t, toast } = useApp();
  const [code, setCode] = useState("");
  const [secs, setSecs] = useState(30);
  const ok = code.length === 6;

  useEffect(() => {
    if (secs <= 0) return;
    const id = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secs]);

  const verify = () => login({ phone, name: "", joined: Date.now() });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "44px 22px 24px" }}>
      <h1 style={{ fontFamily: T.display, fontSize: 26, fontWeight: 800, margin: "0 0 6px", textAlign: "center", color: T.ink }}>{t("otpTitle")}</h1>
      <p style={{ fontSize: 14, color: T.inkSoft, margin: "0 0 30px", textAlign: "center" }}>
        {t("otpSub")} <b style={{ color: T.ink }}>+91 {phone}</b>
      </p>

      <OtpInput value={code} onChange={setCode} />

      <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: T.inkSoft }}>
        {secs > 0 ? (
          <>Resend in <b style={{ color: T.ink }}>0:{String(secs).padStart(2, "0")}</b></>
        ) : (
          <button onClick={() => { setSecs(30); toast("Code resent", "success"); }} style={{ background: "none", border: "none", cursor: "pointer", color: T.primary, fontWeight: 600, fontSize: 13, fontFamily: T.body }}>
            {t("resend")}
          </button>
        )}
      </div>

      <div style={{ flex: 1 }} />
      <Button full size="lg" disabled={!ok} onClick={verify}>{t("verify")}</Button>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: T.inkSoft, fontFamily: T.body, fontSize: 13.5, fontWeight: 600, marginTop: 14, padding: 8 }}>
        {t("changeNumber")}
      </button>
    </div>
  );
}
