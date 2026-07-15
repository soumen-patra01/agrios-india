/* Buyer matching & scoring — discovers demand-side opportunities for a farmer /
   FPO / seller by aggregating buyers across the logistics trade modules
   (procurement tenders, contracts, export orders) and ranking them by an
   explainable AI buyer score: order value, buyer type, verification and repeat
   activity. */

import { procurementService } from "../logistics/procurementService.js";
import { contractService } from "../logistics/contractService.js";
import { exportService } from "../logistics/exportService.js";
import { weigh, factor, confidenceFromN } from "./explain.js";

const num = (v) => Number(v) || 0;
const norm = (s) => String(s || "").toLowerCase();

/* Buyer "type" weighting — government & export buyers are highest-value/lowest-risk. */
const TYPE_WEIGHT = { government: 1.0, export: 1.0, fpo: 0.8, cooperative: 0.8, private: 0.65, contract: 0.85 };

export const buyerMatching = {
  /* Aggregate a buyer directory from all trade sources. */
  async directory({ commodity = null } = {}) {
    const [procs, contracts, exports] = await Promise.all([
      procurementService.getAll().catch(() => []),
      contractService.getAll().catch(() => []),
      exportService.getAll().catch(() => []),
    ]);

    const buyers = {}; // name -> aggregate
    const add = (name, { type, value, verified, commodity: c, source }) => {
      if (!name) return;
      const key = name;
      buyers[key] ||= { name, types: new Set(), totalValue: 0, deals: 0, verified: false, commodities: new Set(), sources: new Set() };
      buyers[key].types.add(type);
      buyers[key].totalValue += num(value);
      buyers[key].deals += 1;
      buyers[key].verified = buyers[key].verified || !!verified;
      if (c) buyers[key].commodities.add(c);
      buyers[key].sources.add(source);
    };

    procs.forEach((p) => add(p.buyerName, { type: p.type, value: num(p.quantityKg) / 1000 * num(p.targetPrice) * 1000, verified: p.type === "government", commodity: p.commodity, source: "procurement" }));
    contracts.forEach((c) => add(c.buyerName, { type: "contract", value: num(c.value), verified: c.status === "active", commodity: c.commodity, source: "contract" }));
    exports.forEach((e) => add(e.buyerName, { type: "export", value: num(e.value) * 83, verified: e.status !== "preparing", commodity: e.commodity, source: "export" }));

    let list = Object.values(buyers).map((b) => ({
      name: b.name,
      types: [...b.types],
      totalValue: Math.round(b.totalValue),
      deals: b.deals,
      verified: b.verified,
      commodities: [...b.commodities],
      sources: [...b.sources],
    }));
    if (commodity) list = list.filter((b) => b.commodities.some((c) => norm(c) === norm(commodity)));
    return list;
  },

  /* Explainable AI buyer score. */
  scoreOne(buyer, maxValue = 1) {
    const typeW = Math.max(...buyer.types.map((t) => TYPE_WEIGHT[t] || 0.6));
    const { score, reasons } = weigh([
      factor("Deal value", Math.min(1, buyer.totalValue / maxValue), 2.5),
      factor(`Buyer type (${buyer.types.join(", ")})`, typeW, 2),
      factor("Verified buyer", buyer.verified ? 1 : 0, 1.5),
      factor("Repeat / multi-deal", Math.min(1, buyer.deals / 3), 1.5),
    ]);
    return { score, reasons };
  },

  /* Ranked buyers for a commodity (buyer discovery + ranking). */
  async rank({ commodity = null, limit = 10 } = {}) {
    const dir = await this.directory({ commodity });
    const maxValue = Math.max(1, ...dir.map((b) => b.totalValue));
    const ranked = dir
      .map((b) => ({ buyer: b, ...this.scoreOne(b, maxValue),
        tags: [b.verified && "Verified", b.types.includes("government") && "Govt", b.types.includes("export") && "Export", b.deals > 1 && "Repeat"].filter(Boolean) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    return { items: ranked, confidence: confidenceFromN(dir.length, 6) };
  },

  async highValue({ limit = 5 } = {}) {
    const { items } = await this.rank({ limit: 50 });
    return { items: items.slice(0, limit) };
  },
};
