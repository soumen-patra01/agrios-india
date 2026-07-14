/* AI Insights — builds a data summary from real farm records and asks the
   existing Claude integration for actionable insights. The health score is
   computed locally from real data; the narrative comes from the model.
   No synthetic data is ever generated. */

import { llmClient } from "../../ai/services/llmClient.js";
import { MODELS, LIMITS } from "../../ai/config.js";
import { kpiService } from "../business/kpiService.js";
import { productionAggregator } from "../production/productionAggregator.js";
import { vaccinationService } from "../livestock/vaccinationService.js";
import { inventoryService } from "../inventory/inventoryService.js";
import { taskService } from "../tasks/taskService.js";

const year = () => new Date().getFullYear();

export const aiInsightsService = {
  /* Gathers real data from every module into one summary object. */
  async gather() {
    const [snapshot, vax, alerts, buckets, mortality] = await Promise.all([
      productionAggregator.monthSnapshot(),
      vaccinationService.counts(),
      inventoryService.alerts(),
      taskService.buckets(),
      productionAggregator.monthMortality(),
    ]);
    return {
      kpi: kpiService.summary(year()),
      production: snapshot.map((r) => ({
        enterprise: r.enterprise.label, metric: r.metric.label,
        thisMonth: `${r.total} ${r.metric.unit}`, entries: r.entries,
      })),
      vaccinations: vax,
      inventoryAlerts: { lowStock: alerts.lowStock.length, expired: alerts.expired.length, expiring: alerts.expiring.length },
      tasks: { overdue: buckets.overdue.length, today: buckets.today.length, upcoming: buckets.upcoming.length },
      monthMortality: mortality,
    };
  },

  /* 0–100 health score from real signals; explanation of each deduction. */
  score(data) {
    let score = 100;
    const notes = [];
    if (data.kpi.netProfit < 0)          { score -= 20; notes.push("Farm is loss-making this year (−20)"); }
    else if (data.kpi.profitMargin < 15) { score -= 8;  notes.push("Profit margin under 15% (−8)"); }
    if (data.vaccinations.missed > 0)    { score -= Math.min(20, data.vaccinations.missed * 5); notes.push(`${data.vaccinations.missed} missed vaccination(s) (−${Math.min(20, data.vaccinations.missed * 5)})`); }
    if (data.inventoryAlerts.expired > 0){ score -= 10; notes.push(`${data.inventoryAlerts.expired} expired stock item(s) (−10)`); }
    if (data.inventoryAlerts.lowStock > 0){ score -= 5; notes.push(`${data.inventoryAlerts.lowStock} low-stock item(s) (−5)`); }
    if (data.tasks.overdue > 0)          { score -= Math.min(15, data.tasks.overdue * 3); notes.push(`${data.tasks.overdue} overdue task(s) (−${Math.min(15, data.tasks.overdue * 3)})`); }
    if (data.monthMortality > 0)         { score -= Math.min(15, data.monthMortality); notes.push(`${data.monthMortality} mortality this month (−${Math.min(15, data.monthMortality)})`); }
    return { score: Math.max(0, score), notes };
  },

  /* Asks Claude for insights grounded in the gathered data. */
  async generate(data) {
    const system =
      "You are an Indian farm business advisor. You are given real data from a " +
      "farmer's records. Give practical, specific advice in simple English. " +
      "Respond with 4-6 short bullet points (each starting with '- '), covering: " +
      "profitability, disease/vaccination risk, feed or inventory actions, and one " +
      "growth opportunity. Mention rupee figures from the data where relevant. " +
      "Do not invent data that is not provided.";
    const text = await llmClient.complete({
      model: MODELS.answer,
      system,
      messages: [{ role: "user", content: `My farm data:\n${JSON.stringify(data, null, 2)}` }],
      maxTokens: LIMITS.maxTokens,
    });
    return text.split("\n").map((l) => l.trim()).filter((l) => l.startsWith("-")).map((l) => l.slice(1).trim());
  },
};
