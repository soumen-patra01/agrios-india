import { inferenceMonitor } from "../monitoring/inferenceMonitor.js";

export const DRIFT_SEVERITY = {
  NONE:     { label: "None",     color: "var(--ag-primary)", threshold: 0.10 },
  LOW:      { label: "Low",      color: "var(--ag-yellow)",  threshold: 0.20 },
  MEDIUM:   { label: "Medium",   color: "var(--ag-orange)",  threshold: 0.35 },
  HIGH:     { label: "High",     color: "var(--ag-red)",     threshold: 0.50 },
  CRITICAL: { label: "Critical", color: "#7f1d1d",           threshold: 1.00 },
};

function classifyDrift(psi) {
  if (psi < 0.10) return "NONE";
  if (psi < 0.20) return "LOW";
  if (psi < 0.35) return "MEDIUM";
  if (psi < 0.50) return "HIGH";
  return "CRITICAL";
}

/* Population Stability Index (PSI) between two confidence distributions. */
function computePsi(baseline, current, bins = 10) {
  if (baseline.length === 0 || current.length === 0) return 0;
  const min = 0, max = 1;
  const binSize = (max - min) / bins;

  const baseHist = Array(bins).fill(0);
  const currHist = Array(bins).fill(0);

  for (const v of baseline) {
    const b = Math.min(Math.floor((v - min) / binSize), bins - 1);
    baseHist[b]++;
  }
  for (const v of current) {
    const b = Math.min(Math.floor((v - min) / binSize), bins - 1);
    currHist[b]++;
  }

  let psi = 0;
  for (let i = 0; i < bins; i++) {
    const baseP = Math.max(baseHist[i] / baseline.length, 1e-6);
    const currP = Math.max(currHist[i] / current.length, 1e-6);
    psi += (currP - baseP) * Math.log(currP / baseP);
  }
  return Math.abs(psi);
}

export const driftDetector = {
  async detect(modelId = null) {
    const all = await inferenceMonitor.getRecent(modelId, 500);
    if (all.length < 20) return { detected: false, reason: "insufficient_data", samples: all.length };

    const half = Math.floor(all.length / 2);
    const baseline = all.slice(half).map((r) => r.confidence).filter((c) => c != null);
    const current  = all.slice(0, half).map((r) => r.confidence).filter((c) => c != null);

    const confidencePsi = computePsi(baseline, current);
    const confidenceDrift = classifyDrift(confidencePsi);

    const baseSuccessRate = baseline.filter((_, i) => all[half + i]?.success).length / baseline.length;
    const currSuccessRate  = current.filter((_, i)  => all[i]?.success).length  / current.length;
    const predDriftScore = Math.abs(baseSuccessRate - currSuccessRate);
    const predictionDrift = classifyDrift(predDriftScore * 2);

    const overallSeverity = [confidenceDrift, predictionDrift].includes("CRITICAL") ? "CRITICAL"
      : [confidenceDrift, predictionDrift].includes("HIGH") ? "HIGH"
      : [confidenceDrift, predictionDrift].includes("MEDIUM") ? "MEDIUM"
      : [confidenceDrift, predictionDrift].includes("LOW") ? "LOW" : "NONE";

    return {
      detected: overallSeverity !== "NONE",
      modelId: modelId || "all",
      samples: all.length,
      confidenceDrift: { psi: confidencePsi, severity: confidenceDrift },
      predictionDrift: { score: predDriftScore, severity: predictionDrift },
      overallSeverity,
      driftInfo: DRIFT_SEVERITY[overallSeverity],
      baselineWindow: `${baseline.length} recent samples (older half)`,
      currentWindow:  `${current.length} recent samples (newer half)`,
      detectedAt: new Date().toISOString(),
    };
  },
};
