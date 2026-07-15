/* AI search — natural-language / keyword ranking over the catalogue with a
   lightweight synonym map (a stand-in for semantic embeddings, which are
   deferred to the backend/vector phase). Results are ranked and explainable:
   each hit reports which terms matched where. Voice search reuses ai/voice;
   image search is a declared-but-deferred capability. */

import { featureStore } from "./featureStore.js";
import { confidenceFromN } from "./explain.js";

/* Domain synonyms so a farmer's words map onto catalogue terms. */
const SYNONYMS = {
  urea: ["fertilizer", "nitrogen", "n"],
  dap: ["fertilizer", "phosphate"],
  seed: ["seeds", "beej", "bij"],
  medicine: ["medicine", "dawa", "cure", "treatment"],
  spray: ["pesticide", "insecticide", "fungicide"],
  feed: ["feed", "chara", "fodder"],
  organic: ["organic", "bio", "bioinput", "compost"],
  tractor: ["equipment", "machinery"],
  pump: ["equipment", "irrigation", "motor"],
};

const norm = (s) => String(s || "").toLowerCase().trim();
const tokens = (s) => norm(s).split(/\s+/).filter(Boolean);

function expand(qTokens) {
  const set = new Set(qTokens);
  qTokens.forEach((t) => (SYNONYMS[t] || []).forEach((syn) => set.add(syn)));
  return [...set];
}

export const aiSearch = {
  /* Rank published products against a natural-language query. */
  async search(query, { limit = 20 } = {}) {
    const snap = await featureStore.snapshot();
    const qTokens = tokens(query);
    if (!qTokens.length) return { query, hits: [], confidence: confidenceFromN(0) };
    const terms = expand(qTokens);

    const hits = snap.products
      .filter((p) => p.status === "published")
      .map((p) => {
        const name = norm(p.name), brand = norm(p.brand), cat = norm(p.category), desc = norm(p.description);
        const matched = [];
        let score = 0;
        terms.forEach((t) => {
          if (name.includes(t)) { score += 5; matched.push({ term: t, field: "name" }); }
          else if (brand.includes(t)) { score += 3; matched.push({ term: t, field: "brand" }); }
          else if (cat.includes(t)) { score += 3; matched.push({ term: t, field: "category" }); }
          else if (desc.includes(t)) { score += 1; matched.push({ term: t, field: "description" }); }
        });
        // small popularity + rating boost to break ties
        score += Math.min(2, p.soldQty / 10) + (p.rating || 0) * 0.2;
        return { product: p, score: Math.round(score * 10) / 10, matched };
      })
      .filter((h) => h.matched.length > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return { query, expandedTerms: terms, hits, confidence: confidenceFromN(hits.length, 8) };
  },

  /* Voice search hook — the caller records via ai/voice and passes the text. */
  async voice(transcript, opts) { return this.search(transcript, opts); },

  /* Image search — declared capability, not connected (no on-device embeddings). */
  image() {
    return { unavailable: true, message: "Image search is planned for the backend/vector phase — use text or voice search for now." };
  },
};
