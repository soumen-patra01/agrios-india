/* Memory engine — what the model sees each turn.
   Short-term: a sliding window over the conversation, size-capped.
   Long-term: durable profile facts (see profileMemory), injected via context. */

import { LIMITS } from "../config.js";
import { toWire, textOf } from "../models/message.js";

const MAX_MSG_CHARS = 3000; // trim pathological long turns inside the window

export const memoryEngine = {
  /* Wire-format history window for the API call (excludes the new message). */
  window(convo) {
    const recent = convo.messages.slice(-LIMITS.historyWindow);
    return recent.map((m) => {
      const wire = toWire(m);
      const text = textOf(m);
      if (text.length > MAX_MSG_CHARS) {
        wire.content = [{ type: "text", text: text.slice(0, MAX_MSG_CHARS) + " …" }];
      }
      // Drop stored image data from older turns to keep requests small.
      else if (Array.isArray(wire.content) && convo.messages.indexOf(m) < convo.messages.length - 2) {
        const textOnly = wire.content.filter((b) => b.type === "text");
        if (textOnly.length) wire.content = textOnly;
      }
      return wire;
    });
  },

  /* One-line summary of prior advice for the context block. */
  recentAdviceSummary(convo) {
    const lastAssistant = [...convo.messages].reverse().find((m) => m.role === "assistant");
    if (!lastAssistant) return "";
    return textOf(lastAssistant).slice(0, 180);
  },
};
