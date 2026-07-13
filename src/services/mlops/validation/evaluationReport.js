import { validationPipeline } from "./validationPipeline.js";

function fmt(n) { return n != null ? (n * 100).toFixed(1) + "%" : "N/A"; }

export const evaluationReport = {
  generate(modelId, datasetId, { trueLabels, predLabels, confidences = [] } = {}) {
    const metrics = validationPipeline.evaluate({ trueLabels, predLabels, confidences });
    if (!metrics) return null;

    return {
      reportId: `eval-${Date.now()}`,
      modelId,
      datasetId,
      summary: {
        accuracy:   metrics.accuracy,
        precision:  metrics.precision,
        recall:     metrics.recall,
        f1Score:    metrics.f1Score,
        rocAuc:     metrics.rocAuc,
      },
      perClass:        metrics.perClass,
      confusionMatrix: metrics.confusionMatrix,
      falsePositives:  metrics.falsePositives,
      falseNegatives:  metrics.falseNegatives,
      support:         metrics.support,
      generatedAt:     new Date().toISOString(),
    };
  },

  toText(report) {
    if (!report) return "No evaluation data.";
    const s = report.summary;
    const lines = [
      `Evaluation Report — Model: ${report.modelId}`,
      `Dataset: ${report.datasetId}  |  Samples: ${report.support}`,
      `Generated: ${new Date(report.generatedAt).toLocaleString()}`,
      "",
      `Accuracy:  ${fmt(s.accuracy)}`,
      `Precision: ${fmt(s.precision)}`,
      `Recall:    ${fmt(s.recall)}`,
      `F1 Score:  ${fmt(s.f1Score)}`,
      s.rocAuc != null ? `ROC-AUC:   ${fmt(s.rocAuc)}` : "",
      "",
      "Per-Class Performance:",
      ...report.perClass.map(
        (c) => `  ${c.class.padEnd(20)} P:${fmt(c.precision)}  R:${fmt(c.recall)}  F1:${fmt(c.f1)}  n=${c.support}`
      ),
    ];
    return lines.filter((l) => l !== undefined).join("\n");
  },

  downloadJson(report) {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eval-${report.reportId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
