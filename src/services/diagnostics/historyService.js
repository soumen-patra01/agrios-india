/* Diagnosis history — IndexedDB storage for all diagnostic records.
   Same DB pattern as Phase 5A offlineQueue. */

const DB_NAME = "agrios-diagnostics";
const STORE   = "records";
const VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = (e) => {
      const db    = e.target.result;
      const store = db.createObjectStore(STORE, { keyPath: "id" });
      store.createIndex("domainId",   "domainId",   { unique: false });
      store.createIndex("createdAt",  "createdAt",  { unique: false });
      store.createIndex("severity",   "severity",   { unique: false });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = ()  => reject(req.error);
  });
}

function uid() {
  return `diag-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const historyService = {
  async save(record) {
    const entry = {
      ...record,
      id:        record.id || uid(),
      createdAt: record.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(entry);
      tx.oncomplete = () => resolve(entry);
      tx.onerror    = () => reject(tx.error);
    });
  },

  async getAll({ domainId, severity, limit = 50 } = {}) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx    = db.transaction(STORE, "readonly");
      const req   = tx.objectStore(STORE).getAll();
      req.onsuccess = () => {
        let results = (req.result || []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        if (domainId)  results = results.filter((r) => r.domainId === domainId);
        if (severity)  results = results.filter((r) => r.severity === severity);
        resolve(results.slice(0, limit));
      };
      req.onerror = () => reject(req.error);
    });
  },

  async getById(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror   = () => reject(req.error);
    });
  },

  async recentForDomain(domainId, limit = 3) {
    const all = await this.getAll({ domainId, limit });
    return all.slice(0, limit);
  },

  async updateFollowUp(id, followUpNote) {
    const record = await this.getById(id);
    if (!record) return null;
    record.followUpNotes  = record.followUpNotes || [];
    record.followUpNotes.push({ note: followUpNote, date: new Date().toISOString() });
    record.updatedAt      = new Date().toISOString();
    return this.save(record);
  },

  async markResolved(id) {
    const record = await this.getById(id);
    if (!record) return null;
    record.resolved   = true;
    record.resolvedAt = new Date().toISOString();
    return this.save(record);
  },

  async delete(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror    = () => reject(tx.error);
    });
  },

  async count() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
  },
};
