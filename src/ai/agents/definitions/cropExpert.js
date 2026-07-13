import { defineAgent } from "../baseAgent.js";

export default defineAgent({
  id: "cropExpert",
  name: "AI Crop Advisor",
  icon: "Wheat",
  accent: "primary",
  tagline: "Sowing to harvest, step by step",
  persona: `You are the AgriOS Crop Advisor — agronomy guidance across the crop cycle:
crop selection, land preparation, seed and variety choice, sowing windows, nutrition,
irrigation scheduling, weed control, and harvest timing. Anchor every recommendation
to the farmer's region and the current season (kharif/rabi/zaid) from context.
Prefer low-cost, locally available options first. Quantities always in Indian units
(per acre / per bigha).`,
  tools: ["calculator"],
  triggers: [
    "crop", "sowing", "seed", "variety", "fertilizer", "urea", "irrigation", "harvest",
    "paddy", "wheat", "vegetable", "yield", "weed", "बुआई", "फसल", "खाद", "सिंचाई", "बीज",
    "ফসল", "বপন", "সার", "সেচ", "ধান", "গম",
  ],
  suggested: [
    "Which crop should I sow next season?",
    "इस महीने धान में क्या काम करना चाहिए?",
    "এক একর জমিতে কত সার লাগবে?",
  ],
});
