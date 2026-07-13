/* OTP sender — generates a 6-digit code, signs it in a JWT (no DB needed),
   and sends it via Fast2SMS. Returns { token } to the client.
   If FAST2SMS_API_KEY is not set, skips SMS and returns { token, demo: true }
   so the app stays usable in dev/staging without credentials. */

import { createHmac, timingSafeEqual, randomInt } from "crypto";

/* ── JWT helpers (HS256, no external package) ────────────────────────────── */
function b64url(buf) {
  return (Buffer.isBuffer(buf) ? buf : Buffer.from(buf))
    .toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function signJwt(payload, secret) {
  const h   = b64url(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const b   = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = b64url(createHmac("sha256", secret).update(`${h}.${b}`).digest());
  return `${h}.${b}.${sig}`;
}

/* ── In-memory rate limit: max 5 OTPs per phone per 10 minutes ───────────── */
const WINDOW = 600_000;
const MAX    = 5;
const hits   = new Map();

function isLimited(phone) {
  const now  = Date.now();
  const prev = (hits.get(phone) || []).filter((t) => now - t < WINDOW);
  if (prev.length >= MAX) { hits.set(phone, prev); return true; }
  prev.push(now);
  hits.set(phone, prev);
  if (hits.size > 20_000) hits.clear();
  return false;
}

/* ── Handler ─────────────────────────────────────────────────────────────── */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const { phone } = req.body || {};
  if (typeof phone !== "string" || !/^\d{10}$/.test(phone)) {
    return res.status(400).json({ error: "Valid 10-digit phone number required" });
  }

  if (isLimited(phone)) {
    return res.status(429).json({ error: "Too many OTP requests — please wait 10 minutes" });
  }

  const secret = process.env.OTP_JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "Server misconfigured — OTP_JWT_SECRET not set" });
  }

  const otp   = String(randomInt(100_000, 1_000_000)); // 6-digit
  const exp   = Math.floor(Date.now() / 1000) + 600;   // 10 min
  const token = signJwt({ phone, otp, exp }, secret);

  const apiKey = process.env.FAST2SMS_API_KEY;

  /* ── Demo mode: no SMS key configured ───────────────────────────────────── */
  if (!apiKey) {
    return res.status(200).json({ token, demo: true });
  }

  /* ── Send SMS via Fast2SMS ───────────────────────────────────────────────── */
  try {
    const smsRes = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route:            "otp",
        variables_values: otp,
        numbers:          phone,
        flash:            0,
      }),
    });

    const smsJson = await smsRes.json().catch(() => ({}));

    if (!smsRes.ok || smsJson.return === false) {
      console.error("Fast2SMS error:", smsJson);
      return res.status(502).json({ error: "SMS delivery failed — try again" });
    }

    return res.status(200).json({ token });
  } catch (err) {
    console.error("Fast2SMS fetch failed:", err);
    return res.status(502).json({ error: "SMS service unreachable — try again" });
  }
}
