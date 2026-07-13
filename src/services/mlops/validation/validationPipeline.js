import { confusionMatrix } from "./confusionMatrix.js";

export const validationPipeline = {
  /* Compute full validation metrics from predictions. */
  evaluate({ trueLabels, predLabels, confidences = [] }) {
    if (trueLabels.length === 0) return null;

    const cm = confusionMatrix.build(trueLabels, predLabels);
    const perClass = confusionMatrix.perClassMetrics(cm);

    const total = trueLabels.length;
    const correct = trueLabels.filter((t, i) => t === predLabels[i]).length;
    const accuracy = correct / total;

    const macroP = perClass.reduce((s, c) => s + c.precision, 0) / perClass.length;
    const macroR = perClass.reduce((s, c) => s + c.recall, 0) / perClass.length;
    const macroF1 = perClass.reduce((s, c) => s + c.f1, 0) / perClass.length;

    const weightedF1 = perClass.reduce((s, c) => s + c.f1 * c.support, 0) / total;

    const { falsePositives, falseNegatives } = confusionMatrix.errors(cm);

    let rocAuc = null;
    if (confidences.length === total) {
      rocAuc = this._approximateRocAuc(trueLabels, confidences, cm.classes[0]);
    }

    return {
      accuracy,
      precision: macroP,
      recall: macroR,
      f1Score: macroF1,
      weightedF1,
      rocAuc,
      confusionMatrix: cm,
      perClass,
      falsePositives,
      falseNegatives,
      support: total,
      evaluatedAt: new Date().toISOString(),
    };
  },

  _approximateRocAuc(trueLabels, scores, positiveClass) {
    const pairs = trueLabels.map((t, i) => ({ label: t === positiveClass ? 1 : 0, score: scores[i] || 0 }));
    pairs.sort((a, b) => b.score - a.score);
    let tp = 0, fp = 0, auc = 0;
    const pos = pairs.filter((p) => p.label === 1).length;
    const neg = pairs.length - pos;
    if (pos === 0 || neg === 0) return null;
    let prevFpr = 0, prevTpr = 0;
    for (const { label } of pairs) {
      if (label === 1) tp++;
      else {
        fp++;
        const fpr = fp / neg, tpr = tp / pos;
        auc += (fpr - prevFpr) * (tpr + prevTpr) / 2;
        prevFpr = fpr; prevTpr = tpr;
      }
    }
    return Math.min(1, Math.max(0, auc));
  },
};
