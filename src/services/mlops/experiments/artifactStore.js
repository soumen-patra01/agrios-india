import { openExperimentDb } from "./experimentDb.js";

function uid() {
  return `art-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const ARTIFACT_TYPES = {
  MODEL:       "model",
  DATASET:     "dataset",
  TRAINING:    "training",
  EVALUATION:  "evaluation",
  CHECKPOINT:  "checkpoint",
  CONFIG:      "config",
};

/* Artifact storage: stores metadata only — actual binaries go to
   object storage (S3/GCS/Azure Blob) referenced by storageUri. */
export const artifactStore = {
  async save({ runId, experimentId, type, name, storageUri, sizeBytes = 0, metadata = {} }) {
    const db = await openExperimentDb();
    const entry = {
      id: uid(),
      runId: runId || null,
      experimentId: experimentId || null,
      type, name, storageUri, sizeBytes, metadata,
      createdAt: new Date().toISOString(),
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction("artifacts", "readwrite");
      tx.objectStore("artifacts").add(entry);
      tx.oncomplete = () => resolve(entry);
      tx.onerror = () => reject(tx.error);
    });
  },

  async getForRun(runId) {
    const db = await openExperimentDb();
    return new Promise((resolve, reject) => {
      const req = db.transaction("artifacts", "readonly").objectStore("artifacts").index("runId").getAll(runId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async getAll() {
    const db = await openExperimentDb();
    return new Promise((resolve, reject) => {
      const req = db.transaction("artifacts", "readonly").objectStore("artifacts").getAll();
      req.onsuccess = () => resolve((req.result || []).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      req.onerror = () => reject(req.error);
    });
  },

  /* Returns object-storage-ready upload descriptor. Actual upload handled by cloud SDK. */
  getUploadDescriptor({ bucket, key, contentType }) {
    return {
      provider: "s3_compatible",
      bucket,
      key,
      contentType,
      acl: "private",
      serverSideEncryption: "AES256",
    };
  },
};
