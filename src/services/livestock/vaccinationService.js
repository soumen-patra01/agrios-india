/* Vaccination calendar — aggregates health events across every livestock
   enterprise into upcoming / missed / history views. Reuses eventService
   data; no separate store. */

import { eventService, ENTERPRISES } from "./livestockService.js";

const HEALTH_TYPES = ["vaccination", "deworming", "treatment", "medicine"];
const todayStr = () => new Date().toISOString().slice(0, 10);

export const vaccinationService = {
  /* All health events across enterprises, newest first, tagged with enterprise. */
  async allHealth() {
    const lists = await Promise.all(
      ENTERPRISES.map(async (e) => {
        const events = await eventService.getForEnterprise(e.id);
        return events
          .filter((ev) => HEALTH_TYPES.includes(ev.type))
          .map((ev) => ({ ...ev, enterpriseLabel: e.label, enterpriseIcon: e.icon }));
      })
    );
    return lists.flat().sort((a, b) => b.date.localeCompare(a.date));
  },

  /* Events with a dueDate in the next `days`. */
  async upcoming(days = 30) {
    const all = await this.allHealth();
    const today = todayStr();
    const end = new Date(); end.setDate(end.getDate() + days);
    const endStr = end.toISOString().slice(0, 10);
    return all
      .filter((ev) => ev.dueDate && ev.dueDate >= today && ev.dueDate <= endStr)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  },

  /* Due dates that have passed without a newer event of the same type. */
  async missed() {
    const all = await this.allHealth();
    const today = todayStr();
    return all
      .filter((ev) => ev.dueDate && ev.dueDate < today)
      .filter((ev) => !all.some((later) =>
        later.enterprise === ev.enterprise &&
        later.type === ev.type &&
        later.date > ev.dueDate))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  },

  async counts() {
    const [up, miss] = await Promise.all([this.upcoming(), this.missed()]);
    return { upcoming: up.length, missed: miss.length };
  },
};
