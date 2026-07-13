/* Thin, safe wrapper over localStorage. Phase 1 stores only UI preferences and
   onboarding flags locally — no user data leaves the device, no backend. */
const NS = "agrios:";

export const storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(NS + key);
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(NS + key, JSON.stringify(value)); return true; }
    catch { return false; }
  },
  remove(key) { try { localStorage.removeItem(NS + key); } catch {} },
  clear() {
    try {
      Object.keys(localStorage).filter((k) => k.startsWith(NS)).forEach((k) => localStorage.removeItem(k));
    } catch {}
  },
};
