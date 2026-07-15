/* Supply forecasting — explainable supply-tightness index from on-hand stock,
   warehouse capacity headroom and logistics throughput. Pairs with
   demandForecast to surface supply/demand gaps. */

import { featureStore } from "./featureStore.js";
import { PRODUCT_CATEGORIES } from "../marketplace/constantsMp.js";
import { warehouseService } from "../logistics/warehouseService.js";
import { confidenceFromN, weigh, factor } from "./explain.js";

const num = (v) => Number(v) || 0;
const catLabel = (id) => PRODUCT_CATEGORIES.find((c) => c.id === id)?.label || id;

export const supplyForecast = {
  /* Category supply position: high available stock = ample, low = tight. */
  async forecastCategory(category) {
    const snap = await featureStore.snapshot();
    const cat = snap.products.filter((p) => p.category === category && p.status === "published");
    const available = cat.reduce((s, p) => s + num(p.available), 0);
    const ordered = snap.categoryStats[category]?.qty || 0;
    const coverRatio = ordered ? available / ordered : available > 0 ? 2 : 0; // stock vs demand

    const { score, reasons } = weigh([
      factor("Available stock", Math.min(1, available / 200), 2),
      factor("Cover vs demand", Math.min(1, coverRatio / 2), 2),
      factor("Active listings", Math.min(1, cat.length / 8), 1),
    ]);
    const position = score >= 66 ? "Ample" : score >= 40 ? "Balanced" : "Tight";
    return {
      category, label: catLabel(category),
      supplyIndex: score, position,
      availableUnits: available, orderedUnits: ordered,
      reasons,
      confidence: confidenceFromN(cat.length, 8),
    };
  },

  async ranking() {
    const out = [];
    for (const c of PRODUCT_CATEGORIES) out.push(await this.forecastCategory(c.id));
    return out.sort((a, b) => a.supplyIndex - b.supplyIndex); // tightest first
  },

  /* Storage capacity headroom from the logistics warehouses. */
  async storageCapacity() {
    const list = await warehouseService.getAll().catch(() => []);
    const capacityKg = list.reduce((s, w) => s + num(w.capacityKg), 0);
    const allocatedKg = list.reduce((s, w) => s + num(w.allocatedKg), 0);
    const free = Math.max(0, capacityKg - allocatedKg);
    const utilisation = capacityKg ? Math.round((allocatedKg / capacityKg) * 100) : 0;
    return {
      facilities: list.length,
      capacityTonnes: Math.round(capacityKg / 1000),
      freeTonnes: Math.round(free / 1000),
      utilisation,
      position: utilisation >= 85 ? "Tight" : utilisation >= 60 ? "Balanced" : "Ample",
      confidence: confidenceFromN(list.length, 5),
    };
  },
};
