/* AI Router — decides which expert agent answers.

   Tier 1: keyword/trigger scoring against every agent (fast, offline, free).
   Tier 2: LLM classification with the router model when tier 1 is ambiguous.
   A conversation that already has an agent keeps it unless the topic clearly
   shifts (strong tier-1 hit on a different agent). */

import { listAgents, DEFAULT_AGENT_ID } from "../agents/registry.js";
import { llmClient } from "../services/llmClient.js";
import { MODELS } from "../config.js";

function tier1(text) {
  const q = text.toLowerCase();
  let best = { id: null, score: 0 };
  for (const agent of listAgents()) {
    let score = 0;
    for (const kw of agent.triggers) {
      if (q.includes(kw)) score += kw.includes(" ") ? 2 : 1; // phrases weigh more
    }
    if (score > best.score) best = { id: agent.id, score };
  }
  return best;
}

async function tier2(text, signal) {
  const ids = listAgents().map((a) => a.id).join(", ");
  const answer = await llmClient.complete({
    model: MODELS.router,
    maxTokens: 16,
    system:
      `You are an intent classifier for a farming app. Reply with exactly one id from this list, nothing else: ${ids}. ` +
      `Pick the expert best suited to answer the user's message. If none clearly fits, reply ${DEFAULT_AGENT_ID}.`,
    messages: [{ role: "user", content: text.slice(0, 500) }],
  }, { signal });
  const id = answer.replace(/[^a-zA-Z]/g, "");
  return listAgents().some((a) => a.id === id) ? id : DEFAULT_AGENT_ID;
}

/* Returns { agentId, method } — never throws (falls back to default agent). */
export async function routeIntent(text, { currentAgentId = null, signal } = {}) {
  const hit = tier1(text);

  // Sticky agent: keep the conversation's agent unless another expert clearly wins.
  if (currentAgentId) {
    if (hit.id && hit.id !== currentAgentId && hit.score >= 3) {
      return { agentId: hit.id, method: "keyword-switch" };
    }
    return { agentId: currentAgentId, method: "sticky" };
  }

  if (hit.id && hit.score >= 2) return { agentId: hit.id, method: "keyword" };

  try {
    return { agentId: await tier2(text, signal), method: "llm" };
  } catch {
    return { agentId: hit.id || DEFAULT_AGENT_ID, method: "fallback" };
  }
}
