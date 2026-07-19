/* P&L service — aggregates ledgerService transactions into profit & loss by enterprise and period.
   Reads from existing ledger data — no migration needed. */

import { ledgerService, ENTERPRISES } from "../ledger/ledgerService.js";

export const plService = {
  /* P&L for a given year, grouped by enterprise */
  async byEnterprise(year) {
    const results = {};
    ENTERPRISES.forEach((e) => {
      results[e.id] = { id: e.id, label: e.label, income: 0, expense: 0, net: 0 };
    });

    for (let m = 1; m <= 12; m++) {
      const txns = await ledgerService.forMonth(year, m);
      txns.forEach((t) => {
        const eid = t.enterpriseId || "other";
        if (!results[eid]) results[eid] = { id: eid, label: eid, income: 0, expense: 0, net: 0 };
        if (t.kind === "income")  results[eid].income  += t.amount;
        if (t.kind === "expense") results[eid].expense += t.amount;
      });
    }

    Object.values(results).forEach((e) => { e.net = e.income - e.expense; });
    return Object.values(results).filter((e) => e.income > 0 || e.expense > 0);
  },

  /* Monthly P&L totals for a given year */
  async byMonth(year) {
    const months = [];
    for (let m = 1; m <= 12; m++) {
      const { income, expense, net } = await ledgerService.monthSummary(year, m);
      months.push({ month: m, income, expense, net });
    }
    return months;
  },

  /* Year total */
  async yearTotal(year) {
    const months = await this.byMonth(year);
    return months.reduce(
      (acc, m) => ({ income: acc.income + m.income, expense: acc.expense + m.expense, net: acc.net + m.net }),
      { income: 0, expense: 0, net: 0 }
    );
  },

  /* Best performing enterprise by net profit */
  async bestEnterprise(year) {
    const list = await this.byEnterprise(year);
    if (!list.length) return null;
    return list.reduce((best, e) => (e.net > best.net ? e : best), list[0]);
  },

  /* Available years with data */
  async availableYears() {
    const txns = await ledgerService.all();
    const years = [...new Set(txns.map((t) => t.date.slice(0, 4)))].sort().reverse();
    const cur = String(new Date().getFullYear());
    if (!years.includes(cur)) years.unshift(cur);
    return years;
  },
};
