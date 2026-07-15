/* Service catalog — listings offered by providers. Service:
   { providerId, providerName, category, title, description,
     pricingType, price, duration (minutes), requirements:[],
     deliverables:[], serviceArea, featured, status, demo } */

import { repo } from "./svcDb.js";

const services = repo("services");
const num = (v) => Number(v) || 0;

export const svcCatalogService = {
  add: (data) => services.add({
    ...data,
    price: num(data.price),
    duration: num(data.duration),
    requirements: data.requirements || [],
    deliverables: data.deliverables || [],
    status: data.status || "draft",
    featured: !!data.featured,
  }),
  update: (id, patch) => services.update(id, patch),
  remove: (id) => services.remove(id),
  getById: (id) => services.getById(id),
  getAll: () => services.getAll(),
  byProvider: (providerId) => services.getBy("providerId", providerId),
  published: () => services.getBy("status", "published"),

  setStatus: (id, status) => services.update(id, { status }),

  async featured() {
    const list = await this.published();
    return list.filter((s) => s.featured);
  },

  async byCategory(category) {
    const list = await this.published();
    return list.filter((s) => s.category === category);
  },

  async search({ q = "", category = "all" } = {}) {
    let list = await this.published();
    if (category !== "all") list = list.filter((s) => s.category === category);
    if (q) {
      const s = q.toLowerCase();
      list = list.filter((svc) =>
        `${svc.title} ${svc.description || ""} ${svc.providerName || ""}`.toLowerCase().includes(s));
    }
    return list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  },
};
