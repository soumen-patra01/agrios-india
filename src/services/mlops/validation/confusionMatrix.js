export const confusionMatrix = {
  /* Build a confusion matrix from arrays of true and predicted labels. */
  build(trueLabels, predLabels) {
    if (trueLabels.length !== predLabels.length) throw new Error("Label arrays must be same length");
    const classes = [...new Set([...trueLabels, ...predLabels])].sort();
    const n = classes.length;
    const matrix = Array.from({ length: n }, () => Array(n).fill(0));
    const idx = Object.fromEntries(classes.map((c, i) => [c, i]));

    for (let i = 0; i < trueLabels.length; i++) {
      matrix[idx[trueLabels[i]]][idx[predLabels[i]]]++;
    }

    return { classes, matrix };
  },

  /* Per-class precision, recall, F1, support. */
  perClassMetrics({ classes, matrix }) {
    return classes.map((cls, i) => {
      const tp = matrix[i][i];
      const fp = matrix.reduce((s, row, r) => r !== i ? s + row[i] : s, 0);
      const fn = matrix[i].reduce((s, v, c) => c !== i ? s + v : s, 0);
      const support = matrix[i].reduce((s, v) => s + v, 0);
      const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
      const recall    = tp + fn > 0 ? tp / (tp + fn) : 0;
      const f1        = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
      return { class: cls, tp, fp, fn, precision, recall, f1, support };
    });
  },

  /* False positives and negatives list. */
  errors({ classes, matrix }) {
    const fp = [], fn = [];
    classes.forEach((cls, i) => {
      classes.forEach((pred, j) => {
        if (i !== j && matrix[i][j] > 0) fn.push({ trueClass: cls, predictedAs: pred, count: matrix[i][j] });
        if (i !== j && matrix[j][i] > 0) fp.push({ predictedClass: cls, trueClass: classes[j], count: matrix[j][i] });
      });
    });
    return { falsePositives: fp, falseNegatives: fn };
  },
};
