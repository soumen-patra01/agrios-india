import { describe, it, expect, beforeAll } from "vitest";
import { seedAiCommerce } from "../seedAiCommerce.js";
import { featureStore } from "../featureStore.js";
import { businessIntelligence } from "../businessIntelligence.js";
import { leadEngine } from "../leadEngine.js";
import { segmentation } from "../segmentation.js";
import { commerceAutomation } from "../commerceAutomation.js";

beforeAll(async () => {
  await seedAiCommerce.load();
  featureStore.invalidate();
});

describe("businessIntelligence", () => {
  it("executive overview returns all sections", async () => {
    const ex = await businessIntelligence.executive();
    expect(ex.sales).toBeTruthy();
    expect(ex.marketplace).toBeTruthy();
    expect(ex.inventory).toBeTruthy();
    expect(ex.customer).toBeTruthy();
    expect(ex.operational).toBeTruthy();
    expect(Array.isArray(ex.topDemand)).toBe(true);
    expect(ex.sales.orders).toBeGreaterThan(0);
  });

  it("sales conversion is a valid percentage", async () => {
    const s = await businessIntelligence.sales();
    expect(s.conversion).toBeGreaterThanOrEqual(0);
    expect(s.conversion).toBeLessThanOrEqual(100);
  });
});

describe("segmentation", () => {
  it("buckets sellers into named segments", async () => {
    const segs = await segmentation.segments();
    expect(segs.length).toBeGreaterThan(0);
    expect(segs[0].segment).toBeTruthy();
    expect(segs[0].count).toBeGreaterThan(0);
  });
});

describe("leadEngine + automation", () => {
  it("lead summary buckets hot/warm/cold", async () => {
    const s = await leadEngine.summary();
    expect(s.total).toBe(s.hot + s.warm + s.cold);
  });

  it("automation raises alerts and dedups on re-run", async () => {
    await commerceAutomation.clearAll();
    const first = await commerceAutomation.run();
    const second = await commerceAutomation.run();
    // second run should not duplicate the same unread alerts
    expect(second.length).toBeLessThanOrEqual(first.length);
  });
});
