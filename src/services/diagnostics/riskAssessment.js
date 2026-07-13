/* Risk assessment — structures and scores the risk fields from the AI response. */

const RISK_LEVELS = { low: 0, medium: 1, high: 2, critical: 3 };
const URGENCY_MAP = {
  routine:   { label: "Routine",   color: "var(--ag-primary)", days: 7 },
  urgent:    { label: "Urgent",    color: "var(--ag-orange)",  days: 2 },
  emergency: { label: "Emergency", color: "var(--ag-red)",     days: 0 },
};

export const riskAssessment = {
  parse(rawRisk = {}) {
    const spread         = normalize(rawRisk.spread);
    const economicImpact = normalize(rawRisk.economicImpact);
    const mortalityRisk  = normalize(rawRisk.mortalityRisk  || rawRisk.mortality);
    const yieldLoss      = normalize(rawRisk.yieldLoss      || rawRisk.yield_loss);
    const urgency        = rawRisk.urgency?.toLowerCase() || "routine";

    const overallScore = Math.max(
      RISK_LEVELS[spread]         || 0,
      RISK_LEVELS[economicImpact] || 0,
      RISK_LEVELS[mortalityRisk]  || 0,
    );

    return {
      spread:         { level: spread,         label: formatLabel(spread) },
      economicImpact: { level: economicImpact, label: formatLabel(economicImpact) },
      mortalityRisk:  { level: mortalityRisk,  label: formatLabel(mortalityRisk) },
      yieldLoss:      { level: yieldLoss,      label: formatLabel(yieldLoss) },
      urgency:        { key: urgency, ...(URGENCY_MAP[urgency] || URGENCY_MAP.routine) },
      overallScore,
      isHighRisk: overallScore >= 2,
    };
  },

  empty() {
    return this.parse({});
  },
};

function normalize(val) {
  if (!val) return "low";
  const v = String(val).toLowerCase().trim();
  if (v === "critical" || v === "very high") return "critical";
  if (v === "high")   return "high";
  if (v === "medium" || v === "moderate") return "medium";
  return "low";
}

function formatLabel(level) {
  return { low: "Low", medium: "Medium", high: "High", critical: "Critical" }[level] || "Low";
}
