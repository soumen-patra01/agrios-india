export const dataPreparation = {
  /* Returns split indices for a dataset of given size. */
  split(totalCount, { trainRatio = 0.7, valRatio = 0.2, testRatio = 0.1, shuffle = true } = {}) {
    const sum = trainRatio + valRatio + testRatio;
    const t = trainRatio / sum;
    const v = valRatio / sum;

    const indices = Array.from({ length: totalCount }, (_, i) => i);
    if (shuffle) {
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
    }

    const trainEnd = Math.floor(totalCount * t);
    const valEnd   = trainEnd + Math.floor(totalCount * v);

    return {
      train: indices.slice(0, trainEnd),
      val:   indices.slice(trainEnd, valEnd),
      test:  indices.slice(valEnd),
      counts: { train: trainEnd, val: valEnd - trainEnd, test: totalCount - valEnd },
      ratios: { train: t, val: v, test: 1 - t - v },
    };
  },

  /* Stratified split — keeps class distribution equal across splits. */
  stratifiedSplit(items, labelFn, ratios = { trainRatio: 0.7, valRatio: 0.2, testRatio: 0.1 }) {
    const byClass = {};
    for (const item of items) {
      const cls = labelFn(item);
      (byClass[cls] = byClass[cls] || []).push(item);
    }

    const train = [], val = [], test = [];
    for (const cls of Object.keys(byClass)) {
      const group = byClass[cls];
      const split = this.split(group.length, ratios);
      train.push(...split.train.map((i) => group[i]));
      val.push(...split.val.map((i) => group[i]));
      test.push(...split.test.map((i) => group[i]));
    }

    return { train, val, test, counts: { train: train.length, val: val.length, test: test.length } };
  },

  buildConfig({ datasetId, splitResult, augmentation = false }) {
    return {
      datasetId,
      split: splitResult.counts,
      augmentation,
      normalization: "imagenet",
      resizeTo: [224, 224],
      batchSize: 32,
      createdAt: new Date().toISOString(),
    };
  },
};
