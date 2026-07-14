/* Cost analysis on top of ledger + production data: cost per unit, ROI,
   break-even, and a naive cash-flow forecast from trailing averages. */

import { plService } from "../business/plService.js";
import { cashFlowService } from "../business/cashFlowService.js";
import { productionAggregator } from "../production/productionAggregator.js";

export const costAnalysis = {
  /* Cost per production unit per enterprise (year expenses / all-time-year output).
     Approximation on ledger enterprise tags — honest label in UI. */
  async costPerUnit(year) {
    const pl = plService.byEnterprise(year);
    const snapshot = await productionAggregator.monthSnapshot();
    return snapshot.map((row) => {
      const plRow = pl.find((p) => p.id === row.enterprise.id);
      const expense = plRow?.expense || 0;
      return {
        enterprise: row.enterprise,
        metric: row.metric,
        output: row.allTime,
        expense,
        costPerUnit: row.allTime > 0 ? +(expense / row.allTime).toFixed(2) : null,
        revenue: plRow?.income || 0,
        pricePerUnit: row.allTime > 0 && plRow?.income
          ? +(plRow.income / row.allTime).toFixed(2) : null,
      };
    });
  },

  /* Break-even output = expense / price-per-unit, where both known. */
  async breakEven(year) {
    const rows = await this.costPerUnit(year);
    return rows
      .filter((r) => r.pricePerUnit > 0)
      .map((r) => ({
        ...r,
        breakEvenUnits: Math.ceil(r.expense / r.pricePerUnit),
        achievedPct: r.expense > 0 ? Math.round((r.revenue / r.expense) * 100) : null,
      }));
  },

  /* 3-month cash forecast from trailing 3-month average income/expense. */
  forecast(year) {
    const flow = cashFlowService.monthlyFlow(year);
    const active = flow.filter((m) => m.income > 0 || m.expense > 0);
    if (active.length === 0) return [];
    const recent = active.slice(-3);
    const avgIn  = recent.reduce((s, m) => s + m.income, 0) / recent.length;
    const avgOut = recent.reduce((s, m) => s + m.expense, 0) / recent.length;
    let balance = flow[flow.length - 1].closing;
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const now = new Date();
    return Array.from({ length: 3 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
      balance += avgIn - avgOut;
      return {
        label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
        income: Math.round(avgIn), expense: Math.round(avgOut),
        projectedBalance: Math.round(balance),
      };
    });
  },
};
