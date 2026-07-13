/* Message and conversation factories + shapes shared across the engine.

   Message content follows the Anthropic content-block shape so messages can be
   sent to the API without transformation:
     text  → { type: "text", text }
     image → { type: "image", source: { type: "base64", media_type, data } }   */

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export function userMessage(text, imageBlocks = []) {
  const content = [...imageBlocks, { type: "text", text }];
  return { id: uid(), role: "user", content, ts: Date.now() };
}

export function assistantMessage(text, agentId, meta = {}) {
  return {
    id: uid(), role: "assistant",
    content: [{ type: "text", text }],
    agentId, ts: Date.now(), ...meta,
  };
}

/* Plain text of a stored message (first text block). */
export function textOf(msg) {
  if (!msg) return "";
  if (typeof msg.content === "string") return msg.content;
  const block = (msg.content || []).find((b) => b.type === "text");
  return block ? block.text : "";
}

/* Strip local-only fields for the API wire format. */
export function toWire(msg) {
  return { role: msg.role, content: msg.content };
}

export function newConversation(agentId = null) {
  return {
    id: uid(),
    title: "",
    agentId,          // pinned agent, or null = auto-route
    pinned: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  };
}
