/* IndexedDB for livestock management — agrios-livestock database.
   Stores: animals (register), productions (daily logs), events (vaccinations/treatments/harvests) */

const DB_NAME = "agrios-livestock";
const DB_VERSION = 1;

let _db = null;

export function openDb() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("animals")) {
        const s = db.createObjectStore("animals", { keyPath: "id" });
        s.createIndex("enterprise", "enterprise", { unique: false });
      }
      if (!db.objectStoreNames.contains("productions")) {
        const s = db.createObjectStore("productions", { keyPath: "id" });
        s.createIndex("animalId", "animalId", { unique: false });
        s.createIndex("enterprise", "enterprise", { unique: false });
        s.createIndex("date", "date", { unique: false });
      }
      if (!db.objectStoreNames.contains("events")) {
        const s = db.createObjectStore("events", { keyPath: "id" });
        s.createIndex("animalId", "animalId", { unique: false });
        s.createIndex("enterprise", "enterprise", { unique: false });
        s.createIndex("date", "date", { unique: false });
      }
    };
    req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}

export function txn(storeName, mode = "readonly") {
  return openDb().then((db) => db.transaction(storeName, mode).objectStore(storeName));
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
