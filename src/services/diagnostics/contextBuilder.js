/* Context builder — assembles all available context for the diagnostic prompt:
   farm profile + weather + GPS + disease history + government advisory + season. */

import { profileMemory } from "../../ai/memory/profileMemory.js";
import { contextEngine, currentSeason } from "../../ai/context/contextEngine.js";
import { historyService } from "./historyService.js";

export const contextBuilder = {
  async build({ domainId, metadata = {}, species }) {
    const now    = new Date();
    const season = currentSeason(now);

    // Farm profile (sync — never throws)
    const profile     = profileMemory.get();
    const farmContext = contextEngine.build();

    // Weather — best-effort, 3 s timeout
    let weatherContext = "";
    try {
      const { weatherService } = await import("../../services/weather/weatherService.js");
      const wx = await Promise.race([
        weatherService.current(),
        new Promise((_, r) => setTimeout(() => r(new Error("timeout")), 3000)),
      ]);
      if (wx?.temp) {
        weatherContext = `Weather: ${wx.temp}°C, humidity ${wx.humidity ?? "?"}%, ${wx.condition || ""}. `;
      }
    } catch { /* weather unavailable — continue without it */ }

    // GPS from image metadata
    let gpsContext = "";
    if (metadata?.gps) {
      const { lat, lon } = metadata.gps;
      gpsContext = `GPS: ${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E. `;
    } else if (profile?.location) {
      gpsContext = `Location: ${profile.location}. `;
    }

    // Recent history for this domain (adds continuity)
    let historyContext = "";
    try {
      const recent = await historyService.recentForDomain(domainId, 3);
      if (recent.length) {
        const summary = recent
          .map((r) => `${r.primaryDiagnosis} (${r.severity?.label || "?"}, ${r.createdAt?.slice(0, 10)})`)
          .join("; ");
        historyContext = `Previous diagnoses for this domain: ${summary}. `;
      }
    } catch { /* history unavailable */ }

    // Species / crop
    const speciesContext = species ? `Subject: ${species}. ` : "";

    // Assembled context block
    return [
      farmContext,
      weatherContext,
      gpsContext,
      speciesContext,
      historyContext,
      `Current season: ${season} (India).`,
      `Analysis date: ${now.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}.`,
    ].filter(Boolean).join("\n");
  },
};
