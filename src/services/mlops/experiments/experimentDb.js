const DB_NAME = "agrios-mlops-experiments";
const VERSION = 1;

export function openExperimentDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      const exps = db.createObjectStore("experiments", { keyPath: "id" });
      exps.createIndex("status",    "status",    { unique: false });
      exps.createIndex("modelId",   "modelId",   { unique: false });
      exps.createIndex("createdAt", "createdAt", { unique: false });

      const runs = db.createObjectStore("runs", { keyPath: "id" });
      runs.createIndex("experimentId", "experimentId", { unique: false });
      runs.createIndex("status",       "status",       { unique: false });

      const artifacts = db.createObjectStore("artifacts", { keyPath: "id" });
      artifacts.createIndex("runId", "runId", { unique: false });

      const metrics = db.createObjectStore("metrics", { keyPath: "id", autoIncrement: true });
      metrics.createIndex("runId", "runId", { unique: false });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}
