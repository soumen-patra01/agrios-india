import { openExperimentDb } from "./experimentDb.js";

export const metricsLogger = {
  async log(runId, step, metrics) {
    const db = await openExperimentDb();
    const entry = {
      runId,
      step,
      metrics,
      timestamp: new Date().toISOString(),
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction("metrics", "readwrite");
      tx.objectStore("metrics").add(entry);
      tx.oncomplete = () => resolve(entry);
      tx.onerror = () => reject(tx.error);
    });
  },

  async getHistory(runId, metricName = null) {
    const db = await openExperimentDb();
    return new Promise((resolve, reject) => {
      const req = db.transaction("metrics", "readonly").objectStore("metrics").index("runId").getAll(runId);
      req.onsuccess = () => {
        const rows = (req.result || []).sort((a, b) => a.step - b.step);
        if (!metricName) { resolve(rows); return; }
        resolve(rows.map((r) => ({ step: r.step, value: r.metrics[metricName] ?? null, timestamp: r.timestamp })));
      };
      req.onerror = () => reject(req.error);
    });
  },

  async getSummary(runId) {
    const all = await this.getHistory(runId);
    if (all.length === 0) return {};
    const last = all[all.length - 1];
    return last.metrics;
  },
};
