import { useState } from "react";
import { T } from "../theme/ThemeProvider.jsx";
import Icon from "../components/Icon.jsx";
import { Button, OtpInput } from "../components/index.js";
import { useApp } from "../store/AppStore.jsx";

const DEMO_CODE = "123456";

export default function OtpVerify({ phone, token, isDemo, onBack }) {
  const { login, t } = useApp();
  const [code,    setCode]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const ok = code.length === 6 && !loading;

  const verify = async () => {
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/verifyOtp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Verification failed — please try again");
        setCode("");
        return;
      }
      login({ phone, name: "", joined: Date.now() });
    } catch {
      setError("Network error — check your connection and try again");
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

      {/* Demo banner — only shown when SMS key is not configured on the server */}
      {isDemo && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10,
          padding: "12px 14px", borderRadius: 14,
          background: T.yellowSoft, border: `1px solid ${T.yellow}33`, marginBottom: 24 }}>
          <Icon name="Info" size={16} style={{ color: T.yellow, flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.5 }}>
            <b>Demo mode</b> — SMS is not configured yet. Use code{" "}
            <button onClick={() => { setCode(DEMO_CODE); setError(""); }}
              style={{ background: T.yellow, color: "#fff", border: "none",
                borderRadius: 6, padding: "2px 8px", cursor: "pointer",
                fontFamily: T.body, fontSize: 13, fontWeight: 700 }}>
              {DEMO_CODE}
            </button>
            {" "}to continue.
          </div>
        </div>
      )}

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
        {loading ? "Verifying…" : t("verify")}
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
