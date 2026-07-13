import { createContext, useContext, useCallback, useMemo, useState } from "react";
import { storage } from "../utils/storage.js";
import { makeT } from "../i18n/strings.js";
import { LOCALES } from "../constants/languages.js";

/* Central app store: language, auth/onboarding flow, navigation stack and
   toast queue. Kept deliberately backend-free for Phase 1 — auth is UI-only. */
const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

/* The splash screen always shows on cold load, then routes to the first
   incomplete step of the flow. */
export const nextAfterSplash = () => {
  if (!storage.get("lang")) return "language";
  if (!storage.get("onboarded")) return "onboarding";
  if (!storage.get("user")) return "auth";
  return "app";
};

export function AppProvider({ children }) {
  const [lang, setLangState] = useState(() => storage.get("lang", "en"));
  const [user, setUser] = useState(() => storage.get("user", null));
  const [stage, setStage] = useState("splash"); // splash | language | onboarding | auth | app
  const [tab, setTab] = useState("home");            // home | ai | market | services | profile
  const [stack, setStack] = useState([]);            // pushed detail screens
  const [toasts, setToasts] = useState([]);

  const t = useMemo(() => makeT(lang), [lang]);
  const locale = LOCALES[lang] || "en-IN";

  const setLang = useCallback((code) => { setLangState(code); storage.set("lang", code); }, []);

  const setStageP = useCallback((s) => setStage(s), []);
  const finishOnboarding = useCallback(() => { storage.set("onboarded", true); setStage("auth"); }, []);
  const login = useCallback((u) => { storage.set("user", u); setUser(u); setStage("app"); setTab("home"); }, []);
  const logout = useCallback(() => { storage.remove("user"); setUser(null); setStack([]); setStage("auth"); }, []);

  const push = useCallback((screen) => setStack((s) => [...s, screen]), []);
  const pop = useCallback(() => setStack((s) => s.slice(0, -1)), []);
  const switchTab = useCallback((tk) => { setStack([]); setTab(tk); }, []);

  const toast = useCallback((message, kind = "info") => {
    const id = Date.now() + Math.random();
    setToasts((q) => [...q, { id, message, kind }]);
    setTimeout(() => setToasts((q) => q.filter((x) => x.id !== id)), 2600);
  }, []);
  const dismissToast = useCallback((id) => setToasts((q) => q.filter((x) => x.id !== id)), []);

  const value = useMemo(() => ({
    lang, setLang, t, locale,
    user, login, logout,
    stage, setStage: setStageP, finishOnboarding,
    tab, switchTab, stack, push, pop,
    toasts, toast, dismissToast,
  }), [lang, setLang, t, locale, user, login, logout, stage, setStageP, finishOnboarding,
      tab, switchTab, stack, push, pop, toasts, toast, dismissToast]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
