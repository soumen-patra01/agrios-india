import { describe, it, expect, beforeAll } from "vitest";
import { productService } from "../../marketplace/productService.js";
import { sellerService } from "../../marketplace/sellerService.js";
import { seedAiCommerce } from "../seedAiCommerce.js";
import { featureStore } from "../featureStore.js";
import { fraudDetection } from "../fraudDetection.js";
import { riskScoring } from "../riskScoring.js";

let suspiciousId;

beforeAll(async () => {
  await seedAiCommerce.load();
  // Plant an obviously suspicious listing: unverified seller, absurdly cheap.
  const seller = await sellerService.register({ name: "Cold Seller", type: "dealer" });
  const p = await productService.add({
    sellerId: seller.id, sellerName: seller.name,
    name: "Cheap Urea Deal", category: "fertilizer", unit: "bag",
    price: 5, stock: 100, status: "published",
  });
  suspiciousId = p.id;
  featureStore.invalidate();
});

describe("fraudDetection", () => {
  it("flags a too-good-to-be-true unverified listing with reasons", async () => {
    const flags = await fraudDetection.scan();
    const hit = flags.find((f) => f.subjectId === suspiciousId);
    expect(hit).toBeTruthy();
    expect(hit.score).toBeGreaterThan(0);
    expect(["low", "medium", "high"]).toContain(hit.severity);
    expect(hit.reasons.length).toBeGreaterThan(0);
    // sorted by score desc
    for (let i = 1; i < flags.length; i++) expect(flags[i - 1].score).toBeGreaterThanOrEqual(flags[i].score);
  });
});

describe("riskScoring", () => {
  it("produces a composite seller risk profile with computable dimensions", async () => {
    const snap = await featureStore.snapshot({ fresh: true });
    const anySeller = snap.sellers[0];
    const profile = await riskScoring.sellerRisk(anySeller.id);
    expect(profile.overall).toBeGreaterThanOrEqual(0);
    expect(profile.overall).toBeLessThanOrEqual(100);
    expect(["High", "Medium", "Low"]).toContain(profile.band);
    expect(profile.dimensions.some((d) => d.score != null)).toBe(true);
    // honest about non-computable dimensions
    expect(profile.dimensions.some((d) => d.score == null && d.note)).toBe(true);
  });

  it("supply-chain risk returns a banded score", async () => {
    const r = await riskScoring.supplyChainRisk();
    expect(["High", "Medium", "Low"]).toContain(r.band);
  });
});
