/* Dynamic prompt builder — composes the system prompt for a turn:
   safety → core persona → agent persona → knowledge (3B) → context → language → output rules.
   Order is stable so the prefix stays cacheable. */

import { SAFETY_PREAMBLE, OUTPUT_RULES } from "./safety.js";
import { CORE_PERSONA, LANGUAGE_RULE, getFragment } from "./library.js";

const LANG_NAMES = {
  en: "English", hi: "Hindi", bn: "Bengali", ta: "Tamil", te: "Telugu",
  mr: "Marathi", pa: "Punjabi", or: "Odia", gu: "Gujarati", kn: "Kannada",
  ml: "Malayalam", as: "Assamese",
};

export function buildSystemPrompt({ agent, contextBlock, lang = "en" }) {
  const parts = [
    SAFETY_PREAMBLE.text,
    CORE_PERSONA.text,
    `YOUR ROLE:\n${agent.persona}`,
  ];

  // Knowledge modules (Phase 3B) referenced by the agent, if registered.
  for (const kid of agent.knowledge || []) {
    const frag = getFragment(kid);
    if (frag) parts.push(frag.text);
  }

  if (contextBlock) parts.push(`FARMER CONTEXT (use it; do not ask again for what is already here):\n${contextBlock}`);
  parts.push(LANGUAGE_RULE(LANG_NAMES[lang] || "English").text);
  parts.push(OUTPUT_RULES.text);

  return parts.join("\n\n");
}
