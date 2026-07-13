/* Extends Phase 5A visionAnalytics with time-series IndexedDB storage
   for latency, confidence, error rate, and traffic volume. */

const DB_NAME = "agrios-mlops-monitoring";
const STORE = "inference_logs";
const VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      const store = db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      store.createIndex("modelId",   "modelId",   { unique: false });
      store.createIndex("timestamp", "timestamp", { unique: false });
      store.createIndex("success",   "success",   { unique: false });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

export const inferenceMonitor = {
  async record({ modelId, provider, latencyMs, confidence, success, error = null, inputBytes = 0 }) {
    const db = await openDb();
    const entry = {
      modelId: modelId || "unknown",
      provider: provider || "unknown",
      latencyMs,
      confidence,
      success,
      error,
      inputBytes,
      cpuMs: performance?.now ? Math.round(performance.now()) : null,
      timestamp: new Date().toISOString(),
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const req = tx.objectStore(STORE).add(entry);
      req.onsuccess = () => resolve({ ...entry, id: req.result });
      tx.onerror = () => reject(tx.error);
    });
  },

  async getRecent(modelId = null, limit = 200) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
      req.onsuccess = () => {
        let results = (req.result || []).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        if (modelId) results = results.filter((r) => r.modelId === modelId);
        resolve(results.slice(0, limit));
      };
      req.onerror = () => reject(req.error);
    });
  },

  async getStats(modelId = null, windowHours = 24) {
    const cutoff = new Date(Date.now() - windowHours * 3600 * 1000).toISOString();
    const all = await this.getRecent(modelId, 1000);
    const window = all.filter((r) => r.timestamp >= cutoff);
    if (window.length === 0) return null;

    const successful = window.filter((r) => r.success);
    const failed = window.filter((r) => !r.success);
    const latencies = successful.map((r) => r.latencyMs).filter(Boolean);
    const confidences = successful.map((r) => r.confidence).filter(Boolean);

    return {
      total: window.length,
      successCount: successful.length,
      errorCount: failed.length,
      errorRate: window.length > 0 ? failed.length / window.length : 0,
      avgLatencyMs: latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0,
      p95LatencyMs: latencies.length > 0 ? latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)] || 0 : 0,
      avgConfidence: confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0,
      windowHours,
      computedAt: new Date().toISOString(),
    };
  },

  async getTimeSeries(modelId = null, metricKey = "latencyMs", bucketMinutes = 60, limit = 24) {
    const all = await this.getRecent(modelId, 500);
    const buckets = {};
    for (const r of all) {
      const d = new Date(r.timestamp);
      const bucket = new Date(Math.floor(d.getTime() / (bucketMinutes * 60000)) * bucketMinutes * 60000).toISOString();
      (buckets[bucket] = buckets[bucket] || []).push(r[metricKey]);
    }
    return Object.entries(buckets)
      .map(([ts, vals]) => ({ ts, value: vals.reduce((a, b) => a + b, 0) / vals.length, count: vals.length }))
      .sort((a, b) => a.ts.localeCompare(b.ts))
      .slice(-limit);
  },
};
