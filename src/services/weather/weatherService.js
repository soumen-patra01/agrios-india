/* Weather service — the single entry point the UI and the AI tool both use.
   Handles caching (offline-first), provider selection and alert derivation.
   Keeps the app independent of any specific weather API. */

import { getWeatherProvider } from "./weatherProvider.js";
import { buildAlerts } from "./alerts.js";
import { ttlCache } from "../cache/ttlCache.js";

const TTL = 30 * 60 * 1000; // 30 min — forecasts don't change faster than this
const key = (lat, lon) => `weather:${lat.toFixed(2)},${lon.toFixed(2)}`;

export const weatherService = {
  /* Returns { weather, alerts, fromCache, stale }.
     - Serves fresh cache instantly when available.
     - Falls back to the last cached value if the network fails (rural reality). */
  async get({ lat, lon, providerId, force = false } = {}, { signal } = {}) {
    if (lat == null || lon == null) throw new Error("weatherService.get: lat/lon required");
    const ck = key(lat, lon);

    if (!force) {
      const fresh = ttlCache.get(ck);
      if (fresh) return { weather: fresh, alerts: buildAlerts(fresh), fromCache: true, stale: false };
    }

    try {
      const provider = getWeatherProvider(providerId);
      const weather = await provider.fetchWeather({ lat, lon }, { signal });
      ttlCache.set(ck, weather, TTL);
      return { weather, alerts: buildAlerts(weather), fromCache: false, stale: false };
    } catch (err) {
      const cached = ttlCache.getStale(ck);
      if (cached?.value) {
        return { weather: cached.value, alerts: buildAlerts(cached.value), fromCache: true, stale: true };
      }
      throw err;
    }
  },

  /* Compact summary string for the AI weather tool. */
  async summaryFor({ lat, lon, name }) {
    const { weather, alerts } = await this.get({ lat, lon });
    const c = weather.current;
    const today = weather.daily?.[0] || {};
    const lines = [
      `Location: ${name || `${lat.toFixed(2)}, ${lon.toFixed(2)}`}`,
      `Now: ${c.temp}°C (feels ${c.feelsLike}°C), ${c.condition}, humidity ${c.humidity}%, wind ${c.windSpeed} km/h.`,
      `Today: high ${today.tempMax}°C / low ${today.tempMin}°C, rain chance ${today.precipProb ?? "?"}%.`,
    ];
    if (alerts.length) lines.push("Advisories: " + alerts.map((a) => a.title).join("; ") + ".");
    return lines.join("\n");
  },
};
