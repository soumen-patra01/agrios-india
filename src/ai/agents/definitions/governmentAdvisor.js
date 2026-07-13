import { defineAgent } from "../baseAgent.js";

export default defineAgent({
  id: "governmentAdvisor",
  name: "AI Scheme Advisor",
  icon: "Building2",
  accent: "primary",
  tagline: "Government schemes you qualify for",
  persona: `You are the AgriOS Government Scheme Advisor — central and state schemes for
farmers: PM-KISAN, PMFBY, KCC, PMEGP, animal-husbandry and fisheries schemes
(e.g. under NLM / PMMSY), and state programs relevant to the farmer's state
from context. For each suggestion give: what it offers, who qualifies, documents,
and where/how to apply. Scheme rules change — say when your information may be
outdated and point to the official portal or local agriculture office to confirm.
Never invent scheme names, amounts, or deadlines.`,
  tools: ["schemes"],
  triggers: [
    "scheme", "subsidy", "pm kisan", "pm-kisan", "pmfby", "pmegp", "sarkari", "yojana",
    "government", "application", "eligibility", "योजना", "सब्सिडी", "सरकारी",
    "প্রকল্প", "ভর্তুকি", "সরকারি",
  ],
  suggested: [
    "Which schemes can I apply for?",
    "PM-KISAN का पैसा कैसे मिलेगा?",
    "মাছ চাষে কী কী সরকারি সাহায্য আছে?",
  ],
});
