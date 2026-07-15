/* Warehouse & cold-storage management. Warehouse:
   { name, type, cold, ownerName, village, district, state, lat, lon,
     capacityKg, allocatedKg, pricePerTonneMonth, icon, accent,
     tempBand:{ min, max }, humidityBand:{ min, max },
     status:"active", rating, reviewCount, demo } */

import { repo } from "./logisticsDb.js";
import { telemetryService, deviceIdFor } from "./telemetryService.js";
import { warehouseMeta } from "./constantsLog.js";

const warehouses = repo("warehouses");
const num = (v) => Number(v) || 0;

export const warehouseService = {
  getAll: () => warehouses.getAll(),
  getById: (id) => warehouses.getById(id),
  byType: (type) => warehouses.getBy("type", type),
  cold: () => warehouses.getAll().then((l) => l.filter((w) => w.cold)),

  register(data) {
    const meta = warehouseMeta(data.type);
    return warehouses.add({
      icon: meta.icon, accent: meta.accent, cold: meta.cold,
      allocatedKg: 0,
      tempBand: meta.cold ? { min: 2, max: 8 } : null,
      humidityBand: meta.cold ? { min: 50, max: 70 } : null,
      status: "active", rating: 0, reviewCount: 0,
      ...data,
      capacityKg: num(data.capacityKg),
      pricePerTonneMonth: num(data.pricePerTonneMonth),
    });
  },

  update: (id, patch) => warehouses.update(id, patch),
  remove: (id) => warehouses.remove(id),

  availableKg: (w) => Math.max(0, num(w.capacityKg) - num(w.allocatedKg)),
  utilisation: (w) => (num(w.capacityKg) ? Math.round((num(w.allocatedKg) / num(w.capacityKg)) * 100) : 0),

  async allocate(id, kg) {
    const w = await warehouses.getById(id);
    if (!w) return null;
    if (num(kg) > this.availableKg(w)) throw new Error("Not enough free capacity");
    return warehouses.update(id, { allocatedKg: num(w.allocatedKg) + num(kg) });
  },

  async release(id, kg) {
    const w = await warehouses.getById(id);
    if (!w) return null;
    return warehouses.update(id, { allocatedKg: Math.max(0, num(w.allocatedKg) - num(kg)) });
  },

  /* Cold-chain snapshot + breach flags for a warehouse. */
  async monitoring(id) {
    const w = await warehouses.getById(id);
    if (!w || !w.cold) return null;
    const snap = await telemetryService.snapshot(id, ["temperature", "humidity"]);
    return {
      temperature: snap.temperature,
      humidity: snap.humidity,
      tempBreach: telemetryService.breach(snap.temperature, w.tempBand || { min: 2, max: 8 }),
      humidityBreach: telemetryService.breach(snap.humidity, w.humidityBand || { min: 50, max: 70 }),
    };
  },

  deviceIdFor,
};
