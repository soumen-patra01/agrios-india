/* Claude Vision inference provider — calls /api/ai/chat with an image block.
   This is the default cloud provider; works immediately with no model download. */

import { CAPABILITIES } from "./inferenceInterface.js";
import { API_ENDPOINT, MODELS } from "../../../ai/config.js";
import { authFetch } from "../../firebase/authFetch.js";

export const claudeVisionProvider = {
  id:   "claude-vision",
  name: "Claude Vision (Cloud)",

  isAvailable() {
    return navigator.onLine;
  },

  getCapabilities() {
    return Object.values(CAPABILITIES);
  },

  async infer(imageBase64, metadata = {}, context = {}) {
    const t0 = Date.now();

    const system = buildSystem(context);
    const messages = [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
          { type: "text",  text: context.userPrompt || defaultPrompt(context) },
        ],
      },
    ];

    const res = await authFetch(API_ENDPOINT, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ model: MODELS.answer, max_tokens: 1024, system, messages }),
    });

    if (!res.ok) {
      let msg = `Vision API error (${res.status})`;
      try { msg = (await res.json()).error?.message || msg; } catch { /* ignore */ }
      throw new Error(msg);
    }

    const text = await consumeSse(res);

    return {
      provider:    this.id,
      raw:         text,
      inferenceMs: Date.now() - t0,
      modelId:     MODELS.answer,
      metadata,
    };
  },
};

function defaultPrompt(ctx) {
  const parts = ["Analyze this farm image."];
  if (ctx.cropType) parts.push(`Crop: ${ctx.cropType}.`);
  parts.push("Identify any diseases, pests, weeds, or soil problems. State: (1) what you see, (2) diagnosis, (3) confidence level (High/Medium/Low), (4) recommended action.");
  return parts.join(" ");
}

function buildSystem(ctx) {
  const lines = [
    "You are an expert agronomist and plant pathologist specializing in Indian crops.",
    "Analyze farm images and give specific, actionable diagnoses.",
    "Always include: what you observe, likely diagnosis, confidence (High/Medium/Low), and recommended action.",
    "If the image is unclear or insufficient, say so explicitly.",
  ];
  if (ctx.cropType) lines.push(`Current crop: ${ctx.cropType}.`);
  if (ctx.location)  lines.push(`Location: ${ctx.location}.`);
  if (ctx.season)    lines.push(`Season: ${ctx.season}.`);
  return lines.join("\n");
}

// Consume an SSE stream from /api/ai/chat and return the assembled text.
async function consumeSse(res) {
  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let buf  = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop(); // keep incomplete last line
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const ev = JSON.parse(line.slice(6));
        if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") {
          text += ev.delta.text;
        }
      } catch { /* malformed chunk — skip */ }
    }
  }

  return text;
}
