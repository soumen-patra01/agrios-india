/* OTP verifier — checks the signed JWT token and the user-entered code.
   No database needed: the OTP and expiry live inside the signed token itself. */

import { createHmac, timingSafeEqual } from "crypto";

/* ── JWT verify (HS256) ──────────────────────────────────────────────────── */
function fromB64url(s) {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function b64url(buf) {
  return buf.toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function verifyJwt(token, secret) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [h, b, s] = parts;

    const expected = b64url(createHmac("sha256", secret).update(`${h}.${b}`).digest());
    const sBuf = Buffer.from(s);
    const eBuf = Buffer.from(expected);
    if (sBuf.length !== eBuf.length || !timingSafeEqual(sBuf, eBuf)) return null;

    const payload = JSON.parse(fromB64url(b).toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/* ── Handler ─────────────────────────────────────────────────────────────── */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const { token, code } = req.body || {};
  if (!token || !code) {
    return res.status(400).json({ error: "token and code are required" });
  }

  const secret = process.env.OTP_JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "Server misconfigured — OTP_JWT_SECRET not set" });
  }

  const payload = verifyJwt(token, secret);
  if (!payload) {
    return res.status(401).json({ error: "OTP expired — please request a new code" });
  }

  if (String(code).trim() !== String(payload.otp)) {
    return res.status(401).json({ error: "Incorrect OTP — please try again" });
  }

  return res.status(200).json({ ok: true, phone: payload.phone });
}
