/* Cash flow service — monthly opening/closing balance, running cash position */

import { ledgerService } from "../ledger/ledgerService.js";

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export const cashFlowService = {
  /* Monthly cash flow for a year with running balance */
  monthlyFlow(year) {
    let running = 0;
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const { income, expense, net } = ledgerService.monthSummary(year, m);
      const opening = running;
      running += net;
      return {
        month: m,
        label: MONTH_LABELS[i],
        income,
        expense,
        net,
        opening,
        closing: running,
        negative: running < 0,
      };
    });
  },

  /* Months where cash goes negative — peak need months */
  cashNegativeMonths(year) {
    return this.monthlyFlow(year).filter((m) => m.closing < 0);
  },

  /* Highest income and expense months */
  peakMonths(year) {
    const flow = this.monthlyFlow(year).filter((m) => m.income > 0 || m.expense > 0);
    if (!flow.length) return { peakIncome: null, peakExpense: null };
    const peakIncome  = flow.reduce((best, m) => (m.income  > best.income  ? m : best), flow[0]);
    const peakExpense = flow.reduce((best, m) => (m.expense > best.expense ? m : best), flow[0]);
    return { peakIncome, peakExpense };
  },

  /* Running balance at end of each month for the sparkline */
  runningBalanceSeries(year) {
    return this.monthlyFlow(year).map((m) => ({ label: m.label, value: m.closing }));
  },
};
