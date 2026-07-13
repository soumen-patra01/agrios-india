import { datasetRegistry } from "./datasetRegistry.js";

const REQUIRED_METADATA_FIELDS = ["name", "category"];
const VALID_CATEGORIES = [
  "crop_images", "leaf_images", "fruit_images", "stem_images", "root_images",
  "animal_images", "fish_images", "bee_images", "soil_images",
  "weather_metadata", "farm_metadata", "user_metadata",
];

export const datasetValidator = {
  validateMetadata(dataset) {
    const errors = [];
    for (const field of REQUIRED_METADATA_FIELDS) {
      if (!dataset[field]) errors.push(`Missing required field: ${field}`);
    }
    if (dataset.category && !VALID_CATEGORIES.includes(dataset.category)) {
      errors.push(`Invalid category: ${dataset.category}`);
    }
    if (dataset.imageCount < 0) errors.push("imageCount cannot be negative");
    return { valid: errors.length === 0, errors };
  },

  computeQualityScore(dataset, annotations = []) {
    let score = 0;
    const checks = [
      { label: "Has description",      pass: !!dataset.description && dataset.description.length > 10, weight: 10 },
      { label: "Has valid category",   pass: VALID_CATEGORIES.includes(dataset.category),              weight: 15 },
      { label: "Has domain set",       pass: !!dataset.domain,                                         weight: 10 },
      { label: "Has images",           pass: dataset.imageCount > 0,                                   weight: 20 },
      { label: "Has annotations",      pass: dataset.annotationCount > 0,                              weight: 20 },
      { label: "Annotation coverage",  pass: dataset.imageCount > 0 && (dataset.annotationCount / dataset.imageCount) >= 0.8, weight: 15 },
      { label: "Has license",          pass: !!dataset.license,                                        weight: 5  },
      { label: "Has source URL",       pass: !!dataset.sourceUrl,                                      weight: 5  },
    ];
    for (const c of checks) if (c.pass) score += c.weight;
    return { score: Math.min(score, 100), checks };
  },

  detectDuplicates(items, keyFn) {
    const seen = new Map();
    const duplicates = [];
    for (const item of items) {
      const key = keyFn(item);
      if (seen.has(key)) duplicates.push({ original: seen.get(key), duplicate: item });
      else seen.set(key, item);
    }
    return duplicates;
  },

  validateImageEntry(entry) {
    const errors = [];
    if (!entry.filename) errors.push("Missing filename");
    if (!entry.label) errors.push("Missing label");
    if (entry.width && entry.width < 32) errors.push("Image width too small (< 32px)");
    if (entry.height && entry.height < 32) errors.push("Image height too small (< 32px)");
    const ext = (entry.filename || "").split(".").pop().toLowerCase();
    if (!["jpg", "jpeg", "png", "webp"].includes(ext)) errors.push(`Unsupported format: ${ext}`);
    return { valid: errors.length === 0, errors };
  },

  async runFullValidation(datasetId) {
    const dataset = await datasetRegistry.getById(datasetId);
    if (!dataset) return { valid: false, errors: [`Dataset ${datasetId} not found`] };
    const metaResult = this.validateMetadata(dataset);
    const qualityResult = this.computeQualityScore(dataset);
    await datasetRegistry.update(datasetId, { qualityScore: qualityResult.score });
    return {
      valid: metaResult.valid,
      errors: metaResult.errors,
      qualityScore: qualityResult.score,
      qualityChecks: qualityResult.checks,
    };
  },
};
