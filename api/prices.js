/* AgriOS price proxy — optional serverless function for live mandi price feeds.
   Returns 503 until PRICE_FEED_URL + PRICE_FEED_KEY env vars are set in Vercel.

   To wire a real feed (e.g. Data.gov.in commodity API):
   1. Set PRICE_FEED_URL and PRICE_FEED_KEY in Vercel Environment Variables.
   2. Implement the normalize() function below for the feed's response shape.
   The browser-side priceProxy.js client will automatically start using live data. */

const RATE = { windowMs: 60_000, max: 30 };
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < RATE.windowMs);
  if (arr.length >= RATE.max) { hits.set(ip, arr); return true; }
  arr.push(now); hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return false;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (limited(ip)) return res.status(429).json({ error: "Too many requests" });

  const feedUrl = process.env.PRICE_FEED_URL;
  const feedKey = process.env.PRICE_FEED_KEY;
  if (!feedUrl || !feedKey) {
    return res.status(503).json({ unavailable: true, message: "Live price feed is not configured on the server." });
  }

  const { cropId, mandi } = req.body || {};
  if (!cropId) return res.status(400).json({ error: "cropId required" });

  try {
    const upstream = await fetch(`${feedUrl}?crop=${encodeURIComponent(cropId)}&mandi=${encodeURIComponent(mandi || "")}&api-key=${feedKey}`);
    if (!upstream.ok) return res.status(upstream.status).json({ unavailable: true });
    const data = await upstream.json();
    // TODO: implement normalize(data) for your feed's schema.
    return res.status(200).json({ ok: true, raw: data });
  } catch {
    return res.status(502).json({ unavailable: true, message: "Price feed request failed." });
  }
}
