/* Local AI analytics — ring buffer of engine events for debugging and, later,
   backend telemetry. Never stores message content, only metadata. */

import { storage } from "../../utils/storage.js";

const KEY = "ai:analytics";
const MAX_EVENTS = 200;

export const aiAnalytics = {
  log(event) {
    const events = storage.get(KEY, []);
    events.push({ ts: Date.now(), ...event });
    storage.set(KEY, events.slice(-MAX_EVENTS));
  },

  all() { return storage.get(KEY, []); },

  summary() {
    const events = this.all().filter((e) => e.type === "turn");
    const byAgent = {};
    let errors = 0, totalLatency = 0, inTok = 0, outTok = 0;
    for (const e of events) {
      byAgent[e.agentId] = (byAgent[e.agentId] || 0) + 1;
      if (!e.ok) errors++;
      totalLatency += e.latencyMs || 0;
      inTok += e.inputTokens || 0;
      outTok += e.outputTokens || 0;
    }
    return {
      turns: events.length, errors, byAgent,
      avgLatencyMs: events.length ? Math.round(totalLatency / events.length) : 0,
      inputTokens: inTok, outputTokens: outTok,
    };
  },

  clear() { storage.remove(KEY); },
};
