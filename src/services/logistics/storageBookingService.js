/* Storage bookings — reserve warehouse / cold-storage capacity. Booking:
   { warehouseId, warehouseName, commodity, quantityKg, months, price,
     startDate, expiryDate, status, paymentTerm, paid,
     timeline:[{status, at}], demo } */

import { repo } from "./logisticsDb.js";
import { warehouseService } from "./warehouseService.js";

const bookings = repo("storageBookings");
const num = (v) => Number(v) || 0;

const addMonths = (dateStr, months) => {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + num(months));
  return d.toISOString().slice(0, 10);
};

export const storageBookingService = {
  getAll: () => bookings.getAll().then((l) =>
    l.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))),
  getById: (id) => bookings.getById(id),
  byWarehouse: (warehouseId) => bookings.getBy("warehouseId", warehouseId),

  async create({ warehouseId, commodity, quantityKg, months = 1, startDate, paymentTerm = "advance" }) {
    const w = await warehouseService.getById(warehouseId);
    if (!w) throw new Error("Warehouse not found");
    await warehouseService.allocate(warehouseId, quantityKg); // throws if over capacity

    const tonnes = num(quantityKg) / 1000;
    const price = Math.round(tonnes * num(w.pricePerTonneMonth) * num(months));
    const start = startDate || new Date().toISOString().slice(0, 10);

    return bookings.add({
      warehouseId, warehouseName: w.name,
      commodity, quantityKg: num(quantityKg), months: num(months),
      price, startDate: start, expiryDate: addMonths(start, months),
      status: "active", paymentTerm, paid: false,
      timeline: [{ status: "active", at: new Date().toISOString() }],
    });
  },

  async setStatus(id, status) {
    const b = await bookings.getById(id);
    if (!b || b.status === status) return b;
    // Releasing capacity when the booking ends.
    if (["completed", "cancelled"].includes(status)) {
      await warehouseService.release(b.warehouseId, b.quantityKg);
    }
    return bookings.update(id, {
      status,
      paid: status === "completed" ? true : b.paid,
      timeline: [...(b.timeline || []), { status, at: new Date().toISOString() }],
    });
  },

  /* Days until expiry (negative = expired). */
  daysToExpiry: (b) => Math.ceil((new Date(b.expiryDate) - Date.now()) / 86400000),
  isExpiringSoon(b) {
    const d = this.daysToExpiry(b);
    return b.status === "active" && d <= 7;
  },
};
