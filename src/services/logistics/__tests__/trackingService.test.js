import { describe, it, expect } from "vitest";
import { trackingService } from "../trackingService.js";
import { shipmentService } from "../shipmentService.js";
import { routingService } from "../routingService.js";
import { placeById } from "../constantsLog.js";

async function makeShipment() {
  return shipmentService.create({
    commodity: "Onion", quantityKg: 1000,
    pickup: placeById("barasat"), drop: placeById("siliguri"), price: 5000,
  });
}

describe("trackingService", () => {
  it("adds points and returns latest as current location", async () => {
    const s = await makeShipment();
    await trackingService.addPoint(s.id, { lat: 22.8, lon: 88.4 });
    await trackingService.addPoint(s.id, { lat: 23.5, lon: 88.4 });
    const cur = await trackingService.currentLocation(s.id);
    expect(cur.lat).toBe(23.5);
  });

  it("simulateTrail generates an ordered trail ending at the drop", async () => {
    const s = await makeShipment();
    const made = await trackingService.simulateTrail(s.id, 4);
    expect(made).toHaveLength(4);
    const replay = await trackingService.replay(s.id);
    expect(replay).toHaveLength(4);
    expect(replay[replay.length - 1].event).toBe("arrived");
  });

  it("computes an ETA to the drop point", async () => {
    const s = await makeShipment();
    await trackingService.addPoint(s.id, { lat: 24.0, lon: 88.4 });
    const eta = await trackingService.eta(s.id);
    expect(eta).toBeGreaterThan(0);
  });

  it("geofence test respects the radius", () => {
    const center = placeById("kolkata");
    const near = { lat: center.lat + 0.01, lon: center.lon + 0.01 };
    const far = { lat: center.lat + 2, lon: center.lon + 2 };
    expect(trackingService.withinGeofence(near, center, 5)).toBe(true);
    expect(trackingService.withinGeofence(far, center, 5)).toBe(false);
  });

  it("haversine distance between two known points is sane", () => {
    const km = routingService.haversineKm(placeById("barasat"), placeById("kolkata"));
    expect(km).toBeGreaterThan(5);
    expect(km).toBeLessThan(60);
  });
});
