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
    principle: "N+1 Query",
    title: "Your candidate list loads instantly with 10 rows. With 500, it crawls.",
    category: "data",
    difficulty: "foundational",
    blastRadius: "expensive",
    provenance: "classic",
    related: [],
    runnable: true
  },
  {
    slug: "sql-injection-contact-form",
    principle: "SQL Injection",
    title: "A contact form started returning every customer's password hash.",
    category: "security",
    difficulty: "foundational",
    blastRadius: "catastrophic",
    provenance: "classic",
    related: [],
    runnable: true
  },
  {
    slug: "one-rule-five-places",
    principle: "DRY (Duplicated Logic)",
    title: "We updated the tax rate everywhere — except the screen that charges customers.",
    category: "code-design",
    difficulty: "intermediate",
    blastRadius: "expensive",
    provenance: "classic",
    related: [],
    runnable: true
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
