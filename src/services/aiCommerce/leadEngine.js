/* Lead engine — generates and scores demand-side leads from intent signals
   (wishlisted products, cart, repeat purchases). Explainable lead score +
   qualification band drive follow-up automation. */

import { featureStore } from "./featureStore.js";
import { wishlistService } from "../marketplace/wishlistService.js";
import { cartService } from "../marketplace/cartService.js";
import { weigh, factor, confidenceFromN } from "./explain.js";

const num = (v) => Number(v) || 0;
const bandOf = (s) => (s >= 66 ? "Hot" : s >= 33 ? "Warm" : "Cold");

export const leadEngine = {
  /* Generate leads: each wishlisted / carted product is an intent signal a
     seller can act on. */
  async generate() {
    const snap = await featureStore.snapshot();
    const [wl, cartLines] = await Promise.all([
      wishlistService.products().catch(() => []),
      cartService.getLines().catch(() => []),
    ]);
    const cartIds = new Set((cartLines || []).filter((l) => !l.saved).map((l) => l.product?.id).filter(Boolean));
    const byId = new Map(snap.products.map((p) => [p.id, p]));

    const leads = [];
    (wl || []).forEach((w) => {
      const p = byId.get(w.refId);
      if (!p) return;
      const inCart = cartIds.has(p.id);
      const { score, reasons } = weigh([
        factor("Saved to wishlist", 1, 2),
        factor("In cart (high intent)", inCart ? 1 : 0, 3),
        factor("Popular product", Math.min(1, p.soldQty / 20), 1),
        factor("In stock", p.available > 0 ? 1 : 0, 1),
      ]);
      leads.push({
        productId: p.id, product: p.name, sellerName: p.sellerName,
        segment: inCart ? "high-intent" : "browsing",
        score, band: bandOf(score), reasons,
      });
    });

    return leads.sort((a, b) => b.score - a.score);
  },

  /* Qualification summary for a dashboard. */
  async summary() {
    const leads = await this.generate();
    return {
      total: leads.length,
      hot: leads.filter((l) => l.band === "Hot").length,
      warm: leads.filter((l) => l.band === "Warm").length,
      cold: leads.filter((l) => l.band === "Cold").length,
      confidence: confidenceFromN(leads.length, 8),
    };
  },
};
