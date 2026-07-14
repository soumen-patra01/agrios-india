/* Production dashboard data — aggregates livestock production records and
   crop-calendar harvests into one cross-farm view. */

import { productionService, eventService, ENTERPRISES } from "../livestock/livestockService.js";

/* enterprise -> which record field is the production quantity + its unit */
const METRICS = {
  poultry: { key: "eggs",     label: "Eggs",       unit: "pcs" },
  dairy:   { key: "quantity", label: "Milk",       unit: "L"   },
  goat:    { key: "weightKg", label: "Weight",     unit: "kg"  },
  pig:     { key: "weightKg", label: "Weight",     unit: "kg"  },
  sheep:   { key: "weightKg", label: "Weight",     unit: "kg"  },
  fish:    { key: "feedKg",   label: "Feed used",  unit: "kg"  },
  bee:     { key: "honeyKg",  label: "Honey",      unit: "kg"  },
};

export const productionAggregator = {
  /* Current-month production per enterprise (only enterprises with data). */
  async monthSnapshot() {
    const prefix = new Date().toISOString().slice(0, 7);
    const rows = await Promise.all(ENTERPRISES.map(async (e) => {
      const metric = METRICS[e.id] || { key: "quantity", label: "Production", unit: "" };
      const records = await productionService.getForEnterprise(e.id, 120);
      const monthRecords = records.filter((r) => r.date.startsWith(prefix));
      const total = monthRecords.reduce((s, r) => s + (Number(r[metric.key]) || 0), 0);
      return { enterprise: e, metric, total, entries: monthRecords.length,
               allTime: records.reduce((s, r) => s + (Number(r[metric.key]) || 0), 0) };
    }));
    return rows.filter((r) => r.entries > 0 || r.allTime > 0);
  },

  /* Fish + other harvest events this year. */
  async harvests() {
    const lists = await Promise.all(ENTERPRISES.map(async (e) => {
      const events = await eventService.getForEnterprise(e.id);
      return events
        .filter((ev) => ev.type === "harvest" && ev.weightKg)
        .map((ev) => ({ ...ev, enterpriseLabel: e.label }));
    }));
    return lists.flat().sort((a, b) => b.date.localeCompare(a.date));
  },

  /* Mortality this month across enterprises (poultry logs mortality daily). */
  async monthMortality() {
    const prefix = new Date().toISOString().slice(0, 7);
    let total = 0;
    for (const e of ENTERPRISES) {
      const records = await productionService.getForEnterprise(e.id, 120);
      total += records.filter((r) => r.date.startsWith(prefix))
                      .reduce((s, r) => s + (Number(r.mortality) || 0), 0);
    }
    return total;
  },
};
