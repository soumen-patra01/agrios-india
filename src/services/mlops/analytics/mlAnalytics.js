import { datasetRegistry } from "../datasets/datasetRegistry.js";
import { mlModelRegistry } from "../registry/mlModelRegistry.js";
import { experimentTracker } from "../experiments/experimentTracker.js";
import { performanceTracker } from "../monitoring/performanceTracker.js";
import { driftReporter } from "../drift/driftReporter.js";
import { annotationQueue } from "../annotations/annotationQueue.js";
import { promotionEngine } from "../deployment/promotionEngine.js";
import { approvalWorkflow } from "../governance/approvalWorkflow.js";
import { auditLog } from "../governance/auditLog.js";

export const mlAnalytics = {
  async getDashboardData() {
    const [
      datasetCount,
      modelCount,
      experimentCount,
      businessKPIs,
      latestDrift,
      queueCounts,
      pendingPromotions,
      pendingApprovals,
      auditCount,
    ] = await Promise.all([
      datasetRegistry.count().catch(() => 0),
      mlModelRegistry.count().catch(() => 0),
      experimentTracker.count().catch(() => 0),
      performanceTracker.getBusinessKPIs().catch(() => null),
      Promise.resolve(driftReporter.getLatestReport()),
      annotationQueue.countByStatus().catch(() => {}),
      Promise.resolve(promotionEngine.getPendingCount()),
      Promise.resolve(approvalWorkflow.getPendingCount()),
      auditLog.count().catch(() => 0),
    ]);

    return {
      counts: {
        datasets: datasetCount,
        models: modelCount,
        experiments: experimentCount,
        auditEntries: auditCount,
        pendingAnnotations: queueCounts?.pending || 0,
        pendingPromotions,
        pendingApprovals,
      },
      businessKPIs,
      driftStatus: latestDrift
        ? { severity: latestDrift.overallSeverity, detected: latestDrift.detected, reportId: latestDrift.id }
        : { severity: "NONE", detected: false },
      computedAt: new Date().toISOString(),
    };
  },
};
