import { openModelDb } from "./mlModelDb.js";
import { MODEL_REGISTRY as VISION_SEED } from "../../vision/models/modelRegistry.js";
import { auditLog } from "../governance/auditLog.js";

function uid() {
  return `mdl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const MODEL_STAGES = {
  DEVELOPMENT: "development",
  TESTING:     "testing",
  STAGING:     "staging",
  PRODUCTION:  "production",
  ARCHIVED:    "archived",
};

/* Seed the registry from Phase 5A vision models on first load. */
async function seedIfEmpty(db) {
  const count = await new Promise((res, rej) => {
    const req = db.transaction("models", "readonly").objectStore("models").count();
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
  if (count > 0) return;

  const tx = db.transaction("models", "readwrite");
  const store = tx.objectStore("models");
  for (const m of VISION_SEED) {
    store.add({
      id: m.id,
      name: m.name,
      description: m.description,
      framework: m.provider === "claude-vision" ? "anthropic-claude" : "onnx",
      version: m.version,
      stage: m.status === "active" ? MODEL_STAGES.PRODUCTION : MODEL_STAGES.DEVELOPMENT,
      isChampion: m.status === "active",
      source: m.source,
      capabilities: m.capabilities,
      inputFormat: "image/jpeg,image/png",
      outputFormat: "application/json",
      metrics: {},
      trainingDatasetId: null,
      owner: "system",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
}

export const mlModelRegistry = {
  async register({ name, description = "", framework, capabilities = [], inputFormat, outputFormat,
    metrics = {}, trainingDatasetId = null, domain = null, owner = "user" }) {
    const db = await openModelDb();
    await seedIfEmpty(db);
    const entry = {
      id: uid(),
      name, description, framework, capabilities,
      inputFormat, outputFormat, metrics,
      trainingDatasetId, domain, owner,
      version: "1.0.0",
      stage: MODEL_STAGES.DEVELOPMENT,
      isChampion: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await new Promise((resolve, reject) => {
      const tx = db.transaction("models", "readwrite");
      tx.objectStore("models").add(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    await auditLog.append({ entity: "model", entityId: entry.id, action: "registered", after: entry });
    return entry;
  },

  async getAll({ stage, framework, domain } = {}) {
    const db = await openModelDb();
    await seedIfEmpty(db);
    return new Promise((resolve, reject) => {
      const req = db.transaction("models", "readonly").objectStore("models").getAll();
      req.onsuccess = () => {
        let results = (req.result || []).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        if (stage) results = results.filter((m) => m.stage === stage);
        if (framework) results = results.filter((m) => m.framework === framework);
        if (domain) results = results.filter((m) => m.domain === domain);
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async getById(id) {
    const db = await openModelDb();
    await seedIfEmpty(db);
    return new Promise((resolve, reject) => {
      const req = db.transaction("models", "readonly").objectStore("models").get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },

  async update(id, patch) {
    const db = await openModelDb();
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Model ${id} not found`);
    const before = { ...existing };
    const updated = { ...existing, ...patch, id, updatedAt: new Date().toISOString() };
    await new Promise((resolve, reject) => {
      const tx = db.transaction("models", "readwrite");
      tx.objectStore("models").put(updated);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    await auditLog.append({ entity: "model", entityId: id, action: "updated", before, after: updated });
    return updated;
  },

  async promote(id, toStage) {
    const model = await this.getById(id);
    if (!model) throw new Error(`Model ${id} not found`);
    return this.update(id, { stage: toStage });
  },

  async setChampion(id) {
    const db = await openModelDb();
    await seedIfEmpty(db);
    const all = await this.getAll();
    const tx = db.transaction("models", "readwrite");
    const store = tx.objectStore("models");
    for (const m of all) {
      if (m.isChampion && m.id !== id) {
        store.put({ ...m, isChampion: false, updatedAt: new Date().toISOString() });
      }
    }
    store.put({ ...all.find((m) => m.id === id), isChampion: true, updatedAt: new Date().toISOString() });
    await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
    await auditLog.append({ entity: "model", entityId: id, action: "set_champion" });
    return this.getById(id);
  },

  async getChampion() {
    const all = await this.getAll({ stage: MODEL_STAGES.PRODUCTION });
    return all.find((m) => m.isChampion) || all[0] || null;
  },

  async count() {
    const db = await openModelDb();
    await seedIfEmpty(db);
    return new Promise((resolve, reject) => {
      const req = db.transaction("models", "readonly").objectStore("models").count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },
};
