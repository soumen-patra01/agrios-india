import { storage } from "../../../utils/storage.js";
import { auditLog } from "../governance/auditLog.js";

const KEY = "mlops:deployments";

function uid() {
  return `dep-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const DEPLOYMENT_STAGES = ["development", "testing", "staging", "production"];
export const DEPLOYMENT_STRATEGIES = { BLUE_GREEN: "blue_green", CANARY: "canary", ROLLING: "rolling" };

export const deploymentPipeline = {
  _getAll() { return storage.get(KEY, []); },
  _save(data) { storage.set(KEY, data); },

  create({ modelId, modelVersion, strategy = DEPLOYMENT_STRATEGIES.ROLLING, requestedBy = "user" }) {
    const entry = {
      id: uid(),
      modelId,
      modelVersion,
      strategy,
      requestedBy,
      stage: "development",
      status: "pending_approval",
      approvals: [],
      securityValidated: false,
      compatibilityChecked: false,
      canaryPercent: strategy === DEPLOYMENT_STRATEGIES.CANARY ? 5 : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const all = this._getAll();
    this._save([entry, ...all]);
    auditLog.append({ entity: "deployment", entityId: entry.id, action: "created", after: entry });
    return entry;
  },

  getAll({ modelId, stage, status } = {}) {
    let all = this._getAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (modelId) all = all.filter((d) => d.modelId === modelId);
    if (stage) all = all.filter((d) => d.stage === stage);
    if (status) all = all.filter((d) => d.status === status);
    return all;
  },

  getById(id) {
    return this._getAll().find((d) => d.id === id) || null;
  },

  _update(id, patch) {
    const all = this._getAll();
    const idx = all.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error(`Deployment ${id} not found`);
    const updated = { ...all[idx], ...patch, id, updatedAt: new Date().toISOString() };
    all[idx] = updated;
    this._save(all);
    return updated;
  },

  markCompatibilityChecked(id, passed) {
    return this._update(id, { compatibilityChecked: passed });
  },

  markSecurityValidated(id, passed) {
    return this._update(id, { securityValidated: passed });
  },

  approve(id, { approvedBy, notes = "" } = {}) {
    const dep = this.getById(id);
    if (!dep) throw new Error(`Deployment ${id} not found`);
    const approvals = [...dep.approvals, { approvedBy, notes, at: new Date().toISOString() }];
    const updated = this._update(id, { approvals, status: "approved" });
    auditLog.append({ entity: "deployment", entityId: id, action: "approved", after: updated });
    return updated;
  },

  promote(id, toStage) {
    const stageIdx = DEPLOYMENT_STAGES.indexOf(toStage);
    if (stageIdx === -1) throw new Error(`Invalid stage: ${toStage}`);
    const updated = this._update(id, { stage: toStage, status: "deployed", deployedAt: new Date().toISOString() });
    auditLog.append({ entity: "deployment", entityId: id, action: `promoted_to_${toStage}`, after: updated });
    return updated;
  },

  reject(id, { rejectedBy, reason = "" } = {}) {
    const updated = this._update(id, { status: "rejected", rejectedBy, rejectionReason: reason });
    auditLog.append({ entity: "deployment", entityId: id, action: "rejected", after: updated });
    return updated;
  },
};
