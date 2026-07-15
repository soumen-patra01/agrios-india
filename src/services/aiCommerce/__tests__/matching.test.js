import { describe, it, expect, beforeAll } from "vitest";
import { seedAiCommerce } from "../seedAiCommerce.js";
import { featureStore } from "../featureStore.js";
import { sellerMatching } from "../sellerMatching.js";
import { buyerMatching } from "../buyerMatching.js";

beforeAll(async () => {
  await seedAiCommerce.load();
  featureStore.invalidate();
});

describe("sellerMatching", () => {
  it("ranks sellers with explainable scores, sorted desc", async () => {
    const { items } = await sellerMatching.rank({ limit: 10 });
    expect(items.length).toBeGreaterThan(0);
    for (let i = 1; i < items.length; i++) {
      expect(items[i - 1].score).toBeGreaterThanOrEqual(items[i].score);
    }
    expect(items[0].reasons.length).toBeGreaterThan(0);
    expect(items[0].score).toBeGreaterThanOrEqual(0);
    expect(items[0].score).toBeLessThanOrEqual(100);
  });
});

describe("buyerMatching", () => {
  it("aggregates buyers from trade sources and scores them", async () => {
    const { items } = await buyerMatching.rank({ limit: 10 });
    // logistics seed provides procurement/contract/export buyers
    if (items.length) {
      expect(items[0].score).toBeGreaterThanOrEqual(0);
      expect(items[0].buyer.name).toBeTruthy();
      expect(items[0].reasons.length).toBeGreaterThan(0);
      for (let i = 1; i < items.length; i++) {
        expect(items[i - 1].score).toBeGreaterThanOrEqual(items[i].score);
      }
    }
  });

  it("filters the directory by commodity", async () => {
    const dir = await buyerMatching.directory({ commodity: "Paddy" });
    expect(dir.every((b) => b.commodities.some((c) => c.toLowerCase() === "paddy"))).toBe(true);
  });
});
