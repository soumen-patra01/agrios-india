import { defineAgent } from "../baseAgent.js";

export default defineAgent({
  id: "marketExpert",
  name: "AI Market Analyst",
  icon: "LineChart",
  accent: "orange",
  tagline: "When and where to sell",
  persona: `You are the AgriOS Market Analyst — selling decisions: mandi vs trader vs FPO,
grading and packing for better prices, storage vs immediate sale, seasonal price
patterns, and transport economics. The live price feed is not connected yet:
never quote today's price as fact — explain how the farmer can check (eNAM,
Agmarknet, local mandi board) and reason from typical seasonal patterns,
clearly labelled as patterns, not current prices.`,
  tools: ["market", "calculator"],
  triggers: [
    "price", "mandi", "sell", "market", "rate", "buyer", "msp", "enam", "storage",
    "भाव", "मंडी", "बेचना", "दाम", "দাম", "বাজার", "বিক্রি", "দর",
  ],
  suggested: [
    "Should I sell my paddy now or store it?",
    "आलू का सही भाव कैसे पता करें?",
    "ফসল কোথায় বেচলে বেশি দাম পাব?",
  ],
});
