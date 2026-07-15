/* Recommendation engine — explainable, deterministic scoring over the local
   commerce graph (co-purchase, category affinity, popularity, rating, season,
   region). No black-box ML: every recommendation carries the reasons that
   ranked it. A future embedding/vector model can replace `score()` alone. */

import { featureStore } from "./featureStore.js";
import { factor, weigh, confidenceFromN } from "./explain.js";

const num = (v) => Number(v) || 0;
const monthSeason = () => {
  const m = new Date().getMonth(); // 0=Jan
  // India: kharif ~Jun–Oct, rabi ~Nov–Mar, zaid ~Apr–May
  if (m >= 5 && m <= 9) return "kharif";
  if (m >= 10 || m <= 2) return "rabi";
  return "zaid";
};

/* Score one candidate product for a viewing context. */
function scoreProduct(p, ctx, snap) {
  const maxSold = Math.max(1, ...snap.products.map((x) => x.soldQty));
  const factors = [
    factor("Popularity (units sold)", p.soldQty / maxSold, 2),
    factor("Buyer rating", (p.rating || 0) / 5, 1.5),
    factor("In stock", p.available > 0 ? 1 : 0, 1),
  ];
  if (ctx.category) factors.push(factor(`Same category (${ctx.category})`, p.category === ctx.category ? 1 : 0, 2));
  if (ctx.coCount != null) factors.push(factor("Frequently bought together", Math.min(1, ctx.coCount / 3), 3));
  if (ctx.region && p.region) factors.push(factor(`Popular in ${ctx.region}`, p.region === ctx.region ? 1 : 0, 1));
  if (ctx.priceCeiling) factors.push(factor("Fits your budget", num(p.price) <= ctx.priceCeiling ? 1 : 0, 1));
  return weigh(factors);
}

export const recommendationEngine = {
  /* Personalized picks from the buyer's order history (category affinity +
     popularity). Falls back to trending when there's no history. */
  async personalized({ limit = 8 } = {}) {
    const snap = await featureStore.snapshot();
    const boughtCats = {};
    snap.orders.forEach((o) => (o.items || []).forEach((it) => {
      const prod = snap.products.find((p) => p.id === it.productId);
      if (prod) boughtCats[prod.category] = (boughtCats[prod.category] || 0) + num(it.qty);
    }));
    const topCat = Object.entries(boughtCats).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const ranked = snap.products
      .filter((p) => p.status === "published")
      .map((p) => ({ product: p, ...scoreProduct(p, { category: topCat }, snap) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return { items: ranked, basis: topCat ? `your interest in ${topCat}` : "trending now",
      confidence: confidenceFromN(snap.orders.length, 15) };
  },

  /* "Frequently bought together" + related items for a product page. */
  async related(productId, { limit = 6 } = {}) {
    const snap = await featureStore.snapshot();
    const base = snap.products.find((p) => p.id === productId);
    if (!base) return { items: [], confidence: confidenceFromN(0) };

    const partners = featureStore.coPurchasePartners(snap, productId);
    const partnerCount = new Map(partners.map((x) => [x.id, x.count]));

    const ranked = snap.products
      .filter((p) => p.id !== productId && p.status === "published")
      .map((p) => ({
        product: p,
        ...scoreProduct(p, { category: base.category, coCount: partnerCount.get(p.id) || 0 }, snap),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return { items: ranked, confidence: confidenceFromN(partners.length, 5) };
  },

  /* Cross-sell / upsell for a product: complementary category vs higher tier. */
  async crossSell(productId, { limit = 4 } = {}) {
    const snap = await featureStore.snapshot();
    const base = snap.products.find((p) => p.id === productId);
    if (!base) return { items: [], confidence: confidenceFromN(0) };
    const partners = featureStore.coPurchasePartners(snap, productId);
    const partnerIds = new Set(partners.map((x) => x.id));
    const ranked = snap.products
      .filter((p) => p.id !== productId && p.status === "published" && p.category !== base.category)
      .map((p) => ({ product: p, ...scoreProduct(p, { coCount: partnerIds.has(p.id) ? 2 : 0 }, snap) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    return { items: ranked, confidence: confidenceFromN(partners.length, 5) };
  },

  async upsell(productId, { limit = 4 } = {}) {
    const snap = await featureStore.snapshot();
    const base = snap.products.find((p) => p.id === productId);
    if (!base) return { items: [], confidence: confidenceFromN(0) };
    const ranked = snap.products
      .filter((p) => p.id !== productId && p.status === "published"
        && p.category === base.category && num(p.price) > num(base.price))
      .map((p) => ({ product: p, ...scoreProduct(p, { category: base.category }, snap),
        upsellReason: `Higher-tier ${base.category} (${p.rating || "—"}★)` }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    return { items: ranked, confidence: confidenceFromN(1, 1) };
  },

  /* Seasonal recommendations from the crop calendar (which inputs suit now). */
  async seasonal({ limit = 6 } = {}) {
    const snap = await featureStore.snapshot();
    const season = monthSeason();
    // Inputs (seeds/fertilizer/pesticide/bioinput) are prioritised in-season.
    const inputCats = ["seeds", "fertilizer", "pesticide", "bioinput"];
    const ranked = snap.products
      .filter((p) => p.status === "published")
      .map((p) => {
        const seasonal = inputCats.includes(p.category);
        const { score, reasons } = weigh([
          factor(`${season} season input`, seasonal ? 1 : 0.3, 2),
          factor("Popularity", p.soldQty / Math.max(1, ...snap.products.map((x) => x.soldQty)), 1),
          factor("In stock", p.available > 0 ? 1 : 0, 1),
        ]);
        return { product: p, score, reasons };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    return { items: ranked, season, confidence: confidenceFromN(snap.products.length, 10) };
  },

  /* Regional recommendations — what sells in a given district. */
  async regional(district, { limit = 6 } = {}) {
    const snap = await featureStore.snapshot();
    const ranked = snap.products
      .filter((p) => p.status === "published")
      .map((p) => ({ product: p, ...scoreProduct(p, { region: district }, snap) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    return { items: ranked, district, confidence: confidenceFromN(snap.regionStats[district]?.orders || 0, 5) };
  },
};
