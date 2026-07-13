import { storage } from "../../../utils/storage.js";

const KEY = "mlops:feature_store";

function uid() {
  return `feat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const FEATURE_TYPES = {
  IMAGE:       "image",
  NUMERIC:     "numeric",
  CATEGORICAL: "categorical",
  TEXT:        "text",
  EMBEDDING:   "embedding",
  METADATA:    "metadata",
};

export const featureStore = {
  _getAll() { return storage.get(KEY, []); },
  _save(data) { storage.set(KEY, data); },

  register({ name, description = "", type, domain = null, version = "1.0.0",
    validationRules = [], lineage = [], tags = [] }) {
    const existing = this._getAll();
    if (existing.find((f) => f.name === name && f.version === version)) {
      throw new Error(`Feature ${name}@${version} already registered`);
    }
    const entry = {
      id: uid(), name, description, type, domain, version,
      validationRules, lineage, tags,
      isOnline: false,
      isOffline: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this._save([entry, ...existing]);
    return entry;
  },

  getAll({ domain, type, tag } = {}) {
    let all = this._getAll();
    if (domain) all = all.filter((f) => f.domain === domain);
    if (type) all = all.filter((f) => f.type === type);
    if (tag) all = all.filter((f) => f.tags.includes(tag));
    return all;
  },

  getByName(name) {
    return this._getAll().filter((f) => f.name === name)
      .sort((a, b) => b.version.localeCompare(a.version));
  },

  getByDomain(domain) {
    return this._getAll().filter((f) => f.domain === domain);
  },

  update(id, patch) {
    const all = this._getAll();
    const idx = all.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error(`Feature ${id} not found`);
    all[idx] = { ...all[idx], ...patch, id, updatedAt: new Date().toISOString() };
    this._save(all);
    return all[idx];
  },

  getLineage(featureId) {
    const all = this._getAll();
    const feature = all.find((f) => f.id === featureId);
    if (!feature) return null;
    return {
      feature: feature.name,
      version: feature.version,
      upstreamFeatures: feature.lineage.map((id) => all.find((f) => f.id === id)).filter(Boolean),
      downstreamFeatures: all.filter((f) => f.lineage.includes(featureId)),
    };
  },

  count() { return this._getAll().length; },
};
