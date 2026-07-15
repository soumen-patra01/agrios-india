/* Customer segmentation — buckets sellers/participants into the brief's segments
   (small/medium/large farmer, FPO, cooperative, dealer, distributor, exporter)
   from type + activity. Rule-based and transparent. */

import { featureStore } from "./featureStore.js";
import { SELLER_TYPES } from "../marketplace/constantsMp.js";

const num = (v) => Number(v) || 0;
const typeLabel = (id) => SELLER_TYPES.find((t) => t.id === id)?.label || id;

/* Farmer size band by delivered volume/revenue. */
function farmerSize(revenue) {
  if (revenue >= 100000) return "Large farmer";
  if (revenue >= 20000) return "Medium farmer";
  return "Small farmer";
}

function segmentOf(seller) {
  switch (seller.type) {
    case "farmer": return farmerSize(num(seller.revenue));
    case "fpo": return "FPO";
    case "cooperative": return "Cooperative";
    case "dealer": return "Input Dealer";
    case "distributor": return "Distributor";
    case "wholesaler": return "Distributor";
    case "company":
    case "manufacturer": return "Commercial";
    case "govt": return "Government";
    default: return typeLabel(seller.type);
  }
}

export const segmentation = {
  async segments() {
    const snap = await featureStore.snapshot();
    const buckets = {};
    snap.sellers.forEach((s) => {
      const seg = segmentOf(s);
      buckets[seg] ||= { segment: seg, count: 0, revenue: 0, members: [] };
      buckets[seg].count += 1;
      buckets[seg].revenue += num(s.revenue);
      buckets[seg].members.push({ id: s.id, name: s.name, revenue: num(s.revenue) });
    });
    return Object.values(buckets).sort((a, b) => b.revenue - a.revenue);
  },

  /* Classify a single seller with the reasoning. */
  classify(seller) {
    const seg = segmentOf(seller);
    return {
      segment: seg,
      reasons: [
        { label: `Type: ${typeLabel(seller.type)}`, contribution: 60 },
        { label: `Revenue ₹${num(seller.revenue).toLocaleString("en-IN")}`, contribution: 40 },
      ],
    };
  },
};
