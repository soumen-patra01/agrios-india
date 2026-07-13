/* Hybrid provider — tries local first, falls back to cloud.
   Future A/B testing and automatic rollback live here. */

import { localProvider }        from "./localProvider.js";
import { claudeVisionProvider } from "./claudeVisionProvider.js";

export const hybridProvider = {
  id:   "hybrid",
  name: "Hybrid (Local + Cloud)",

  isAvailable() {
    return localProvider.isAvailable() || claudeVisionProvider.isAvailable();
  },

  getCapabilities() {
    return [...new Set([...localProvider.getCapabilities(), ...claudeVisionProvider.getCapabilities()])];
  },

  async infer(imageBase64, metadata = {}, context = {}) {
    if (localProvider.isAvailable()) {
      try {
        const result = await localProvider.infer(imageBase64, metadata, context);
        return { ...result, strategy: "local" };
      } catch { /* fall through to cloud */ }
    }

    if (!claudeVisionProvider.isAvailable()) {
      throw new Error("No inference provider available. Check your network connection.");
    }

    const result = await claudeVisionProvider.infer(imageBase64, metadata, context);
    return { ...result, strategy: "cloud" };
  },
};
