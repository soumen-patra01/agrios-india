import { describe, it, expect, beforeAll } from "vitest";
import { seedAiCommerce } from "../seedAiCommerce.js";
import { featureStore } from "../featureStore.js";
import { demandForecast } from "../demandForecast.js";
import { supplyForecast } from "../supplyForecast.js";

beforeAll(async () => {
  await seedAiCommerce.load();
  featureStore.invalidate();
});

describe("demandForecast", () => {
  it("ranking returns every category scored, sorted desc", async () => {
    const rows = await demandForecast.ranking();
    expect(rows.length).toBeGreaterThan(0);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1].demandIndex).toBeGreaterThanOrEqual(rows[i].demandIndex);
    }
    expect(["High", "Moderate", "Low"]).toContain(rows[0].level);
    expect(rows[0].reasons.length).toBeGreaterThan(0);
  });

  it("regional demand aggregates districts", async () => {
    const r = await demandForecast.regional();
    expect(Array.isArray(r.rows)).toBe(true);
  });
});

describe("supplyForecast", () => {
  it("ranking sorts tightest supply first", async () => {
    const rows = await supplyForecast.ranking();
    expect(rows.length).toBeGreaterThan(0);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1].supplyIndex).toBeLessThanOrEqual(rows[i].supplyIndex);
    }
    expect(["Ample", "Balanced", "Tight"]).toContain(rows[0].position);
  });

  it("storage capacity reports a utilisation position", async () => {
    const cap = await supplyForecast.storageCapacity();
    expect(cap.utilisation).toBeGreaterThanOrEqual(0);
    expect(["Ample", "Balanced", "Tight"]).toContain(cap.position);
  });
});
