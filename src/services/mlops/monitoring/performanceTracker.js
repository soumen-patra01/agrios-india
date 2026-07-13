import { historyService } from "../../diagnostics/historyService.js";
import { inferenceMonitor } from "./inferenceMonitor.js";
import { visionAnalytics } from "../../vision/analytics/visionAnalytics.js";

export const performanceTracker = {
  async getBusinessKPIs() {
    const [diagCount, visionStats, monitorStats] = await Promise.all([
      historyService.count().catch(() => 0),
      Promise.resolve(visionAnalytics.getStats()),
      inferenceMonitor.getStats(null, 24).catch(() => null),
    ]);

    const diagRecords = await historyService.getAll({ limit: 100 }).catch(() => []);
    const byDomain = {};
    const bySeverity = {};
    for (const r of diagRecords) {
      byDomain[r.domainId] = (byDomain[r.domainId] || 0) + 1;
      const sev = r.severity?.level || "unknown";
      bySeverity[sev] = (bySeverity[sev] || 0) + 1;
    }

    const last7Days = diagRecords.filter((r) => {
      return new Date(r.createdAt) > new Date(Date.now() - 7 * 86400000);
    });

    return {
      totalDiagnoses: diagCount,
      diagnosesLast7Days: last7Days.length,
      avgDiagnosesPerDay: Math.round(last7Days.length / 7),
      diagnosisByDomain: byDomain,
      diagnosisBySeverity: bySeverity,
      visionStats: {
        imagesProcessed: visionStats.imagesProcessed,
        successRate: visionStats.successRate,
        avgConfidence: visionStats.avgConfidence,
        avgInferenceMs: visionStats.avgInferenceMs,
      },
      monitorStats: monitorStats || {},
      computedAt: new Date().toISOString(),
    };
  },
};
