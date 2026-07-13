/* Confidence scoring — normalizes raw inference output into a structured result. */

export const THRESHOLDS = { HIGH: 0.80, MEDIUM: 0.55 };

export const confidenceEngine = {
  parseClaudeOutput(raw, _context = {}) {
    const text = typeof raw === "string" ? raw : "";

    const confMatch  = text.match(/confidence[:\s]+?(high|medium|low)/i);
    const confLabel  = confMatch ? confMatch[1].toLowerCase() : "medium";
    const confScore  = { high: 0.85, medium: 0.60, low: 0.35 }[confLabel] ?? 0.60;

    const diagMatch  = text.match(/(?:diagnosis|likely|identified|detected)[:\s]+?([^\n.]+)/i);
    const topPrediction = diagMatch ? diagMatch[1].trim() : "See full analysis";

    const sevMatch   = text.match(/severity[:\s]+?(mild|moderate|severe|critical)/i);
    const severity   = sevMatch ? sevMatch[1].toLowerCase() : null;

    const needsMore  = /insufficient|unclear|more image|better photo|clearer/i.test(text);

    return this.build({ score: confScore, label: confLabel, topPrediction, severity, needsMoreImages: needsMore, fullAnalysis: text });
  },

  build({ score, label, topPrediction, needsMoreImages = false, severity = null, fullAnalysis = "" }) {
    const s = Math.max(0, Math.min(1, score));
    return {
      score: s,
      label: label || this.getLabel(s),
      isHigh:         s >= THRESHOLDS.HIGH,
      isMedium:       s >= THRESHOLDS.MEDIUM && s < THRESHOLDS.HIGH,
      isLow:          s <  THRESHOLDS.MEDIUM,
      color:          s >= THRESHOLDS.HIGH ? "primary" : s >= THRESHOLDS.MEDIUM ? "orange" : "red",
      topPrediction,
      needsMoreImages,
      severity,
      fullAnalysis,
    };
  },

  getLabel(score) {
    if (score >= THRESHOLDS.HIGH)   return "high";
    if (score >= THRESHOLDS.MEDIUM) return "medium";
    return "low";
  },

  aggregate(results) {
    if (!results.length) return null;
    const avg = results.reduce((s, r) => s + r.score, 0) / results.length;
    return this.build({
      score:        avg,
      topPrediction: results[0]?.topPrediction || "Aggregated analysis",
      fullAnalysis:  results.map((r) => r.fullAnalysis).join("\n\n---\n\n"),
    });
  },
};
