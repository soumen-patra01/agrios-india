/* Maps service — provider-independent map URLs. Default is OpenStreetMap
   (keyless, embeddable). Directions can be swapped to Google/Mapbox by changing
   the provider id — no consumer code changes. Rendered by components/MapView. */

const MAP_PROVIDERS = {
  osm: {
    id: "osm",
    embed({ lat, lon, zoom = 13, delta = 0.04 }) {
      const bbox = [lon - delta, lat - delta, lon + delta, lat + delta].join("%2C");
      return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`;
    },
    directions({ lat, lon }) {
      return `https://www.openstreetmap.org/directions?to=${lat}%2C${lon}`;
    },
    view({ lat, lon, zoom = 14 }) {
      return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=${zoom}/${lat}/${lon}`;
    },
  },
  google: {
    id: "google",
    embed: null, // requires a keyed embed API — intentionally not enabled
    directions({ lat, lon }) {
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
    },
    view({ lat, lon }) {
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    },
  },
};

const DEFAULT = "osm";

export const mapsService = {
  provider(id = DEFAULT) { return MAP_PROVIDERS[id] || MAP_PROVIDERS[DEFAULT]; },
  embedUrl(coords, id) { return this.provider(id).embed?.(coords) || null; },
  directionsUrl(coords, id) { return this.provider(id).directions(coords); },
  viewUrl(coords, id) { return this.provider(id).view(coords); },
};
