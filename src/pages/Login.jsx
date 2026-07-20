import { useState, useEffect } from "react";
import { T } from "../theme/ThemeProvider.jsx";
import Icon from "../components/Icon.jsx";
import { useApp } from "../store/AppStore.jsx";
import {
  setupRecaptcha,
  sendOtp,
  signInWithGoogle,
  signInWithApple,
  signInWithEmail,
} from "../services/firebase/auth.js";

export default function Login() {
  const { login, t } = useApp();
  const [step, setStep] = useState("main");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { setupRecaptcha("recaptcha-container"); }, []);

  const handleSocial = async (id, fn) => {
    setError(""); setSocialLoading(id);
    try {
      const fbUser = await fn();
      login({
        uid: fbUser.uid, name: fbUser.displayName || "",
        email: fbUser.email || "", phone: fbUser.phoneNumber?.replace("+91", "") || "",
        photo: fbUser.photoURL || "", provider: id, joined: Date.now(),
      });
    } catch (err) {
      if (err?.code !== "auth/popup-closed-by-user") {
        setError(err?.code === "auth/account-exists-with-different-credential"
          ? "Account exists with a different sign-in method"
          : "Sign-in failed — please try again");
      }
    } finally { setSocialLoading(null); }
  };

  const handleEmailContinue = async () => {
    if (step === "main") { setStep("email"); setError(""); return; }
    if (!email.includes("@") || password.length < 6) return;
    setError(""); setLoading(true);
    try {
      const fbUser = await signInWithEmail(email, password);
      login({ email, uid: fbUser.uid, name: fbUser.displayName || "", joined: Date.now() });
    } catch (err) {
      setError(
        err?.code === "auth/invalid-email" ? "Invalid email address"
        : err?.code === "auth/wrong-password" || err?.code === "auth/invalid-credential" ? "Incorrect email or password"
        : err?.code === "auth/weak-password" ? "Password must be at least 6 characters"
        : `Login failed — ${err?.code || "please try again"}`
      );
    } finally { setLoading(false); }
  };

  const disabled = !!socialLoading || loading;

  const btnStyle = {
    width: "100%", display: "flex", alignItems: "center", gap: 12,
    padding: "13px 16px", borderRadius: 12, cursor: "pointer",
    fontFamily: "inherit", fontSize: 15, fontWeight: 500,
    background: "#f5f5f5", border: "1px solid #e5e5e5", color: "#1a1a1a",
    transition: "background 0.15s",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, background: "#1a1a1a" }}>
      <div id="recaptcha-container" />

      <div style={{ width: "100%", maxWidth: 400, background: "#fff", borderRadius: 20,
        padding: "32px 28px", position: "relative" }}>

        {step === "main" && (
          <>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 10px", color: "#1a1a1a",
              textAlign: "center", fontFamily: "inherit" }}>
              Log in or sign up
            </h1>
            <p style={{ fontSize: 14, color: "#6b6b6b", margin: "0 0 28px", textAlign: "center", lineHeight: 1.5 }}>
              Smart farming tools, market prices, AI advice, and more.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={() => handleSocial("google", signInWithGoogle)} disabled={disabled}
                style={{ ...btnStyle, opacity: disabled && socialLoading !== "google" ? 0.5 : 1 }}>
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                {socialLoading === "google" ? "Signing in…" : "Continue with Google"}
              </button>

              <button onClick={() => handleSocial("apple", signInWithApple)} disabled={disabled}
                style={{ ...btnStyle, opacity: disabled && socialLoading !== "apple" ? 0.5 : 1 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#1a1a1a"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.51-3.23 0-1.44.64-2.2.45-3.06-.4C3.79 16.17 4.36 9.53 8.7 9.28c1.23.06 2.08.72 2.8.75.99-.2 1.94-.78 3-.66 1.28.15 2.24.69 2.87 1.7-2.63 1.58-2.01 5.05.36 6.02-.5 1.32-.93 2.61-1.68 3.19zM12.03 9.22c-.13-2.62 2.08-4.88 4.47-5.08.32 2.95-2.67 5.16-4.47 5.08z"/></svg>
                {socialLoading === "apple" ? "Signing in…" : "Continue with Apple"}
              </button>

              <button onClick={() => setStep("phone")} disabled={disabled} style={btnStyle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                Continue with phone
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "6px 0" }}>
                <div style={{ flex: 1, height: 1, background: "#e5e5e5" }} />
                <span style={{ fontSize: 12, color: "#999", fontWeight: 400 }}>OR</span>
                <div style={{ flex: 1, height: 1, background: "#e5e5e5" }} />
              </div>

              <input value={email} onChange={(e) => { setEmail(e.target.value.trim()); setError(""); }}
                placeholder="Email address" type="email"
                style={{ width: "100%", padding: "13px 16px", borderRadius: 12, fontSize: 15,
                  border: "1px solid #e5e5e5", background: "#f5f5f5", color: "#1a1a1a",
                  fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                onFocus={(e) => e.target.style.borderColor = "#10a37f"}
                onBlur={(e) => e.target.style.borderColor = "#e5e5e5"} />

              <button onClick={handleEmailContinue} disabled={!email.includes("@")}
                style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: "none",
                  background: "#1a1a1a", color: "#fff", fontSize: 15, fontWeight: 600,
                  fontFamily: "inherit", cursor: "pointer",
                  opacity: email.includes("@") ? 1 : 0.35 }}>
                Continue
              </button>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => handleSocial("facebook", signInWithGoogle)} disabled={disabled}
                  style={{ ...btnStyle, flex: 1, justifyContent: "center", padding: "12px 0" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Facebook
                </button>
                <button onClick={() => handleSocial("twitter", signInWithGoogle)} disabled={disabled}
                  style={{ ...btnStyle, flex: 1, justifyContent: "center", padding: "12px 0" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1a1a1a"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  X
                </button>
              </div>
            </div>
          </>
        )}

        {step === "email" && (
          <>
            <button onClick={() => { setStep("main"); setError(""); }}
              style={{ position: "absolute", top: 16, left: 16, background: "none", border: "none",
                cursor: "pointer", fontSize: 20, color: "#999", padding: 4 }}>←</button>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 28px", color: "#1a1a1a",
              textAlign: "center", fontFamily: "inherit" }}>Email login</h1>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input value={email} onChange={(e) => { setEmail(e.target.value.trim()); setError(""); }}
                placeholder="Email address" type="email" autoFocus
                style={{ width: "100%", padding: "13px 16px", borderRadius: 12, fontSize: 15,
                  border: "1px solid #e5e5e5", background: "#f5f5f5", color: "#1a1a1a",
                  fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                onFocus={(e) => e.target.style.borderColor = "#10a37f"}
                onBlur={(e) => e.target.style.borderColor = "#e5e5e5"} />

              <input value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Password (min 6 characters)" type="password"
                style={{ width: "100%", padding: "13px 16px", borderRadius: 12, fontSize: 15,
                  border: "1px solid #e5e5e5", background: "#f5f5f5", color: "#1a1a1a",
                  fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                onFocus={(e) => e.target.style.borderColor = "#10a37f"}
                onBlur={(e) => e.target.style.borderColor = "#e5e5e5"} />

              <button onClick={handleEmailContinue}
                disabled={!email.includes("@") || password.length < 6 || loading}
                style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: "none",
                  background: "#1a1a1a", color: "#fff", fontSize: 15, fontWeight: 600,
                  fontFamily: "inherit", cursor: "pointer",
                  opacity: email.includes("@") && password.length >= 6 && !loading ? 1 : 0.35 }}>
                {loading ? "Signing in…" : "Continue"}
              </button>
            </div>
          </>
        )}

        {step === "phone" && (
          <>
            <button onClick={() => { setStep("main"); setError(""); }}
              style={{ position: "absolute", top: 16, left: 16, background: "none", border: "none",
                cursor: "pointer", fontSize: 20, color: "#999", padding: 4 }}>←</button>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 28px", color: "#1a1a1a",
              textAlign: "center", fontFamily: "inherit" }}>Phone login</h1>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ padding: "13px 14px", borderRadius: 12, border: "1px solid #e5e5e5",
                  background: "#f5f5f5", color: "#6b6b6b", fontSize: 15, fontFamily: "inherit", flexShrink: 0 }}>
                  +91
                </div>
                <input placeholder="Mobile number" autoFocus
                  style={{ flex: 1, padding: "13px 16px", borderRadius: 12, fontSize: 15,
                    border: "1px solid #e5e5e5", background: "#f5f5f5", color: "#1a1a1a",
                    fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                  onFocus={(e) => e.target.style.borderColor = "#10a37f"}
                  onBlur={(e) => e.target.style.borderColor = "#e5e5e5"} />
              </div>

              <div style={{ padding: "10px 14px", borderRadius: 10, background: "#fff8ed",
                fontSize: 13, color: "#b25e00", textAlign: "center" }}>
                Phone login requires Firebase Blaze plan — use Google or Email instead
              </div>
            </div>
          </>
        )}

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14,
            padding: "12px 14px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca" }}>
            <Icon name="AlertCircle" size={16} style={{ color: "#dc2626", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "#dc2626" }}>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
