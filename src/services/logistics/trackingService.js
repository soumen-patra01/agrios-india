/* Shipment tracking — SIMULATED GPS. Real-time streaming / WebSocket / device
   telemetry is deferred to the backend phase; here we store discrete tracking
   points locally and can synthesise a demo trail between pickup and drop.
   Tracking point: { shipmentId, lat, lon, at, note, event } */

import { repo } from "./logisticsDb.js";
import { routingService } from "./routingService.js";
import { shipmentService } from "./shipmentService.js";

const tracking = repo("tracking");

// Monotonic tiebreaker so points written within the same millisecond keep
// their insertion order (ISO `at` alone can collide at ms resolution).
let _seq = 0;

export const trackingService = {
  addPoint(shipmentId, { lat, lon, note = "", event = "ping" }) {
    return tracking.add({ shipmentId, lat, lon, at: new Date().toISOString(), seq: ++_seq, note, event });
  },

  forShipment: (shipmentId) =>
    tracking.getBy("shipmentId", shipmentId).then((l) =>
      l.sort((a, b) => (a.at || "").localeCompare(b.at || "") || (a.seq || 0) - (b.seq || 0))),

  async currentLocation(shipmentId) {
    const pts = await this.forShipment(shipmentId);
    return pts.length ? pts[pts.length - 1] : null;
  },

  /* Straight-line ETA from the latest point to the drop, in minutes. */
  async eta(shipmentId) {
    const s = await shipmentService.getById(shipmentId);
    if (!s || !s.drop) return null;
    const cur = await this.currentLocation(shipmentId);
    const from = cur || s.pickup;
    if (!from) return null;
    return routingService.estimate(from, s.drop).etaMinutes;
  },

  /* Point-in-circle geofence test (radius in km) around a target. */
  withinGeofence(point, center, radiusKm) {
    if (!point || !center) return false;
    return routingService.haversineKm(point, center) <= radiusKm;
  },

  /* Trip replay = ordered points; also expose as {lat,lon} path for the map. */
  async replay(shipmentId) {
    const pts = await this.forShipment(shipmentId);
    return pts.map((p) => ({ lat: p.lat, lon: p.lon, at: p.at, event: p.event, note: p.note }));
  },

  /* Synthesise a demo trail of `steps` points along pickup→drop. Used by seed
     and by the "simulate movement" button on the tracking page. */
  async simulateTrail(shipmentId, steps = 5) {
    const s = await shipmentService.getById(shipmentId);
    if (!s || !s.pickup || !s.drop) return [];
    const made = [];
    for (let i = 1; i <= steps; i++) {
      const f = i / steps;
      const { lat, lon } = routingService.interpolate(s.pickup, s.drop, f);
      const event = i === steps ? "arrived" : "moving";
      made.push(await this.addPoint(shipmentId, {
        lat, lon,
        note: i === steps ? "Reached drop location" : `In transit (${Math.round(f * 100)}%)`,
        event,
      }));
    }
    return made;
  },

  async advance(shipmentId) {
    const s = await shipmentService.getById(shipmentId);
    if (!s) return null;
    const cur = await this.currentLocation(shipmentId);
    const done = (await this.forShipment(shipmentId)).length;
    const total = 5;
    const f = Math.min(1, (done + 1) / total);
    const { lat, lon } = routingService.interpolate(s.pickup, s.drop, f);
    return this.addPoint(shipmentId, {
      lat, lon,
      note: f >= 1 ? "Reached drop location" : `In transit (${Math.round(f * 100)}%)`,
      event: f >= 1 ? "arrived" : "moving",
    });
  },
};
