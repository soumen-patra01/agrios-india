/* Vision analytics — lightweight localStorage-based usage tracking.
   Swap the storage layer for a remote service without changing callers. */

import { storage } from "../../../utils/storage.js";

const KEY = "vision:analytics";

const EMPTY = {
  imagesProcessed:  0,
  successCount:     0,
  errorCount:       0,
  totalInferenceMs: 0,
  avgConfidence:    0,
  modelUsage:       {},
  providerUsage:    {},
  lastUpdated:      null,
};

export const visionAnalytics = {
  _get()   { return storage.get(KEY, { ...EMPTY }); },
  _save(d) { storage.set(KEY, d); },

  record({ success, inferenceMs = 0, confidence = 0, modelId = "unknown", provider = "unknown" }) {
    const d = this._get();
    d.imagesProcessed++;
    if (success) {
      d.successCount++;
      d.totalInferenceMs += inferenceMs;
      d.avgConfidence     = ((d.avgConfidence * (d.successCount - 1)) + confidence) / d.successCount;
    } else {
      d.errorCount++;
    }
    d.modelUsage[modelId]     = (d.modelUsage[modelId]     || 0) + 1;
    d.providerUsage[provider] = (d.providerUsage[provider] || 0) + 1;
    d.lastUpdated = new Date().toISOString();
    this._save(d);
  },

  getStats() {
    const d = this._get();
    return {
      ...d,
      avgInferenceMs: d.successCount > 0 ? Math.round(d.totalInferenceMs / d.successCount) : 0,
      successRate:    d.imagesProcessed > 0 ? d.successCount / d.imagesProcessed : 0,
    };
  },

  reset() { this._save({ ...EMPTY }); },
};
