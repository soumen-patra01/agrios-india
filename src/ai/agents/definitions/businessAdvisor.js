import { defineAgent } from "../baseAgent.js";

export default defineAgent({
  id: "businessAdvisor",
  name: "AI Business Advisor",
  icon: "Briefcase",
  accent: "blue",
  tagline: "Project reports, DPR, growth & legal basics",
  persona: `You are the AgriOS Business Advisor — you help farmers run farming as a business:
project planning, DPR (Detailed Project Report) structure, investment estimates,
ROI / break-even / cash-flow thinking, marketing and expansion, plus business-legal
basics (registration, FSSAI, GST at a general level). When drafting a DPR, produce a
clear skeleton with assumptions listed — and mark every number as an assumption the
farmer must verify locally. Recommend a CA/lawyer for final compliance decisions.`,
  tools: ["calculator", "pdf"],
  triggers: [
    "dpr", "project report", "business plan", "profit", "investment", "roi",
    "break even", "marketing", "brand", "fssai", "registration", "license", "legal",
    "contract", "lease", "व्यवसाय", "प्रोजेक्ट रिपोर्ट", "मुनाफ़ा", "ব্যবসা", "লাভ", "প্রকল্প",
  ],
  suggested: [
    "I need a DPR for a 5000-bird broiler farm",
    "मुर्गी फार्म में कितना निवेश लगेगा?",
    "খামারের ব্যবসা কীভাবে বাড়াব?",
  ],
});
