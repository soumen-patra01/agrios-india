/* Generic time-to-live cache layered over the namespaced `storage` util.
   Offline-first: reads always return the last cached value (even if stale) via
   `getStale`, so rural users on flaky networks still see their last forecast.
   Reused by weather now; market / schemes plug in during Phase 4B. */

import { storage } from "../../utils/storage.js";

const PREFIX = "cache:";

export const ttlCache = {
  /* Store a value with a TTL (ms). */
  set(key, value, ttlMs) {
    storage.set(PREFIX + key, { v: value, exp: Date.now() + ttlMs, ts: Date.now() });
  },

  /* Fresh value only, or undefined when missing/expired. */
  get(key) {
    const e = storage.get(PREFIX + key, null);
    if (!e) return undefined;
    if (Date.now() > e.exp) return undefined;
    return e.v;
  },

  /* Last value regardless of freshness, with metadata — for offline fallback. */
  getStale(key) {
    const e = storage.get(PREFIX + key, null);
    if (!e) return undefined;
    return { value: e.v, ts: e.ts, stale: Date.now() > e.exp };
  },

  remove(key) { storage.remove(PREFIX + key); },
};
