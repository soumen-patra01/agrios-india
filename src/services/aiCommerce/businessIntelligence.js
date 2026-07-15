/* Business intelligence — aggregates the engines and source data into executive
   dashboards (sales, customer, marketplace, inventory, financial, operational).
   Pure read-model over featureStore + engine outputs. */

import { featureStore } from "./featureStore.js";
import { demandForecast } from "./demandForecast.js";
import { sellerMatching } from "./sellerMatching.js";
import { fraudDetection } from "./fraudDetection.js";
import { leadEngine } from "./leadEngine.js";

const num = (v) => Number(v) || 0;

export const businessIntelligence = {
  async sales() {
    const snap = await featureStore.snapshot();
    const delivered = snap.orders.filter((o) => o.status === "delivered");
    const gmv = snap.orders.reduce((s, o) => s + num(o.total), 0);
    return {
      orders: snap.orders.length,
      delivered: delivered.length,
      revenue: delivered.reduce((s, o) => s + num(o.total), 0),
      gmv,
      avgOrderValue: snap.orders.length ? Math.round(gmv / snap.orders.length) : 0,
      conversion: snap.orders.length ? Math.round((delivered.length / snap.orders.length) * 100) : 0,
    };
  },

  async marketplace() {
    const snap = await featureStore.snapshot();
    const published = snap.products.filter((p) => p.status === "published");
    const outOfStock = published.filter((p) => p.available <= 0).length;
    const topSellers = (await sellerMatching.rank({ limit: 3 })).items;
    return {
      products: snap.products.length,
      published: published.length,
      sellers: snap.sellers.length,
      outOfStock,
      topSellers: topSellers.map((t) => ({ name: t.seller.name, score: t.score })),
    };
  },

  async inventory() {
    const snap = await featureStore.snapshot();
    const published = snap.products.filter((p) => p.status === "published");
    const low = published.filter((p) => p.available > 0 && p.available <= num(p.lowStockAt)).length;
    const out = published.filter((p) => p.available <= 0).length;
    return {
      totalUnits: published.reduce((s, p) => s + num(p.available), 0),
      lowStock: low, outOfStock: out,
      healthy: published.length - low - out,
    };
  },

  async customer() {
    const leads = await leadEngine.summary();
    const snap = await featureStore.snapshot();
    return {
      leads: leads.total, hotLeads: leads.hot,
      districts: Object.keys(snap.regionStats).length,
      repeatSignals: leads.warm + leads.hot,
    };
  },

  async operational() {
    const fraud = await fraudDetection.scan();
    return {
      fraudFlags: fraud.length,
      highSeverity: fraud.filter((f) => f.severity === "high").length,
    };
  },

  /* Executive overview: the headline numbers + top demand categories. */
  async executive() {
    const [sales, marketplace, inventory, customer, operational, demand] = await Promise.all([
      this.sales(), this.marketplace(), this.inventory(), this.customer(), this.operational(),
      demandForecast.ranking(),
    ]);
    return {
      sales, marketplace, inventory, customer, operational,
      topDemand: demand.slice(0, 4),
    };
  },
};
