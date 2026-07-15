/* Export readiness — order + document checklist + compliance. No real customs,
   port or blockchain integration (deferred). ExportOrder:
   { buyerName, destinationCountry, commodity, quantityKg, value, currency,
     status, containerNo, portOfLoading, docs:{ [name]: boolean }, demo } */

import { repo } from "./logisticsDb.js";
import { EXPORT_DOCS } from "./constantsLog.js";

const orders = repo("exportOrders");
const num = (v) => Number(v) || 0;

const emptyDocs = () => Object.fromEntries(EXPORT_DOCS.map((d) => [d, false]));

export const exportService = {
  DOCS: EXPORT_DOCS,

  getAll: () => orders.getAll().then((l) =>
    l.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))),
  getById: (id) => orders.getById(id),
  byStatus: (status) => orders.getBy("status", status),

  create({ buyerName, destinationCountry, commodity, quantityKg, value, currency = "USD", portOfLoading = "Kolkata" }) {
    return orders.add({
      buyerName, destinationCountry, commodity,
      quantityKg: num(quantityKg), value: num(value), currency,
      status: "preparing", containerNo: "", portOfLoading,
      docs: emptyDocs(),
    });
  },

  update: (id, patch) => orders.update(id, patch),

  async toggleDoc(id, name) {
    const o = await orders.getById(id);
    if (!o) return null;
    const docs = { ...o.docs, [name]: !o.docs[name] };
    const patch = { docs };
    // Auto-advance preparing → documented once every doc is checked.
    if (Object.values(docs).every(Boolean) && o.status === "preparing") {
      patch.status = "documented";
    }
    return orders.update(id, patch);
  },

  async setStatus(id, status) {
    return orders.update(id, { status });
  },

  compliance(o) {
    const docs = o.docs || {};
    const total = Object.keys(docs).length;
    const done = Object.values(docs).filter(Boolean).length;
    return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
  },
};
