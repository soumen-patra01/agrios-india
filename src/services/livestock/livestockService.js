/* Livestock management service — CRUD for animals, production records, events.
   All data persisted in IndexedDB via livestockDb.js */

import { openDb, uid } from "./livestockDb.js";

export const ENTERPRISES = [
  { id: "poultry", label: "Poultry",    icon: "Bird",      accent: "orange" },
  { id: "dairy",   label: "Dairy",      icon: "Milk",      accent: "blue"   },
  { id: "goat",    label: "Goat",       icon: "Rabbit",    accent: "primary"},
  { id: "pig",     label: "Pig",        icon: "PiggyBank", accent: "red"    },
  { id: "sheep",   label: "Sheep",      icon: "Beef",      accent: "blue"   },
  { id: "fish",    label: "Fish",       icon: "Fish",      accent: "blue"   },
  { id: "bee",     label: "Beekeeping", icon: "Bug",       accent: "yellow" },
];
/* Duck and Rabbit are planned — add a row here + a HerdManager config to enable. */

/* ── ANIMALS ──────────────────────────────────────────────────────────────── */

export const animalService = {
  async add(data) {
    const db = await openDb();
    const record = { ...data, id: uid(), createdAt: new Date().toISOString() };
    return new Promise((res, rej) => {
      const req = db.transaction("animals", "readwrite").objectStore("animals").add(record);
      req.onsuccess = () => res(record);
      req.onerror   = () => rej(req.error);
    });
  },

  async getAll(enterprise) {
    const db = await openDb();
    return new Promise((res, rej) => {
      const store = db.transaction("animals", "readonly").objectStore("animals");
      const req = enterprise
        ? store.index("enterprise").getAll(enterprise)
        : store.getAll();
      req.onsuccess = () => res(req.result || []);
      req.onerror   = () => rej(req.error);
    });
  },

  async getById(id) {
    const db = await openDb();
    return new Promise((res, rej) => {
      const req = db.transaction("animals", "readonly").objectStore("animals").get(id);
      req.onsuccess = () => res(req.result || null);
      req.onerror   = () => rej(req.error);
    });
  },

  async update(id, patch) {
    const db = await openDb();
    const store = db.transaction("animals", "readwrite").objectStore("animals");
    return new Promise((res, rej) => {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const updated = { ...getReq.result, ...patch, updatedAt: new Date().toISOString() };
        const putReq = store.put(updated);
        putReq.onsuccess = () => res(updated);
        putReq.onerror   = () => rej(putReq.error);
      };
      getReq.onerror = () => rej(getReq.error);
    });
  },

  async remove(id) {
    const db = await openDb();
    return new Promise((res, rej) => {
      const req = db.transaction("animals", "readwrite").objectStore("animals").delete(id);
      req.onsuccess = () => res();
      req.onerror   = () => rej(req.error);
    });
  },

  async count(enterprise) {
    const list = await this.getAll(enterprise);
    return list.length;
  },
};

/* ── PRODUCTION RECORDS ───────────────────────────────────────────────────── */

export const productionService = {
  async add(data) {
    const db = await openDb();
    const record = { ...data, id: uid(), createdAt: new Date().toISOString() };
    return new Promise((res, rej) => {
      const req = db.transaction("productions", "readwrite").objectStore("productions").add(record);
      req.onsuccess = () => res(record);
      req.onerror   = () => rej(req.error);
    });
  },

  async getForEnterprise(enterprise, limit = 90) {
    const db = await openDb();
    return new Promise((res, rej) => {
      const req = db.transaction("productions", "readonly")
        .objectStore("productions").index("enterprise").getAll(enterprise);
      req.onsuccess = () => {
        const sorted = (req.result || []).sort((a, b) => b.date.localeCompare(a.date));
        res(sorted.slice(0, limit));
      };
      req.onerror = () => rej(req.error);
    });
  },

  async getForAnimal(animalId) {
    const db = await openDb();
    return new Promise((res, rej) => {
      const req = db.transaction("productions", "readonly")
        .objectStore("productions").index("animalId").getAll(animalId);
      req.onsuccess = () => res((req.result || []).sort((a, b) => b.date.localeCompare(a.date)));
      req.onerror   = () => rej(req.error);
    });
  },

  async remove(id) {
    const db = await openDb();
    return new Promise((res, rej) => {
      const req = db.transaction("productions", "readwrite").objectStore("productions").delete(id);
      req.onsuccess = () => res();
      req.onerror   = () => rej(req.error);
    });
  },
};

/* ── EVENTS (vaccinations, treatments, harvests, breeding) ───────────────── */

export const eventService = {
  async add(data) {
    const db = await openDb();
    const record = { ...data, id: uid(), createdAt: new Date().toISOString() };
    return new Promise((res, rej) => {
      const req = db.transaction("events", "readwrite").objectStore("events").add(record);
      req.onsuccess = () => res(record);
      req.onerror   = () => rej(req.error);
    });
  },

  async getForEnterprise(enterprise) {
    const db = await openDb();
    return new Promise((res, rej) => {
      const req = db.transaction("events", "readonly")
        .objectStore("events").index("enterprise").getAll(enterprise);
      req.onsuccess = () => res((req.result || []).sort((a, b) => b.date.localeCompare(a.date)));
      req.onerror   = () => rej(req.error);
    });
  },

  async getUpcoming(enterprise, days = 30) {
    const all = await this.getForEnterprise(enterprise);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const cutoff = new Date(today); cutoff.setDate(cutoff.getDate() + days);
    return all.filter((e) => {
      if (!e.dueDate) return false;
      const d = new Date(e.dueDate);
      return d >= today && d <= cutoff;
    });
  },

  async remove(id) {
    const db = await openDb();
    return new Promise((res, rej) => {
      const req = db.transaction("events", "readwrite").objectStore("events").delete(id);
      req.onsuccess = () => res();
      req.onerror   = () => rej(req.error);
    });
  },
};
