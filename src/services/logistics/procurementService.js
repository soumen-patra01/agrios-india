/* Procurement platform — tenders & purchase orders from government, FPO,
   cooperative or private buyers. Procurement:
   { title, type, buyerName, commodity, quantityKg, targetPrice,
     status:"open"|"reviewing"|"awarded"|"closed", closeDate,
     quotations:[{ id, supplierName, price, note, at }],
     awardedTo, poNumber, demo } */

import { repo, uid } from "./logisticsDb.js";

const procurements = repo("procurements");
const num = (v) => Number(v) || 0;

export const procurementService = {
  getAll: () => procurements.getAll().then((l) =>
    l.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))),
  getById: (id) => procurements.getById(id),
  byType: (type) => procurements.getBy("type", type),
  byStatus: (status) => procurements.getBy("status", status),

  create({ title, type = "government", buyerName, commodity, quantityKg, targetPrice, closeDate }) {
    return procurements.add({
      title, type, buyerName, commodity,
      quantityKg: num(quantityKg), targetPrice: num(targetPrice),
      status: "open", closeDate: closeDate || "",
      quotations: [], awardedTo: null, poNumber: null,
    });
  },

  update: (id, patch) => procurements.update(id, patch),

  async addQuotation(id, { supplierName, price, note = "" }) {
    const p = await procurements.getById(id);
    if (!p) return null;
    const quote = { id: uid(), supplierName, price: num(price), note, at: new Date().toISOString() };
    return procurements.update(id, {
      quotations: [...(p.quotations || []), quote],
      status: p.status === "open" ? "reviewing" : p.status,
    });
  },

  /* Rank quotations cheapest-first for the supplier-comparison view. */
  async compare(id) {
    const p = await procurements.getById(id);
    if (!p) return [];
    return [...(p.quotations || [])].sort((a, b) => num(a.price) - num(b.price));
  },

  async award(id, quotationId) {
    const p = await procurements.getById(id);
    if (!p) return null;
    const q = (p.quotations || []).find((x) => x.id === quotationId);
    if (!q) return null;
    return procurements.update(id, {
      status: "awarded",
      awardedTo: q.supplierName,
      awardedPrice: q.price,
      poNumber: "PO-" + Date.now().toString(36).slice(-6).toUpperCase(),
    });
  },

  close: (id) => procurements.update(id, { status: "closed" }),
};
