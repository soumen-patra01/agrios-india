/* Diagnosis parser — extracts and validates the structured JSON from AI output.
   Never fabricates data; returns a clearly-marked failure record on bad output. */

import { severityEngine } from "./severityEngine.js";
import { riskAssessment } from "./riskAssessment.js";

const DEFAULT_DISCLAIMER =
  "AI-based prediction only. Not a confirmed diagnosis. Consult a qualified agricultural expert or veterinarian before taking any action.";

export const diagnosisParser = {
  parse(rawText, domainId) {
    const json = extractJson(rawText);

    if (!json) {
      return failureRecord(domainId, "AI response could not be parsed. Please try again with a clearer image.");
    }

    // Normalise primary diagnosis
    const primary = json.primaryDiagnosis || {};
    const primaryName = primary.name || json.disease || json.diagnosis || "Unable to Detect";

    // Normalise possible diseases list
    const possibleDiseases = Array.isArray(json.possibleDiseases)
      ? json.possibleDiseases.filter((d) => d && d.name)
      : (primaryName !== "Unable to Detect" ? [{ name: primaryName, probability: primary.score || 0.5, category: "unknown" }] : []);

    // Severity
    const severity = severityEngine.parse(json.severity);

    // Confidence score
    const confScore = clamp(
      typeof primary.score === "number" ? primary.score
      : { high: 0.85, medium: 0.60, low: 0.35 }[String(primary.confidence).toLowerCase()] ?? 0.55
    );

    // Risk
    const risk = riskAssessment.parse(json.risk || {});

    // Recommendations — normalise to array-of-strings for each category
    const recs = json.recommendations || {};
    const recommendations = {
      immediate:   toStringArray(recs.immediate),
      organic:     toStringArray(recs.organic),
      chemical:    toStringArray(recs.chemical),
      biological:  toStringArray(recs.biological),
      nutrition:   toStringArray(recs.nutrition),
      environmental: toStringArray(recs.environmental),
    };

    // Follow-up
    const followUp = json.followUp || {};

    return {
      ok:              true,
      domainId:        domainId || json.domain || "unknown",
      primaryDiagnosis: primaryName,
      possibleDiseases,
      severity,
      confidence: {
        score:  confScore,
        label:  primary.confidence || "medium",
        isHigh:   confScore >= 0.80,
        isMedium: confScore >= 0.55 && confScore < 0.80,
        isLow:    confScore < 0.55,
      },
      observations:        toStringArray(json.observations),
      differentialDiagnosis: toStringArray(json.differentialDiagnosis),
      riskFactors:         toStringArray(json.riskFactors),
      recommendations,
      risk,
      followUp: {
        days:        followUp.days || 7,
        checkPoints: toStringArray(followUp.checkPoints),
      },
      recoveryTimeline: json.recoveryTimeline || "",
      needsMoreImages:  !!json.needsMoreImages,
      needsExpertReview: !!json.needsExpertReview,
      knowledgeSource:  json.knowledgeSource || "",
      governmentAdvisory: json.governmentAdvisory || "",
      disclaimer:       json.disclaimer || DEFAULT_DISCLAIMER,
    };
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractJson(text) {
  if (!text) return null;

  // Direct parse
  try { return JSON.parse(text.trim()); } catch { /* continue */ }

  // Extract from markdown code block
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) { try { return JSON.parse(fence[1].trim()); } catch { /* continue */ } }

  // Extract outermost { ... }
  const start = text.indexOf("{");
  const end   = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch { /* continue */ }
  }

  return null;
}

function toStringArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.map((item) =>
      typeof item === "string" ? item : (item.action || item.text || item.name || JSON.stringify(item))
    ).filter(Boolean);
  }
  if (typeof val === "string") return val ? [val] : [];
  return [];
}

function clamp(v) { return Math.max(0, Math.min(1, Number(v) || 0)); }

function failureRecord(domainId, error) {
  return {
    ok:              false,
    domainId:        domainId || "unknown",
    primaryDiagnosis: "Unable to Detect",
    possibleDiseases: [],
    severity:        severityEngine.get("Mild"),
    confidence:      { score: 0, label: "low", isHigh: false, isMedium: false, isLow: true },
    observations:    [],
    differentialDiagnosis: [],
    riskFactors:     [],
    recommendations: { immediate: [], organic: [], chemical: [], biological: [], nutrition: [], environmental: [] },
    risk:            riskAssessment.empty(),
    followUp:        { days: 3, checkPoints: ["Retake photo in better lighting", "Describe symptoms to an expert"] },
    recoveryTimeline: "",
    needsMoreImages:  true,
    needsExpertReview: true,
    knowledgeSource:  "",
    governmentAdvisory: "",
    disclaimer:       DEFAULT_DISCLAIMER,
    parseError:       error,
  };
}
