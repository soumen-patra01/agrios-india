/* Fleet management — vehicles owned by transport providers. Vehicle:
   { providerId, providerName, category, regNumber, model, capacityKg,
     status:"available"|"on_trip"|"maintenance", available:true,
     documents:{ insuranceExpiry, fitnessExpiry, permitExpiry },
     maintenance:[{ date, note, cost }], fuelLogs:[{ date, litres, cost, odometer }],
     odometer, healthScore, demo } */

import { repo } from "./logisticsDb.js";
import { vehicleMeta } from "./constantsLog.js";

const vehicles = repo("vehicles");
const num = (v) => Number(v) || 0;

/* Days until an ISO date (negative = expired). null-safe. */
const daysUntil = (iso) => {
  if (!iso) return null;
  return Math.ceil((new Date(iso) - Date.now()) / 86400000);
};

export const fleetService = {
  getAll: () => vehicles.getAll(),
  getById: (id) => vehicles.getById(id),
  byProvider: (providerId) => vehicles.getBy("providerId", providerId),

  register({ providerId, providerName, category, regNumber, model, documents = {} }) {
    const meta = vehicleMeta(category);
    return vehicles.add({
      providerId, providerName, category,
      regNumber, model: model || meta.label,
      capacityKg: meta.capacityKg,
      status: "available", available: true,
      documents: {
        insuranceExpiry: documents.insuranceExpiry || "",
        fitnessExpiry: documents.fitnessExpiry || "",
        permitExpiry: documents.permitExpiry || "",
      },
      maintenance: [], fuelLogs: [],
      odometer: 0, healthScore: 100,
    });
  },

  update: (id, patch) => vehicles.update(id, patch),
  remove: (id) => vehicles.remove(id),

  setAvailability: (id, available) =>
    vehicles.update(id, { available, status: available ? "available" : "off_duty" }),

  async logMaintenance(id, { date, note, cost }) {
    const v = await vehicles.getById(id);
    if (!v) return null;
    const entry = { date: date || new Date().toISOString().slice(0, 10), note, cost: num(cost) };
    // A maintenance event dents health; a service refreshes it toward 100.
    const health = Math.min(100, num(v.healthScore) + 5);
    return vehicles.update(id, {
      maintenance: [...(v.maintenance || []), entry],
      healthScore: health,
    });
  },

  async logFuel(id, { date, litres, cost, odometer }) {
    const v = await vehicles.getById(id);
    if (!v) return null;
    const entry = {
      date: date || new Date().toISOString().slice(0, 10),
      litres: num(litres), cost: num(cost), odometer: num(odometer),
    };
    return vehicles.update(id, {
      fuelLogs: [...(v.fuelLogs || []), entry],
      odometer: Math.max(num(v.odometer), num(odometer)),
    });
  },

  /* Mileage (km/L) from consecutive fuel logs with odometer readings. */
  mileage(v) {
    const logs = (v.fuelLogs || []).filter((f) => f.odometer > 0).sort((a, b) => a.odometer - b.odometer);
    if (logs.length < 2) return null;
    const dist = logs[logs.length - 1].odometer - logs[0].odometer;
    const litres = logs.slice(1).reduce((s, f) => s + num(f.litres), 0);
    return litres > 0 ? Math.round((dist / litres) * 10) / 10 : null;
  },

  /* Which documents are expired or expiring within 30 days. */
  documentAlerts(v) {
    const d = v.documents || {};
    const alerts = [];
    [["Insurance", d.insuranceExpiry], ["Fitness", d.fitnessExpiry], ["Permit", d.permitExpiry]]
      .forEach(([label, iso]) => {
        const days = daysUntil(iso);
        if (days === null) return;
        if (days < 0) alerts.push({ label, days, level: "expired" });
        else if (days <= 30) alerts.push({ label, days, level: "soon" });
      });
    return alerts;
  },

  daysUntil,
  categoryLabel: (id) => vehicleMeta(id).label,
};
