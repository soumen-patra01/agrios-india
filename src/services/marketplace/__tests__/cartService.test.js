import { describe, it, expect } from "vitest";
import { cartService } from "../cartService.js";
import { productService } from "../productService.js";

const makeProduct = (over = {}) => productService.add({
  sellerId: "s1", sellerName: "Test Store", name: "Vermicompost 40kg",
  category: "bioinput", unit: "bag", price: 480, stock: 10, status: "published", ...over,
});

describe("cartService", () => {
  it("merges repeat adds of the same product into one line", async () => {
    const p = await makeProduct({ name: "Merge Target" });
    await cartService.addToCart(p.id, 2);
    await cartService.addToCart(p.id, 3);
    const lines = await cartService.getLines();
    const mine = lines.filter((l) => l.productId === p.id);
    expect(mine).toHaveLength(1);
    expect(mine[0].qty).toBe(5);
  });

  it("prices lines with bulk/discount rules and computes totals", async () => {
    const p = await makeProduct({ name: "Bulk Deal", price: 100, discountPrice: 90, bulkPrices: [{ minQty: 5, price: 80 }], stock: 50 });
    await cartService.addToCart(p.id, 5);
    const lines = await cartService.getLines();
    const line = lines.find((l) => l.productId === p.id);
    expect(line.unitPrice).toBe(80);
    expect(line.lineTotal).toBe(400);

    const totals = cartService.totals([line]);
    expect(totals.subtotal).toBe(400);
    expect(totals.count).toBe(5);
  });

  it("flags stock and availability problems", async () => {
    const scarce = await makeProduct({ name: "Scarce", stock: 2 });
    const offline = await makeProduct({ name: "Offline", status: "draft" });
    await cartService.addToCart(scarce.id, 5);   // more than stock
    await cartService.addToCart(offline.id, 1);  // not published

    const lines = await cartService.getLines();
    expect(lines.find((l) => l.productId === scarce.id).problem).toBe("stock");
    expect(lines.find((l) => l.productId === offline.id).problem).toBe("unavailable");

    // problem lines are excluded from totals
    const totals = cartService.totals(lines.filter((l) => [scarce.id, offline.id].includes(l.productId)));
    expect(totals.subtotal).toBe(0);
  });

  it("updateQty to zero removes the line; saved lines don't count", async () => {
    const p = await makeProduct({ name: "Removable" });
    await cartService.addToCart(p.id, 1);
    let line = (await cartService.getLines()).find((l) => l.productId === p.id);

    await cartService.toggleSaved(line.id);
    line = (await cartService.getLines()).find((l) => l.productId === p.id);
    expect(line.saved).toBe(true);
    expect(cartService.totals([line]).count).toBe(0);

    await cartService.updateQty(line.id, 0);
    const after = (await cartService.getLines()).find((l) => l.productId === p.id);
    expect(after).toBeUndefined();
  });
});
