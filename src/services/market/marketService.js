/* Market service — search, filter, bookmarks.
   Prices are curated MSP + seasonal bands, clearly labelled as such.
   Live mandi rates plug in via priceProxy when a feed is wired. */

import { storage } from "../../utils/storage.js";
import { CROPS, CROP_CATEGORIES, searchCrops, getCropsByCategory } from "./cropData.js";

const BOOKMARKS_KEY = "mkt:bookmarks";

export const marketService = {
  categories: CROP_CATEGORIES,
  allCrops: CROPS,

  search: searchCrops,
  byCategory: getCropsByCategory,

  /* Bookmarks */
  bookmarks() { return storage.get(BOOKMARKS_KEY, []); },
  isBookmarked(cropId) { return this.bookmarks().includes(cropId); },
  toggleBookmark(cropId) {
    const bm = this.bookmarks();
    const next = bm.includes(cropId) ? bm.filter((id) => id !== cropId) : [...bm, cropId];
    storage.set(BOOKMARKS_KEY, next);
    return next.includes(cropId);
  },
  bookmarkedCrops() {
    const bm = this.bookmarks();
    return CROPS.filter((c) => bm.includes(c.id));
  },
};
