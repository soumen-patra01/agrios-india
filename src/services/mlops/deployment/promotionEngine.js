import { storage } from "../../../utils/storage.js";
import { mlModelRegistry, MODEL_STAGES } from "../registry/mlModelRegistry.js";
import { auditLog } from "../governance/auditLog.js";

const KEY = "mlops:promotion_requests";

const STAGE_ORDER = [
  MODEL_STAGES.DEVELOPMENT,
  MODEL_STAGES.TESTING,
  MODEL_STAGES.STAGING,
  MODEL_STAGES.PRODUCTION,
];

function uid() {
  return `pr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const promotionEngine = {
  _getAll() { return storage.get(KEY, []); },
  _save(data) { storage.set(KEY, data); },

  async requestPromotion(modelId, { requestedBy = "user", notes = "" } = {}) {
    const model = await mlModelRegistry.getById(modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);

    const currentIdx = STAGE_ORDER.indexOf(model.stage);
    if (currentIdx === -1 || currentIdx >= STAGE_ORDER.length - 1) {
      throw new Error(`Model is already at the highest stage or in an invalid stage`);
    }
    const targetStage = STAGE_ORDER[currentIdx + 1];

    const request = {
      id: uid(),
      modelId,
      fromStage: model.stage,
      toStage: targetStage,
      requestedBy,
      notes,
      status: "pending",
      createdAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
    };

    this._save([request, ...this._getAll()]);
    await auditLog.append({ entity: "promotion", entityId: request.id, action: "requested", after: request });
    return request;
  },

  getQueue({ status } = {}) {
    let all = this._getAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (status) all = all.filter((r) => r.status === status);
    return all;
  },

  async approve(requestId, { approvedBy = "admin" } = {}) {
    const all = this._getAll();
    const idx = all.findIndex((r) => r.id === requestId);
    if (idx === -1) throw new Error(`Promotion request ${requestId} not found`);

    const request = all[idx];
    all[idx] = { ...request, status: "approved", reviewedBy: approvedBy, reviewedAt: new Date().toISOString() };
    this._save(all);

    await mlModelRegistry.promote(request.modelId, request.toStage);
    await auditLog.append({ entity: "promotion", entityId: requestId, action: "approved", after: all[idx] });
    return all[idx];
  },

  async reject(requestId, { rejectedBy = "admin", reason = "" } = {}) {
    const all = this._getAll();
    const idx = all.findIndex((r) => r.id === requestId);
    if (idx === -1) throw new Error(`Promotion request ${requestId} not found`);

    all[idx] = { ...all[idx], status: "rejected", rejectedBy, rejectionReason: reason, reviewedAt: new Date().toISOString() };
    this._save(all);
    await auditLog.append({ entity: "promotion", entityId: requestId, action: "rejected", after: all[idx] });
    return all[idx];
  },

  getPendingCount() {
    return this.getQueue({ status: "pending" }).length;
  },
};
