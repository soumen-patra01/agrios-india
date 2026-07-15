/* Service providers. Provider:
   { name, type, tagline, description, phone, village, district, state,
     icon, accent, specializations:[], languages:[], serviceAreas:[],
     workingHours:{ start, end }, verificationStatus, kycStatus,
     rating:0, reviewCount:0, completedBookings:0, demo } */

import { repo } from "./svcDb.js";
import { storage } from "../../utils/storage.js";
import { PROVIDER_TYPES } from "./constantsSvc.js";

const providers = repo("providers");
const MY_KEY = "svc:myProviderId";

export const providerService = {
  getAll: () => providers.getAll(),
  getById: (id) => providers.getById(id),
  update: (id, patch) => providers.update(id, patch),

  async register(profile) {
    const rec = await providers.add({
      icon: "Handshake", accent: "primary",
      specializations: [], languages: [], serviceAreas: [],
      workingHours: { start: "09:00", end: "17:00" },
      rating: 0, reviewCount: 0, completedBookings: 0,
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
