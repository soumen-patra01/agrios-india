/* Seller matching & scoring — ranks sellers for a buyer/product by trust,
   quality, fulfilment and delivery performance. Explainable weighted score. */

import { featureStore } from "./featureStore.js";
import { weigh, factor, confidenceFromN } from "./explain.js";

export const sellerMatching = {
  /* AI seller score (0..100) for one seller from performance features. */
  scoreOne(seller, maxRevenue = 1) {
    const { score, reasons } = weigh([
      factor("Buyer rating", (seller.rating || 0) / 5, 2),
      factor("Verified", seller.verified ? 1 : 0, 1.5),
      factor("Fulfilment rate", seller.fulfilmentRate || 0, 2),
      factor("Delivered orders", Math.min(1, (seller.deliveredCount || 0) / 20), 1.5),
      factor("Sales volume", Math.min(1, (seller.revenue || 0) / maxRevenue), 1),
    ]);
    return { score, reasons };
  },

  /* Ranked sellers, optionally filtered to a product category / district. */
  async rank({ category = null, district = null, limit = 10 } = {}) {
    const snap = await featureStore.snapshot();
    const maxRevenue = Math.max(1, ...snap.sellers.map((s) => s.revenue));
    let sellers = snap.sellers;
    if (category) {
      const catSellerIds = new Set(snap.products.filter((p) => p.category === category).map((p) => p.sellerId));
      sellers = sellers.filter((s) => catSellerIds.has(s.id));
    }
    if (district) sellers = sellers.filter((s) => s.district === district);

    const ranked = sellers
      .map((s) => ({ seller: s, ...this.scoreOne(s, maxRevenue),
        badges: [s.verified && "Verified", s.fulfilmentRate >= 0.9 && "Reliable", s.rating >= 4.5 && "Top rated"].filter(Boolean) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    return { items: ranked, confidence: confidenceFromN(sellers.length, 6) };
  },

  async trusted({ limit = 6 } = {}) {
    const { items } = await this.rank({ limit: 50 });
    return { items: items.filter((x) => x.seller.verified && x.score >= 60).slice(0, limit) };
  },
};
