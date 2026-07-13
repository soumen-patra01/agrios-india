/* Parses an Anthropic Messages SSE stream into content blocks.

   Emits text deltas via onText as they arrive and returns the fully
   accumulated message: { content, stopReason, usage }. Handles text blocks
   and tool_use blocks (accumulated from input_json_delta fragments). */

export async function parseStream(response, { onText, signal } = {}) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  const blocks = [];
  let stopReason = null;
  let usage = null;

  const handle = (data) => {
    let ev;
    try { ev = JSON.parse(data); } catch { return; }

    switch (ev.type) {
      case "content_block_start":
        blocks[ev.index] = ev.content_block.type === "tool_use"
          ? { type: "tool_use", id: ev.content_block.id, name: ev.content_block.name, _json: "" }
          : { type: "text", text: ev.content_block.text || "" };
        break;
      case "content_block_delta":
        if (ev.delta.type === "text_delta") {
          blocks[ev.index].text += ev.delta.text;
          onText?.(ev.delta.text);
        } else if (ev.delta.type === "input_json_delta") {
          blocks[ev.index]._json += ev.delta.partial_json;
        }
        break;
      case "content_block_stop": {
        const b = blocks[ev.index];
        if (b?.type === "tool_use") {
          try { b.input = b._json ? JSON.parse(b._json) : {}; } catch { b.input = {}; }
          delete b._json;
        }
        break;
      }
      case "message_delta":
        stopReason = ev.delta?.stop_reason ?? stopReason;
        usage = ev.usage ? { ...usage, ...ev.usage } : usage;
        break;
      case "message_start":
        usage = ev.message?.usage || usage;
        break;
      case "error":
        throw new Error(ev.error?.message || "stream error");
      default:
        break;
    }
  };

  for (;;) {
    if (signal?.aborted) { reader.cancel(); throw new DOMException("aborted", "AbortError"); }
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE messages are separated by a blank line.
    const parts = buffer.split("\n\n");
    buffer = parts.pop();
    for (const part of parts) {
      for (const line of part.split("\n")) {
        if (line.startsWith("data:")) handle(line.slice(5).trim());
      }
    }
  }

  // Thinking-capable models emit thinking blocks with empty text — drop them.
  const content = blocks.filter((b) => b && (b.type === "tool_use" || (b.type === "text" && b.text)));
  return { content, stopReason, usage };
}
