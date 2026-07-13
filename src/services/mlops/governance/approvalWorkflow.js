import { storage } from "../../../utils/storage.js";
import { auditLog } from "./auditLog.js";

const KEY = "mlops:approval_workflows";

function uid() {
  return `apw-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const APPROVAL_STATUS = {
  PENDING:   "pending",
  APPROVED:  "approved",
  REJECTED:  "rejected",
  CANCELLED: "cancelled",
};

export const approvalWorkflow = {
  _getAll() { return storage.get(KEY, []); },
  _save(data) { storage.set(KEY, data); },

  create({ type, entityId, entityType, requestedBy = "user", description = "", requiredApprovals = 1 }) {
    const entry = {
      id: uid(),
      type,
      entityId,
      entityType,
      requestedBy,
      description,
      requiredApprovals,
      approvals: [],
      status: APPROVAL_STATUS.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this._save([entry, ...this._getAll()]);
    auditLog.append({ entity: entityType, entityId, action: "approval_requested", after: entry });
    return entry;
  },

  getAll({ type, entityType, status } = {}) {
    let all = this._getAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (type) all = all.filter((w) => w.type === type);
    if (entityType) all = all.filter((w) => w.entityType === entityType);
    if (status) all = all.filter((w) => w.status === status);
    return all;
  },

  getById(id) {
    return this._getAll().find((w) => w.id === id) || null;
  },

  getPendingCount() {
    return this._getAll().filter((w) => w.status === APPROVAL_STATUS.PENDING).length;
  },

  _updateEntry(id, patch) {
    const all = this._getAll();
    const idx = all.findIndex((w) => w.id === id);
    if (idx === -1) throw new Error(`Workflow ${id} not found`);
    const updated = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
    all[idx] = updated;
    this._save(all);
    return updated;
  },

  approve(id, { approvedBy, notes = "" } = {}) {
    const workflow = this.getById(id);
    if (!workflow) throw new Error(`Workflow ${id} not found`);
    const approvals = [...workflow.approvals, { by: approvedBy, notes, at: new Date().toISOString() }];
    const status = approvals.length >= workflow.requiredApprovals
      ? APPROVAL_STATUS.APPROVED
      : APPROVAL_STATUS.PENDING;
    const updated = this._updateEntry(id, { approvals, status });
    auditLog.append({ entity: workflow.entityType, entityId: workflow.entityId, action: "approved", after: updated });
    return updated;
  },

  reject(id, { rejectedBy, reason = "" } = {}) {
    const workflow = this.getById(id);
    if (!workflow) throw new Error(`Workflow ${id} not found`);
    const updated = this._updateEntry(id, {
      status: APPROVAL_STATUS.REJECTED,
      rejectedBy,
      rejectionReason: reason,
    });
    auditLog.append({ entity: workflow.entityType, entityId: workflow.entityId, action: "rejected", after: updated });
    return updated;
  },

  cancel(id) {
    return this._updateEntry(id, { status: APPROVAL_STATUS.CANCELLED });
  },
};
