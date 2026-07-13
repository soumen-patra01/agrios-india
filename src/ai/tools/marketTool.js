/* Market tool — gives the AI agent real MSP and seasonal price band data.
   Replaces the notConnected("market") stub from Phase 3A.
   Data is clearly labelled as MSP/seasonal band, not today's live mandi price. */

import { searchCrops, getCrop } from "../../services/market/cropData.js";

export const marketTool = {
  name: "market",
  description:
    "Look up the official MSP (Minimum Support Price) and typical seasonal price band for a crop. " +
    "Use this when farmers ask about prices, selling decisions, or MSP rates. " +
    "IMPORTANT: this returns the government-declared MSP and historical seasonal bands — NOT today's live mandi price. " +
    "Always tell the farmer this, and advise them to check today's actual rate at their local mandi, eNAM, or Agmarknet.",
  input_schema: {
    type: "object",
    properties: {
      crop: { type: "string", description: "Crop name in English, Hindi, or Bengali" },
    },
    required: ["crop"],
  },

  async run({ crop }) {
    if (!crop) return JSON.stringify({ error: "crop name required" });

    const results = searchCrops(crop);
    if (results.length === 0) {
      return JSON.stringify({
        found: false,
        message: `No price data found for "${crop}". This may be a local variety or produce not in our database.`,
      });
    }

    const best = results[0];
    const msp = best.msp ? `₹${best.msp}/qtl (Govt. MSP 2024-25)` : "No MSP declared (price determined by market)";
    const band = `₹${best.bandLow}–₹${best.bandHigh}/${best.unit} (typical seasonal range — not guaranteed)`;

    return JSON.stringify({
      found: true,
      cropName: best.name,
      unit: best.unit,
      season: best.season,
      msp: best.msp || null,
      mspLabel: msp,
      seasonalBand: band,
      note: best.note || null,
      disclaimer: "This is official MSP + historical seasonal data, NOT today's live mandi price. For today's actual rate, check: your local mandi board, eNAM app (enam.gov.in), or Agmarknet (agmarknet.nic.in).",
      alternatives: results.slice(1, 3).map((c) => ({ name: c.name, msp: c.msp, band: `₹${c.bandLow}–${c.bandHigh}` })),
    });
  },
};
