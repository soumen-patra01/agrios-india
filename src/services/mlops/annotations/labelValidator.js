import { domainRegistry } from "../../diagnostics/domainRegistry.js";

const GLOBAL_FORBIDDEN = ["unknown", "undefined", "null", "n/a"];

export const labelValidator = {
  validate(label, { domainId, annotationType } = {}) {
    const errors = [];

    if (!label || typeof label !== "string" || label.trim().length === 0) {
      errors.push("Label must be a non-empty string");
    } else {
      const normalized = label.trim().toLowerCase();
      if (GLOBAL_FORBIDDEN.includes(normalized)) errors.push(`Label "${label}" is not meaningful`);
      if (label.length > 128) errors.push("Label exceeds 128 characters");
      if (/[<>{}]/.test(label)) errors.push("Label contains invalid characters");
    }

    if (domainId && domainRegistry.has(domainId)) {
      const domain = domainRegistry.get(domainId);
      if (domain.species && annotationType === "image_classification") {
        const valid = domain.species.map((s) => s.toLowerCase());
        if (!valid.some((v) => label.toLowerCase().includes(v.split(" ")[0]))) {
          // soft warning, not an error — custom labels may be valid
        }
      }
    }

    return { valid: errors.length === 0, errors };
  },

  validateMultiple(labels, options = {}) {
    const results = labels.map((l) => ({ label: l, ...this.validate(l, options) }));
    return {
      allValid: results.every((r) => r.valid),
      results,
      invalidCount: results.filter((r) => !r.valid).length,
    };
  },

  normalizeLabel(label) {
    return label.trim().toLowerCase().replace(/\s+/g, "_");
  },
};
