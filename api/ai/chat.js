/* AgriOS AI Gateway — Vercel serverless function.

   The ONLY place the Anthropic API key lives. The browser never sees it.
   Validates the request, applies a basic rate limit, forwards to the
   Anthropic Messages API and streams the SSE response straight through.

   Setup: add ANTHROPIC_API_KEY in Vercel → Project → Settings → Environment Variables. */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ALLOWED_MODELS = new Set(["claude-opus-4-8", "claude-haiku-4-5"]);
const MAX_TOKENS_CAP = 4096;
const MAX_BODY_CHARS = 400_000;   // generous: history + one compressed image
const MAX_MESSAGES = 40;
const RATE = { windowMs: 60_000, max: 20 }; // per IP, per warm instance

/* Best-effort per-instance rate limiting (serverless instances are ephemeral;
   real per-user limits arrive with backend auth in a later phase). */
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
  if (req.method !== "POST") return res.status(405).json({ error: { message: "POST only" } });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: { message: "AI is not configured on the server (missing ANTHROPIC_API_KEY)." } });

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (limited(ip)) return res.status(429).json({ error: { message: "Too many requests. Please wait a minute." } });

  // ---- validate ----
  const body = req.body || {};
  const { model, system, messages, tools, max_tokens } = body;
  if (!ALLOWED_MODELS.has(model)) return res.status(400).json({ error: { message: "model not allowed" } });
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return res.status(400).json({ error: { message: "invalid messages" } });
  }
  if (JSON.stringify(body).length > MAX_BODY_CHARS) {
    return res.status(413).json({ error: { message: "request too large" } });
  }

  const upstream = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      system: typeof system === "string" ? system.slice(0, 20_000) : undefined,
      messages,
      ...(Array.isArray(tools) && tools.length ? { tools } : {}),
      max_tokens: Math.min(Number(max_tokens) || 1024, MAX_TOKENS_CAP),
      stream: true,
    }),
  });

  if (!upstream.ok) {
    let detail = { message: `upstream error (${upstream.status})` };
    try { detail = (await upstream.json()).error || detail; } catch { /* opaque */ }
    return res.status(upstream.status).json({ error: { message: detail.message } });
  }

  // ---- stream SSE through ----
  res.writeHead(200, {
    "content-type": "text/event-stream",
    "cache-control": "no-cache, no-transform",
    connection: "keep-alive",
  });

  const reader = upstream.body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
  } catch {
    /* client disconnected or upstream dropped — nothing useful to do */
  } finally {
    res.end();
  }
}
