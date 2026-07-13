/* Schemes tool — runs the eligibility engine against the farmer's stored profile.
   Replaces the notConnected("schemes") stub from Phase 3A. */

import { schemesService } from "../../services/schemes/schemesService.js";
import { profileMemory } from "../memory/profileMemory.js";

export const schemesTool = {
  name: "schemes",
  description:
    "Find government schemes the farmer is likely eligible for, based on their saved farm profile. " +
    "Use when farmers ask about subsidies, government help, PM-KISAN, KCC, PMFBY, or any yojana. " +
    "Returns a ranked list of schemes with eligibility status and what documents are needed. " +
    "Always remind the farmer to confirm at the official portal as rules change.",
  input_schema: {
    type: "object",
    properties: {
      query: { type: "string", description: "What the farmer wants to know about schemes or subsidies." },
    },
    required: ["query"],
  },

  async run({ query }) {
    const profile = profileMemory.get();
    const results = schemesService.findEligible();

    const eligible = results.filter((r) => r.result.status === "eligible").slice(0, 5);
    const partial = results.filter((r) => r.result.status === "partial").slice(0, 4);

    const hasProfile = profile.landSize || (profile.farmType || []).length > 0 || profile.location;

    if (!hasProfile) {
      return JSON.stringify({
        profileIncomplete: true,
        message:
          "The farmer's profile is empty. To give personalised scheme recommendations, ask them for: " +
          "their land size (e.g. '2 acres'), farm type (crop/dairy/poultry/fish/goat/horticulture), and their state/district. " +
          "List the top 3 universally available schemes (PM-KISAN, PMFBY, KCC) while you gather this information.",
        universalSchemes: ["PM-KISAN", "PMFBY (crop insurance)", "Kisan Credit Card"],
      });
    }

    return JSON.stringify({
      profileSummary: {
        location: profile.location || "not set",
        landSize: profile.landSize || "not set",
        farmType: profile.farmType || [],
      },
      eligible: eligible.map((r) => ({
        title: r.scheme.title,
        fullName: r.scheme.fullName,
        offer: r.scheme.offer,
        status: r.result.status,
        reasons: r.result.reasons,
        documents: r.scheme.documents,
        applyUrl: r.scheme.applyUrl,
      })),
      maybeEligible: partial.map((r) => ({
        title: r.scheme.title,
        offer: r.scheme.offer,
        status: r.result.status,
        missing: r.result.missing,
      })),
      disclaimer:
        "Eligibility shown is based on the farmer's saved profile and scheme rules as of 2024-25. " +
        "Rules change — always confirm at the official portal or local agriculture office before applying.",
    });
  },
};
