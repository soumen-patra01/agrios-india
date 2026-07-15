/* AI-commerce seed — the AI engines read the marketplace & logistics modules,
   so this ensures those exist, then generates sample marketplace ORDERS (which
   the base marketplace seed omits) so demand, co-purchase, sell-through and BI
   signals are non-empty. All generated orders carry demo:true. */

import { repo as marketRepo } from "../marketplace/marketDb.js";
import { productService } from "../marketplace/productService.js";
import { seedMp } from "../marketplace/seedMp.js";
import { seedLog } from "../logistics/seedLog.js";
import { featureStore } from "./featureStore.js";

const orders = marketRepo("orders");

const DISTRICTS = ["Nadia", "Hooghly", "North 24 Parganas", "Purba Bardhaman", "Paschim Bardhaman"];
const STATUSES = ["delivered", "delivered", "delivered", "shipped", "pending", "cancelled"];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const isoAgo = (d) => new Date(Date.now() - d * 86400000).toISOString();

export const seedAiCommerce = {
  async hasData() {
    return (await orders.count()) > 3;
  },

  async load() {
    // 1. Ensure the source modules have data.
    if (!(await seedMp.hasData())) await seedMp.load();
    if (!(await seedLog.hasData())) await seedLog.load();

    // 2. Group published products by seller so multi-item orders create
    //    genuine co-purchase pairs.
    const products = (await productService.getAll()).filter((p) => p.status === "published");
    const bySeller = {};
    products.forEach((p) => { (bySeller[p.sellerId] ||= []).push(p); });
    const sellersWithStock = Object.entries(bySeller).filter(([, ps]) => ps.length >= 1);
    if (!sellersWithStock.length) return { orders: 0 };

    // 3. Generate ~12 orders.
    let made = 0;
    for (let i = 0; i < 12; i++) {
      const [sellerId, ps] = pick(sellersWithStock);
      const n = Math.min(ps.length, 1 + Math.floor(Math.random() * 3)); // 1..3 items
      const chosen = [...ps].sort(() => Math.random() - 0.5).slice(0, n);
      const items = chosen.map((p) => {
        const qty = 1 + Math.floor(Math.random() * 5);
        const unitPrice = productService.unitPrice(p, qty);
        return { productId: p.id, name: p.name, qty, unit: p.unit, unitPrice, lineTotal: unitPrice * qty };
      });
      const subtotal = items.reduce((s, it) => s + it.lineTotal, 0);
      const status = pick(STATUSES);
      await orders.add({
        sellerId, sellerName: chosen[0].sellerName || "",
        items, subtotal, total: subtotal,
        status, paymentMethod: "cod", paid: status === "delivered",
        address: { district: pick(DISTRICTS) },
        timeline: [{ status: "pending", at: isoAgo(6) },
          ...(status !== "pending" ? [{ status, at: isoAgo(1) }] : [])],
        demo: true,
      });
      made += 1;
    }

    featureStore.invalidate();
    return { orders: made };
  },

  async clear() {
    const list = await orders.getAll();
    await Promise.all(list.filter((x) => x.demo).map((x) => orders.remove(x.id)));
    featureStore.invalidate();
  },
};
