/* Offline queue — stores pending vision jobs in IndexedDB when offline.
   Flushes automatically when connectivity is restored. */

const DB_NAME = "agrios-vision";
const STORE   = "queue";
const VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = ()  => reject(req.error);
  });
}

export const offlineQueue = {
  _flushCallback: null,

  async enqueue(job) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(STORE, "readwrite");
      const req = tx.objectStore(STORE).add({ ...job, queuedAt: Date.now() });
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
  },

  async dequeue(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror    = () => reject(tx.error);
    });
  },

  async getAll() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror   = () => reject(req.error);
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

  onFlush(callback) {
    this._flushCallback = callback;
    window.addEventListener("online", () => this._flush());
  },

  async _flush() {
    if (!navigator.onLine || !this._flushCallback) return;
    const jobs = await this.getAll();
    for (const job of jobs) {
      try {
        await this._flushCallback(job);
        await this.dequeue(job.id);
      } catch { /* leave in queue for next attempt */ }
    }
  },
};
