import { storage } from "../../../utils/storage.js";

const KEY = "mlops:training_pipelines";

function uid() {
  return `tp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const PIPELINE_STEPS = [
  { id: "prepare",   label: "Data Preparation"  },
  { id: "split",     label: "Dataset Split"      },
  { id: "train",     label: "Training"           },
  { id: "validate",  label: "Validation"         },
  { id: "test",      label: "Testing"            },
  { id: "evaluate",  label: "Evaluation"         },
  { id: "package",   label: "Model Packaging"    },
];

export const STEP_STATUS = {
  PENDING:   "pending",
  RUNNING:   "running",
  COMPLETED: "completed",
  FAILED:    "failed",
  SKIPPED:   "skipped",
};

function makePipeline({ name, modelId, datasetId, experimentId, config = {} }) {
  return {
    id: uid(),
    name,
    modelId,
    datasetId,
    experimentId,
    config,
    status: "pending",
    steps: PIPELINE_STEPS.map((s) => ({
      ...s,
      status: STEP_STATUS.PENDING,
      startedAt: null,
      completedAt: null,
      logs: [],
      metrics: {},
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
  };
}

export const trainingPipeline = {
  _getAll() { return storage.get(KEY, []); },
  _save(pipelines) { storage.set(KEY, pipelines); },

  create(params) {
    const pipeline = makePipeline(params);
    const all = this._getAll();
    this._save([pipeline, ...all]);
    return pipeline;
  },

  getAll({ status, modelId } = {}) {
    let all = this._getAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (status) all = all.filter((p) => p.status === status);
    if (modelId) all = all.filter((p) => p.modelId === modelId);
    return all;
  },

  getById(id) {
    return this._getAll().find((p) => p.id === id) || null;
  },

  updateStep(pipelineId, stepId, patch) {
    const all = this._getAll();
    const idx = all.findIndex((p) => p.id === pipelineId);
    if (idx === -1) throw new Error(`Pipeline ${pipelineId} not found`);
    const pipeline = { ...all[idx] };
    pipeline.steps = pipeline.steps.map((s) => s.id === stepId ? { ...s, ...patch } : s);
    pipeline.updatedAt = new Date().toISOString();

    const statuses = pipeline.steps.map((s) => s.status);
    if (statuses.every((s) => s === STEP_STATUS.COMPLETED)) pipeline.status = "completed";
    else if (statuses.some((s) => s === STEP_STATUS.FAILED)) pipeline.status = "failed";
    else if (statuses.some((s) => s === STEP_STATUS.RUNNING)) pipeline.status = "running";

    all[idx] = pipeline;
    this._save(all);
    return pipeline;
  },

  appendLog(pipelineId, stepId, message) {
    const pipeline = this.getById(pipelineId);
    if (!pipeline) return;
    const step = pipeline.steps.find((s) => s.id === stepId);
    if (!step) return;
    const updatedLogs = [...(step.logs || []), { ts: new Date().toISOString(), msg: message }];
    this.updateStep(pipelineId, stepId, { logs: updatedLogs });
  },

  delete(id) {
    this._save(this._getAll().filter((p) => p.id !== id));
  },
};
