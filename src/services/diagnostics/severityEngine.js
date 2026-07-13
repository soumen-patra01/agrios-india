/* Severity engine — maps AI text severity to a structured object with color, urgency, icon. */

export const SEVERITY_LEVELS = ["Healthy", "VeryMild", "Mild", "Moderate", "Severe", "Critical"];

const SEVERITY_MAP = {
  Healthy:  { label: "Healthy",   color: "var(--ag-primary)",  bg: "var(--ag-primary-soft)", icon: "CheckCircle2", urgency: "none",     order: 0 },
  VeryMild: { label: "Very Mild", color: "#22c55e",            bg: "#dcfce7",                icon: "AlertCircle",  urgency: "monitor",  order: 1 },
  Mild:     { label: "Mild",      color: "var(--ag-yellow)",   bg: "var(--ag-yellow-soft)",  icon: "AlertTriangle", urgency: "monitor", order: 2 },
  Moderate: { label: "Moderate",  color: "var(--ag-orange)",   bg: "var(--ag-orange-soft)",  icon: "AlertTriangle", urgency: "treat",   order: 3 },
  Severe:   { label: "Severe",    color: "var(--ag-red)",      bg: "var(--ag-red-soft)",     icon: "ShieldAlert",  urgency: "urgent",   order: 4 },
  Critical: { label: "Critical",  color: "#7f1d1d",            bg: "#fee2e2",                icon: "ShieldAlert",  urgency: "emergency", order: 5 },
};

// Aliases that Claude might return
const ALIASES = {
  "healthy":       "Healthy",
  "normal":        "Healthy",
  "very mild":     "VeryMild",
  "verymild":      "VeryMild",
  "mild":          "Mild",
  "moderate":      "Moderate",
  "medium":        "Moderate",
  "severe":        "Severe",
  "critical":      "Critical",
  "emergency":     "Critical",
  "unable to detect": "Mild",
  "unknown":       "Mild",
};

export const severityEngine = {
  parse(rawSeverity) {
    if (!rawSeverity) return this.get("Mild");
    const key = ALIASES[rawSeverity.toLowerCase().trim()] || rawSeverity;
    return this.get(key);
  },

  get(level) {
    return {
      level,
      ...(SEVERITY_MAP[level] || SEVERITY_MAP.Mild),
    };
  },

  compare(a, b) {
    const ao = (SEVERITY_MAP[a] || SEVERITY_MAP.Mild).order;
    const bo = (SEVERITY_MAP[b] || SEVERITY_MAP.Mild).order;
    return ao - bo;
  },

  isUrgent(level) {
    const s = SEVERITY_MAP[level] || SEVERITY_MAP.Mild;
    return s.urgency === "urgent" || s.urgency === "emergency";
  },

  isEmergency(level) {
    return (SEVERITY_MAP[level] || {}).urgency === "emergency";
  },

  all() { return SEVERITY_LEVELS.map((l) => ({ level: l, ...SEVERITY_MAP[l] })); },
};
