/* Agronomic alert engine — turns a normalized forecast into farmer-facing
   advisories (spraying, irrigation, heat/cold/wind, disease pressure).
   Pure function, no I/O, easy to unit-test. Severity: danger | warn | good | info. */

import { isThunder, isHeavyRain } from "./wmo.js";

/* Look at the next `hours` of hourly data. */
const window = (hourly, hours) => (hourly || []).slice(0, hours);

export function buildAlerts(weather) {
  if (!weather) return [];
  const alerts = [];
  const cur = weather.current || {};
  const next24 = window(weather.hourly, 24);
  const today = (weather.daily || [])[0] || {};

  const maxPrecipProb = Math.max(0, ...next24.map((h) => h.precipProb ?? 0));
  const thunderSoon = next24.some((h) => isThunder(h.weatherCode));
  const heavyRainSoon = next24.some((h) => isHeavyRain(h.weatherCode)) || (today.precipSum ?? 0) >= 20;
  const maxWind = Math.max(cur.windSpeed || 0, today.windMax || 0);

  // --- Storms (most urgent) ---
  if (thunderSoon) {
    alerts.push({
      id: "storm", severity: "danger", icon: "CloudLightning",
      title: "Thunderstorm likely",
      body: "Storms expected within 24h. Avoid field work, secure livestock and shelter equipment.",
    });
  }

  // --- Rain / spraying ---
  if (heavyRainSoon || maxPrecipProb >= 70) {
    alerts.push({
      id: "spray-hold", severity: "warn", icon: "Umbrella",
      title: "Hold off on spraying",
      body: `Rain likely within 24h (${maxPrecipProb}% chance). Sprays will wash off — wait for a dry window.`,
    });
  } else if (maxPrecipProb <= 20 && maxWind < 15 && cur.temp <= 34) {
    alerts.push({
      id: "spray-ok", severity: "good", icon: "SprayCan",
      title: "Good spraying window",
      body: "Low rain chance and gentle wind — a good time to spray or apply foliar nutrients.",
    });
  }

  // --- Wind / drone ---
  if (maxWind >= 30) {
    alerts.push({
      id: "wind", severity: "warn", icon: "Wind",
      title: "Strong winds",
      body: `Winds up to ${maxWind} km/h. Avoid drone or boom spraying — drift will waste chemical and harm neighbours.`,
    });
  }

  // --- Heat ---
  if ((today.tempMax ?? cur.temp) >= 40) {
    alerts.push({
      id: "heat", severity: "danger", icon: "Thermometer",
      title: "Heat stress risk",
      body: "Very high temperature today. Irrigate in the early morning or evening and give livestock shade and water.",
    });
  }

  // --- Cold / frost ---
  if ((today.tempMin ?? cur.temp) <= 5) {
    alerts.push({
      id: "cold", severity: "warn", icon: "Snowflake",
      title: "Cold / frost risk",
      body: "Low temperatures tonight. Protect nurseries and sensitive crops; light irrigation can reduce frost damage.",
    });
  }

  // --- Fungal disease pressure ---
  if ((cur.humidity ?? 0) >= 85 && cur.temp >= 20 && cur.temp <= 32 && maxPrecipProb >= 40) {
    alerts.push({
      id: "disease", severity: "warn", icon: "Bug",
      title: "Fungal disease pressure",
      body: "Warm, humid and wet — conditions favour fungal disease. Scout crops and consider a preventive spray after the rain.",
    });
  }

  return alerts;
}
