import { STATES, K, loadKey, saveKey } from "./domain.js";

/* WMO weather code → i18n condition key */
function codeToKey(code) {
  if (code === 0) return "wxClear";
  if (code <= 3) return "wxCloudy";
  if (code === 45 || code === 48) return "wxFog";
  if (code >= 51 && code <= 57) return "wxDrizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "wxRainy";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "wxSnow";
  if (code >= 95) return "wxStorm";
  return "wxCloudy";
}

const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // refetch after 2 hours

/* Returns { temp, condKey, rainChance, wind, live } or null. */
export async function getWeather(stateName) {
  const cached = await loadKey(K.weather, null);
  if (cached && cached.state === stateName && Date.now() - cached.ts < CACHE_TTL_MS) {
    return { ...cached.data, live: true };
  }
  const { lat, lon } = STATES[stateName] || STATES.Other;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code,wind_speed_10m` +
      `&daily=precipitation_probability_max&timezone=auto&forecast_days=2`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("weather http " + res.status);
    const j = await res.json();
    const rainToday = j.daily?.precipitation_probability_max?.[0] ?? 0;
    const rainTomorrow = j.daily?.precipitation_probability_max?.[1] ?? 0;
    const data = {
      temp: Math.round(j.current.temperature_2m),
      condKey: codeToKey(j.current.weather_code),
      rainChance: Math.max(rainToday, rainTomorrow),
      wind: Math.round(j.current.wind_speed_10m),
    };
    await saveKey(K.weather, { state: stateName, ts: Date.now(), data });
    return { ...data, live: true };
  } catch (e) {
    if (cached && cached.state === stateName) return { ...cached.data, live: false };
    return null;
  }
}

/* Spraying/field-work advisory from the forecast. */
export function buildAdvisory(w) {
  if (!w) return null;
  if (w.rainChance >= 60 || w.condKey === "wxRainy" || w.condKey === "wxStorm")
    return { key: "advRain", tone: "warn" };
  if (w.wind >= 20) return { key: "advWind", tone: "warn" };
  return { key: "advClear", tone: "ok" };
}
