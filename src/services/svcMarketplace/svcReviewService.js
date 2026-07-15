/* Service reviews — provider & service ratings.
   Review: { serviceId, providerId, rating (1-5), text, author, verified, demo } */

import { repo } from "./svcDb.js";
import { bookingService } from "./bookingService.js";

const reviews = repo("svcReviews");

const stats = (list) => {
  if (!list.length) return { avg: 0, count: 0 };
  return {
    avg: Math.round((list.reduce((s, r) => s + (Number(r.rating) || 0), 0) / list.length) * 10) / 10,
    count: list.length,
  };
};

export const svcReviewService = {
  async add({ serviceId, providerId, rating, text = "", author = "You" }) {
    const all = await bookingService.getAll();
    const verified = all.some((b) => b.status === "completed" &&
      b.serviceId === serviceId);
    return reviews.add({ serviceId, providerId, rating: Number(rating), text, author, verified });
  },

  forService: (serviceId) => reviews.getBy("serviceId", serviceId).then((l) =>
    l.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))),
  forProvider: (providerId) => reviews.getBy("providerId", providerId).then((l) =>
    l.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))),

  serviceStats: (serviceId) => reviews.getBy("serviceId", serviceId).then(stats),
  providerStats: (providerId) => reviews.getBy("providerId", providerId).then(stats),
};
