import { annotationService } from "./annotationService.js";
import { annotationQueue, QUEUE_STATUS } from "./annotationQueue.js";

export const annotationMetrics = {
  /* Cohen's Kappa for two annotators on same image set. */
  cohensKappa(labels1, labels2) {
    if (labels1.length !== labels2.length || labels1.length === 0) return null;
    const n = labels1.length;
    let agreed = 0;
    for (let i = 0; i < n; i++) if (labels1[i] === labels2[i]) agreed++;
    const po = agreed / n;

    const classes = [...new Set([...labels1, ...labels2])];
    let pe = 0;
    for (const cls of classes) {
      const p1 = labels1.filter((l) => l === cls).length / n;
      const p2 = labels2.filter((l) => l === cls).length / n;
      pe += p1 * p2;
    }
    return pe === 1 ? 1 : (po - pe) / (1 - pe);
  },

  async getDatasetMetrics(datasetId) {
    const annotations = await annotationService.getForDataset(datasetId);
    const queueItems = await annotationQueue.getAll();
    const datasetQueue = queueItems.filter((q) => {
      return annotations.some((a) => a.id === q.annotationId);
    });

    const byStatus = { pending: 0, approved: 0, rejected: 0 };
    for (const a of annotations) byStatus[a.status] = (byStatus[a.status] || 0) + 1;

    const labelDist = {};
    for (const a of annotations) {
      const lbls = Array.isArray(a.labels) ? a.labels : [a.labels];
      for (const l of lbls) if (l) labelDist[l] = (labelDist[l] || 0) + 1;
    }

    return {
      total: annotations.length,
      byStatus,
      labelDistribution: labelDist,
      approvalRate: annotations.length > 0 ? byStatus.approved / annotations.length : 0,
      pendingReviews: datasetQueue.filter((q) => q.status === QUEUE_STATUS.PENDING).length,
    };
  },
};
