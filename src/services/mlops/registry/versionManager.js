import { openModelDb } from "./mlModelDb.js";
import { mlModelRegistry } from "./mlModelRegistry.js";

function uid() {
  return `mv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function bumpVersion(version, part = "patch") {
  const [major, minor, patch] = version.split(".").map(Number);
  if (part === "major") return `${major + 1}.0.0`;
  if (part === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

export const versionManager = {
  async createVersion(modelId, { bumpPart = "minor", notes = "", metrics = {}, artifactRef = null } = {}) {
    const model = await mlModelRegistry.getById(modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);

    const newVersion = bumpVersion(model.version, bumpPart);
    const db = await openModelDb();

    const entry = {
      id: uid(),
      modelId,
      version: newVersion,
      notes,
      metrics,
      artifactRef,
      stage: model.stage,
      isChampion: false,
      isChallenger: false,
      createdAt: new Date().toISOString(),
    };

    await new Promise((resolve, reject) => {
      const tx = db.transaction("modelVersions", "readwrite");
      tx.objectStore("modelVersions").add(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    await mlModelRegistry.update(modelId, { version: newVersion, metrics });
    return entry;
  },

  async getVersionHistory(modelId) {
    const db = await openModelDb();
    return new Promise((resolve, reject) => {
      const req = db.transaction("modelVersions", "readonly")
        .objectStore("modelVersions").index("modelId").getAll(modelId);
      req.onsuccess = () =>
        resolve((req.result || []).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      req.onerror = () => reject(req.error);
    });
  },

  async setChallenger(versionId) {
    const db = await openModelDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("modelVersions", "readwrite");
      const store = tx.objectStore("modelVersions");
      const req = store.get(versionId);
      req.onsuccess = () => {
        store.put({ ...req.result, isChallenger: true });
        tx.oncomplete = () => resolve();
      };
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
    });
  },

  async getAbTestConfig(modelId) {
    const history = await this.getVersionHistory(modelId);
    const champion = history.find((v) => v.isChampion);
    const challenger = history.find((v) => v.isChallenger);
    if (!champion || !challenger) return null;
    return {
      modelId,
      champion: champion.version,
      challenger: challenger.version,
      splitPercent: 10,
      createdAt: new Date().toISOString(),
    };
  },
};
