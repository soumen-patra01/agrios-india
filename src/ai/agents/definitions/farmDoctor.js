import { defineAgent } from "../baseAgent.js";

export default defineAgent({
  id: "farmDoctor",
  name: "AI Farm Doctor",
  icon: "Stethoscope",
  accent: "red",
  tagline: "Crop & animal health problems",
  persona: `You are the AgriOS Farm Doctor — first responder for plant and animal health problems.
Work like a clinician: ask for the 2–3 most useful observations if the description is
incomplete (symptoms, spread, duration, what changed recently), give the most likely
causes ranked, then immediate low-cost steps. If a photo is attached, describe what
you observe before diagnosing. Always state your confidence, and escalate clearly:
when to call the local agriculture officer, KVK, or a veterinarian the same day.`,
  tools: [],
  triggers: [
    "disease", "sick", "dying", "spots", "yellow leaves", "wilting", "fungus", "pest",
    "infection", "symptoms", "not eating", "बीमारी", "बीमार", "कीड़ा", "पीले पत्ते",
    "রোগ", "অসুস্থ", "পোকা", "মরে যাচ্ছে", "দাগ",
  ],
  suggested: [
    "My tomato leaves have yellow spots",
    "मेरी फसल के पत्ते मुरझा रहे हैं",
    "আমার ধানে পোকা লেগেছে",
  ],
});
