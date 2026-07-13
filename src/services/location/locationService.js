/* Location service — GPS, manual place selection, and saved farm locations.
   Local-first (namespaced storage); syncs to the backend profile in a later
   phase. The "active" location drives weather, nearby services and the AI's
   context. Never stores anything but coordinates + a chosen label. */

import { storage } from "../../utils/storage.js";
import { reverseGeocode } from "./geocoding.js";

const FARMS_KEY = "loc:farms";
const ACTIVE_KEY = "loc:active";

const uid = () => "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export const locationService = {
  /* ---- GPS ---- */
  supportsGPS() { return typeof navigator !== "undefined" && "geolocation" in navigator; },

  /* Resolve the device's current position → { lat, lon, name }. */
  currentPosition({ timeout = 10000 } = {}) {
    return new Promise((resolve, reject) => {
      if (!this.supportsGPS()) return reject(new Error("GPS not available on this device"));
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lon } = pos.coords;
          const name = await reverseGeocode(lat, lon).catch(() => null);
          resolve({ lat, lon, name: name || "Current location", accuracy: pos.coords.accuracy });
        },
        (err) => reject(new Error(err.code === 1 ? "Location permission denied" : "Couldn't get your location")),
        { enableHighAccuracy: true, timeout, maximumAge: 5 * 60 * 1000 },
      );
    });
  },

  /* ---- Saved farms ---- */
  list() { return storage.get(FARMS_KEY, []); },

  add({ name, lat, lon }) {
    const farms = this.list();
    const farm = { id: uid(), name: name || "My farm", lat, lon, ts: Date.now() };
    const next = [farm, ...farms];
    storage.set(FARMS_KEY, next);
    if (!storage.get(ACTIVE_KEY, null)) this.setActive(farm.id);
    return farm;
  },

  rename(id, name) {
    storage.set(FARMS_KEY, this.list().map((f) => (f.id === id ? { ...f, name } : f)));
  },

  remove(id) {
    storage.set(FARMS_KEY, this.list().filter((f) => f.id !== id));
    if (storage.get(ACTIVE_KEY, null) === id) {
      const first = this.list()[0];
      if (first) this.setActive(first.id); else storage.remove(ACTIVE_KEY);
    }
  },

  /* ---- Active location ---- */
  setActive(id) { storage.set(ACTIVE_KEY, id); },

  getActive() {
    const id = storage.get(ACTIVE_KEY, null);
    const farms = this.list();
    return farms.find((f) => f.id === id) || farms[0] || null;
  },
};
