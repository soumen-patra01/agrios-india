const DB_NAME = "agrios-mlops-registry";
const VERSION = 1;

export function openModelDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      const models = db.createObjectStore("models", { keyPath: "id" });
      models.createIndex("stage",     "stage",     { unique: false });
      models.createIndex("framework", "framework", { unique: false });
      models.createIndex("domain",    "domain",    { unique: false });

      const versions = db.createObjectStore("modelVersions", { keyPath: "id" });
      versions.createIndex("modelId",    "modelId",    { unique: false });
      versions.createIndex("stage",      "stage",      { unique: false });
      versions.createIndex("isChampion", "isChampion", { unique: false });

      const deployments = db.createObjectStore("deployments", { keyPath: "id" });
      deployments.createIndex("modelId", "modelId", { unique: false });
      deployments.createIndex("stage",   "stage",   { unique: false });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}
