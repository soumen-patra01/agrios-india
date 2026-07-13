/* Schemes service — eligibility checks + bookmarks. */

import { storage } from "../../utils/storage.js";
import { SCHEMES, searchSchemes } from "./schemeData.js";
import { checkEligibility } from "./eligibilityEngine.js";
import { profileMemory } from "../../ai/memory/profileMemory.js";

const BOOKMARKS_KEY = "mkt:scheme-bookmarks";

export const schemesService = {
  all: SCHEMES,
  search: searchSchemes,

  /* Run eligibility engine against stored profile for all schemes. */
  findEligible() {
    const profile = profileMemory.get();
    return SCHEMES.map((scheme) => ({
      scheme,
      result: checkEligibility(profile, scheme),
    })).sort((a, b) => b.result.score - a.result.score);
  },

  checkOne(schemeId) {
    const scheme = SCHEMES.find((s) => s.id === schemeId);
    if (!scheme) return null;
    const profile = profileMemory.get();
    return { scheme, result: checkEligibility(profile, scheme) };
  },

  /* Bookmarks */
  bookmarks() { return storage.get(BOOKMARKS_KEY, []); },
  isBookmarked(schemeId) { return this.bookmarks().includes(schemeId); },
  toggleBookmark(schemeId) {
    const bm = this.bookmarks();
    const next = bm.includes(schemeId) ? bm.filter((id) => id !== schemeId) : [...bm, schemeId];
    storage.set(BOOKMARKS_KEY, next);
    return next.includes(schemeId);
  },
};
