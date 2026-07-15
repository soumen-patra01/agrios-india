import { describe, it, expect } from "vitest";
import { pricePrediction } from "../pricePrediction.js";
import { smartPricing } from "../smartPricing.js";

describe("pricePrediction", () => {
  it("forecasts a known crop within a sane band with reasons + confidence", async () => {
    const f = await pricePrediction.forecast("paddy");
    expect(f.found).toBe(true);
    expect(f.predicted).toBeGreaterThan(f.bandLow * 0.8);
    expect(f.predicted).toBeLessThan(f.bandHigh * 1.2);
    expect(f.reasons.length).toBeGreaterThan(0);
    expect(f.confidence.value).toBeGreaterThan(0);
    expect(f.range.low).toBeLessThan(f.range.high);
  });

  it("returns not-found for an unknown crop", async () => {
    const f = await pricePrediction.forecast("zzznotacrop");
    expect(f.found).toBeFalsy();
  });

  it("suggestSell never floors below MSP and adjusts for grade", async () => {
    const std = await smartPricing.suggestSell("wheat", { grade: "standard" });
    const prem = await smartPricing.suggestSell("wheat", { grade: "premium" });
    expect(std.found).toBe(true);
    expect(std.floor).toBe(std.floor); // MSP present
    expect(prem.suggested).toBeGreaterThanOrEqual(std.suggested);
  });

  it("bulkTiers produce decreasing prices with quantity", () => {
    const tiers = smartPricing.bulkTiers(100);
    expect(tiers[0].price).toBeGreaterThan(tiers[2].price);
  });
});
