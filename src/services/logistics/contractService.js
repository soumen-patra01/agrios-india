/* Contract farming — digital agreements between a buyer and a farmer.
   Contract:
   { title, buyerName, farmerName, commodity, quantityKg, pricePerKg,
     qualityGrade, deliveryDate, paymentTerm, status,
     milestones:[{ label, due, done, doneAt }],
     inspection:{ status:"pending"|"passed"|"failed", note, at } | null,
     disputeNote, timeline:[{status, at}], demo } */

import { repo } from "./logisticsDb.js";

const contracts = repo("contracts");
const num = (v) => Number(v) || 0;

/* Standard milestone templates farmers/buyers can start from. */
export const CONTRACT_TEMPLATES = [
  {
    id: "seasonal",
    label: "Seasonal Supply",
    milestones: ["Agreement signed", "Sowing verified", "Mid-season inspection", "Harvest & grading", "Delivery", "Payment released"],
  },
  {
    id: "spot",
    label: "Spot Purchase",
    milestones: ["Agreement signed", "Quality inspection", "Delivery", "Payment released"],
  },
  {
    id: "advance",
    label: "Advance + Buyback",
    milestones: ["Agreement signed", "Advance disbursed", "Crop monitoring", "Harvest buyback", "Final settlement"],
  },
];

export const contractService = {
  getAll: () => contracts.getAll().then((l) =>
    l.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))),
  getById: (id) => contracts.getById(id),
  byStatus: (status) => contracts.getBy("status", status),

  create({ title, buyerName, farmerName, commodity, quantityKg, pricePerKg,
    qualityGrade, deliveryDate, paymentTerm = "milestone", templateId = "seasonal" }) {
    const tpl = CONTRACT_TEMPLATES.find((t) => t.id === templateId) || CONTRACT_TEMPLATES[0];
    const milestones = tpl.milestones.map((label) => ({ label, due: "", done: false, doneAt: null }));
    return contracts.add({
      title, buyerName, farmerName, commodity,
      quantityKg: num(quantityKg), pricePerKg: num(pricePerKg),
      value: num(quantityKg) * num(pricePerKg),
      qualityGrade, deliveryDate, paymentTerm,
      status: "offered",
      milestones,
      inspection: null, disputeNote: "",
      timeline: [{ status: "offered", at: new Date().toISOString() }],
    });
  },

  update: (id, patch) => contracts.update(id, patch),

  async setStatus(id, status) {
    const c = await contracts.getById(id);
    if (!c || c.status === status) return c;
    return contracts.update(id, {
      status,
      timeline: [...(c.timeline || []), { status, at: new Date().toISOString() }],
    });
  },

  accept: (id) => contractService.setStatus(id, "active"),

  async toggleMilestone(id, index) {
    const c = await contracts.getById(id);
    if (!c) return null;
    const milestones = c.milestones.map((m, i) =>
      i === index ? { ...m, done: !m.done, doneAt: !m.done ? new Date().toISOString() : null } : m);
    const patch = { milestones };
    // Auto-complete when every milestone is done.
    if (milestones.every((m) => m.done) && c.status === "active") {
      patch.status = "completed";
      patch.timeline = [...(c.timeline || []), { status: "completed", at: new Date().toISOString() }];
    }
    return contracts.update(id, patch);
  },

  recordInspection(id, status, note = "") {
    return contracts.update(id, { inspection: { status, note, at: new Date().toISOString() } });
  },

  async raiseDispute(id, note) {
    const c = await contracts.getById(id);
    if (!c) return null;
    return contracts.update(id, {
      status: "disputed", disputeNote: note,
      timeline: [...(c.timeline || []), { status: "disputed", at: new Date().toISOString() }],
    });
  },

  progress: (c) => {
    const ms = c.milestones || [];
    return ms.length ? Math.round((ms.filter((m) => m.done).length / ms.length) * 100) : 0;
  },
};
