import { useState } from "react";
import { T } from "../theme/ThemeProvider.jsx";
import Icon from "../components/Icon.jsx";
import { Button, OtpInput } from "../components/index.js";
import { useApp } from "../store/AppStore.jsx";
import { verifyOtp } from "../services/firebase/auth.js";

export default function OtpVerify({ phone, onBack }) {
  const { login, t, tc } = useApp();
  const [code,    setCode]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const ok = code.length === 6 && !loading;

  const verify = async () => {
    setError("");
    setLoading(true);
    try {
      const fbUser = await verifyOtp(code);
      login({ phone, uid: fbUser.uid, name: "", joined: Date.now() });
    } catch (err) {
      const msg = err?.code === "auth/invalid-verification-code"
        ? tc({ en: "Invalid code — please try again", hi: "अमान्य कोड — पुनः प्रयास करें", bn: "অবৈধ কোড — আবার চেষ্টা করুন" })
        : err?.code === "auth/code-expired"
        ? tc({ en: "Code expired — request a new one", hi: "कोड समाप्त — नया अनुरोध करें", bn: "কোড মেয়াদোত্তীর্ণ — নতুন অনুরোধ করুন" })
        : tc({ en: "Verification failed — please try again", hi: "सत्यापन विफल — पुनः प्रयास करें", bn: "যাচাই ব্যর্থ — আবার চেষ্টা করুন" });
      setError(msg);
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "44px 22px 24px" }}>
      <h1 style={{ fontFamily: T.display, fontSize: 26, fontWeight: 800,
        margin: "0 0 6px", textAlign: "center", color: T.ink }}>{t("otpTitle")}</h1>
      <p style={{ fontSize: 14, color: T.inkSoft, margin: "0 0 24px", textAlign: "center" }}>
        {t("otpSub")} <b style={{ color: T.ink }}>+91 {phone}</b>
      </p>

      <OtpInput value={code} onChange={(v) => { setCode(v); setError(""); }} />

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16,
          padding: "10px 14px", borderRadius: 12,
          background: T.redSoft, border: `1px solid ${T.red}33` }}>
          <Icon name="AlertCircle" size={15} style={{ color: T.red, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: T.red }}>{error}</span>
        </div>
      )}

      <div style={{ flex: 1 }} />
      <Button full size="lg" disabled={!ok} onClick={verify}>
        {loading ? tc({ en: "Verifying…", hi: "सत्यापित हो रहा है…", bn: "যাচাই হচ্ছে…" }) : t("verify")}
      </Button>
      <button onClick={onBack}
        style={{ background: "none", border: "none", cursor: "pointer",
          color: T.inkSoft, fontFamily: T.body, fontSize: 13.5,
          fontWeight: 600, marginTop: 14, padding: 8 }}>
        {t("changeNumber")}
      </button>
    </div>
  );
}
