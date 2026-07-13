import { openAnnotationDb } from "./annotationDb.js";
import { annotationService } from "./annotationService.js";

function uid() {
  return `aq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const QUEUE_STATUS = {
  PENDING:   "pending",
  REVIEWING: "reviewing",
  APPROVED:  "approved",
  REJECTED:  "rejected",
};

export const annotationQueue = {
  async submit(annotationId, { submittedBy = "user" } = {}) {
    const db = await openAnnotationDb();
    const entry = {
      id: uid(),
      annotationId,
      submittedBy,
      status: QUEUE_STATUS.PENDING,
      reviewerId: null,
      reviewNotes: null,
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction("queue", "readwrite");
      tx.objectStore("queue").add(entry);
      tx.oncomplete = () => resolve(entry);
      tx.onerror = () => reject(tx.error);
    });
  },

  async getPending() {
    const db = await openAnnotationDb();
    return new Promise((resolve, reject) => {
      const req = db.transaction("queue", "readonly").objectStore("queue").index("status").getAll(QUEUE_STATUS.PENDING);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async getAll({ status } = {}) {
    const db = await openAnnotationDb();
    return new Promise((resolve, reject) => {
      const req = db.transaction("queue", "readonly").objectStore("queue").getAll();
      req.onsuccess = () => {
        let results = (req.result || []).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
        if (status) results = results.filter((q) => q.status === status);
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async _updateEntry(id, patch) {
    const db = await openAnnotationDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("queue", "readwrite");
      const store = tx.objectStore("queue");
      const req = store.get(id);
      req.onsuccess = () => {
        const updated = { ...req.result, ...patch };
        store.put(updated);
        tx.oncomplete = () => resolve(updated);
      };
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
    });
  },

  async startReview(queueId, reviewerId) {
    return this._updateEntry(queueId, { status: QUEUE_STATUS.REVIEWING, reviewerId });
  },

  async approve(queueId, { reviewerId, notes = "" } = {}) {
    const entry = await this._updateEntry(queueId, {
      status: QUEUE_STATUS.APPROVED,
      reviewerId,
      reviewNotes: notes,
      reviewedAt: new Date().toISOString(),
    });
    await annotationService.update(entry.annotationId, { status: "approved" });
    return entry;
  },

  async reject(queueId, { reviewerId, notes = "" } = {}) {
    const entry = await this._updateEntry(queueId, {
      status: QUEUE_STATUS.REJECTED,
      reviewerId,
      reviewNotes: notes,
      reviewedAt: new Date().toISOString(),
    });
    await annotationService.update(entry.annotationId, { status: "rejected" });
    return entry;
  },

  async countByStatus() {
    const all = await this.getAll();
    return all.reduce((acc, q) => {
      acc[q.status] = (acc[q.status] || 0) + 1;
      return acc;
    }, {});
  },
};
