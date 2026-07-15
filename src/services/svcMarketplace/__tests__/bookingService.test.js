import { describe, it, expect } from "vitest";
import { bookingService } from "../bookingService.js";
import { providerService } from "../providerService.js";
import { svcCatalogService } from "../svcCatalogService.js";
import { availabilityService } from "../availabilityService.js";

async function setup() {
  const p = await providerService.register({ name: "Booking Test Provider", type: "individual" });
  const svc = await svcCatalogService.add({
    providerId: p.id, providerName: p.name, title: "Test Service",
    category: "vet", pricingType: "perVisit", price: 500, duration: 60, status: "published",
  });
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  await availabilityService.setForDay(p.id, today.getDay(), [
    { start: "09:00", end: "10:00" },
    { start: "10:00", end: "11:00" },
    { start: "11:00", end: "12:00" },
    { start: "14:00", end: "15:00" },
  ], 0);
  return { provider: p, service: svc, dateStr };
}

describe("bookingService", () => {
  it("creates a booking with pending status and timeline", async () => {
    const { provider, service, dateStr } = await setup();
    const b = await bookingService.create({
      serviceId: service.id, serviceName: service.title,
      providerId: provider.id, providerName: provider.name,
      date: dateStr, startTime: "09:00", endTime: "10:00",
      pricingType: "perVisit", price: 500,
    });

    expect(b.status).toBe("pending");
    expect(b.price).toBe(500);
    expect(b.timeline).toHaveLength(1);
    expect(b.timeline[0].status).toBe("pending");
  });

  it("rejects double-booking on the same slot", async () => {
    const { provider, service, dateStr } = await setup();
    await bookingService.create({
      serviceId: service.id, serviceName: service.title,
      providerId: provider.id, providerName: provider.name,
      date: dateStr, startTime: "10:00", endTime: "11:00",
      pricingType: "perVisit", price: 500,
    });

    await expect(bookingService.create({
      serviceId: service.id, serviceName: service.title,
      providerId: provider.id, providerName: provider.name,
      date: dateStr, startTime: "10:00", endTime: "11:00",
      pricingType: "perVisit", price: 500,
    })).rejects.toThrow("Time slot not available");
  });

  it("walks lifecycle: pending → confirmed → in_progress → completed", async () => {
    const { provider, service, dateStr } = await setup();
    const b = await bookingService.create({
      serviceId: service.id, serviceName: service.title,
      providerId: provider.id, providerName: provider.name,
      date: dateStr, startTime: "11:00", endTime: "12:00",
      pricingType: "perVisit", price: 500,
    });

    let updated = await bookingService.setStatus(b.id, "confirmed");
    expect(updated.status).toBe("confirmed");

    updated = await bookingService.setStatus(b.id, "in_progress");
    expect(updated.status).toBe("in_progress");

    updated = await bookingService.setStatus(b.id, "completed");
    expect(updated.status).toBe("completed");
    expect(updated.paid).toBe(true);
    expect(updated.timeline).toHaveLength(4);
  });

  it("cancel and reschedule guards work correctly", () => {
    expect(bookingService.canCancel({ status: "pending" })).toBe(true);
    expect(bookingService.canCancel({ status: "confirmed" })).toBe(true);
    expect(bookingService.canCancel({ status: "in_progress" })).toBe(false);
    expect(bookingService.canReschedule({ status: "pending" })).toBe(true);
    expect(bookingService.canReschedule({ status: "completed" })).toBe(false);
  });

  it("nextStatus returns correct forward flow", () => {
    expect(bookingService.nextStatus("pending")).toBe("confirmed");
    expect(bookingService.nextStatus("confirmed")).toBe("in_progress");
    expect(bookingService.nextStatus("in_progress")).toBe("completed");
    expect(bookingService.nextStatus("completed")).toBeNull();
  });

  it("providerSummary aggregates correctly", async () => {
    const { provider, service, dateStr } = await setup();
    const b1 = await bookingService.create({
      serviceId: service.id, serviceName: service.title,
      providerId: provider.id, providerName: provider.name,
      date: dateStr, startTime: "14:00", endTime: "15:00",
      pricingType: "perVisit", price: 300,
    });
    await bookingService.setStatus(b1.id, "completed");

    const summary = await bookingService.providerSummary(provider.id);
    expect(summary.completed).toBeGreaterThanOrEqual(1);
    expect(summary.earnings).toBeGreaterThanOrEqual(300);
  });
});
