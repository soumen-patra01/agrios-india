import { describe, it, expect } from "vitest";
import { procurementService } from "../procurementService.js";

describe("procurementService", () => {
  it("creates an open tender and moves to reviewing on first quotation", async () => {
    const p = await procurementService.create({ title: "Paddy MSP", type: "government", buyerName: "FCI", commodity: "Paddy", quantityKg: 10000, targetPrice: 23 });
    expect(p.status).toBe("open");
    const after = await procurementService.addQuotation(p.id, { supplierName: "FPO A", price: 22 });
    expect(after.status).toBe("reviewing");
    expect(after.quotations).toHaveLength(1);
  });

  it("compare ranks quotations cheapest first", async () => {
    const p = await procurementService.create({ title: "Wheat", type: "fpo", buyerName: "B", commodity: "Wheat", quantityKg: 5000, targetPrice: 25 });
    await procurementService.addQuotation(p.id, { supplierName: "High", price: 26 });
    await procurementService.addQuotation(p.id, { supplierName: "Low", price: 24 });
    const ranked = await procurementService.compare(p.id);
    expect(ranked[0].supplierName).toBe("Low");
  });

  it("awards a quotation and generates a PO number", async () => {
    const p = await procurementService.create({ title: "Potato", type: "private", buyerName: "B", commodity: "Potato", quantityKg: 3000, targetPrice: 15 });
    const withQuote = await procurementService.addQuotation(p.id, { supplierName: "Supplier X", price: 14 });
    const quotationId = withQuote.quotations[0].id;
    const awarded = await procurementService.award(p.id, quotationId);
    expect(awarded.status).toBe("awarded");
    expect(awarded.awardedTo).toBe("Supplier X");
    expect(awarded.poNumber).toMatch(/^PO-/);
  });
});
