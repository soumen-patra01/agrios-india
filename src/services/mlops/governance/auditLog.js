const DB_NAME = "agrios-mlops-audit";
const STORE = "entries";
const VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      const store = db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      store.createIndex("entity",    "entity",    { unique: false });
      store.createIndex("entityId",  "entityId",  { unique: false });
      store.createIndex("action",    "action",    { unique: false });
      store.createIndex("timestamp", "timestamp", { unique: false });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

export const auditLog = {
  async append({ entity, entityId, action, actor = "system", before = null, after = null, meta = {} }) {
    const db = await openDb();
    const entry = {
      entity, entityId, action, actor, before, after, meta,
      timestamp: new Date().toISOString(),
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const req = tx.objectStore(STORE).add(entry);
      req.onsuccess = () => resolve({ ...entry, id: req.result });
      tx.onerror = () => reject(tx.error);
    });
  },

  async getAll({ entity, entityId, action, limit = 100 } = {}) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
      req.onsuccess = () => {
        let results = (req.result || []).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        if (entity)   results = results.filter((e) => e.entity === entity);
        if (entityId) results = results.filter((e) => e.entityId === entityId);
        if (action)   results = results.filter((e) => e.action === action);
        resolve(results.slice(0, limit));
      };
      req.onerror = () => reject(req.error);
    });
  },

  async count() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },
};
