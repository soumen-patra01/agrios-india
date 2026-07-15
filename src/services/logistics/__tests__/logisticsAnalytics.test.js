import { describe, it, expect } from "vitest";
import { logisticsAnalytics } from "../logisticsAnalytics.js";
import { shipmentService } from "../shipmentService.js";
import { transportService } from "../transportService.js";
import { fleetService } from "../fleetService.js";
import { driverService } from "../driverService.js";
import { placeById } from "../constantsLog.js";

describe("logisticsAnalytics", () => {
  it("overview returns fleet/shipments/warehouses/trade groups", async () => {
    const ov = await logisticsAnalytics.overview();
    expect(ov).toHaveProperty("fleet");
    expect(ov).toHaveProperty("shipments");
    expect(ov).toHaveProperty("warehouses");
    expect(ov).toHaveProperty("trade");
  });

  it("counts a delivered shipment in revenue and throughput", async () => {
    const p = await transportService.register({ name: "Analytics Co", type: "fleet" });
    const v = await fleetService.register({ providerId: p.id, providerName: p.name, category: "truck", regNumber: "WB-AN-1" });
    const d = await driverService.register({ providerId: p.id, providerName: p.name, name: "D" });
    const s = await shipmentService.create({ commodity: "Maize", quantityKg: 3000, pickup: placeById("barasat"), drop: placeById("kolkata"), price: 4000 });
    await shipmentService.assign(s.id, { providerId: p.id, vehicleId: v.id, driverId: d.id });
    await shipmentService.setStatus(s.id, "delivered");

    const ship = await logisticsAnalytics.shipments();
    expect(ship.delivered).toBeGreaterThanOrEqual(1);
    expect(ship.revenue).toBeGreaterThanOrEqual(4000);

    const tp = await logisticsAnalytics.commodityThroughput();
    expect(tp.find((t) => t.commodity === "Maize")?.kg).toBeGreaterThanOrEqual(3000);
  });
});
