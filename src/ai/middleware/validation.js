/* Input validation, sensitive-data detection and client-side rate limiting.
   The serverless gateway re-validates independently — never trust one layer. */

import { LIMITS } from "../config.js";

const AADHAAR = /\b\d{4}\s?\d{4}\s?\d{4}\b/;
const OTP_LIKE = /\b(otp|one time password)\b.*\b\d{4,8}\b/i;

export function validateInput(text) {
  const trimmed = (text || "").trim();
  if (!trimmed) return { ok: false, reason: "empty" };
  if (trimmed.length > LIMITS.maxInputChars) return { ok: false, reason: "too-long" };
  return { ok: true, text: trimmed };
}

/* Warn (don't block) when a message contains sensitive identifiers. */
export function detectSensitive(text) {
  if (AADHAAR.test(text)) return { sensitive: true, kind: "aadhaar" };
  if (OTP_LIKE.test(text)) return { sensitive: true, kind: "otp" };
  return { sensitive: false };
}

/* Sliding-window rate limiter. */
const stamps = [];
export function rateLimit() {
  const now = Date.now();
  while (stamps.length && now - stamps[0] > 60_000) stamps.shift();
  if (stamps.length >= LIMITS.requestsPerMinute) {
    return { ok: false, retryInSec: Math.ceil((60_000 - (now - stamps[0])) / 1000) };
  }
  stamps.push(now);
  return { ok: true };
}
