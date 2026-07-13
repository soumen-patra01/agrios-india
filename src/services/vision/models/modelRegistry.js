/* Model registry — catalog of known inference models.
   Active models are ready to use. Future models plug in when trained/available. */

import { CAPABILITIES } from "../inference/inferenceInterface.js";

export const MODEL_STATUS = {
  ACTIVE:      "active",
  UNAVAILABLE: "unavailable",
  FUTURE:      "future",
};

export const MODEL_REGISTRY = [
  {
    id:            "claude-vision-v1",
    name:          "Claude Vision",
    version:       "1.0.0",
    provider:      "claude-vision",
    capabilities:  Object.values(CAPABILITIES),
    status:        MODEL_STATUS.ACTIVE,
    source:        "cloud",
    minConfidence: 0.55,
    description:   "General-purpose agricultural vision via Anthropic Claude.",
  },
  {
    id:            "crop-disease-tfjs-v1",
    name:          "Crop Disease Detector",
    version:       "0.0.0",
    provider:      "local",
    capabilities:  [CAPABILITIES.DISEASE_DETECTION],
    status:        MODEL_STATUS.FUTURE,
    source:        "local",
    minConfidence: 0.70,
    description:   "On-device TensorFlow.js model — plug in when the model is trained.",
  },
  {
    id:            "pest-onnx-v1",
    name:          "Pest Identifier",
    version:       "0.0.0",
    provider:      "local",
    capabilities:  [CAPABILITIES.PEST_IDENTIFICATION],
    status:        MODEL_STATUS.FUTURE,
    source:        "local",
    minConfidence: 0.75,
    description:   "ONNX Runtime Web pest identification model — coming soon.",
  },
];

export const modelRegistry = {
  getAll()    { return MODEL_REGISTRY; },
  getById(id) { return MODEL_REGISTRY.find((m) => m.id === id) || null; },
  getActive() { return MODEL_REGISTRY.filter((m) => m.status === MODEL_STATUS.ACTIVE); },

  getForCapability(capability) {
    return MODEL_REGISTRY.filter(
      (m) => m.status === MODEL_STATUS.ACTIVE && m.capabilities.includes(capability)
    );
  },
};
