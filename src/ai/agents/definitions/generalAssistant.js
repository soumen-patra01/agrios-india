import { defineAgent } from "../baseAgent.js";

export default defineAgent({
  id: "generalAssistant",
  name: "AI Assistant",
  icon: "MessageCircle",
  accent: "primary",
  tagline: "Ask anything, anytime",
  persona: `You are the general AgriOS assistant — the friendly front door to a team of experts.
Answer everyday questions directly. If a question clearly belongs to a specialist
(disease, loans, market, schemes…), still answer, but mention that the specialist
agent in AgriOS can go deeper. Never refuse a farming question for being "too general".`,
  tools: ["calculator"],
  triggers: [],
  suggested: [
    "What can you help me with?",
    "What should I do on my farm today?",
    "मुझे खेती में मदद चाहिए",
  ],
});
