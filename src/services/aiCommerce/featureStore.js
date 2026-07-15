/* Feature store — the SINGLE data-access layer feeding every AI-commerce engine.
   It reads the existing marketplace / logistics / market modules and derives the
   normalised features (co-purchase graph, sell-through, seller performance,
   category & regional demand, price history) the engines consume. Keeping this
   the only place that touches source data means a future backend swap is a
   one-file change. All methods are async (IndexedDB-backed sources). */

import { productService } from "../marketplace/productService.js";
import { mpOrderService } from "../marketplace/mpOrderService.js";
import { sellerService } from "../marketplace/sellerService.js";
import { reviewService } from "../marketplace/reviewService.js";
import { shipmentService } from "../logistics/shipmentService.js";
import { auctionService } from "../logistics/auctionService.js";
import { CROPS } from "../market/cropData.js";

const num = (v) => Number(v) || 0;

let _cache = null;
let _cacheAt = 0;
const TTL = 4000; // ms — coalesce the many engine calls in one screen render

export const featureStore = {
  crops: () => CROPS,

  /* Build (or reuse) a full snapshot of derived commerce features. */
  async snapshot({ fresh = false } = {}) {
    if (!fresh && _cache && Date.now() - _cacheAt < TTL) return _cache;

    const [rawProducts, orders, sellers, shipments, auctions] = await Promise.all([
      productService.getAll(),
      mpOrderService.getAll(),
      sellerService.getAll(),
      shipmentService.getAll().catch(() => []),
      auctionService.getAll().catch(() => []),
    ]);

    // Per-product review stats (parallel).
    const prodStats = await Promise.all(rawProducts.map((p) => reviewService.productStats(p.id)));
    const statsById = new Map(rawProducts.map((p, i) => [p.id, prodStats[i]]));

    // Sell-through + co-purchase graph from delivered/active orders.
    const soldQty = {};          // productId -> qty ordered
    const coPurchase = {};       // productId -> { otherId: count }
    const categoryStats = {};    // category -> { orders, qty, revenue }
    const regionStats = {};      // district -> { orders, revenue }

    orders.forEach((o) => {
      const ids = (o.items || []).map((i) => i.productId);
      (o.items || []).forEach((it) => {
        soldQty[it.productId] = num(soldQty[it.productId]) + num(it.qty);
      });
      // co-purchase pairs within an order
      ids.forEach((a) => {
        coPurchase[a] ||= {};
        ids.forEach((b) => { if (a !== b) coPurchase[a][b] = (coPurchase[a][b] || 0) + 1; });
      });
      const district = o.address?.district || "Unknown";
      regionStats[district] ||= { orders: 0, revenue: 0 };
      regionStats[district].orders += 1;
      regionStats[district].revenue += num(o.total);
    });

    const products = rawProducts.map((p) => {
      const st = statsById.get(p.id) || { avg: 0, count: 0 };
      const cat = p.category || "other";
      categoryStats[cat] ||= { orders: 0, qty: 0, revenue: 0 };
      categoryStats[cat].qty += num(soldQty[p.id]);
      return {
        ...p,
        available: productService.available(p),
        rating: st.avg, reviewCount: st.count,
        soldQty: num(soldQty[p.id]),
      };
    });

    // Seller performance.
    const sellerPerf = sellers.map((s) => {
      const theirOrders = orders.filter((o) => o.sellerId === s.id);
      const delivered = theirOrders.filter((o) => o.status === "delivered");
      const cancelled = theirOrders.filter((o) => ["cancelled", "returned"].includes(o.status));
      const revenue = delivered.reduce((sum, o) => sum + num(o.total), 0);
      const sellerReviews = products.filter((p) => p.sellerId === s.id);
      const rated = sellerReviews.filter((p) => p.reviewCount > 0);
      const rating = rated.length ? rated.reduce((sum, p) => sum + p.rating, 0) / rated.length : 0;
      const totalTerminal = delivered.length + cancelled.length;
      return {
        ...s,
        orderCount: theirOrders.length,
        deliveredCount: delivered.length,
        cancelledCount: cancelled.length,
        revenue,
        rating: Math.round(rating * 10) / 10,
        fulfilmentRate: totalTerminal ? delivered.length / totalTerminal : 0,
        verified: s.verificationStatus === "verified",
      };
    });

    _cache = {
      products, orders, sellers: sellerPerf,
      shipments, auctions,
      coPurchase, categoryStats, regionStats, soldQty,
      totals: {
        products: products.length,
        orders: orders.length,
        sellers: sellers.length,
        revenue: orders.filter((o) => o.status === "delivered").reduce((s, o) => s + num(o.total), 0),
      },
    };
    _cacheAt = Date.now();
    return _cache;
  },

  /* Invalidate after data mutations (used by automation). */
  invalidate() { _cache = null; },

  /* Co-purchase partners for a product, most-frequent first. */
  coPurchasePartners(snap, productId) {
    const map = snap.coPurchase[productId] || {};
    return Object.entries(map)
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count);
  },
};
