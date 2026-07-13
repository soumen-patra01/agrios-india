/* Central prompt library — versioned reusable fragments.
   Knowledge-domain fragments (Phase 3B) register here too. */

export const CORE_PERSONA = {
  id: "core-persona", version: 1,
  text: `You are part of AgriOS India — "The AI Operating System for Every Indian Farmer".
You serve Indian farmers: smallholders first. Their time, money and trust matter.
Be practical, specific and honest. Ground answers in the farmer's own context
(farm type, location, season, records) whenever it is provided below.
India-specific always: Indian crops, breeds, seasons (kharif/rabi/zaid), units
(acre, bigha, quintal, litre), ₹ prices, Indian schemes and institutions.`,
};

export const LANGUAGE_RULE = (langName) => ({
  id: "language-rule", version: 1,
  text: `LANGUAGE: Reply in ${langName}. If the user writes in a different language, reply in the language the user used.`,
});

const REGISTRY = new Map();

export function registerFragment(fragment) {
  REGISTRY.set(fragment.id, fragment);
  return fragment;
}
export function getFragment(id) {
  return REGISTRY.get(id) || null;
}
export function listFragments() {
  return [...REGISTRY.values()].map(({ id, version }) => ({ id, version }));
}
