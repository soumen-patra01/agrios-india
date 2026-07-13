/* Geocoding — provider-independent place ↔ coordinate lookup.
   Forward search uses Open-Meteo's geocoding API (keyless, CORS-friendly).
   Reverse (coords → place name) uses OpenStreetMap Nominatim. No keys, and no
   personal data is ever sent — only coordinates or a place query. */

const FORWARD_URL = "https://geocoding-api.open-meteo.com/v1/search";
const REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";

/* Search places by name. Returns [{ name, admin, country, lat, lon }]. */
export async function searchPlaces(query, { signal, count = 6 } = {}) {
  const q = (query || "").trim();
  if (q.length < 2) return [];
  const p = new URLSearchParams({ name: q, count: String(count), language: "en", format: "json" });
  const res = await fetch(`${FORWARD_URL}?${p.toString()}`, { signal });
  if (!res.ok) throw new Error(`geocoding error (${res.status})`);
  const d = await res.json();
  return (d.results || []).map((r) => ({
    name: r.name,
    admin: [r.admin2, r.admin1].filter(Boolean).join(", "),
    country: r.country,
    lat: r.latitude,
    lon: r.longitude,
    label: [r.name, r.admin1, r.country].filter(Boolean).join(", "),
  }));
}

/* Coordinates → a short human place name (district/town level). */
export async function reverseGeocode(lat, lon, { signal } = {}) {
  const p = new URLSearchParams({
    lat: String(lat), lon: String(lon), format: "json", zoom: "10", addressdetails: "1",
  });
  try {
    const res = await fetch(`${REVERSE_URL}?${p.toString()}`, {
      signal, headers: { "Accept-Language": "en" },
    });
    if (!res.ok) throw new Error();
    const d = await res.json();
    const a = d.address || {};
    const town = a.village || a.town || a.city || a.suburb || a.county;
    const region = a.state_district || a.state;
    return [town, region].filter(Boolean).join(", ") || d.display_name || null;
  } catch {
    return null; // name is a nicety; coordinates still work without it
  }
}
