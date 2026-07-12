import { CATS, ENTERPRISES, ACTIVITIES, todayISO } from "./domain.js";
import { langName } from "./i18n.js";

const API_URL = "https://api.anthropic.com/v1/messages";
export const DEFAULT_MODEL = "claude-opus-4-8";

/* Build the grounding context the advisor answers from:
   profile, this month's P&L, category totals, recent diary, tasks, weather. */
export function buildSystem({ profile, tx, diary, tasks, weather, lang }) {
  const month = todayISO().slice(0, 7);
  const mtx = tx.filter((t) => (t.date || "").slice(0, 7) === month);
  const income = mtx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = mtx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const catTotals = {};
  mtx.forEach((t) => {
    const label = `${t.type}:${t.category}`;
    catTotals[label] = (catTotals[label] || 0) + t.amount;
  });
  const catLines = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `  - ${k}: ₹${v}`)
    .join("\n") || "  (none)";

  const byFarm = {};
  mtx.forEach((t) => {
    const f = t.farm || "general";
    byFarm[f] = byFarm[f] || { income: 0, expense: 0 };
    byFarm[f][t.type] += t.amount;
  });
  const farmLines = Object.entries(byFarm)
    .map(([f, v]) => `  - ${f}: income ₹${v.income}, expense ₹${v.expense}, net ₹${v.income - v.expense}`)
    .join("\n") || "  (none)";

  const diaryLines = diary.slice(0, 15)
    .map((d) => `  - ${d.date}: ${d.activity}${d.farm ? ` (${d.farm})` : ""}${d.note ? ` — ${d.note}` : ""}`)
    .join("\n") || "  (no diary entries yet)";

  const taskLines = tasks.filter((t) => !t.done).map((t) => `  - ${t.text}`).join("\n") || "  (none)";

  const wx = weather
    ? `${weather.temp}°C, condition ${weather.condKey.replace("wx", "")}, rain chance next 24-48h ${weather.rainChance}%, wind ${weather.wind} km/h`
    : "not available";

  return `You are the AI Farm Advisor inside AgriOS India, a farm management app for Indian farmers.

FARMER PROFILE
- Name: ${profile.name}
- State: ${profile.state}, India
- Land: ${profile.acres ? profile.acres + " acres" : "not specified"}
- Enterprises: ${profile.enterprises.join(", ") || "none selected"}
- Today's date: ${todayISO()}
- Weather at the farm: ${wx}

THIS MONTH'S LEDGER (${month})
- Total income: ₹${income}; total expense: ₹${expense}; net: ₹${income - expense}
- By category:
${catLines}
- By enterprise:
${farmLines}

RECENT FARM DIARY (newest first)
${diaryLines}

PENDING TASKS
${taskLines}

RULES
- Reply in ${langName(lang)}, using simple, everyday words a farmer uses. No jargon.
- Be practical and specific to THIS farm and its data. Refer to the actual numbers, activities and weather above when relevant.
- Keep answers short — under 200 words — unless the farmer asks for detail. Use short bullet lists for steps.
- For pesticides, fertilizer doses, medicines or animal treatment: give general guidance only and always tell the farmer to confirm the exact product and dose with the local agriculture officer or Krishi Vigyan Kendra (KVK).
- If the data needed to answer well is missing, say so and tell the farmer what to record in the app.
- Never invent numbers that are not in the data above.`;
}

/* Direct browser call to the Claude API. The user's own key is sent with the
   CORS opt-in header; nothing is proxied through a server. */
export async function askAdvisor({ apiKey, model, system, messages }) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: model || DEFAULT_MODEL,
      max_tokens: 2048,
      thinking: { type: "adaptive" },
      system,
      messages,
    }),
  });
  if (!res.ok) {
    let detail = "";
    try { detail = (await res.json())?.error?.message || ""; } catch (e) {}
    const err = new Error(detail || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  return data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}
