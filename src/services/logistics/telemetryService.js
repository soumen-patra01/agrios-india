/* Telemetry — simulated IoT readings for cold-chain / shipment sensors.
   Reuses the shared device-type/protocol vocabulary from iot/deviceRegistry;
   readings are stored in the logistics DB's own `telemetry` store so the
   Supabase migration stays independent. Live MQTT/LoRaWAN/NB-IoT ingestion
   plugs into `record()` without changing consumers.
   Reading: { deviceId, kind, value, unit, at, note } */

import { repo } from "./logisticsDb.js";
import { PROTOCOLS } from "../iot/deviceRegistry.js";
import { SENSOR_KINDS } from "./constantsLog.js";

const telemetry = repo("telemetry");
const num = (v) => Number(v) || 0;

// Monotonic tiebreaker so readings written within the same millisecond order
// deterministically (ISO `at` can collide at ms resolution).
let _seq = 0;

/* Stable synthetic device id for a facility/shipment + sensor kind. */
export const deviceIdFor = (ownerId, kind) => `${ownerId}:${kind}`;

export const kindMeta = (id) => SENSOR_KINDS.find((k) => k.id === id) || SENSOR_KINDS[0];

export const telemetryService = {
  PROTOCOLS,
  SENSOR_KINDS,

  record(deviceId, kind, value, note = "") {
    const meta = kindMeta(kind);
    return telemetry.add({
      deviceId, kind, value: num(value), unit: meta.unit, note,
      at: new Date().toISOString(), seq: ++_seq,
    });
  },

  forDevice: (deviceId, limit = 50) =>
    telemetry.getBy("deviceId", deviceId).then((l) =>
      l.sort((a, b) => (b.at || "").localeCompare(a.at || "") || (b.seq || 0) - (a.seq || 0)).slice(0, limit)),

  async latest(deviceId) {
    const l = await this.forDevice(deviceId, 1);
    return l[0] || null;
  },

  /* Latest reading per sensor kind for an owner (warehouse/shipment). */
  async snapshot(ownerId, kinds = ["temperature", "humidity"]) {
    const out = {};
    for (const k of kinds) {
      out[k] = await this.latest(deviceIdFor(ownerId, k));
    }
    return out;
  },

  /* Generate a small demo series (used by seed + "simulate" button). */
  async simulate(ownerId, kind, { base, jitter = 1, count = 6 }) {
    const made = [];
    for (let i = count; i >= 1; i--) {
      const value = Math.round((base + (Math.random() - 0.5) * 2 * jitter) * 10) / 10;
      made.push(await this.record(deviceIdFor(ownerId, kind), kind, value, "auto"));
    }
    return made;
  },

  /* Cold-chain breach check against a target band. */
  breach(reading, { min, max }) {
    if (!reading) return false;
    return reading.value < min || reading.value > max;
  },
};
