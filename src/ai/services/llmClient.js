/* Provider abstraction over the LLM transport.

   Production: POST /api/ai/chat (Vercel serverless holds the API key).
   Dev:        if a dev key is set (see config.getDevKey), call the Anthropic
               API directly from the browser — dev convenience only.

   Additional providers (OpenAI, Gemini, Ollama) implement the same
   `streamChat(request, handlers)` contract and register here. */

import { API_ENDPOINT, getDevKey } from "../config.js";
import { parseStream } from "./streamParser.js";
import { authFetch } from "../../services/firebase/authFetch.js";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

async function anthropicFetch({ model, system, messages, tools, maxTokens }, signal) {
  const body = {
    model,
    max_tokens: maxTokens,
    stream: true,
    system,
    messages,
    ...(tools?.length ? { tools } : {}),
  };

  const devKey = getDevKey();
  const url = devKey ? ANTHROPIC_URL : API_ENDPOINT;
  const headers = devKey
    ? {
        "content-type": "application/json",
        "x-api-key": devKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      }
    : { "content-type": "application/json" };

  const fetcher = devKey ? fetch : authFetch;
  const res = await fetcher(url, { method: "POST", headers, body: JSON.stringify(body), signal });
  if (!res.ok) {
    let detail = "";
    try { detail = (await res.json())?.error?.message || ""; } catch { /* opaque */ }
    const err = new Error(detail || `AI request failed (HTTP ${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res;
}

export const llmClient = {
  /* Streams a chat completion. Returns { content, stopReason, usage }. */
  async streamChat(request, { onText, signal } = {}) {
    const res = await anthropicFetch(request, signal);
    return parseStream(res, { onText, signal });
  },

  /* One-shot, non-streamed short completion (used by the router). */
  async complete(request, { signal } = {}) {
    const { content } = await this.streamChat(request, { signal });
    const text = content.find((b) => b.type === "text");
    return text ? text.text.trim() : "";
  },
};
