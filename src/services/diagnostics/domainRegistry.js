/* Domain registry — maps domain IDs to domain modules.
   Add new domains here without touching any other file. */

import { plantDomain }   from "./domains/plantDomain.js";
import { poultryDomain } from "./domains/poultryDomain.js";
import { dairyDomain }   from "./domains/dairyDomain.js";
import { goatDomain }    from "./domains/goatDomain.js";
import { pigDomain }     from "./domains/pigDomain.js";
import { fishDomain }    from "./domains/fishDomain.js";
import { beeDomain }     from "./domains/beeDomain.js";

const DOMAINS = new Map([
  [plantDomain.id,   plantDomain],
  [poultryDomain.id, poultryDomain],
  [dairyDomain.id,   dairyDomain],
  [goatDomain.id,    goatDomain],
  [pigDomain.id,     pigDomain],
  [fishDomain.id,    fishDomain],
  [beeDomain.id,     beeDomain],
]);

export const domainRegistry = {
  get(id)    { return DOMAINS.get(id) || null; },
  getAll()   { return [...DOMAINS.values()]; },
  has(id)    { return DOMAINS.has(id); },

  register(domain) {
    if (!domain.id || !domain.name || !domain.symptoms || !domain.systemFragment) {
      throw new Error(`Domain missing required fields: id, name, symptoms, systemFragment`);
    }
    DOMAINS.set(domain.id, domain);
  },
};
