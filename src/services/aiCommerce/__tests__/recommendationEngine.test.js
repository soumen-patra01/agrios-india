import { describe, it, expect, beforeAll } from "vitest";
import { seedAiCommerce } from "../seedAiCommerce.js";
import { featureStore } from "../featureStore.js";
import { recommendationEngine } from "../recommendationEngine.js";
import { aiSearch } from "../aiSearch.js";

beforeAll(async () => {
  await seedAiCommerce.load();
  featureStore.invalidate();
});

describe("recommendationEngine", () => {
  it("personalized returns scored, explained items", async () => {
    const r = await recommendationEngine.personalized({ limit: 6 });
    expect(r.items.length).toBeGreaterThan(0);
    const first = r.items[0];
    expect(first.score).toBeGreaterThanOrEqual(0);
    expect(first.reasons.length).toBeGreaterThan(0);
    // sorted descending by score
    expect(r.items[0].score).toBeGreaterThanOrEqual(r.items[r.items.length - 1].score);
  });

  it("seasonal recommendations tag the current season", async () => {
    const r = await recommendationEngine.seasonal({ limit: 5 });
    expect(["kharif", "rabi", "zaid"]).toContain(r.season);
    expect(r.items.length).toBeGreaterThan(0);
  });

  it("related items exclude the source product", async () => {
    const snap = await featureStore.snapshot({ fresh: true });
    const anyId = snap.products[0].id;
    const r = await recommendationEngine.related(anyId, { limit: 5 });
    expect(r.items.every((x) => x.product.id !== anyId)).toBe(true);
  });
});

describe("aiSearch", () => {
  it("ranks catalogue hits and reports matched fields", async () => {
    const res = await aiSearch.search("seed");
    expect(res.expandedTerms).toContain("seeds");
    if (res.hits.length) {
      expect(res.hits[0].matched.length).toBeGreaterThan(0);
      expect(res.hits[0].score).toBeGreaterThanOrEqual(res.hits[res.hits.length - 1].score);
    }
  });

  it("image search reports itself unavailable", () => {
    expect(aiSearch.image().unavailable).toBe(true);
  });
});
