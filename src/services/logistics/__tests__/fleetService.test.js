import { describe, it, expect } from "vitest";
import { fleetService } from "../fleetService.js";

describe("fleetService", () => {
  it("registers a vehicle with capacity from category", async () => {
    const v = await fleetService.register({ providerId: "p1", providerName: "P", category: "truck", regNumber: "WB-1" });
    expect(v.capacityKg).toBe(10000);
    expect(v.status).toBe("available");
    expect(v.healthScore).toBe(100);
  });

  it("toggles availability", async () => {
    const v = await fleetService.register({ providerId: "p1", providerName: "P", category: "miniTruck", regNumber: "WB-2" });
    const off = await fleetService.setAvailability(v.id, false);
    expect(off.available).toBe(false);
  });

  it("logs fuel and computes mileage from odometer deltas", async () => {
    const v = await fleetService.register({ providerId: "p1", providerName: "P", category: "truck", regNumber: "WB-3" });
    await fleetService.logFuel(v.id, { litres: 100, cost: 9500, odometer: 10000 });
    const updated = await fleetService.logFuel(v.id, { litres: 100, cost: 9500, odometer: 10600 });
    const mileage = fleetService.mileage(updated);
    expect(mileage).toBe(6); // 600 km / 100 L
  });

  it("flags expired and soon-to-expire documents", async () => {
    const past = new Date(Date.now() - 10 * 86400000).toISOString();
    const soon = new Date(Date.now() + 10 * 86400000).toISOString();
    const far = new Date(Date.now() + 300 * 86400000).toISOString();
    const v = await fleetService.register({
      providerId: "p1", providerName: "P", category: "truck", regNumber: "WB-4",
      documents: { insuranceExpiry: past, fitnessExpiry: soon, permitExpiry: far },
    });
    const alerts = fleetService.documentAlerts(v);
    expect(alerts.find((a) => a.label === "Insurance").level).toBe("expired");
    expect(alerts.find((a) => a.label === "Fitness").level).toBe("soon");
    expect(alerts.find((a) => a.label === "Permit")).toBeUndefined();
  });

  it("records maintenance entries", async () => {
    const v = await fleetService.register({ providerId: "p1", providerName: "P", category: "tractor", regNumber: "WB-5" });
    const updated = await fleetService.logMaintenance(v.id, { note: "Brake service", cost: 1200 });
    expect(updated.maintenance).toHaveLength(1);
    expect(updated.maintenance[0].note).toBe("Brake service");
  });
});
