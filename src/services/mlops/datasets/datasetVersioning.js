import { openDatasetDb } from "./datasetDb.js";
import { datasetRegistry } from "./datasetRegistry.js";

function uid() {
  return `dsv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function bumpVersion(version, part = "patch") {
  const [major, minor, patch] = version.split(".").map(Number);
  if (part === "major") return `${major + 1}.0.0`;
  if (part === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

export const datasetVersioning = {
  async createVersion(datasetId, { label, notes = "", bumpPart = "patch" } = {}) {
    const dataset = await datasetRegistry.getById(datasetId);
    if (!dataset) throw new Error(`Dataset ${datasetId} not found`);

    const newVersion = bumpVersion(dataset.version, bumpPart);
    const db = await openDatasetDb();

    const entry = {
      id: uid(),
      datasetId,
      version: newVersion,
      label: label || `v${newVersion}`,
      notes,
      imageCount: dataset.imageCount,
      annotationCount: dataset.annotationCount,
      qualityScore: dataset.qualityScore,
      createdAt: new Date().toISOString(),
    };

    await new Promise((resolve, reject) => {
      const tx = db.transaction("versions", "readwrite");
      tx.objectStore("versions").add(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    await datasetRegistry.update(datasetId, { version: newVersion });
    return entry;
  },

  async getVersionHistory(datasetId) {
    const db = await openDatasetDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("versions", "readonly");
      const index = tx.objectStore("versions").index("datasetId");
      const req = index.getAll(datasetId);
      req.onsuccess = () =>
        resolve((req.result || []).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      req.onerror = () => reject(req.error);
    });
  },

  async tagVersion(datasetId, { name, color = "#6366f1" }) {
    const db = await openDatasetDb();
    const dataset = await datasetRegistry.getById(datasetId);
    if (!dataset) throw new Error(`Dataset ${datasetId} not found`);

    const tag = {
      id: `tag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      datasetId,
      name,
      color,
      version: dataset.version,
      createdAt: new Date().toISOString(),
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction("tags", "readwrite");
      tx.objectStore("tags").add(tag);
      tx.oncomplete = () => resolve(tag);
      tx.onerror = () => reject(tx.error);
    });
  },

  async getTags(datasetId) {
    const db = await openDatasetDb();
    return new Promise((resolve, reject) => {
      const req = db.transaction("tags", "readonly").objectStore("tags").index("datasetId").getAll(datasetId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },
};
