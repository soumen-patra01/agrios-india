const DB_NAME = "agrios-mlops-datasets";
const VERSION = 1;

export function openDatasetDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      const datasets = db.createObjectStore("datasets", { keyPath: "id" });
      datasets.createIndex("category", "category", { unique: false });
      datasets.createIndex("createdAt", "createdAt", { unique: false });
      datasets.createIndex("domain", "domain", { unique: false });

      const versions = db.createObjectStore("versions", { keyPath: "id" });
      versions.createIndex("datasetId", "datasetId", { unique: false });

      const tags = db.createObjectStore("tags", { keyPath: "id" });
      tags.createIndex("datasetId", "datasetId", { unique: false });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}
