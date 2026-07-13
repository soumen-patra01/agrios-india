/* Vision pipeline — full image analysis flow:
   validate → process → metadata → infer → confidence → analytics */

import { imageValidator }    from "./imageValidator.js";
import { imageProcessor }    from "./imageProcessor.js";
import { metadataExtractor } from "./metadataExtractor.js";
import { hybridProvider }    from "./inference/hybridProvider.js";
import { confidenceEngine }  from "./confidence/confidenceEngine.js";
import { visionAnalytics }   from "./analytics/visionAnalytics.js";
import { offlineQueue }      from "./offlineQueue.js";
import { modelManager }      from "./models/modelManager.js";

export const visionPipeline = {
  async analyze(file, context = {}) {
    const t0 = Date.now();

    // 1 — Validate
    const validation = await imageValidator.validate(file);
    if (!validation.valid) {
      return { ok: false, error: validation.error, stage: "validation" };
    }

    // 2 — Process (resize, compress, enhance)
    let processed;
    try {
      processed = await imageProcessor.process(file, context.processingOptions);
    } catch (err) {
      return { ok: false, error: "Image processing failed: " + err.message, stage: "processing" };
    }

    // 3 — Extract metadata (non-blocking — don't fail the pipeline on GPS denial)
    const metadata = await metadataExtractor.extract(file, context.location).catch(() => ({}));

    // 4 — Offline: queue and return
    if (!navigator.onLine) {
      await offlineQueue.enqueue({ imageBase64: processed.base64, metadata, context });
      return { ok: true, queued: true, message: "Saved for analysis when back online." };
    }

    // 5 — Infer
    const activeModel = modelManager.getActive();
    let inferResult;
    try {
      inferResult = await hybridProvider.infer(processed.base64, metadata, {
        ...context,
        model: activeModel?.id,
      });
    } catch (err) {
      visionAnalytics.record({ success: false, modelId: activeModel?.id || "unknown", provider: "unknown" });
      return { ok: false, error: err.message, stage: "inference" };
    }

    // 6 — Score confidence
    const confidence = inferResult.provider === "claude-vision"
      ? confidenceEngine.parseClaudeOutput(inferResult.raw, context)
      : confidenceEngine.build({ score: inferResult.confidence || 0.5, fullAnalysis: inferResult.raw || "" });

    // 7 — Record analytics
    visionAnalytics.record({
      success:     true,
      inferenceMs: inferResult.inferenceMs,
      confidence:  confidence.score,
      modelId:     activeModel?.id || "unknown",
      provider:    inferResult.provider,
    });

    return {
      ok:             true,
      confidence,
      prediction:     confidence.topPrediction,
      fullAnalysis:   confidence.fullAnalysis,
      severity:       confidence.severity,
      needsMoreImages: confidence.needsMoreImages,
      metadata,
      processingMs:   Date.now() - t0,
      imageInfo:      { width: processed.width, height: processed.height, bytes: processed.bytes },
      provider:       inferResult.provider,
      model:          activeModel?.id,
    };
  },

  init() {
    offlineQueue.onFlush(async (job) => {
      if (!job.imageBase64) return;
      const fakeFile = { name: "queued.jpg", type: "image/jpeg", size: job.imageBase64.length };
      await this.analyze(fakeFile, { ...job.context, _preProcessed: job.imageBase64 });
    });
  },
};
