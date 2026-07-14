import { describe, it, expect } from "vitest";
import { productService } from "../productService.js";

describe("productService", () => {
  it("adds with coerced numbers and draft status by default", async () => {
    const p = await productService.add({ sellerId: "s1", name: "Urea 45kg", category: "fertilizer", unit: "bag", price: "266", stock: "10" });
    expect(p.price).toBe(266);
    expect(p.stock).toBe(10);
    expect(p.reserved).toBe(0);
    expect(p.status).toBe("draft");
  });

  it("search returns only published products, filtered by category and text", async () => {
    const a = await productService.add({ sellerId: "s1", name: "Swarna Paddy Seed", category: "seeds", unit: "bag", price: 850, stock: 5, status: "published" });
    await productService.add({ sellerId: "s1", name: "Hidden Draft Seed", category: "seeds", unit: "bag", price: 100, stock: 5 }); // draft
    await productService.add({ sellerId: "s2", name: "Layer Feed", category: "feed", unit: "bag", price: 1750, stock: 5, status: "published" });

    const seeds = await productService.search({ category: "seeds" });
    expect(seeds.map((p) => p.id)).toContain(a.id);
    expect(seeds.some((p) => p.name === "Hidden Draft Seed")).toBe(false);

    const byText = await productService.search({ q: "paddy" });
    expect(byText).toHaveLength(1);
    expect(byText[0].name).toBe("Swarna Paddy Seed");
  });

  it("unitPrice picks bulk tier > discount > base", () => {
    const p = { price: 100, discountPrice: 90, bulkPrices: [{ minQty: 5, price: 80 }, { minQty: 10, price: 70 }] };
    expect(productService.unitPrice(p, 1)).toBe(90);   // discount
    expect(productService.unitPrice(p, 5)).toBe(80);   // first tier
    expect(productService.unitPrice(p, 12)).toBe(70);  // deepest tier
    expect(productService.unitPrice({ price: 100 }, 1)).toBe(100); // base
  });

  it("available = stock - reserved, floored at 0", () => {
    expect(productService.available({ stock: 10, reserved: 4 })).toBe(6);
    expect(productService.available({ stock: 2, reserved: 5 })).toBe(0);
  });

  it("lowStock flags listings at or under their alert level", async () => {
    const p = await productService.add({ sellerId: "sLow", name: "Sickle Pack", category: "tools", unit: "set", price: 475, stock: 3, lowStockAt: 5, status: "published" });
    const low = await productService.lowStock("sLow");
    expect(low.map((x) => x.id)).toContain(p.id);
  });
});
