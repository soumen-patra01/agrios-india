/* Model manager — active model selection, health checks, and status reporting. */

import { modelRegistry, MODEL_STATUS } from "./modelRegistry.js";
import { storage } from "../../../utils/storage.js";
import { localProvider } from "../inference/localProvider.js";

const ACTIVE_KEY = "vision:activeModel";

export const modelManager = {
  getActive() {
    const saved = storage.get(ACTIVE_KEY, null);
    if (saved) {
      const model = modelRegistry.getById(saved);
      if (model?.status === MODEL_STATUS.ACTIVE) return model;
    }
    return modelRegistry.getActive()[0] || null;
  },

  setActive(modelId) {
    const model = modelRegistry.getById(modelId);
    if (!model)                               throw new Error(`Model not found: ${modelId}`);
    if (model.status !== MODEL_STATUS.ACTIVE) throw new Error(`Model not available: ${modelId}`);
    storage.set(ACTIVE_KEY, modelId);
    return model;
  },

  getStatus(modelId) {
    const model = modelRegistry.getById(modelId);
    if (!model)                                      return { available: false, reason: "Model not found" };
    if (model.status === MODEL_STATUS.FUTURE)        return { available: false, reason: "Coming soon" };
    if (model.source === "cloud" && !navigator.onLine) return { available: false, reason: "No internet connection" };
    if (model.source === "local" && !localProvider.isAvailable()) return { available: false, reason: "Local model not loaded" };
    return { available: true, reason: null };
  },

  listAvailable() {
    return modelRegistry.getActive().map((m) => ({ ...m, ...this.getStatus(m.id) }));
  },

  async download(_modelId) {
    throw new Error("Model download not yet supported. Coming in a future update.");
  },
};
