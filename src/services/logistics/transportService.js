/* Transport providers. Provider:
   { name, type, tagline, phone, village, district, state, icon, accent,
     serviceAreas:[], languages:[], role:"transporter",
     verificationStatus, kycStatus, rating:0, reviewCount:0,
     completedTrips:0, demo } */

import { repo } from "./logisticsDb.js";
import { storage } from "../../utils/storage.js";
import { PROVIDER_TYPES } from "./constantsLog.js";

const providers = repo("transportProviders");
const MY_KEY = "log:myProviderId";

export const transportService = {
  getAll: () => providers.getAll(),
  getById: (id) => providers.getById(id),
  update: (id, patch) => providers.update(id, patch),

  async register(profile) {
    const rec = await providers.add({
      icon: "Truck", accent: "primary",
      serviceAreas: [], languages: [],
      rating: 0, reviewCount: 0, completedTrips: 0,
      role: "transporter",
      ...profile,
      verificationStatus: "pending",
      kycStatus: "not_submitted",
    });
    storage.set(MY_KEY, rec.id);
    return rec;
  },

  async getMine() {
    const id = storage.get(MY_KEY, null);
    return id ? providers.getById(id) : null;
  },
  myId: () => storage.get(MY_KEY, null),

  typeLabel: (id) => PROVIDER_TYPES.find((t) => t.id === id)?.label ?? id,
};
