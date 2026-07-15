/* Service bookings — lifecycle mirrors mpOrderService's order pattern.
   Booking: { serviceId, serviceName, providerId, providerName, farmerId:"self",
     bookingType, date, startTime, endTime, status, pricingType, price,
     paymentMethod, paid, notes, location, timeline:[{status, at}],
     originalDate, originalTime, demo } */

import { repo } from "./svcDb.js";
import { availabilityService } from "./availabilityService.js";
import { providerService } from "./providerService.js";
import { BOOKING_FLOW } from "./constantsSvc.js";

const bookings = repo("bookings");
const num = (v) => Number(v) || 0;

export const bookingService = {
  async create({ serviceId, serviceName, providerId, providerName,
    bookingType = "scheduled", date, startTime, endTime,
    pricingType, price, notes = "", location = "", paymentMethod = "cod" }) {

    if (bookingType !== "emergency") {
      const conflict = await availabilityService.hasConflict(providerId, date, startTime, endTime);
      if (conflict) throw new Error("Time slot not available");
    }

    return bookings.add({
      serviceId, serviceName, providerId, providerName, farmerId: "self",
      bookingType, date, startTime, endTime,
      status: "pending", pricingType, price: num(price),
      paymentMethod, paid: false, notes, location,
      timeline: [{ status: "pending", at: new Date().toISOString() }],
    });
  },

  getAll: () => bookings.getAll().then((l) =>
    l.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))),
  getById: (id) => bookings.getById(id),
  byProvider: (providerId) => bookings.getBy("providerId", providerId).then((l) =>
    l.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))),

  async setStatus(id, status) {
    const booking = await bookings.getById(id);
    if (!booking || booking.status === status) return booking;

    const patch = {
      status,
      paid: status === "completed" ? true : booking.paid,
      timeline: [...(booking.timeline || []), { status, at: new Date().toISOString() }],
    };

    if (status === "completed") {
      const provider = await providerService.getById(booking.providerId);
      if (provider) {
        await providerService.update(provider.id, {
          completedBookings: num(provider.completedBookings) + 1,
        });
      }
    }

    return bookings.update(id, patch);
  },

  async reschedule(id, newDate, newStartTime, newEndTime) {
    const booking = await bookings.getById(id);
    if (!booking) return null;

    const conflict = await availabilityService.hasConflict(
      booking.providerId, newDate, newStartTime, newEndTime);
    if (conflict) throw new Error("New time slot not available");

    return bookings.update(id, {
      originalDate: booking.originalDate || booking.date,
      originalTime: booking.originalTime || booking.startTime,
      date: newDate, startTime: newStartTime, endTime: newEndTime,
      timeline: [...(booking.timeline || []), { status: "rescheduled", at: new Date().toISOString() }],
    });
  },

  cancel: (id) => bookingService.setStatus(id, "cancelled"),

  nextStatus: (status) => {
    const i = BOOKING_FLOW.indexOf(status);
    return i >= 0 && i < BOOKING_FLOW.length - 1 ? BOOKING_FLOW[i + 1] : null;
  },
  canCancel: (b) => ["pending", "confirmed"].includes(b.status),
  canReschedule: (b) => ["pending", "confirmed"].includes(b.status),

  async providerSummary(providerId) {
    const list = await this.byProvider(providerId);
    const completed = list.filter((b) => b.status === "completed");
    const active = list.filter((b) => ["pending", "confirmed", "in_progress"].includes(b.status));
    return {
      total: list.length,
      active: active.length,
      completed: completed.length,
      earnings: completed.reduce((s, b) => s + num(b.price), 0),
    };
  },
};
