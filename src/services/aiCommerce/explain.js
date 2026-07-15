/* Explainability core — every AI-commerce engine returns results through these
   helpers so predictions, scores and recommendations are auditable and
   human-review-ready. No black boxes: a result always carries the reasons and
   a confidence derived from how much evidence backed it. */

export const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const pct = (x) => Math.round(clamp01(x) * 100);

/* A single explanation factor. weight is the factor's share of the decision;
   value is its normalised strength (0..1). */
export const factor = (label, value, weight = 1) => ({ label, value: clamp01(value), weight });

/* Combine weighted factors → { score 0..100, reasons[] sorted by contribution }.
   Each reason exposes its contribution so a human can audit the ranking. */
export function weigh(factors = []) {
  const totalW = factors.reduce((s, f) => s + (f.weight || 0), 0) || 1;
  const score = factors.reduce((s, f) => s + f.value * f.weight, 0) / totalW;
  const reasons = factors
    .map((f) => ({
      label: f.label,
      contribution: Math.round((f.value * f.weight / totalW) * 100),
      value: f.value,
    }))
    .sort((a, b) => b.contribution - a.contribution);
  return { score: pct(score), reasons };
}

/* Confidence grows with evidence volume, saturating at `full` samples.
   Returns { value 0..1, label } so the UI can show "High / Medium / Low". */
export function confidenceFromN(n, full = 20) {
  const v = clamp01(n / full);
  const label = v >= 0.66 ? "High" : v >= 0.33 ? "Medium" : "Low";
  return { value: Math.round(v * 100) / 100, label, samples: n };
}

/* Standard explained-result envelope used across every engine. */
export function explained({ score = 0, confidence = null, reasons = [], meta = {} }) {
  return {
    score: Math.round(score),
    confidence: confidence || confidenceFromN(0),
    reasons,
    meta,
    generatedAt: new Date().toISOString(),
  };
}

/* Linear trend (slope + projection) over a numeric series — the shared basis
   for demand / price / supply forecasting. Returns slope per step and the
   projected next value. */
export function linearTrend(series = []) {
  const n = series.length;
  if (n < 2) return { slope: 0, next: series[n - 1] ?? 0, mean: series[0] ?? 0 };
  const xs = series.map((_, i) => i);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = series.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (series[i] - my); den += (xs[i] - mx) ** 2; }
  const slope = den ? num / den : 0;
  const next = my + slope * (n - mx);
  return { slope: Math.round(slope * 100) / 100, next: Math.max(0, Math.round(next * 100) / 100), mean: Math.round(my * 100) / 100 };
}

/* Coefficient of variation → used to discount confidence for noisy series. */
export function volatility(series = []) {
  const n = series.length;
  if (n < 2) return 0;
  const mean = series.reduce((a, b) => a + b, 0) / n;
  if (!mean) return 0;
  const variance = series.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  return Math.sqrt(variance) / Math.abs(mean);
}
