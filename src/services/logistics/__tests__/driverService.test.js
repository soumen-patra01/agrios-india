import { describe, it, expect } from "vitest";
import { driverService } from "../driverService.js";

describe("driverService", () => {
  it("registers a driver as available and unverified", async () => {
    const d = await driverService.register({ providerId: "p1", providerName: "P", name: "Ravi", phone: "9" });
    expect(d.status).toBe("available");
    expect(d.licenseVerified).toBe(false);
    expect(d.identityVerified).toBe(false);
  });

  it("verifies license and identity independently", async () => {
    const d = await driverService.register({ providerId: "p1", providerName: "P", name: "Ravi" });
    await driverService.verify(d.id, "license");
    const after = await driverService.verify(d.id, "identity");
    expect(after.licenseVerified).toBe(true);
    expect(after.identityVerified).toBe(true);
    expect(driverService.performance(after).verified).toBe(true);
  });

  it("records a trip, updates rating and returns driver to available", async () => {
    const d = await driverService.register({ providerId: "p1", providerName: "P", name: "Ravi" });
    await driverService.setStatus(d.id, "on_trip");
    const after = await driverService.recordTrip(d.id, "shp1", 5);
    expect(after.completedTrips).toBe(1);
    expect(after.rating).toBe(5);
    expect(after.status).toBe("available");
  });

  it("lists available drivers for a provider", async () => {
    const a = await driverService.register({ providerId: "p2", providerName: "P2", name: "A" });
    await driverService.register({ providerId: "p2", providerName: "P2", name: "B" });
    await driverService.setStatus(a.id, "on_trip");
    const avail = await driverService.available("p2");
    expect(avail.every((d) => d.status === "available")).toBe(true);
    expect(avail.find((d) => d.id === a.id)).toBeUndefined();
  });
});
