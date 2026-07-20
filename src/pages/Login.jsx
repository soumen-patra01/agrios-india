import { useState, useEffect } from "react";
import { T } from "../theme/ThemeProvider.jsx";
import Icon from "../components/Icon.jsx";
import { Button, Input } from "../components/index.js";
import { useApp } from "../store/AppStore.jsx";
import {
  setupRecaptcha,
  sendOtp,
  signInWithGoogle,
  signInWithFacebook,
  signInWithApple,
  signInWithTwitter,
  signInWithEmail,
} from "../services/firebase/auth.js";

const SOCIAL = [
  { id: "google",   label: "Google",   color: "#4285F4", icon: "Chrome"   },
  { id: "facebook", label: "Facebook", color: "#1877F2", icon: "Facebook" },
  { id: "apple",    label: "Apple",    color: "#000000", icon: "Apple"    },
  { id: "twitter",  label: "Twitter",  color: "#1DA1F2", icon: "Twitter"  },
];

const socialFns = {
  google:   signInWithGoogle,
  facebook: signInWithFacebook,
  apple:    signInWithApple,
  twitter:  signInWithTwitter,
};

export default function Login({ onNext }) {
  const { login, t } = useApp();
  const [mode, setMode] = useState("phone"); // phone | email
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setupRecaptcha("recaptcha-container");
  }, []);

  const handleSendOtp = async () => {
    setError(""); setLoading(true);
    try {
      await sendOtp(phone);
      onNext(phone);
    } catch (err) {
      setError(
        err?.code === "auth/too-many-requests" ? "Too many attempts — try later"
        : err?.code === "auth/invalid-phone-number" ? "Invalid phone number"
        : err?.code === "auth/billing-not-enabled" || err?.code === "auth/operation-not-allowed"
          ? "Phone OTP is not available yet — please use Google or Email login"
        : `Failed to send OTP — ${err?.code || err?.message || "please try again"}`
      );
    } finally { setLoading(false); }
  };

  const handleEmailLogin = async () => {
    setError(""); setLoading(true);
    try {
      const fbUser = await signInWithEmail(email, password);
      login({ email, uid: fbUser.uid, name: fbUser.displayName || "", joined: Date.now() });
    } catch (err) {
      setError(
        err?.code === "auth/invalid-email" ? "Invalid email address"
        : err?.code === "auth/wrong-password" ? "Wrong password"
        : err?.code === "auth/weak-password" ? "Password must be at least 6 characters"
        : "Login failed — please try again"
      );
    } finally { setLoading(false); }
  };

  const handleSocial = async (id) => {
    setError(""); setSocialLoading(id);
    try {
      const fbUser = await socialFns[id]();
      login({
        uid: fbUser.uid,
        name: fbUser.displayName || "",
        email: fbUser.email || "",
        phone: fbUser.phoneNumber?.replace("+91", "") || "",
        photo: fbUser.photoURL || "",
        provider: id,
        joined: Date.now(),
      });
    } catch (err) {
      if (err?.code !== "auth/popup-closed-by-user") {
        setError(
          err?.code === "auth/account-exists-with-different-credential"
          ? "Account exists with a different sign-in method"
          : `${id} sign-in failed — please try again`
        );
      }
    } finally { setSocialLoading(null); }
  };

  const phoneOk = phone.length === 10 && !loading;
  const emailOk = email.includes("@") && password.length >= 6 && !loading;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "44px 22px 24px" }}>
      <div id="recaptcha-container" />

      {/* Logo */}
      <div style={{ width: 64, height: 64, borderRadius: 20, margin: "0 auto 24px",
        display: "grid", placeItems: "center",
        background: `linear-gradient(150deg, ${T.primary}, ${T.primaryDark})`,
        boxShadow: T.shadowMd }}>
        <Icon name="Sprout" size={32} color="#fff" strokeWidth={2.3} />
      </div>
      <h1 style={{ fontFamily: T.display, fontSize: 26, fontWeight: 800,
        margin: "0 0 6px", textAlign: "center", color: T.ink }}>{t("login")}</h1>
      <p style={{ fontSize: 14, color: T.inkSoft, margin: "0 0 24px", textAlign: "center" }}>
        {t("loginSub")}
      </p>

      {/* Social buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {SOCIAL.map((s) => (
          <button key={s.id} onClick={() => handleSocial(s.id)}
            disabled={!!socialLoading}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "12px 10px", borderRadius: 14, border: `1.5px solid ${T.border}`,
              background: T.surface, cursor: "pointer", fontFamily: T.body,
              fontSize: 13.5, fontWeight: 600, color: T.ink,
              opacity: socialLoading && socialLoading !== s.id ? 0.5 : 1,
              transition: "all 0.2s",
            }}>
            <Icon name={s.icon} size={18} style={{ color: s.color }} />
            {socialLoading === s.id ? "…" : s.label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0 20px" }}>
        <div style={{ flex: 1, height: 1, background: T.border }} />
        <span style={{ fontSize: 12, color: T.inkFaint, fontWeight: 600 }}>OR</span>
        <div style={{ flex: 1, height: 1, background: T.border }} />
      </div>

      {/* Mode tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 18, borderRadius: 12,
        overflow: "hidden", border: `1.5px solid ${T.border}` }}>
        {[["phone", "Phone"], ["email", "Email"]].map(([id, label]) => (
          <button key={id} onClick={() => { setMode(id); setError(""); }}
            style={{
              flex: 1, padding: "10px 0", border: "none", cursor: "pointer",
              fontFamily: T.body, fontSize: 13.5, fontWeight: 700,
              background: mode === id ? T.primary : "transparent",
              color: mode === id ? "#fff" : T.inkSoft,
              transition: "all 0.2s",
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Phone input */}
      {mode === "phone" && (
        <Input label={t("phone")} value={phone}
          onChange={(v) => { setPhone(v.replace(/\D/g, "").slice(0, 10)); setError(""); }}
          inputMode="numeric" prefix="+91" placeholder="98765 43210" />
      )}

      {/* Email inputs */}
      {mode === "email" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label="Email" value={email}
            onChange={(v) => { setEmail(v.trim()); setError(""); }}
            inputMode="email" placeholder="you@gmail.com" />
          <Input label="Password" value={password}
            onChange={(v) => { setPassword(v); setError(""); }}
            type="password" placeholder="Min 6 characters" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12,
          padding: "10px 14px", borderRadius: 12,
          background: T.redSoft, border: `1px solid ${T.red}33` }}>
          <Icon name="AlertCircle" size={15} style={{ color: T.red, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: T.red }}>{error}</span>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Submit */}
      {mode === "phone" && (
        <Button full size="lg" disabled={!phoneOk} onClick={handleSendOtp}>
          {loading ? "Sending…" : t("sendOtp")}
        </Button>
      )}
      {mode === "email" && (
        <Button full size="lg" disabled={!emailOk} onClick={handleEmailLogin}>
          {loading ? "Signing in…" : "Continue with Email"}
        </Button>
      )}

      <p style={{ fontSize: 11.5, color: T.inkFaint, textAlign: "center", marginTop: 16, lineHeight: 1.5 }}>
        {mode === "phone"
          ? "We'll send a one-time code to verify your number."
          : "Sign in or create a new account with your email."}
      </p>
    </div>
  );
}
