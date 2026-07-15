/* Auction platform — forward (sell to highest) & reverse (buy at lowest).
   Auction:
   { title, type:"forward"|"reverse", commodity, quantityKg, unit:"kg",
     basePrice, currentPrice, status, sellerName, endsAt,
     winnerBidId, winnerName, winnerPrice, demo }
   Bid: { auctionId, bidderName, price, at, valid } */

import { repo } from "./logisticsDb.js";

const auctions = repo("auctions");
const bids = repo("bids");
const num = (v) => Number(v) || 0;

export const auctionService = {
  getAll: () => auctions.getAll().then((l) =>
    l.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))),
  getById: (id) => auctions.getById(id),
  byStatus: (status) => auctions.getBy("status", status),

  create({ title, type = "forward", commodity, quantityKg, basePrice, sellerName, endsAt }) {
    return auctions.add({
      title, type, commodity,
      quantityKg: num(quantityKg), unit: "kg",
      basePrice: num(basePrice), currentPrice: num(basePrice),
      status: "live", sellerName,
      endsAt: endsAt || "",
      winnerBidId: null, winnerName: null, winnerPrice: null,
    });
  },

  bidsFor: (auctionId) => bids.getBy("auctionId", auctionId).then((l) =>
    l.sort((a, b) => (b.at || "").localeCompare(a.at || ""))),

  /* Validate against auction direction, then record + update current price. */
  async placeBid(auctionId, { bidderName, price }) {
    const a = await auctions.getById(auctionId);
    if (!a) throw new Error("Auction not found");
    if (a.status !== "live") throw new Error("Auction is not live");

    const p = num(price);
    if (a.type === "forward" && p <= num(a.currentPrice)) {
      throw new Error("Bid must be higher than the current price");
    }
    if (a.type === "reverse" && p >= num(a.currentPrice)) {
      throw new Error("Quote must be lower than the current price");
    }

    const bid = await bids.add({ auctionId, bidderName, price: p, at: new Date().toISOString(), valid: true });
    await auctions.update(auctionId, { currentPrice: p });
    return bid;
  },

  /* Close + pick winner: highest bid (forward) or lowest (reverse). */
  async close(auctionId) {
    const a = await auctions.getById(auctionId);
    if (!a) return null;
    const list = (await this.bidsFor(auctionId)).filter((b) => b.valid);
    if (!list.length) return auctions.update(auctionId, { status: "closed" });

    const winner = a.type === "forward"
      ? list.reduce((best, b) => (b.price > best.price ? b : best))
      : list.reduce((best, b) => (b.price < best.price ? b : best));

    return auctions.update(auctionId, {
      status: "awarded",
      winnerBidId: winner.id, winnerName: winner.bidderName, winnerPrice: winner.price,
    });
  },

  cancel: (id) => auctions.update(id, { status: "cancelled" }),

  async stats(auctionId) {
    const list = await this.bidsFor(auctionId);
    const prices = list.map((b) => num(b.price));
    return {
      bidCount: list.length,
      highest: prices.length ? Math.max(...prices) : 0,
      lowest: prices.length ? Math.min(...prices) : 0,
    };
  },
};
