import { describe, it, expect } from "vitest";
import { mpOrderService } from "../mpOrderService.js";
import { cartService } from "../cartService.js";
import { productService } from "../productService.js";

const listedProduct = (over = {}) => productService.add({
  sellerId: "sellerA", sellerName: "Store A", name: "Layer Feed 50kg",
  category: "feed", unit: "bag", price: 1750, stock: 20, status: "published", ...over,
});

async function checkout(products, qty = 2) {
  for (const p of products) await cartService.addToCart(p.id, qty);
  const lines = await cartService.getLines();
  const mine = lines.filter((l) => products.some((p) => p.id === l.productId));
  return mpOrderService.createFromCart(mine, { paymentMethod: "cod", address: { name: "T", phone: "9", village: "V" } });
}

describe("mpOrderService", () => {
  it("creates one order per seller and reserves stock", async () => {
    const a = await listedProduct({ name: "From A" });
    const b = await listedProduct({ name: "From B", sellerId: "sellerB", sellerName: "Store B" });
    const orders = await checkout([a, b], 3);

    expect(orders).toHaveLength(2);
    expect(new Set(orders.map((o) => o.sellerId))).toEqual(new Set(["sellerA", "sellerB"]));
    expect(orders[0].status).toBe("pending");
    expect(orders[0].total).toBe(3 * 1750);

    const aAfter = await productService.getById(a.id);
    expect(aAfter.reserved).toBe(3);
    expect(productService.available(aAfter)).toBe(17);
    expect(aAfter.stock).toBe(20); // stock untouched until delivery
  });

  it("delivered: decrements stock, releases reservation, marks paid", async () => {
    const p = await listedProduct({ name: "Deliver Me", sellerId: "sellerC" });
    const [order] = await checkout([p], 4);

    const done = await mpOrderService.setStatus(order.id, "delivered");
    expect(done.status).toBe("delivered");
    expect(done.paid).toBe(true);
    expect(done.timeline.map((t) => t.status)).toEqual(["pending", "delivered"]);

    const after = await productService.getById(p.id);
    expect(after.stock).toBe(16);
    expect(after.reserved).toBe(0);
  });

  it("cancelled: releases the reservation, stock intact", async () => {
    const p = await listedProduct({ name: "Cancel Me", sellerId: "sellerD" });
    const [order] = await checkout([p], 5);
    await mpOrderService.setStatus(order.id, "cancelled");

    const after = await productService.getById(p.id);
    expect(after.stock).toBe(20);
    expect(after.reserved).toBe(0);
  });

  it("returned after delivery: restores stock", async () => {
    const p = await listedProduct({ name: "Return Me", sellerId: "sellerE" });
    const [order] = await checkout([p], 2);
    await mpOrderService.setStatus(order.id, "delivered");
    await mpOrderService.setStatus(order.id, "returned");

    const after = await productService.getById(p.id);
    expect(after.stock).toBe(20);
  });

  it("walks the forward flow and guards cancel/return windows", () => {
    expect(mpOrderService.nextStatus("pending")).toBe("processing");
    expect(mpOrderService.nextStatus("shipped")).toBe("delivered");
    expect(mpOrderService.nextStatus("delivered")).toBeNull();
    expect(mpOrderService.canCancel({ status: "packed" })).toBe(true);
    expect(mpOrderService.canCancel({ status: "shipped" })).toBe(false);
    expect(mpOrderService.canReturn({ status: "delivered" })).toBe(true);
    expect(mpOrderService.canReturn({ status: "pending" })).toBe(false);
  });

  it("sellerSummary aggregates revenue from delivered orders only", async () => {
    const p = await listedProduct({ name: "Summary", sellerId: "sellerF", price: 100 });
    const [o1] = await checkout([p], 1);
    await checkout([p], 1); // second order stays pending
    await mpOrderService.setStatus(o1.id, "delivered");

    const s = await mpOrderService.sellerSummary("sellerF");
    expect(s.orders).toBe(2);
    expect(s.active).toBe(1);
    expect(s.revenue).toBe(100);
  });
});
