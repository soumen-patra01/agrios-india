/* Local inference provider — stub for future TF.js / ONNX Runtime Web models.
   Returns unavailable until a real model is registered via registerModel(). */

import { CAPABILITIES } from "./inferenceInterface.js";

const loadedModels = new Map();

export const localProvider = {
  id:   "local",
  name: "On-Device Model",

  isAvailable() {
    return loadedModels.size > 0;
  },

  getCapabilities() {
    const caps = new Set();
    for (const m of loadedModels.values()) m.capabilities?.forEach((c) => caps.add(c));
    return [...caps];
  },

  registerModel(id, model, capabilities = []) {
    loadedModels.set(id, { model, capabilities, loadedAt: Date.now() });
  },

  unregisterModel(id) {
    loadedModels.delete(id);
  },

  async infer(_imageBase64, _metadata, _context) {
    if (!this.isAvailable()) {
      throw new Error("No local model loaded. Use cloud inference instead.");
    }
    // Future: call model.predict() here when TF.js / ONNX model is registered.
    throw new Error("Local inference not yet implemented. Falling back to cloud.");
  },

  async loadTFJS(_url, _capabilities) {
    throw new Error("TensorFlow.js not yet bundled. Run `npm install @tensorflow/tfjs` and re-implement when a model is available.");
  },

  async loadONNX(_url, _capabilities) {
    throw new Error("ONNX Runtime Web not yet bundled. Run `npm install onnxruntime-web` and re-implement when a model is available.");
  },
};
