/* Open-Meteo weather provider — the default, keyless source.
   Free, no API key, CORS-friendly (works directly from the browser), which is
   ideal for a frontend-first app with no backend yet. Returns the app's
   normalized weather shape so the UI is provider-independent. */

import { describeWeather } from "../wmo.js";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

/* Build the query without leaking anything sensitive — only coordinates. */
function url(lat, lon) {
  const p = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    timezone: "auto",
    current: [
      "temperature_2m", "relative_humidity_2m", "apparent_temperature",
      "precipitation", "weather_code", "wind_speed_10m", "wind_direction_10m",
      "surface_pressure", "is_day",
    ].join(","),
    hourly: ["temperature_2m", "precipitation_probability", "weather_code", "wind_speed_10m"].join(","),
    daily: [
      "weather_code", "temperature_2m_max", "temperature_2m_min",
      "precipitation_probability_max", "precipitation_sum", "wind_speed_10m_max",
      "sunrise", "sunset", "uv_index_max",
    ].join(","),
    forecast_days: "7",
  });
  return `${FORECAST_URL}?${p.toString()}`;
}

export const openMeteoProvider = {
  id: "open-meteo",
  label: "Open-Meteo",
  requiresKey: false,

  async fetchWeather({ lat, lon }, { signal } = {}) {
    const res = await fetch(url(lat, lon), { signal });
    if (!res.ok) throw new Error(`weather provider error (${res.status})`);
    const d = await res.json();
    return normalize(d, lat, lon);
  },
};

function normalize(d, lat, lon) {
  const cur = d.current || {};
  const curDesc = describeWeather(cur.weather_code);

  const H = d.hourly || {};
  const nowIdx = Math.max(0, (H.time || []).findIndex((t) => new Date(t) >= new Date()));
  const hourly = (H.time || []).slice(nowIdx, nowIdx + 24).map((time, i) => {
    const k = nowIdx + i;
    return {
      time,
      temp: Math.round(H.temperature_2m?.[k]),
      precipProb: H.precipitation_probability?.[k] ?? null,
      windSpeed: Math.round(H.wind_speed_10m?.[k]),
      weatherCode: H.weather_code?.[k],
      condition: describeWeather(H.weather_code?.[k]).label,
      icon: describeWeather(H.weather_code?.[k]).icon,
    };
  });

  const D = d.daily || {};
  const daily = (D.time || []).map((date, i) => ({
    date,
    tempMax: Math.round(D.temperature_2m_max?.[i]),
    tempMin: Math.round(D.temperature_2m_min?.[i]),
    precipProb: D.precipitation_probability_max?.[i] ?? null,
    precipSum: D.precipitation_sum?.[i] ?? 0,
    windMax: Math.round(D.wind_speed_10m_max?.[i]),
    uvMax: D.uv_index_max?.[i] ?? null,
    sunrise: D.sunrise?.[i],
    sunset: D.sunset?.[i],
    weatherCode: D.weather_code?.[i],
    condition: describeWeather(D.weather_code?.[i]).label,
    icon: describeWeather(D.weather_code?.[i]).icon,
  }));

  return {
    location: { lat, lon, timezone: d.timezone },
    current: {
      temp: Math.round(cur.temperature_2m),
      feelsLike: Math.round(cur.apparent_temperature),
      humidity: cur.relative_humidity_2m,
      precip: cur.precipitation,
      windSpeed: Math.round(cur.wind_speed_10m),
      windDir: cur.wind_direction_10m,
      pressure: cur.surface_pressure != null ? Math.round(cur.surface_pressure) : null,
      isDay: cur.is_day === 1,
      weatherCode: cur.weather_code,
      condition: curDesc.label,
      icon: curDesc.icon,
      time: cur.time,
    },
    hourly,
    daily,
    provider: "open-meteo",
    updatedAt: Date.now(),
  };
}
