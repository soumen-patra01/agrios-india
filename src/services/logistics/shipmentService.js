/* Shipment management — lifecycle mirrors mpOrderService's order pattern.
   Shipment:
   { ref, commodity, quantityKg, pickup:{name,lat,lon}, drop:{name,lat,lon},
     distanceKm, etaMinutes, fuelCost,
     status, providerId, providerName, vehicleId, vehicleReg,
     driverId, driverName, price, paymentTerm, paid, pickupDate, notes,
     pod:{ receivedBy, at } | null, damage:[{ at, note }],
     timeline:[{status, at}], demo } */

import { repo } from "./logisticsDb.js";
import { routingService } from "./routingService.js";
import { transportService } from "./transportService.js";
import { driverService } from "./driverService.js";
import { fleetService } from "./fleetService.js";
import { SHIPMENT_FLOW } from "./constantsLog.js";

const shipments = repo("shipments");
const num = (v) => Number(v) || 0;
const ref = () => "SHP-" + Date.now().toString(36).slice(-5).toUpperCase();

export const shipmentService = {
  async create({ commodity, quantityKg, pickup, drop, price, paymentTerm = "onDelivery", pickupDate, notes = "" }) {
    const est = routingService.estimate(pickup, drop);
    return shipments.add({
      ref: ref(),
      commodity, quantityKg: num(quantityKg),
      pickup, drop,
      distanceKm: est.distanceKm, etaMinutes: est.etaMinutes, fuelCost: est.fuelCost,
      status: "pending",
      providerId: null, providerName: null,
      vehicleId: null, vehicleReg: null,
      driverId: null, driverName: null,
      price: num(price), paymentTerm, paid: false,
      pickupDate: pickupDate || new Date().toISOString().slice(0, 10),
      notes,
      pod: null, damage: [],
      timeline: [{ status: "pending", at: new Date().toISOString() }],
    });
  },

  getAll: () => shipments.getAll().then((l) =>
    l.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))),
  getById: (id) => shipments.getById(id),
  byProvider: (providerId) => shipments.getBy("providerId", providerId).then((l) =>
    l.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))),
  byStatus: (status) => shipments.getBy("status", status),
  unassigned: () => shipments.getBy("status", "pending"),

  /* Assign a provider + vehicle + driver → moves to "assigned". */
  async assign(id, { providerId, vehicleId, driverId }) {
    const s = await shipments.getById(id);
    if (!s) return null;

    const [provider, vehicle, driver] = await Promise.all([
      transportService.getById(providerId),
      vehicleId ? fleetService.getById(vehicleId) : null,
      driverId ? driverService.getById(driverId) : null,
    ]);

    if (vehicle && vehicle.capacityKg && num(s.quantityKg) > num(vehicle.capacityKg)) {
      throw new Error("Load exceeds vehicle capacity");
    }

    if (vehicleId) await fleetService.update(vehicleId, { status: "on_trip", available: false });
    if (driverId) await driverService.setStatus(driverId, "on_trip");

    return shipments.update(id, {
      providerId, providerName: provider?.name || null,
      vehicleId: vehicleId || null, vehicleReg: vehicle?.regNumber || null,
      driverId: driverId || null, driverName: driver?.name || null,
      status: "assigned",
      timeline: [...(s.timeline || []), { status: "assigned", at: new Date().toISOString() }],
    });
  },

  async setStatus(id, status) {
    const s = await shipments.getById(id);
    if (!s || s.status === status) return s;

    const patch = {
      status,
      paid: status === "delivered" ? true : s.paid,
      timeline: [...(s.timeline || []), { status, at: new Date().toISOString() }],
    };

    // Free the vehicle/driver + credit trip counts on terminal states.
    if (["delivered", "returned", "cancelled"].includes(status)) {
      if (s.vehicleId) await fleetService.update(s.vehicleId, { status: "available", available: true });
      if (s.driverId) await driverService.recordTrip(s.driverId, s.id, null);
      if (status === "delivered" && s.providerId) {
        const p = await transportService.getById(s.providerId);
        if (p) await transportService.update(p.id, { completedTrips: num(p.completedTrips) + 1 });
      }
    }

    return shipments.update(id, patch);
  },

  /* Proof of delivery — also flips status to delivered. */
  async confirmDelivery(id, { receivedBy }) {
    const s = await shipments.getById(id);
    if (!s) return null;
    await shipments.update(id, { pod: { receivedBy: receivedBy || "Recipient", at: new Date().toISOString() } });
    return this.setStatus(id, "delivered");
  },

  async reportDamage(id, note) {
    const s = await shipments.getById(id);
    if (!s) return null;
    return shipments.update(id, {
      damage: [...(s.damage || []), { at: new Date().toISOString(), note }],
    });
  },

  cancel: (id) => shipmentService.setStatus(id, "cancelled"),
  markReturned: (id) => shipmentService.setStatus(id, "returned"),

  nextStatus: (status) => {
    const i = SHIPMENT_FLOW.indexOf(status);
    return i >= 0 && i < SHIPMENT_FLOW.length - 1 ? SHIPMENT_FLOW[i + 1] : null;
  },
  canCancel: (s) => ["pending", "assigned"].includes(s.status),

  async providerSummary(providerId) {
    const list = await this.byProvider(providerId);
    const delivered = list.filter((s) => s.status === "delivered");
    const active = list.filter((s) => ["assigned", "picked_up", "in_transit"].includes(s.status));
    return {
      total: list.length,
      active: active.length,
      delivered: delivered.length,
      earnings: delivered.reduce((sum, s) => sum + num(s.price), 0),
    };
  },
};
