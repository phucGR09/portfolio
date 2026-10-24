/** All 6 branch categories. categoriesTotal in stats() is always this length. */
export const CATEGORIES = ["data", "security", "code-design", "api", "performance", "reliability"];

/**
 * Single source of truth for every problem page. The landing page computes
 * its own counts from this array (`stats()`) — it must never hardcode
 * "18 problems" anywhere.
 * @type {readonly import("../types.d.ts").CatalogEntry[]}
 */
export const CATALOG = [
  {
    slug: "n-plus-one-query",
    title: "The N+1 Query",
    category: "data",
    difficulty: "foundational",
    blastRadius: "expensive",
    provenance: "classic",
    related: [],
    runnable: false
  },
  {
    slug: "sql-injection-contact-form",
    title: "SQL Injection in a Contact Form",
    category: "security",
    difficulty: "foundational",
    blastRadius: "catastrophic",
    provenance: "classic",
    related: [],
    runnable: false
  },
  {
    slug: "one-rule-five-places",
    title: "One Rule, Five Places",
    category: "code-design",
    difficulty: "intermediate",
    blastRadius: "expensive",
    provenance: "classic",
    related: [],
    runnable: false
  }
];

/**
 * @param {readonly import("../types.d.ts").CatalogEntry[]} [entries]
 * @returns {import("../types.d.ts").CatalogStats}
 */
export function stats(entries = CATALOG) {
  const categoriesUsed = new Set(entries.map((entry) => entry.category)).size;
  return {
    problems: entries.length,
    categoriesUsed,
    categoriesTotal: CATEGORIES.length
  };
}
