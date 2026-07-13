/* Recommendation engine — structures AI recommendations into typed, source-tagged categories.
   Never adds or invents recommendations not present in the AI response. */

const CATEGORY_META = {
  immediate:     { label: "Immediate Action",    icon: "ShieldAlert",   color: "var(--ag-red)",     priority: 1 },
  organic:       { label: "Organic Treatment",   icon: "Leaf",          color: "var(--ag-primary)", priority: 2 },
  chemical:      { label: "Chemical Treatment",  icon: "FlaskConical",  color: "var(--ag-orange)",  priority: 3 },
  biological:    { label: "Biological Control",  icon: "Bug",           color: "var(--ag-blue)",    priority: 4 },
  nutrition:     { label: "Nutrition Advice",    icon: "Sprout",        color: "var(--ag-primary)", priority: 5 },
  environmental: { label: "Environmental Mgmt",  icon: "CloudSun",      color: "var(--ag-blue)",    priority: 6 },
};

export const recommendationEngine = {
  structure(rawRecs = {}, parsed = {}) {
    const categories = [];

    for (const [key, meta] of Object.entries(CATEGORY_META)) {
      const items = rawRecs[key];
      if (!items || !items.length) continue;

      categories.push({
        key,
        ...meta,
        items: items.map((item, i) => ({
          id:       `${key}-${i}`,
          text:     typeof item === "string" ? item : (item.action || item.text || String(item)),
          source:   typeof item === "object" ? (item.source || "") : "",
          cost:     typeof item === "object" ? (item.cost || "") : "",
          duration: typeof item === "object" ? (item.duration || "") : "",
        })).filter((item) => item.text),
      });
    }

    // Sort by priority
    categories.sort((a, b) => a.priority - b.priority);

    return {
      categories,
      hasImmediate:     !!(rawRecs.immediate?.length),
      hasChemical:      !!(rawRecs.chemical?.length),
      totalCount:       categories.reduce((s, c) => s + c.items.length, 0),
      knowledgeSource:  parsed.knowledgeSource || "",
      governmentAdvisory: parsed.governmentAdvisory || "",
      disclaimer:       "Recommendations are AI-generated guidance. Always verify with a qualified expert before applying chemical treatments.",
    };
  },
};
