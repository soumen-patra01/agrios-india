/* Long-term farmer/farm memory — durable facts the AI should always know.
   Local-first now; syncs to the backend profile in a later phase. */

import { storage } from "../../utils/storage.js";

const KEY = "ai:farmProfile";
const MAX_FACTS = 30;

const empty = () => ({
  farmType: [],     // e.g. ["paddy", "poultry"]
  location: "",     // district / state
  landSize: "",     // e.g. "3 acre"
  crops: [],
  livestock: [],
  facts: [],        // free-form remembered facts: { text, ts }
});

export const profileMemory = {
  get() { return { ...empty(), ...storage.get(KEY, {}) }; },

  update(patch) {
    const next = { ...this.get(), ...patch };
    storage.set(KEY, next);
    return next;
  },

  remember(text) {
    const p = this.get();
    p.facts = [{ text: String(text).slice(0, 200), ts: Date.now() }, ...p.facts].slice(0, MAX_FACTS);
    storage.set(KEY, p);
  },

  clear() { storage.remove(KEY); },

  /* Compact block for the system prompt; empty string when nothing is known. */
  toPromptBlock() {
    const p = this.get();
    const lines = [];
    if (p.location) lines.push(`Location: ${p.location}`);
    if (p.landSize) lines.push(`Land: ${p.landSize}`);
    if (p.farmType.length) lines.push(`Farm type: ${p.farmType.join(", ")}`);
    if (p.crops.length) lines.push(`Crops: ${p.crops.join(", ")}`);
    if (p.livestock.length) lines.push(`Livestock: ${p.livestock.join(", ")}`);
    for (const f of p.facts.slice(0, 8)) lines.push(`Note: ${f.text}`);
    return lines.join("\n");
  },
};
