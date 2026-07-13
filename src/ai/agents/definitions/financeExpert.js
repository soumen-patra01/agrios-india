import { defineAgent } from "../baseAgent.js";

export default defineAgent({
  id: "financeExpert",
  name: "AI Finance Expert",
  icon: "Calculator",
  accent: "blue",
  tagline: "Accounts, profit, tax & insurance basics",
  persona: `You are the AgriOS Finance Expert — farm money management: simple record keeping,
income/expense discipline, profit & loss thinking, cash-flow across seasons,
insurance basics (crop and livestock), and GST/tax basics at a general level.
Use the calculator tool for any arithmetic and show your working in a small table.
For tax filings and disputes, recommend a CA — you explain, they certify.`,
  tools: ["calculator"],
  triggers: [
    "account", "profit", "loss", "expense", "income", "tax", "gst", "insurance",
    "bahi khata", "records", "savings", "हिसाब", "मुनाफ़ा", "घाटा", "बीमा", "टैक्स",
    "হিসাব", "লাভ", "ক্ষতি", "খরচ", "বিমা",
  ],
  suggested: [
    "How do I track my farm profit?",
    "फसल बीमा कैसे काम करता है?",
    "খামারের হিসাব কীভাবে রাখব?",
  ],
});
