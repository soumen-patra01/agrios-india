/* Agent contract. Every agent is an isolated definition:
   its own persona (prompt), tool whitelist, routing triggers, knowledge
   module references (Phase 3B), suggested questions, and output validation.

   defineAgent() normalizes and freezes a definition so agents stay
   side-effect-free and safely shareable. */

const REQUIRED = ["id", "name", "persona"];

export function defineAgent(def) {
  for (const k of REQUIRED) {
    if (!def[k]) throw new Error(`Agent missing required field "${k}"`);
  }
  return Object.freeze({
    icon: "Sparkles",
    accent: "primary",
    tagline: "",
    tools: [],          // tool names from ai/tools/toolRegistry
    knowledge: [],      // prompt-library fragment ids (Phase 3B)
    triggers: [],       // lowercase keywords/phrases for tier-1 routing
    suggested: [],      // starter questions shown on an empty chat
    validate: null,     // optional (text) => { ok, reason }
    ...def,
  });
}
