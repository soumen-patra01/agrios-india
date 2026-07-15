import { describe, it, expect } from "vitest";
import { factor, weigh, confidenceFromN, linearTrend, clamp01, volatility } from "../explain.js";

describe("explain", () => {
  it("clamp01 bounds values to [0,1]", () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(0.5)).toBe(0.5);
  });

  it("weigh produces a 0-100 score and reasons sorted by contribution", () => {
    const { score, reasons } = weigh([
      factor("strong", 1, 3),
      factor("weak", 0.2, 1),
    ]);
    expect(score).toBeGreaterThan(50);
    expect(score).toBeLessThanOrEqual(100);
    expect(reasons[0].label).toBe("strong");
    expect(reasons[0].contribution).toBeGreaterThanOrEqual(reasons[1].contribution);
  });

  it("confidence grows with sample size and labels bands", () => {
    expect(confidenceFromN(0).label).toBe("Low");
    expect(confidenceFromN(20, 20).label).toBe("High");
    expect(confidenceFromN(10, 20).value).toBeCloseTo(0.5, 1);
  });

  it("linearTrend detects an upward slope and projects the next value", () => {
    const t = linearTrend([10, 12, 14, 16]);
    expect(t.slope).toBeGreaterThan(0);
    expect(t.next).toBeGreaterThan(16);
  });

  it("volatility is zero for a flat series and positive for a noisy one", () => {
    expect(volatility([5, 5, 5])).toBe(0);
    expect(volatility([1, 9, 2, 8])).toBeGreaterThan(0);
  });
});
