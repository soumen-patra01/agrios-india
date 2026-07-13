/* Inference provider interface — every provider must implement this shape.
   Use validateProvider() to assert compliance at registration time. */

export const CAPABILITIES = {
  DISEASE_DETECTION:    "disease_detection",
  PEST_IDENTIFICATION:  "pest_identification",
  WEED_CLASSIFICATION:  "weed_classification",
  SOIL_ANALYSIS:        "soil_analysis",
  CROP_IDENTIFICATION:  "crop_identification",
  GENERAL_VISION:       "general_vision",
};

export function validateProvider(provider) {
  const required = ["id", "name", "isAvailable", "infer", "getCapabilities"];
  for (const key of required) {
    if (!(key in provider)) throw new Error(`InferenceProvider missing required field: ${key}`);
  }
}
