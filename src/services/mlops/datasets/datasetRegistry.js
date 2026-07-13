import { openDatasetDb } from "./datasetDb.js";

function uid() {
  return `ds-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const DATASET_CATEGORIES = [
  "crop_images", "leaf_images", "fruit_images", "stem_images", "root_images",
  "animal_images", "fish_images", "bee_images", "soil_images",
  "weather_metadata", "farm_metadata", "user_metadata",
];

export const datasetRegistry = {
  async register({ name, description = "", category, domain = null, sourceUrl = null, license = "proprietary" }) {
    const db = await openDatasetDb();
    const entry = {
      id: uid(),
      name,
      description,
      category,
      domain,
      sourceUrl,
      license,
      version: "1.0.0",
      imageCount: 0,
      annotationCount: 0,
      qualityScore: null,
      status: "empty",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction("datasets", "readwrite");
      tx.objectStore("datasets").add(entry);
      tx.oncomplete = () => resolve(entry);
      tx.onerror = () => reject(tx.error);
    });
  },

  async getAll({ category, domain, status } = {}) {
    const db = await openDatasetDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("datasets", "readonly");
      const req = tx.objectStore("datasets").getAll();
      req.onsuccess = () => {
        let results = (req.result || []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        if (category) results = results.filter((d) => d.category === category);
        if (domain) results = results.filter((d) => d.domain === domain);
        if (status) results = results.filter((d) => d.status === status);
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async getById(id) {
    const db = await openDatasetDb();
    return new Promise((resolve, reject) => {
      const req = db.transaction("datasets", "readonly").objectStore("datasets").get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },

  async update(id, patch) {
    const db = await openDatasetDb();
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Dataset ${id} not found`);
    const updated = { ...existing, ...patch, id, updatedAt: new Date().toISOString() };
    return new Promise((resolve, reject) => {
      const tx = db.transaction("datasets", "readwrite");
      tx.objectStore("datasets").put(updated);
      tx.oncomplete = () => resolve(updated);
      tx.onerror = () => reject(tx.error);
    });
  },

  async delete(id) {
    const db = await openDatasetDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("datasets", "readwrite");
      tx.objectStore("datasets").delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async search(query) {
    const all = await this.getAll();
    const q = query.toLowerCase();
    return all.filter(
      (d) => d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q) || d.category.includes(q)
    );
  },

  async count() {
    const db = await openDatasetDb();
    return new Promise((resolve, reject) => {
      const req = db.transaction("datasets", "readonly").objectStore("datasets").count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },
};
