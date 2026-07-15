import { describe, it, expect } from "vitest";
import { shipmentService } from "../shipmentService.js";
import { transportService } from "../transportService.js";
import { fleetService } from "../fleetService.js";
import { driverService } from "../driverService.js";
import { placeById } from "../constantsLog.js";

async function setup() {
  const p = await transportService.register({ name: "Test Transport", type: "fleet" });
  const v = await fleetService.register({ providerId: p.id, providerName: p.name, category: "truck", regNumber: "WB-00-XX-0001" });
  const d = await driverService.register({ providerId: p.id, providerName: p.name, name: "Test Driver" });
  return { provider: p, vehicle: v, driver: d };
}

function shipmentPayload(over = {}) {
  return {
    commodity: "Paddy", quantityKg: 2000,
    pickup: placeById("barasat"), drop: placeById("kolkata"),
    price: 3000, ...over,
  };
}

describe("shipmentService", () => {
  it("creates a shipment with pending status, ref and computed distance", async () => {
    const s = await shipmentService.create(shipmentPayload());
    expect(s.status).toBe("pending");
    expect(s.ref).toMatch(/^SHP-/);
    expect(s.distanceKm).toBeGreaterThan(0);
    expect(s.timeline).toHaveLength(1);
  });

  it("assigns vehicle + driver and moves to assigned", async () => {
    const { provider, vehicle, driver } = await setup();
    const s = await shipmentService.create(shipmentPayload());
    const assigned = await shipmentService.assign(s.id, { providerId: provider.id, vehicleId: vehicle.id, driverId: driver.id });
    expect(assigned.status).toBe("assigned");
    expect(assigned.vehicleReg).toBe("WB-00-XX-0001");
    expect(assigned.driverName).toBe("Test Driver");

    const veh = await fleetService.getById(vehicle.id);
    expect(veh.available).toBe(false);
  });

  it("rejects assignment when load exceeds vehicle capacity", async () => {
    const { provider, driver } = await setup();
    const small = await fleetService.register({ providerId: provider.id, providerName: provider.name, category: "threeWheeler", regNumber: "WB-00-XX-0009" });
    const s = await shipmentService.create(shipmentPayload({ quantityKg: 5000 }));
    await expect(shipmentService.assign(s.id, { providerId: provider.id, vehicleId: small.id, driverId: driver.id }))
      .rejects.toThrow("exceeds vehicle capacity");
  });

  it("walks lifecycle assigned → picked_up → in_transit → delivered via POD", async () => {
    const { provider, vehicle, driver } = await setup();
    const s = await shipmentService.create(shipmentPayload());
    await shipmentService.assign(s.id, { providerId: provider.id, vehicleId: vehicle.id, driverId: driver.id });
    await shipmentService.setStatus(s.id, "picked_up");
    await shipmentService.setStatus(s.id, "in_transit");
    const done = await shipmentService.confirmDelivery(s.id, { receivedBy: "Agent" });

    expect(done.status).toBe("delivered");
    expect(done.paid).toBe(true);
    expect(done.pod.receivedBy).toBe("Agent");

    // vehicle freed on delivery
    const veh = await fleetService.getById(vehicle.id);
    expect(veh.available).toBe(true);
  });

  it("records damage reports", async () => {
    const s = await shipmentService.create(shipmentPayload());
    const updated = await shipmentService.reportDamage(s.id, "2 sacks torn");
    expect(updated.damage).toHaveLength(1);
    expect(updated.damage[0].note).toBe("2 sacks torn");
  });

  it("nextStatus follows the forward flow and stops at delivered", () => {
    expect(shipmentService.nextStatus("pending")).toBe("assigned");
    expect(shipmentService.nextStatus("in_transit")).toBe("delivered");
    expect(shipmentService.nextStatus("delivered")).toBeNull();
  });

  it("providerSummary aggregates delivered earnings", async () => {
    const { provider, vehicle, driver } = await setup();
    const s = await shipmentService.create(shipmentPayload({ price: 4500 }));
    await shipmentService.assign(s.id, { providerId: provider.id, vehicleId: vehicle.id, driverId: driver.id });
    await shipmentService.setStatus(s.id, "delivered");
    const sum = await shipmentService.providerSummary(provider.id);
    expect(sum.delivered).toBeGreaterThanOrEqual(1);
    expect(sum.earnings).toBeGreaterThanOrEqual(4500);
  });
});
