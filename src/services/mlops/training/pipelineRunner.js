import { trainingPipeline, STEP_STATUS } from "./trainingPipeline.js";

/* EventTarget-based runner — emits events so UI can listen without polling. */
export class PipelineRunner extends EventTarget {
  constructor(pipelineId) {
    super();
    this.pipelineId = pipelineId;
    this._aborted = false;
  }

  emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  log(stepId, msg) {
    trainingPipeline.appendLog(this.pipelineId, stepId, msg);
    this.emit("log", { stepId, msg, ts: new Date().toISOString() });
  }

  async runStep(stepId, fn) {
    if (this._aborted) return;
    trainingPipeline.updateStep(this.pipelineId, stepId, {
      status: STEP_STATUS.RUNNING,
      startedAt: new Date().toISOString(),
    });
    this.emit("step_start", { stepId });
    try {
      const metrics = await fn(this);
      trainingPipeline.updateStep(this.pipelineId, stepId, {
        status: STEP_STATUS.COMPLETED,
        completedAt: new Date().toISOString(),
        metrics: metrics || {},
      });
      this.emit("step_complete", { stepId, metrics });
    } catch (err) {
      trainingPipeline.updateStep(this.pipelineId, stepId, {
        status: STEP_STATUS.FAILED,
        completedAt: new Date().toISOString(),
        error: err.message,
      });
      this.emit("step_error", { stepId, error: err.message });
      throw err;
    }
  }

  abort() {
    this._aborted = true;
    this.emit("aborted", { pipelineId: this.pipelineId });
  }
}

/* Factory: creates a runner with no-op steps (training steps require
   an actual training backend). This runner simulates the workflow UI
   and is replaced by a real backend runner in production. */
export function createSimulatedRunner(pipelineId) {
  const runner = new PipelineRunner(pipelineId);

  runner.start = async () => {
    const steps = [
      { id: "prepare",  fn: async (r) => { r.log("prepare", "Scanning dataset..."); await delay(400); r.log("prepare", "Dataset validated."); return { samples: 0 }; } },
      { id: "split",    fn: async (r) => { r.log("split", "Splitting 70/20/10..."); await delay(300); return { train: 0, val: 0, test: 0 }; } },
      { id: "train",    fn: async (r) => { r.log("train", "Training requires a backend training service."); return { epochs: 0 }; } },
      { id: "validate", fn: async (r) => { r.log("validate", "Validation step ready for backend."); return {}; } },
      { id: "test",     fn: async (r) => { r.log("test", "Test step ready for backend."); return {}; } },
      { id: "evaluate", fn: async (r) => { r.log("evaluate", "Evaluation step ready for backend."); return {}; } },
      { id: "package",  fn: async (r) => { r.log("package", "Package step ready for backend."); return {}; } },
    ];

    for (const { id, fn } of steps) {
      if (runner._aborted) break;
      await runner.runStep(id, fn);
    }
    runner.emit("pipeline_done", { pipelineId });
  };

  return runner;
}

function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }
