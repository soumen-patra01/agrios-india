export const complianceChecker = {
  checkModel(model) {
    const rules = [
      {
        id: "has_description",
        label: "Model documentation exists",
        pass: !!model.description && model.description.length >= 20,
        severity: "warning",
        detail: "Model must have a meaningful description for audit purposes",
      },
      {
        id: "has_owner",
        label: "Model owner assigned",
        pass: !!model.owner && model.owner !== "unknown",
        severity: "error",
        detail: "Each model must have an assigned owner (DPDP Act § 8 — accountability)",
      },
      {
        id: "has_training_dataset",
        label: "Training dataset documented",
        pass: !!model.trainingDatasetId,
        severity: "warning",
        detail: "Training data lineage required for bias assessment",
      },
      {
        id: "has_metrics",
        label: "Performance metrics recorded",
        pass: model.metrics && Object.keys(model.metrics).length > 0,
        severity: "error",
        detail: "Models deployed without evaluation metrics violate AI governance policy",
      },
      {
        id: "not_in_dev_for_prod",
        label: "Not deploying dev model to production",
        pass: model.stage !== "development",
        severity: "error",
        detail: "Development-stage models must complete testing and staging before production",
      },
      {
        id: "dpdp_compatible",
        label: "DPDP Act 2023 compatible",
        pass: !model.storesPersonalData || !!model.dpdpConsent,
        severity: "error",
        detail: "Models processing personal data need explicit DPDP Act consent configuration",
      },
    ];

    const errors   = rules.filter((r) => !r.pass && r.severity === "error");
    const warnings = rules.filter((r) => !r.pass && r.severity === "warning");
    return {
      compliant: errors.length === 0,
      rules,
      errors,
      warnings,
      score: Math.round((rules.filter((r) => r.pass).length / rules.length) * 100),
      checkedAt: new Date().toISOString(),
    };
  },
};
