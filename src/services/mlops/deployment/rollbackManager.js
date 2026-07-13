import { storage } from "../../../utils/storage.js";
import { mlModelRegistry } from "../registry/mlModelRegistry.js";
import { auditLog } from "../governance/auditLog.js";

const KEY = "mlops:rollback_history";

export const rollbackManager = {
  _getHistory() { return storage.get(KEY, []); },
  _addEntry(entry) {
    const h = this._getHistory();
    storage.set(KEY, [entry, ...h].slice(0, 100));
  },

  async snapshot(modelId) {
    const model = await mlModelRegistry.getById(modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);
    const snap = {
      id: `snap-${Date.now()}`,
      modelId,
      version: model.version,
      stage: model.stage,
      isChampion: model.isChampion,
      metrics: model.metrics,
      snappedAt: new Date().toISOString(),
    };
    this._addEntry(snap);
    return snap;
  },

  getHistory(modelId = null) {
    const all = this._getHistory();
    if (modelId) return all.filter((e) => e.modelId === modelId);
    return all;
  },

  getPreviousSnapshot(modelId) {
    const history = this.getHistory(modelId);
    return history.length >= 2 ? history[1] : history[0] || null;
  },

  async rollback(modelId) {
    const prev = this.getPreviousSnapshot(modelId);
    if (!prev) throw new Error(`No rollback snapshot available for model ${modelId}`);

    await mlModelRegistry.update(modelId, {
      version: prev.version,
      stage: prev.stage,
      isChampion: prev.isChampion,
      metrics: prev.metrics,
    });

    const entry = {
      id: `rb-${Date.now()}`,
      modelId,
      rolledBackTo: prev.version,
      rolledBackFrom: (await mlModelRegistry.getById(modelId))?.version,
      reason: "manual rollback",
      executedAt: new Date().toISOString(),
    };
    this._addEntry(entry);
    await auditLog.append({ entity: "model", entityId: modelId, action: "rollback", after: entry });
    return entry;
  },
};
