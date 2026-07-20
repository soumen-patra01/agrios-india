import { useState, useEffect } from "react";
import { T } from "../theme/ThemeProvider.jsx";
import Icon from "../components/Icon.jsx";
import { useApp } from "../store/AppStore.jsx";
import {
  setupRecaptcha,
  sendOtp,
  verifyOtp,
  signInWithGoogle,
  signInWithApple,
  signInWithEmail,
} from "../services/firebase/auth.js";

export default function Login() {
  const { login, t } = useApp();
  const [tab, setTab] = useState("phone"); // phone | email
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setupRecaptcha("recaptcha-container"); }, []);

  const doLogin = (fbUser, provider) => {
    login({
      uid: fbUser.uid, name: fbUser.displayName || "",
      email: fbUser.email || "", phone: fbUser.phoneNumber?.replace("+91", "") || "",
      photo: fbUser.photoURL || "", provider, joined: Date.now(),
    });
  };

  const handleSocial = async (id, fn) => {
    setError(""); setLoading(true);
    try { doLogin(await fn(), id); }
    catch (err) {
      if (err?.code !== "auth/popup-closed-by-user")
        setError(err?.code === "auth/account-exists-with-different-credential"
          ? "Account exists with a different sign-in method" : "Sign-in failed — please try again");
    } finally { setLoading(false); }
  };

  const handleSendOtp = async () => {
    if (phone.length < 10) return;
    setError(""); setLoading(true);
    try {
      await sendOtp(phone);
      setOtpSent(true);
    } catch (err) {
      setError(err?.code === "auth/billing-not-enabled"
        ? "Phone login requires Firebase Blaze plan — use Google or Email"
        : `Failed to send OTP — ${err?.code || "try again"}`);
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) return;
    setError(""); setLoading(true);
    try { doLogin(await verifyOtp(otp), "phone"); }
    catch { setError("Invalid OTP — please try again"); }
    finally { setLoading(false); }
  };

  const handleEmail = async () => {
    if (!email.includes("@") || password.length < 6) return;
    setError(""); setLoading(true);
    try { doLogin(await signInWithEmail(email, password), "email"); }
    catch (err) {
      setError(
        err?.code === "auth/wrong-password" || err?.code === "auth/invalid-credential" ? "Incorrect email or password"
        : err?.code === "auth/weak-password" ? "Password must be at least 6 characters"
        : `Login failed — ${err?.code || "please try again"}`
      );
    } finally { setLoading(false); }
  };

  const socials = [
    { id: "google", label: "Google", fn: signInWithGoogle,
      icon: <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg> },
    { id: "facebook", label: "Facebook",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
    { id: "apple", label: "Apple", fn: signInWithApple,
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.51-3.23 0-1.44.64-2.2.45-3.06-.4C3.79 16.17 4.36 9.53 8.7 9.28c1.23.06 2.08.72 2.8.75.99-.2 1.94-.78 3-.66 1.28.15 2.24.69 2.87 1.7-2.63 1.58-2.01 5.05.36 6.02-.5 1.32-.93 2.61-1.68 3.19zM12.03 9.22c-.13-2.62 2.08-4.88 4.47-5.08.32 2.95-2.67 5.16-4.47 5.08z"/></svg> },
    { id: "twitter", label: "Twitter",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="#1DA1F2"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg> },
  ];

  const btnSocial = {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "13px 0", borderRadius: 12, cursor: "pointer",
    fontFamily: "inherit", fontSize: 13.5, fontWeight: 600,
    background: "transparent", border: `1.5px solid ${T.line}`, color: T.ink,
    transition: "all 0.15s ease",
  };

  const inputStyle = {
    width: "100%", padding: "15px 16px", borderRadius: 12, fontSize: 15,
    border: `1.5px solid ${T.line}`, background: T.surface, color: T.ink,
    fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "32px 20px", background: T.bg }}>
      <div id="recaptcha-container" />
      <div style={{ width: "100%", maxWidth: 380, display: "flex", flexDirection: "column", alignItems: "center" }}>

        <img src="/icon-192.png" alt="AgriOS" style={{ width: 56, height: 56, borderRadius: 16, marginBottom: 18 }} />

        <h1 style={{ fontFamily: T.display, fontSize: 26, fontWeight: 800, margin: "0 0 6px", color: T.ink, textAlign: "center" }}>
          {t("login")}
        </h1>
        <p style={{ fontSize: 13.5, color: T.inkSoft, margin: "0 0 28px", textAlign: "center" }}>
          {tab === "phone" ? t("enterPhone") || "Enter your mobile number to continue" : "Sign in with email and password"}
        </p>

        {/* Social 2x2 grid */}
        <div style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 4 }}>
          {socials.map((s) => (
            <button key={s.id} disabled={loading}
              onClick={() => s.fn ? handleSocial(s.id, s.fn) : setError(`${s.label} login not configured yet`)}
              style={{ ...btnSocial, opacity: loading ? 0.5 : 1 }}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* OR divider */}
        <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, margin: "14px 0" }}>
          <div style={{ flex: 1, height: 1, background: T.line }} />
          <span style={{ fontSize: 12, color: T.inkFaint, fontWeight: 600 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: T.line }} />
        </div>

        {/* Phone / Email tabs */}
        <div style={{ width: "100%", display: "flex", gap: 0, marginBottom: 18 }}>
          <button onClick={() => { setTab("phone"); setError(""); }}
            style={{ flex: 1, padding: "11px 0", borderRadius: 999, border: "none", cursor: "pointer",
              fontFamily: "inherit", fontSize: 14, fontWeight: 700,
              background: tab === "phone" ? T.primary : "transparent",
              color: tab === "phone" ? "#fff" : T.inkSoft, transition: "all .15s" }}>
            Phone
          </button>
          <button onClick={() => { setTab("email"); setError(""); }}
            style={{ flex: 1, padding: "11px 0", borderRadius: 999, border: "none", cursor: "pointer",
              fontFamily: "inherit", fontSize: 14, fontWeight: 700,
              background: tab === "email" ? T.primary : "transparent",
              color: tab === "email" ? "#fff" : T.inkSoft, transition: "all .15s" }}>
            Email
          </button>
        </div>

        {/* Phone tab */}
        {tab === "phone" && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: T.inkSoft }}>{t("mobileNumber") || "Mobile number"}</label>
            {!otpSent ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 0, borderRadius: 12,
                  border: `1.5px solid ${T.line}`, background: T.surface, overflow: "hidden" }}>
                  <span style={{ padding: "0 14px", fontSize: 15, color: T.inkSoft, fontWeight: 600, flexShrink: 0 }}>+91</span>
                  <input value={phone} onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setError(""); }}
                    placeholder="98765 43210" type="tel"
                    style={{ flex: 1, padding: "15px 14px 15px 0", border: "none", background: "transparent",
                      color: T.ink, fontSize: 15, fontFamily: "inherit", outline: "none" }} />
                </div>
                <div style={{ height: 40 }} />
                <button onClick={handleSendOtp} disabled={phone.length < 10 || loading}
                  style={{ width: "100%", padding: "15px 0", borderRadius: 14, border: "none", cursor: "pointer",
                    fontFamily: "inherit", fontSize: 17, fontWeight: 800,
                    background: T.primary, color: "#fff",
                    opacity: phone.length >= 10 && !loading ? 1 : 0.45, transition: "opacity .15s" }}>
                  {loading ? "Sending…" : t("sendOtp") || "OTP Send"}
                </button>
                <p style={{ fontSize: 12, color: T.inkFaint, textAlign: "center", margin: "8px 0 0", lineHeight: 1.5 }}>
                  We'll send a one-time code to verify your number.
                </p>
              </>
            ) : (
              <>
                <p style={{ fontSize: 13, color: T.inkSoft }}>OTP sent to +91 {phone}</p>
                <input value={otp} onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                  placeholder="Enter 6-digit OTP" type="tel" autoFocus style={inputStyle} />
                <button onClick={handleVerifyOtp} disabled={otp.length < 6 || loading}
                  style={{ width: "100%", padding: "15px 0", borderRadius: 14, border: "none", cursor: "pointer",
                    fontFamily: "inherit", fontSize: 17, fontWeight: 800,
                    background: T.primary, color: "#fff",
                    opacity: otp.length >= 6 && !loading ? 1 : 0.45 }}>
                  {loading ? "Verifying…" : "Verify OTP"}
                </button>
                <button onClick={() => { setOtpSent(false); setOtp(""); setError(""); }}
                  style={{ background: "none", border: "none", color: T.inkSoft, fontSize: 13, fontWeight: 600,
                    cursor: "pointer", padding: "8px 0", fontFamily: "inherit" }}>
                  ← Change number
                </button>
              </>
            )}
          </div>
        )}

        {/* Email tab */}
        {tab === "email" && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: T.inkSoft }}>Email</label>
            <input value={email} onChange={(e) => { setEmail(e.target.value.trim()); setError(""); }}
              placeholder="you@example.com" type="email" autoFocus style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = T.primary}
              onBlur={(e) => e.target.style.borderColor = T.line} />

            <label style={{ fontSize: 13, fontWeight: 700, color: T.inkSoft }}>Password</label>
            <input value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="Min 6 characters" type="password" style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = T.primary}
              onBlur={(e) => e.target.style.borderColor = T.line} />

            <button onClick={handleEmail} disabled={!email.includes("@") || password.length < 6 || loading}
              style={{ width: "100%", padding: "15px 0", borderRadius: 14, border: "none", cursor: "pointer",
                fontFamily: "inherit", fontSize: 17, fontWeight: 800, marginTop: 8,
                background: T.primary, color: "#fff",
                opacity: email.includes("@") && password.length >= 6 && !loading ? 1 : 0.45 }}>
              {loading ? "Signing in…" : "Continue"}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, marginTop: 16,
            padding: "12px 14px", borderRadius: 12,
            background: T.redSoft, border: `1px solid ${T.red}33` }}>
            <Icon name="AlertCircle" size={16} style={{ color: T.red, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: T.red }}>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
