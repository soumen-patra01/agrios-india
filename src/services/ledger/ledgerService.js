/* Farm ledger — income/expense transaction storage.
   All data stays on-device in localStorage under the ldg: prefix.
   Each transaction: {id, kind, amount, categoryId, enterpriseId, date, note} */

import { storage } from "../../utils/storage.js";

const KEY = "ldg:txns";

export const INCOME_CATEGORIES = [
  { id: "crop_sale",      label: "Crop sale",           icon: "Wheat"      },
  { id: "milk_sale",      label: "Milk sale",            icon: "Milk"       },
  { id: "poultry_sale",   label: "Poultry / egg sale",   icon: "Bird"       },
  { id: "fish_sale",      label: "Fish sale",            icon: "Fish"       },
  { id: "livestock_sale", label: "Livestock sale",       icon: "Rabbit"     },
  { id: "subsidy",        label: "Subsidy / scheme",     icon: "Building2"  },
  { id: "other_income",   label: "Other income",         icon: "Wallet"     },
];

export const EXPENSE_CATEGORIES = [
  { id: "seeds",       label: "Seeds",                   icon: "Sprout"    },
  { id: "fertilizer",  label: "Fertilizer",              icon: "Leaf"      },
  { id: "pesticide",   label: "Pesticide / herbicide",   icon: "SprayCan"  },
  { id: "labour",      label: "Labour",                  icon: "Users"     },
  { id: "feed",        label: "Feed",                    icon: "Package"   },
  { id: "medicine",    label: "Medicine",                icon: "Pill"      },
  { id: "equipment",   label: "Equipment",               icon: "Tractor"   },
  { id: "irrigation",  label: "Irrigation",              icon: "Droplets"  },
  { id: "transport",   label: "Transport",               icon: "Truck"     },
  { id: "other_exp",   label: "Other expense",           icon: "Package"   },
];

export const ENTERPRISES = [
  { id: "crop",    label: "Crop"          },
  { id: "dairy",   label: "Dairy"         },
  { id: "poultry", label: "Poultry"       },
  { id: "goat",    label: "Goat"          },
  { id: "fish",    label: "Fish"          },
  { id: "horti",   label: "Horticulture"  },
  { id: "other",   label: "Other"         },
];

export const ledgerService = {
  all() {
    return [...storage.get(KEY, [])].sort((a, b) => b.date.localeCompare(a.date));
  },

  forMonth(year, month) {
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    return this.all().filter((t) => t.date.startsWith(prefix));
  },

  monthSummary(year, month) {
    const txns = this.forMonth(year, month);
    const income  = txns.filter((t) => t.kind === "income").reduce((s, t) => s + t.amount, 0);
    const expense = txns.filter((t) => t.kind === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expense, net: income - expense };
  },

  currentMonthSummary() {
    const d = new Date();
    return this.monthSummary(d.getFullYear(), d.getMonth() + 1);
  },

  add(txn) {
    const list = storage.get(KEY, []);
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    storage.set(KEY, [...list, { ...txn, id }]);
    return id;
  },

  remove(id) {
    storage.set(KEY, storage.get(KEY, []).filter((t) => t.id !== id));
  },

  categoryLabel(kind, categoryId) {
    const src = kind === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    return src.find((c) => c.id === categoryId)?.label ?? categoryId;
  },

  categoryIcon(kind, categoryId) {
    const src = kind === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    return src.find((c) => c.id === categoryId)?.icon ?? "Wallet";
  },

  enterpriseLabel(id) {
    return ENTERPRISES.find((e) => e.id === id)?.label ?? "";
  },
};
