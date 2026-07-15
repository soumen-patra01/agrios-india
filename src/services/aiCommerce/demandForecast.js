/* Demand forecasting — explainable demand index per category / region, adjusted
   for season and festivals. Built from local order throughput; a real
   time-series model plugs in behind `forecastCategory()`. */

import { featureStore } from "./featureStore.js";
import { PRODUCT_CATEGORIES } from "../marketplace/constantsMp.js";
import { confidenceFromN, weigh, factor } from "./explain.js";

/* Festival demand windows (month index) that lift specific categories. */
const FESTIVALS = [
  { name: "Durga Puja / Diwali", months: [9, 10], lifts: ["livestock", "feed", "organic"] },
  { name: "Rabi sowing", months: [10, 11], lifts: ["seeds", "fertilizer"] },
  { name: "Kharif sowing", months: [5, 6], lifts: ["seeds", "fertilizer", "pesticide"] },
  { name: "Summer stress", months: [3, 4], lifts: ["medicine", "feed"] },
];

const catLabel = (id) => PRODUCT_CATEGORIES.find((c) => c.id === id)?.label || id;

function activeFestival() {
  const m = new Date().getMonth();
  return FESTIVALS.find((f) => f.months.includes(m)) || null;
}

export const demandForecast = {
  /* Demand outlook for a single category. */
  async forecastCategory(category) {
    const snap = await featureStore.snapshot();
    const stat = snap.categoryStats[category] || { qty: 0 };
    const maxQty = Math.max(1, ...Object.values(snap.categoryStats).map((s) => s.qty));
    const fest = activeFestival();
    const festLift = fest && fest.lifts.includes(category);

    const { score, reasons } = weigh([
      factor("Recent order volume", stat.qty / maxQty, 2),
      factor(festLift ? `Festival demand — ${fest.name}` : "No festival lift now", festLift ? 1 : 0.35, 1.5),
      factor("Catalogue breadth", Math.min(1, snap.products.filter((p) => p.category === category).length / 8), 1),
    ]);

    const level = score >= 66 ? "High" : score >= 40 ? "Moderate" : "Low";
    return {
      category, label: catLabel(category),
      demandIndex: score, level,
      unitsOrdered: stat.qty,
      festival: festLift ? fest.name : null,
      reasons,
      confidence: confidenceFromN(stat.qty, 25),
    };
  },

  /* Ranked demand across all categories. */
  async ranking() {
    const out = [];
    for (const c of PRODUCT_CATEGORIES) out.push(await this.forecastCategory(c.id));
    return out.sort((a, b) => b.demandIndex - a.demandIndex);
  },

  /* Regional demand — order activity by district. */
  async regional() {
    const snap = await featureStore.snapshot();
    const rows = Object.entries(snap.regionStats)
      .map(([district, s]) => ({ district, orders: s.orders, revenue: s.revenue }))
      .sort((a, b) => b.revenue - a.revenue);
    return { rows, confidence: confidenceFromN(snap.orders.length, 20) };
  },
};
