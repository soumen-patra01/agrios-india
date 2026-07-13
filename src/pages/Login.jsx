import { useState } from "react";
import { T } from "../theme/ThemeProvider.jsx";
import Icon from "../components/Icon.jsx";
import { Button, Input } from "../components/index.js";
import { useApp } from "../store/AppStore.jsx";

export default function Login({ onNext }) {
  const { t } = useApp();
  const [phone,   setPhone]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const ok = phone.length === 10 && !loading;

  const sendOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/sendOtp", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send OTP — please try again");
        return;
      }
      onNext(phone, data.token, !!data.demo);
    } catch {
      setError("Network error — check your connection and try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "44px 22px 24px" }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, margin: "0 auto 24px",
        display: "grid", placeItems: "center",
        background: `linear-gradient(150deg, ${T.primary}, ${T.primaryDark})`,
        boxShadow: T.shadowMd }}>
        <Icon name="Sprout" size={32} color="#fff" strokeWidth={2.3} />
      </div>
      <h1 style={{ fontFamily: T.display, fontSize: 26, fontWeight: 800,
        margin: "0 0 6px", textAlign: "center", color: T.ink }}>{t("login")}</h1>
      <p style={{ fontSize: 14, color: T.inkSoft, margin: "0 0 30px", textAlign: "center" }}>
        {t("loginSub")}
      </p>

      <Input label={t("phone")} value={phone}
        onChange={(v) => { setPhone(v.replace(/\D/g, "").slice(0, 10)); setError(""); }}
        inputMode="numeric" prefix="+91" placeholder="98765 43210" />

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12,
          padding: "10px 14px", borderRadius: 12,
          background: T.redSoft, border: `1px solid ${T.red}33` }}>
          <Icon name="AlertCircle" size={15} style={{ color: T.red, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: T.red }}>{error}</span>
        </div>
      )}

      <div style={{ flex: 1 }} />
      <Button full size="lg" disabled={!ok} onClick={sendOtp}>
        {loading ? "Sending…" : t("sendOtp")}
      </Button>
      <p style={{ fontSize: 11.5, color: T.inkFaint, textAlign: "center", marginTop: 16, lineHeight: 1.5 }}>
        We'll send a one-time code to verify your number.
      </p>
    </div>
  );
}
