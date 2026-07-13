import { openAnnotationDb } from "./annotationDb.js";

function uid() {
  return `ann-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const ANNOTATION_TYPES = {
  BOUNDING_BOX:          "bounding_box",
  SEGMENTATION_MASK:     "segmentation_mask",
  IMAGE_CLASSIFICATION:  "image_classification",
  MULTI_LABEL:           "multi_label",
  KEYPOINTS:             "keypoints",
  POLYGON:               "polygon",
  METADATA:              "metadata",
};

export const annotationService = {
  async save({ datasetId, imageId, imageUrl, type, labels, geometry, metadata = {}, annotatorId = "user", notes = "" }) {
    const db = await openAnnotationDb();
    const entry = {
      id: uid(),
      datasetId,
      imageId,
      imageUrl: imageUrl || null,
      type,
      labels,
      geometry,
      metadata,
      annotatorId,
      notes,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction("annotations", "readwrite");
      tx.objectStore("annotations").add(entry);
      tx.oncomplete = () => resolve(entry);
      tx.onerror = () => reject(tx.error);
    });
  },

  async bulkSave(annotations) {
    const db = await openAnnotationDb();
    const entries = annotations.map((a) => ({
      ...a,
      id: uid(),
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    return new Promise((resolve, reject) => {
      const tx = db.transaction("annotations", "readwrite");
      const store = tx.objectStore("annotations");
      entries.forEach((e) => store.add(e));
      tx.oncomplete = () => resolve(entries);
      tx.onerror = () => reject(tx.error);
    });
  },

  async getForImage(imageId) {
    const db = await openAnnotationDb();
    return new Promise((resolve, reject) => {
      const req = db.transaction("annotations", "readonly").objectStore("annotations").index("imageId").getAll(imageId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async getForDataset(datasetId, { status } = {}) {
    const db = await openAnnotationDb();
    return new Promise((resolve, reject) => {
      const req = db.transaction("annotations", "readonly").objectStore("annotations").index("datasetId").getAll(datasetId);
      req.onsuccess = () => {
        let results = req.result || [];
        if (status) results = results.filter((a) => a.status === status);
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async getById(id) {
    const db = await openAnnotationDb();
    return new Promise((resolve, reject) => {
      const req = db.transaction("annotations", "readonly").objectStore("annotations").get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },

  async update(id, patch) {
    const db = await openAnnotationDb();
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Annotation ${id} not found`);
    const updated = { ...existing, ...patch, id, updatedAt: new Date().toISOString() };
    return new Promise((resolve, reject) => {
      const tx = db.transaction("annotations", "readwrite");
      tx.objectStore("annotations").put(updated);
      tx.oncomplete = () => resolve(updated);
      tx.onerror = () => reject(tx.error);
    });
  },

  async delete(id) {
    const db = await openAnnotationDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("annotations", "readwrite");
      tx.objectStore("annotations").delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async countForDataset(datasetId) {
    const all = await this.getForDataset(datasetId);
    return all.length;
  },
};
