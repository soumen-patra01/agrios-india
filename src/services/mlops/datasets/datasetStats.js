import { datasetRegistry } from "./datasetRegistry.js";

export const datasetStats = {
  async computeSummary(datasetId) {
    const dataset = await datasetRegistry.getById(datasetId);
    if (!dataset) return null;

    const coverageRate = dataset.imageCount > 0
      ? Math.round((dataset.annotationCount / dataset.imageCount) * 100)
      : 0;

    return {
      datasetId,
      name: dataset.name,
      category: dataset.category,
      version: dataset.version,
      imageCount: dataset.imageCount,
      annotationCount: dataset.annotationCount,
      coverageRate,
      qualityScore: dataset.qualityScore || 0,
      status: dataset.status,
      computedAt: new Date().toISOString(),
    };
  },

  async getPortfolioStats() {
    const all = await datasetRegistry.getAll();
    const byCategory = {};
    const byDomain = {};
    let totalImages = 0;
    let totalAnnotations = 0;
    let qualitySum = 0;
    let qualityCount = 0;

    for (const d of all) {
      totalImages += d.imageCount || 0;
      totalAnnotations += d.annotationCount || 0;
      if (d.qualityScore != null) { qualitySum += d.qualityScore; qualityCount++; }

      byCategory[d.category] = (byCategory[d.category] || 0) + 1;
      if (d.domain) byDomain[d.domain] = (byDomain[d.domain] || 0) + 1;
    }

    return {
      totalDatasets: all.length,
      totalImages,
      totalAnnotations,
      avgQualityScore: qualityCount > 0 ? Math.round(qualitySum / qualityCount) : 0,
      byCategory,
      byDomain,
      computedAt: new Date().toISOString(),
    };
  },
};
