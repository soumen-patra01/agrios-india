/* Provider availability — weekly slot management with conflict detection.
   Availability: { providerId, dayOfWeek (0=Sun..6=Sat),
     slots:[{ start:"09:00", end:"10:00" }], bufferMinutes:15, demo } */

import { repo } from "./svcDb.js";

const availability = repo("availability");
const bookingsRepo = repo("bookings");

const timeToMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const minToTime = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

const overlaps = (s1, e1, s2, e2) => s1 < e2 && s2 < e1;

export const availabilityService = {
  async setForDay(providerId, dayOfWeek, slots, bufferMinutes = 15) {
    const existing = await availability.getBy("providerId", providerId);
    const rec = existing.find((a) => a.dayOfWeek === dayOfWeek);
    if (rec) return availability.update(rec.id, { slots, bufferMinutes });
    return availability.add({ providerId, dayOfWeek, slots, bufferMinutes });
  },

  getForProvider: (providerId) => availability.getBy("providerId", providerId),

  async getForDay(providerId, dayOfWeek) {
    const list = await availability.getBy("providerId", providerId);
    return list.find((a) => a.dayOfWeek === dayOfWeek) || null;
  },

  async getAvailableSlots(providerId, dateStr) {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    const dayRec = await this.getForDay(providerId, dayOfWeek);
    if (!dayRec || !dayRec.slots?.length) return [];

    const buffer = dayRec.bufferMinutes || 0;
    const booked = (await bookingsRepo.getBy("providerId", providerId))
      .filter((b) => b.date === dateStr && !["cancelled", "no_show"].includes(b.status));

    return dayRec.slots.map((slot) => {
      const sMin = timeToMin(slot.start);
      const eMin = timeToMin(slot.end);
      const conflict = booked.some((b) => {
        const bs = timeToMin(b.startTime);
        const be = timeToMin(b.endTime) + buffer;
        return overlaps(sMin, eMin, bs, be);
      });
      return { start: slot.start, end: slot.end, available: !conflict };
    });
  },

  async hasConflict(providerId, dateStr, startTime, endTime) {
    const booked = (await bookingsRepo.getBy("providerId", providerId))
      .filter((b) => b.date === dateStr && !["cancelled", "no_show"].includes(b.status));
    const dayRec = await this.getForDay(providerId, new Date(dateStr).getDay());
    const buffer = dayRec?.bufferMinutes || 0;
    const sMin = timeToMin(startTime);
    const eMin = timeToMin(endTime);
    return booked.some((b) => {
      const bs = timeToMin(b.startTime);
      const be = timeToMin(b.endTime) + buffer;
      return overlaps(sMin, eMin, bs, be);
    });
  },

  timeToMin,
  minToTime,
};
