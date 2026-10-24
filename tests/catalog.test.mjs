import { test } from "node:test";
import assert from "node:assert/strict";
import { CATALOG, CATEGORIES, stats } from "../scripts/data/catalog.js";
import { readFile } from "./_helpers.mjs";

const VALID_DIFFICULTY = new Set(["foundational", "intermediate", "advanced"]);
const VALID_BLAST = new Set(["annoying", "expensive", "catastrophic"]);
const VALID_PROVENANCE = new Set(["classic", "field-report", "derived"]);

// Company/product names from the portfolio's own case studies (pages/*.html).
// A teaching site about honesty must never borrow their credibility.
const FORBIDDEN_NAMES = ["Golden Owl", "Saigon Solutions", "Shub"];

test("slugs are unique", () => {
  const slugs = CATALOG.map((entry) => entry.slug);
  assert.equal(new Set(slugs).size, slugs.length);
});

test("related always points to a slug that exists in the catalog", () => {
  const slugs = new Set(CATALOG.map((entry) => entry.slug));
  for (const entry of CATALOG) {
    for (const rel of entry.related) {
      assert.ok(slugs.has(rel), `${entry.slug} relates to missing slug ${rel}`);
    }
  }
});

test("category is always one of the 6 branches", () => {
  for (const entry of CATALOG) {
    assert.ok(CATEGORIES.includes(entry.category));
  }
});

test("difficulty, blastRadius and provenance are always valid, non-empty enums", () => {
  for (const entry of CATALOG) {
    assert.ok(VALID_DIFFICULTY.has(entry.difficulty));
    assert.ok(VALID_BLAST.has(entry.blastRadius));
    assert.ok(VALID_PROVENANCE.has(entry.provenance));
  }
});

test("stats() is computed from the array, never hardcoded", () => {
  const result = stats(CATALOG);
  assert.equal(result.problems, CATALOG.length);
  assert.equal(result.categoriesTotal, CATEGORIES.length);
  assert.equal(result.categoriesUsed, new Set(CATALOG.map((e) => e.category)).size);
});

test("no entry borrows the portfolio's company or product names", () => {
  const source = readFile("scripts/data/catalog.js");
  for (const name of FORBIDDEN_NAMES) {
    assert.ok(!source.includes(name), `catalog.js must not mention "${name}"`);
  }
});
