/* Risk scoring — a composite, explainable risk profile across the dimensions
   the brief lists. Dimensions computable from local data (business, operational,
   market, supply-chain) are scored; those needing external feeds (weather,
   disease, credit bureau) are surfaced as "needs external data" so the profile
   stays honest and auditable. */

import { featureStore } from "./featureStore.js";
import { supplyForecast } from "./supplyForecast.js";
import { weigh, factor, confidenceFromN } from "./explain.js";

const num = (v) => Number(v) || 0;
const bandOf = (score) => (score >= 66 ? "High" : score >= 33 ? "Medium" : "Low");

export const riskScoring = {
  /* Seller/business risk profile (higher score = higher risk). */
  async sellerRisk(sellerId) {
    const snap = await featureStore.snapshot();
    const s = snap.sellers.find((x) => x.id === sellerId);
    if (!s) return null;

    const business = weigh([
      factor("Cancellation rate", s.orderCount ? s.cancelledCount / s.orderCount : 0.3, 2),
      factor("Unverified", s.verified ? 0 : 1, 1.5),
    ]).score;
    const operational = weigh([
      factor("Low fulfilment", 1 - (s.fulfilmentRate || 0), 2),
      factor("Thin track record", 1 - Math.min(1, (s.deliveredCount || 0) / 15), 1),
    ]).score;
    const market = weigh([
      factor("Low buyer rating", s.rating ? 1 - s.rating / 5 : 0.5, 1.5),
    ]).score;

    const overall = Math.round((business * 0.4 + operational * 0.4 + market * 0.2));
    return {
      subjectId: sellerId, name: s.name,
      overall, band: bandOf(overall),
      dimensions: [
        { name: "Business risk", score: business, band: bandOf(business) },
        { name: "Operational risk", score: operational, band: bandOf(operational) },
        { name: "Market risk", score: market, band: bandOf(market) },
        { name: "Credit risk", score: null, note: "needs credit-bureau data (backend phase)" },
        { name: "Weather risk", score: null, note: "needs geo/weather feed (backend phase)" },
        { name: "Disease risk", score: null, note: "needs livestock/crop health feed (backend phase)" },
      ],
      confidence: confidenceFromN(s.orderCount, 15),
    };
  },

  /* Supply-chain risk snapshot from storage tightness + logistics. */
  async supplyChainRisk() {
    const cap = await supplyForecast.storageCapacity();
    const score = cap.utilisation >= 85 ? 75 : cap.utilisation >= 60 ? 45 : 20;
    return {
      overall: score, band: bandOf(score),
      reasons: [
        { label: `Storage utilisation ${cap.utilisation}% (${cap.position})`, contribution: 70 },
        { label: `${cap.freeTonnes}t free across ${cap.facilities} facilities`, contribution: 30 },
      ],
      confidence: cap.confidence,
    };
  },
};
