import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { preferences } from "./preferences.js";
import { applyAppearance } from "./appearance.js";
import { useTheme } from "../theme/ThemeProvider.jsx";

/* Firebase (auth + firestore) loaded lazily — preference cloud sync is a
   background nicety and must not block the initial render. */
const loadAuth = () => import("../services/firebase/auth.js");
const loadPrefsSync = () => import("./prefsSync.js");

const PrefsCtx = createContext(null);
export const usePrefs = () => useContext(PrefsCtx);

export function PreferencesProvider({ children }) {
  const theme = useTheme();
  const [prefs, setPrefs] = useState(() => preferences.all());

  // Re-render on any preference change.
  useEffect(() => preferences.subscribe(setPrefs), []);

  // Keep the base theme (light/dark/system) in sync with the pref.
  useEffect(() => {
    if (prefs.appearance.theme !== theme.mode) theme.setTheme(prefs.appearance.theme);
  }, [prefs.appearance.theme]);

  // Apply appearance CSS vars whenever appearance or the resolved theme changes.
  useEffect(() => {
    applyAppearance(prefs.appearance, theme.resolved);
  }, [prefs.appearance, theme.resolved]);

  // Accessibility: reduce motion.
  useEffect(() => {
    document.documentElement.dataset.motion = prefs.accessibility.reduceMotion ? "reduce" : "full";
  }, [prefs.accessibility.reduceMotion]);

  // Cloud sync: pull on sign-in (new-device restore), push on change (debounced).
  // prefsSync drags in the Firestore SDK, and neither direction is reachable
  // until somebody is actually signed in — so it is loaded from inside the auth
  // callback, never at mount. Eagerly pairing it with loadAuth() here used to
  // put ~460kB of Firestore on the first-paint path of every signed-out session.
  const signedIn = useRef(false);
  useEffect(() => {
    let unsub = () => {};
    let cancelled = false;
    loadAuth().then(({ onAuthChange }) => {
      if (cancelled) return;
      unsub = onAuthChange(async (user) => {
        signedIn.current = !!user;
        if (!user) return;
        try {
          const { loadPrefsCloud } = await loadPrefsSync();
          const cloud = await loadPrefsCloud();
          if (cloud) preferences.replace(cloud);
        } catch { /* offline / chunk fetch failed — local prefs stay the source */ }
      });
    }).catch(() => {});
    return () => { cancelled = true; unsub(); };
  }, []);

  const saveTimer = useRef(null);
  useEffect(() => {
    clearTimeout(saveTimer.current);
    // "off" = local only: don't push preferences to the cloud.
    if (prefs.offline.mode === "off") return;
    saveTimer.current = setTimeout(() => {
      // Signed out, savePrefsCloud() no-ops on its own null ref — skip the
      // import entirely so the SDK is never fetched for a session that has
      // nowhere to push to.
      if (!signedIn.current) return;
      loadPrefsSync().then(({ savePrefsCloud }) => savePrefsCloud(preferences.all())).catch(() => {});
    }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [prefs]);

  const set        = useCallback((path, value) => preferences.set(path, value), []);
  const reset      = useCallback(() => preferences.reset(), []);
  const exportPrefs = useCallback(() => preferences.export(), []);
  const importPrefs = useCallback((json) => preferences.import(json), []);

  return (
    <PrefsCtx.Provider value={{ prefs, set, reset, exportPrefs, importPrefs }}>
      {/* Global appearance CSS driven by the vars applyAppearance() sets. */}
      <style>{`
        #root { zoom: var(--ag-zoom, 1); }
        :root[data-contrast="high"] {
          --ag-line: color-mix(in srgb, var(--ag-ink) 34%, transparent);
          --ag-line-soft: color-mix(in srgb, var(--ag-ink) 22%, transparent);
          --ag-ink-soft: color-mix(in srgb, var(--ag-ink) 78%, var(--ag-bg));
        }
        :root[data-motion="reduce"] *, :root[data-motion="reduce"] *::before, :root[data-motion="reduce"] *::after {
          animation-duration: .001ms !important; animation-iteration-count: 1 !important;
          transition-duration: .001ms !important; scroll-behavior: auto !important;
        }
      `}</style>
      {children}
    </PrefsCtx.Provider>
  );
}
