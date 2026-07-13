import { useState } from "react";
import { T } from "../theme/ThemeProvider.jsx";
import Icon from "../components/Icon.jsx";
import { Button, Input } from "../components/index.js";
import { useApp } from "../store/AppStore.jsx";

export default function Login({ onNext }) {
  const { t } = useApp();
  const [phone, setPhone] = useState("");
  const ok = phone.length === 10;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "44px 22px 24px" }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, margin: "0 auto 24px", display: "grid", placeItems: "center",
        background: `linear-gradient(150deg, ${T.primary}, ${T.primaryDark})`, boxShadow: T.shadowMd }}>
        <Icon name="Sprout" size={32} color="#fff" strokeWidth={2.3} />
      </div>
      <h1 style={{ fontFamily: T.display, fontSize: 26, fontWeight: 800, margin: "0 0 6px", textAlign: "center", color: T.ink }}>{t("login")}</h1>
      <p style={{ fontSize: 14, color: T.inkSoft, margin: "0 0 30px", textAlign: "center" }}>{t("loginSub")}</p>

      <Input label={t("phone")} value={phone} onChange={(v) => setPhone(v.replace(/\D/g, "").slice(0, 10))}
        inputMode="numeric" prefix="+91" placeholder="98765 43210" />

      <div style={{ flex: 1 }} />
      <Button full size="lg" disabled={!ok} onClick={() => onNext(phone)}>{t("sendOtp")}</Button>
      <p style={{ fontSize: 11.5, color: T.inkFaint, textAlign: "center", marginTop: 16, lineHeight: 1.5 }}>
        Demo screen — no OTP is actually sent in Phase 1.
      </p>
    </div>
  );
}
