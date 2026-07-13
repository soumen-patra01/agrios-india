/* Weather tool — bridges the AI engine to the real weatherService (Phase 4A).
   The model calls this to ground its advice in the farmer's actual forecast.
   Uses the active saved location; if none is set, it tells the model to ask the
   farmer to set their location rather than inventing data. */

import { weatherService } from "../../services/weather/weatherService.js";
import { locationService } from "../../services/location/locationService.js";

export const weatherTool = {
  name: "weather",
  description:
    "Get the live weather forecast and agronomic advisories for the farmer's saved location. " +
    "Use it whenever weather affects the answer (spraying, irrigation, sowing, harvest, drying, storms). " +
    "Returns current conditions, today's high/low, rain chance and any active advisories.",
  input_schema: {
    type: "object",
    properties: {
      query: { type: "string", description: "What the farmer wants to know about the weather." },
    },
    required: ["query"],
  },
  async run() {
    const loc = locationService.getActive();
    if (!loc) {
      return JSON.stringify({
        unavailable: true,
        message: "No farm location is set. Ask the farmer to set their location in the Weather screen, then I can give a location-specific forecast.",
      });
    }
    try {
      const summary = await weatherService.summaryFor({ lat: loc.lat, lon: loc.lon, name: loc.name });
      return JSON.stringify({ ok: true, location: loc.name, forecast: summary });
    } catch {
      return JSON.stringify({
        unavailable: true,
        message: "Live weather could not be fetched right now. Answer from general seasonal knowledge and tell the farmer to check again when online.",
      });
    }
  },
};
