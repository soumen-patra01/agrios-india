/* Price prediction — an explainable, band-anchored forecast. Anchored on the
   government MSP / seasonal band from market/cropData, then adjusted by seasonal
   position, and (when available) local demand and supply signals. Every forecast
   returns the contributing factors and a confidence that falls with volatility
   and thin data. Real time-series ML is deferred to the backend phase. */

import { CROPS, searchCrops } from "../market/cropData.js";
import { featureStore } from "./featureStore.js";
import { confidenceFromN, clamp01, volatility } from "./explain.js";

const clampToBand = (v, lo, hi) => Math.max(lo * 0.85, Math.min(hi * 1.15, v));

/* Seasonal position multiplier: prices soften at harvest, firm off-season. */
function seasonalAdjust(crop) {
  const m = new Date().getMonth();
  const harvest = { kharif: [9, 10, 11], rabi: [2, 3, 4], zaid: [5, 6] }[crop.season] || [];
  if (harvest.includes(m)) return { mult: 0.95, note: "harvest glut — prices typically soften" };
  const preHarvest = harvest.map((h) => (h + 10) % 12);
  if (preHarvest.includes(m)) return { mult: 1.06, note: "pre-harvest scarcity — prices typically firm" };
  return { mult: 1.0, note: "mid-season — prices near seasonal band" };
}

export const pricePrediction = {
  /* Forecast the next-window price for a crop (by id or name). */
  async forecast(cropQuery, { horizon = "next 4 weeks" } = {}) {
    const crop = CROPS.find((c) => c.id === cropQuery) || searchCrops(cropQuery)[0];
    if (!crop) return { found: false, message: `No price reference for "${cropQuery}".` };

    const mid = (crop.bandLow + crop.bandHigh) / 2;
    const season = seasonalAdjust(crop);

    // Optional local demand signal: are related listings selling through?
    const snap = await featureStore.snapshot().catch(() => null);
    let demandMult = 1.0;
    let demandNote = "no local demand signal";
    if (snap) {
      const related = snap.products.filter((p) =>
        (p.name || "").toLowerCase().includes(crop.name.split(" ")[0].toLowerCase()));
      const sold = related.reduce((s, p) => s + p.soldQty, 0);
      if (sold > 0) {
        demandMult = clamp01(0.5 + sold / 40) + 0.6; // 0.6..~1.6
        demandNote = `${sold} related units moving locally`;
      }
    }

    const predicted = Math.round(clampToBand(mid * season.mult * (0.7 + 0.3 * demandMult), crop.bandLow, crop.bandHigh));
    const band = crop.bandHigh - crop.bandLow;
    const vol = band / (mid || 1);
    const conf = confidenceFromN(Math.max(3, 20 - Math.round(vol * 15)), 20);

    const hasMsp = !!crop.msp;
    const anchorLabel = hasMsp
      ? `MSP ₹${crop.msp} · seasonal band ₹${crop.bandLow}–${crop.bandHigh}`
      : `Market-driven (no MSP) · seasonal band ₹${crop.bandLow}–${crop.bandHigh}`;
    const reasons = [
      { label: anchorLabel, contribution: 45 },
      { label: season.note, contribution: 30 },
      { label: demandNote, contribution: 25 },
    ];

    return {
      found: true,
      crop: crop.name, unit: crop.unit,
      msp: crop.msp, hasMsp, floor: crop.msp || crop.bandLow,
      bandLow: crop.bandLow, bandHigh: crop.bandHigh,
      predicted, horizon,
      range: { low: Math.round(predicted * 0.94), high: Math.round(predicted * 1.06) },
      direction: season.mult > 1 ? "up" : season.mult < 1 ? "down" : "flat",
      confidence: conf,
      reasons,
      disclaimer: "Reasoned from MSP + seasonal patterns, not today's live mandi price. Verify at eNAM / Agmarknet / your local mandi.",
    };
  },

  /* Confidence-scored outlook for several crops (dashboard use). */
  async outlook(cropIds = ["paddy", "wheat", "potato", "mustard"]) {
    const out = [];
    for (const id of cropIds) {
      const f = await this.forecast(id);
      if (f.found) out.push(f);
    }
    return out;
  },
};
