import { describe, it, expect } from "vitest";
import { warehouseService } from "../warehouseService.js";
import { storageBookingService } from "../storageBookingService.js";
import { telemetryService, deviceIdFor } from "../telemetryService.js";

async function makeWarehouse(over = {}) {
  return warehouseService.register({
    name: "Test WH", type: "dry", ownerName: "Me",
    village: "V", district: "D", state: "WB", lat: 22, lon: 88,
    capacityKg: 100000, pricePerTonneMonth: 300, ...over,
  });
}

describe("warehouseService", () => {
  it("registers a cold store with temp/humidity bands", async () => {
    const w = await makeWarehouse({ type: "cold" });
    expect(w.cold).toBe(true);
    expect(w.tempBand).toEqual({ min: 2, max: 8 });
  });

  it("allocates and releases capacity with a free-space guard", async () => {
    const w = await makeWarehouse();
    await warehouseService.allocate(w.id, 40000);
    let fresh = await warehouseService.getById(w.id);
    expect(warehouseService.availableKg(fresh)).toBe(60000);

    await expect(warehouseService.allocate(w.id, 70000)).rejects.toThrow("free capacity");

    await warehouseService.release(w.id, 40000);
    fresh = await warehouseService.getById(w.id);
    expect(fresh.allocatedKg).toBe(0);
  });

  it("booking reserves capacity and releases it on completion", async () => {
    const w = await makeWarehouse();
    const b = await storageBookingService.create({ warehouseId: w.id, commodity: "Potato", quantityKg: 20000, months: 2 });
    expect(b.status).toBe("active");
    expect(b.price).toBe(20 * 300 * 2); // tonnes * rate * months

    let fresh = await warehouseService.getById(w.id);
    expect(fresh.allocatedKg).toBe(20000);

    await storageBookingService.setStatus(b.id, "completed");
    fresh = await warehouseService.getById(w.id);
    expect(fresh.allocatedKg).toBe(0);
  });

  it("cold monitoring flags an out-of-band temperature", async () => {
    const w = await makeWarehouse({ type: "cold" });
    await telemetryService.record(deviceIdFor(w.id, "temperature"), "temperature", 12); // 12°C breaches 2-8
    const mon = await warehouseService.monitoring(w.id);
    expect(mon.temperature.value).toBe(12);
    expect(mon.tempBreach).toBe(true);
  });
});
