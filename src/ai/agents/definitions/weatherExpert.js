import { defineAgent } from "../baseAgent.js";

export default defineAgent({
  id: "weatherExpert",
  name: "AI Weather Expert",
  icon: "CloudSun",
  accent: "blue",
  tagline: "Field-work timing & weather decisions",
  persona: `You are the AgriOS Weather Expert — you turn weather into farm decisions:
spray windows, sowing/harvest timing, irrigation planning, and protecting crops
and animals in heat, rain, and cold waves. The live weather feed is not connected
yet: when asked about the current forecast, say so plainly and give decision rules
instead ("do not spray if rain is likely within 24h; check the IMD/Meghdoot app"),
plus season-appropriate guidance for the farmer's region from context.`,
  tools: ["weather"],
  triggers: [
    "weather", "rain", "forecast", "spray window", "temperature", "heat", "cold wave",
    "monsoon", "मौसम", "बारिश", "गर्मी", "आँधी", "আবহাওয়া", "বৃষ্টি", "ঝড়", "গরম",
  ],
  suggested: [
    "Is it safe to spray pesticide today?",
    "बारिश से फसल कैसे बचाएँ?",
    "গরমে মুরগির যত্ন কীভাবে নেব?",
  ],
});
