/* Nearby services — finds vets, markets, banks, fuel, agri-supply shops etc.
   around a coordinate using the keyless OpenStreetMap Overpass API. Results are
   cached (offline-first) and sorted by distance. Category → OSM tag mapping
   lives here so the UI stays declarative. */

import { ttlCache } from "../cache/ttlCache.js";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const TTL = 6 * 60 * 60 * 1000; // 6h — POIs rarely move

/* category id → { label, icon, accent, overpass filters } */
export const NEARBY_CATEGORIES = [
  { id: "vet",     label: "Veterinary", icon: "Stethoscope", accent: "red",     filters: ['node["amenity"="veterinary"]'] },
  { id: "market",  label: "Markets",    icon: "Store",       accent: "orange",  filters: ['node["amenity"="marketplace"]', 'node["shop"="farm"]'] },
  { id: "agri",    label: "Agri supply",icon: "Sprout",      accent: "primary", filters: ['node["shop"="agrarian"]', 'node["shop"="garden_centre"]'] },
  { id: "bank",    label: "Banks & ATM",icon: "Building2",   accent: "blue",    filters: ['node["amenity"="bank"]', 'node["amenity"="atm"]'] },
  { id: "fuel",    label: "Fuel",       icon: "Truck",       accent: "yellow",  filters: ['node["amenity"="fuel"]'] },
  { id: "hospital",label: "Health",     icon: "ShieldCheck", accent: "red",     filters: ['node["amenity"="hospital"]', 'node["amenity"="clinic"]'] },
];

export function getCategory(id) {
  return NEARBY_CATEGORIES.find((c) => c.id === id) || NEARBY_CATEGORIES[0];
}

/* Haversine distance in km. */
function distanceKm(aLat, aLon, bLat, bLon) {
  const R = 6371, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat), dLon = toRad(bLon - aLon);
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function buildQuery(category, lat, lon, radiusM) {
  const around = `(around:${radiusM},${lat},${lon})`;
  const body = category.filters.map((f) => `${f}${around};`).join("");
  return `[out:json][timeout:20];(${body});out body 40;`;
}

export const nearbyService = {
  categories: NEARBY_CATEGORIES,

  /* Returns [{ id, name, lat, lon, distanceKm, category }], nearest first. */
  async find({ categoryId, lat, lon, radiusKm = 15, force = false }, { signal } = {}) {
    const category = getCategory(categoryId);
    const ck = `nearby:${categoryId}:${lat.toFixed(2)},${lon.toFixed(2)}:${radiusKm}`;

    if (!force) {
      const fresh = ttlCache.get(ck);
      if (fresh) return fresh;
    }

    try {
      const res = await fetch(OVERPASS_URL, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: "data=" + encodeURIComponent(buildQuery(category, lat, lon, radiusKm * 1000)),
        signal,
      });
      if (!res.ok) throw new Error(`overpass error (${res.status})`);
      const d = await res.json();
      const items = (d.elements || [])
        .filter((e) => e.lat && e.lon)
        .map((e) => ({
          id: String(e.id),
          name: e.tags?.name || category.label,
          address: [e.tags?.["addr:street"], e.tags?.["addr:city"]].filter(Boolean).join(", "),
          phone: e.tags?.phone || e.tags?.["contact:phone"] || null,
          lat: e.lat,
          lon: e.lon,
          distanceKm: Math.round(distanceKm(lat, lon, e.lat, e.lon) * 10) / 10,
          category: categoryId,
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 30);
      ttlCache.set(ck, items, TTL);
      return items;
    } catch (err) {
      const cached = ttlCache.getStale(ck);
      if (cached?.value) return cached.value;
      throw err;
    }
  },
};
