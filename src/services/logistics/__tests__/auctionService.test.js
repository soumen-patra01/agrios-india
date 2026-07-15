import { describe, it, expect } from "vitest";
import { auctionService } from "../auctionService.js";

describe("auctionService", () => {
  it("forward auction accepts only higher bids and awards the highest", async () => {
    const a = await auctionService.create({ title: "Mustard", type: "forward", commodity: "Mustard", quantityKg: 1000, basePrice: 50, sellerName: "S" });
    await auctionService.placeBid(a.id, { bidderName: "A", price: 52 });
    await auctionService.placeBid(a.id, { bidderName: "B", price: 55 });
    await expect(auctionService.placeBid(a.id, { bidderName: "C", price: 54 }))
      .rejects.toThrow("higher than the current price");

    const closed = await auctionService.close(a.id);
    expect(closed.status).toBe("awarded");
    expect(closed.winnerName).toBe("B");
    expect(closed.winnerPrice).toBe(55);
  });

  it("reverse auction accepts only lower quotes and awards the lowest", async () => {
    const a = await auctionService.create({ title: "Haul", type: "reverse", commodity: "Haulage", quantityKg: 0, basePrice: 16000, sellerName: "Buyer" });
    await auctionService.placeBid(a.id, { bidderName: "X", price: 15000 });
    await auctionService.placeBid(a.id, { bidderName: "Y", price: 14000 });
    await expect(auctionService.placeBid(a.id, { bidderName: "Z", price: 14500 }))
      .rejects.toThrow("lower than the current price");

    const closed = await auctionService.close(a.id);
    expect(closed.winnerName).toBe("Y");
    expect(closed.winnerPrice).toBe(14000);
  });

  it("rejects bids on a non-live auction", async () => {
    const a = await auctionService.create({ title: "T", type: "forward", commodity: "Onion", quantityKg: 100, basePrice: 10, sellerName: "S" });
    await auctionService.cancel(a.id);
    await expect(auctionService.placeBid(a.id, { bidderName: "A", price: 20 })).rejects.toThrow("not live");
  });

  it("stats report bid count and extremes", async () => {
    const a = await auctionService.create({ title: "T", type: "forward", commodity: "Onion", quantityKg: 100, basePrice: 10, sellerName: "S" });
    await auctionService.placeBid(a.id, { bidderName: "A", price: 12 });
    await auctionService.placeBid(a.id, { bidderName: "B", price: 18 });
    const stats = await auctionService.stats(a.id);
    expect(stats.bidCount).toBe(2);
    expect(stats.highest).toBe(18);
    expect(stats.lowest).toBe(12);
  });
});
