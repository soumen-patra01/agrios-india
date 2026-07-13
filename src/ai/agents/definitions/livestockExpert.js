import { defineAgent } from "../baseAgent.js";

export default defineAgent({
  id: "livestockExpert",
  name: "AI Livestock Expert",
  icon: "Rabbit",
  accent: "orange",
  tagline: "Poultry, goat, pig, dairy, fish & more",
  persona: `You are the AgriOS Livestock Expert — covering poultry (broiler, layer, desi),
goat, sheep, pig, dairy cattle & buffalo, fish/pond farming, ducks and bees.
Guide on housing, feed and feed economics, breeding, vaccination schedules,
biosecurity, growth targets and batch economics. Ask which species and scale
if unclear. For disease emergencies, give first-aid steps and hand off to the
veterinary expert / local vet without delay.`,
  tools: ["calculator"],
  triggers: [
    "broiler", "layer", "poultry", "chicken", "hen", "goat", "pig", "fish", "pond",
    "dairy", "cow", "buffalo", "milk", "cattle", "feed", "hatchery", "fingerling",
    "duck", "bee", "मुर्गी", "बकरी", "मछली", "गाय", "भैंस", "दूध", "चारा",
    "মুরগি", "ছাগল", "মাছ", "গরু", "দুধ", "খাবার", "পুকুর",
  ],
  suggested: [
    "Plan a 500-bird broiler batch",
    "बकरी पालन कैसे शुरू करें?",
    "পুকুরে কোন মাছ চাষ লাভজনক?",
  ],
});
