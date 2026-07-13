const DB_NAME = "agrios-mlops-annotations";
const VERSION = 1;

export function openAnnotationDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      const ann = db.createObjectStore("annotations", { keyPath: "id" });
      ann.createIndex("datasetId",  "datasetId",  { unique: false });
      ann.createIndex("imageId",    "imageId",    { unique: false });
      ann.createIndex("status",     "status",     { unique: false });
      ann.createIndex("annotatorId","annotatorId",{ unique: false });

      const queue = db.createObjectStore("queue", { keyPath: "id" });
      queue.createIndex("status",    "status",    { unique: false });
      queue.createIndex("reviewerId","reviewerId", { unique: false });

      const reviews = db.createObjectStore("reviews", { keyPath: "id" });
      reviews.createIndex("annotationId","annotationId",{ unique: false });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}
