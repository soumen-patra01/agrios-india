/* Route planning — self-contained geo helpers + a nearest-neighbour multi-stop
   optimiser. No external routing API; distances are great-circle (haversine)
   estimates, good enough for planning/ETA display. AI/traffic-aware routing is
   deferred to the backend phase. */

const R = 6371; // earth radius km
const toRad = (d) => (d * Math.PI) / 180;

/* Great-circle distance in km between two {lat, lon} points. */
export function haversineKm(a, b) {
  if (!a || !b) return 0;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}

const AVG_SPEED_KMH = 40;   // rural highway average
const FUEL_KM_PER_L = 6;    // laden truck
const DIESEL_PER_L = 95;    // ₹

export const routingService = {
  haversineKm,

  /* Estimate for a single leg. */
  estimate(from, to) {
    const km = haversineKm(from, to);
    const hours = km / AVG_SPEED_KMH;
    return {
      distanceKm: km,
      etaMinutes: Math.round(hours * 60),
      fuelLitres: Math.round((km / FUEL_KM_PER_L) * 10) / 10,
      fuelCost: Math.round((km / FUEL_KM_PER_L) * DIESEL_PER_L),
    };
  },

  /* Order intermediate stops by nearest-neighbour from `start`, then total the
     route. stops: [{ name, lat, lon, ...}]. Returns { ordered, totalKm, legs }. */
  optimize(start, stops, end = null) {
    const remaining = [...stops];
    const ordered = [];
    let cursor = start;
    while (remaining.length) {
      let bestI = 0;
      let bestD = Infinity;
      remaining.forEach((s, i) => {
        const d = haversineKm(cursor, s);
        if (d < bestD) { bestD = d; bestI = i; }
      });
      const next = remaining.splice(bestI, 1)[0];
      ordered.push(next);
      cursor = next;
    }
    const path = [start, ...ordered, ...(end ? [end] : [])];
    const legs = [];
    let totalKm = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const km = haversineKm(path[i], path[i + 1]);
      legs.push({ from: path[i], to: path[i + 1], km });
      totalKm += km;
    }
    return {
      ordered,
      totalKm: Math.round(totalKm * 10) / 10,
      legs,
      etaMinutes: Math.round((totalKm / AVG_SPEED_KMH) * 60),
    };
  },

  /* Interpolate a point fraction f (0..1) along a straight leg — used by the
     tracking simulator to place the vehicle marker. */
  interpolate(from, to, f) {
    return {
      lat: from.lat + (to.lat - from.lat) * f,
      lon: from.lon + (to.lon - from.lon) * f,
    };
  },
};
