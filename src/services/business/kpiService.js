/* KPI service — high-level business metrics: margin, ROI, growth */

import { plService } from "./plService.js";
import { cashFlowService } from "./cashFlowService.js";

export const kpiService = {
  async summary(year) {
    const total  = await plService.yearTotal(year);
    const best   = await plService.bestEnterprise(year);
    const months = (await plService.byMonth(year)).filter((m) => m.income > 0 || m.expense > 0);
    const flow   = await cashFlowService.monthlyFlow(year);

    const margin = total.income > 0 ? +((total.net / total.income) * 100).toFixed(1) : 0;
    const roi    = total.expense > 0 ? +((total.net / total.expense) * 100).toFixed(1) : 0;

    // Month-over-month revenue growth (last 2 active months)
    const activeMonths = flow.filter((m) => m.income > 0);
    let revenueGrowth = null;
    if (activeMonths.length >= 2) {
      const last = activeMonths[activeMonths.length - 1];
      const prev = activeMonths[activeMonths.length - 2];
      if (prev.income > 0) {
        revenueGrowth = +((((last.income - prev.income) / prev.income) * 100).toFixed(1));
      }
    }

    return {
      totalRevenue:  total.income,
      totalCost:     total.expense,
      netProfit:     total.net,
      profitMargin:  margin,
      roi,
      revenueGrowth,
      bestEnterprise: best,
      activeMonths:  months.length,
    };
  },
};
