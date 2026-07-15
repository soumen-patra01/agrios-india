/* Driver management. Driver:
   { providerId, providerName, name, phone, licenseNumber, licenseExpiry,
     status:"available"|"on_trip"|"off_duty",
     licenseVerified, identityVerified, languages:[],
     rating:0, reviewCount:0, trips:[{ shipmentId, date, rating }],
     completedTrips:0, demo } */

import { repo } from "./logisticsDb.js";

const drivers = repo("drivers");
const num = (v) => Number(v) || 0;

export const driverService = {
  getAll: () => drivers.getAll(),
  getById: (id) => drivers.getById(id),
  byProvider: (providerId) => drivers.getBy("providerId", providerId),
  available: (providerId) =>
    drivers.getBy("providerId", providerId).then((l) => l.filter((d) => d.status === "available")),

  register({ providerId, providerName, name, phone, licenseNumber, licenseExpiry, languages = [] }) {
    return drivers.add({
      providerId, providerName, name, phone,
      licenseNumber, licenseExpiry: licenseExpiry || "",
      status: "available",
      licenseVerified: false, identityVerified: false,
      languages,
      rating: 0, reviewCount: 0,
      trips: [], completedTrips: 0,
    });
  },

  update: (id, patch) => drivers.update(id, patch),
  remove: (id) => drivers.remove(id),
  setStatus: (id, status) => drivers.update(id, { status }),
  verify: (id, kind) =>
    drivers.update(id, kind === "identity" ? { identityVerified: true } : { licenseVerified: true }),

  async recordTrip(id, shipmentId, rating) {
    const d = await drivers.getById(id);
    if (!d) return null;
    const trips = [...(d.trips || []), { shipmentId, date: new Date().toISOString().slice(0, 10), rating: rating || null }];
    const rated = trips.filter((t) => t.rating);
    const avg = rated.length
      ? Math.round((rated.reduce((s, t) => s + t.rating, 0) / rated.length) * 10) / 10
      : num(d.rating);
    return drivers.update(id, {
      trips,
      completedTrips: num(d.completedTrips) + 1,
      status: "available",
      rating: avg, reviewCount: rated.length,
    });
  },

  /* Performance: on-time rate proxy from completed trips + average rating. */
  performance(d) {
    return {
      completedTrips: num(d.completedTrips),
      rating: num(d.rating),
      verified: !!(d.licenseVerified && d.identityVerified),
    };
  },
};
