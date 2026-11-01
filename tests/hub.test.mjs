import { test } from "node:test";
import assert from "node:assert/strict";
import { makeDom, readFile, fakeStorage } from "./_helpers.mjs";
import { CATALOG } from "../scripts/data/catalog.js";

/**
 * @param {{ storage?: Storage }} [opts]
 * @returns {Promise<{ document: Document, storage: Storage, pickSurprise: () => string | undefined }>}
 */
async function mountLanding(opts = {}) {
  const html = readFile("labs/index.html");
  const { document, window } = makeDom(html);
  const storage = opts.storage ?? fakeStorage();
  globalThis.document = document;
  globalThis.window = /** @type {Window & typeof globalThis} */ (/** @type {unknown} */ (window));
  globalThis.localStorage = storage;
  const mod = await import(`../scripts/hub.js?t=${Math.random()}`);
  return { document, storage, pickSurprise: mod.pickSurprise };
}

test("hero stats reflect the real catalog size, not a hardcoded count", async () => {
  const { document } = await mountLanding();
  const text = document.querySelector("[data-hero-stats]")?.textContent ?? "";
  assert.match(text, new RegExp(`^${CATALOG.length} problems? ·`));
  assert.doesNotMatch(text, /18 problems/);
});

test("clicking one filter chip narrows the grid to matching cards", async () => {
  const { document } = await mountLanding();
  const chip = /** @type {HTMLElement} */ (document.querySelector('[data-filter-axis="category"][data-filter-value="security"]'));
  chip.click();
  const titles = [...document.querySelectorAll("[data-catalog-grid] h3")].map((h) => h.textContent);
  const expected = CATALOG.filter((e) => e.category === "security").map((e) => e.principle);
  assert.deepEqual(titles, expected);
});

test("two chips on different axes intersect, not union", async () => {
  const { document } = await mountLanding();
  /** @type {HTMLElement} */ (document.querySelector('[data-filter-axis="category"][data-filter-value="security"]')).click();
  /** @type {HTMLElement} */ (document.querySelector('[data-filter-axis="difficulty"][data-filter-value="foundational"]')).click();
  const titles = [...document.querySelectorAll("[data-catalog-grid] h3")].map((h) => h.textContent);
  const expected = CATALOG.filter((e) => e.category === "security" && e.difficulty === "foundational").map((e) => e.principle);
  assert.deepEqual(titles, expected);
});

test("a filter combination with no matches shows a hint, never '0 results'", async () => {
  const { document } = await mountLanding();
  /** @type {HTMLElement} */ (document.querySelector('[data-filter-axis="category"][data-filter-value="security"]')).click();
  /** @type {HTMLElement} */ (document.querySelector('[data-filter-axis="category"][data-filter-value="data"]')).click();
  /** @type {HTMLElement} */ (document.querySelector('[data-filter-axis="difficulty"][data-filter-value="advanced"]')).click();
  const grid = document.querySelector("[data-catalog-grid]");
  assert.doesNotMatch(grid?.textContent ?? "", /0 results/);
});

test("default sort is blastRadius descending", async () => {
  const { document } = await mountLanding();
  const titles = [...document.querySelectorAll("[data-catalog-grid] h3")].map((h) => h.textContent);
  const order = { annoying: 0, expensive: 1, catastrophic: 2 };
  const byTitle = new Map(CATALOG.map((e) => [e.principle, order[e.blastRadius]]));
  const ranks = titles.map((t) => byTitle.get(t ?? ""));
  for (let i = 1; i < ranks.length; i += 1) assert.ok((ranks[i - 1] ?? 0) >= (ranks[i] ?? 0));
});

test("Surprise me only ever picks a runnable, real slug", async () => {
  const { pickSurprise } = await mountLanding();
  const slugs = new Set(CATALOG.filter((e) => e.runnable).map((e) => e.slug));
  for (let i = 0; i < 20; i += 1) {
    const slug = pickSurprise();
    assert.ok(slug && slugs.has(slug));
  }
});

test("every card shows a provenance badge with one of the 3 valid values", async () => {
  const { document } = await mountLanding();
  const tags = [...document.querySelectorAll("[data-catalog-grid] .badge-provenance")].map((t) => t.textContent);
  assert.equal(tags.length, CATALOG.length);
  for (const tag of tags) assert.ok(["Classic problem", "From the field", "Constructed example"].includes(tag ?? ""));
});

test("every card shows a severity badge and a symptom overview, and has its own background diagram", async () => {
  const { document } = await mountLanding();
  const cards = [...document.querySelectorAll("[data-catalog-grid] .catalog-card")];
  assert.equal(cards.length, CATALOG.length);
  for (const card of cards) {
    assert.ok(card.querySelector(".badge-severity"));
    assert.ok(card.querySelector(".catalog-card__overview")?.textContent?.length);
    assert.ok(card.querySelector(".catalog-card__bg svg"));
  }
});

test("both views render exactly the filtered CATALOG count", async () => {
  const { document } = await mountLanding();
  const list = document.querySelector("[data-catalog-grid]");
  const track = document.querySelector("[data-catalog-track]");
  assert.equal(list?.querySelectorAll(".catalog-card").length, CATALOG.length);
  /** @type {HTMLElement} */ (document.querySelector("[data-view-slides]")).click();
  assert.equal(track?.querySelectorAll(".catalog-card").length, CATALOG.length);
});

test("toggling views keeps active filters; filtering in slide view resets scroll position", async () => {
  const { document } = await mountLanding();
  /** @type {HTMLElement} */ (document.querySelector("[data-view-slides]")).click();
  const track = /** @type {HTMLElement} */ (document.querySelector("[data-catalog-track]"));
  assert.equal(track.querySelectorAll(".catalog-card").length, CATALOG.length);

  track.scrollLeft = 400;
  // narrows to 2 results (still > 1, so the track stays active) — a filter
  // that narrowed to exactly 1 would legitimately fall back to list view
  // (Phase C: hide the track for a single card), which isn't what this test checks.
  /** @type {HTMLElement} */ (document.querySelector('[data-filter-axis="blastRadius"][data-filter-value="expensive"]')).click();
  const expected = CATALOG.filter((e) => e.blastRadius === "expensive").length;
  assert.ok(expected > 1, "fixture assumption: need >1 result to stay in slide view");
  assert.equal(track.querySelectorAll(".catalog-card").length, expected);
  assert.equal(track.classList.contains("is-active"), true, "should still be in slide view");
  assert.equal(track.scrollLeft, 0, "filtering must reset slide-track scroll position");
});

test("persisted catalogView is restored on load; a garbage value falls back to list", async () => {
  const storage = fakeStorage();
  storage.setItem("pl:v1:prefs:catalogView", JSON.stringify("slides"));
  const { document } = await mountLanding({ storage });
  assert.equal(document.querySelector("[data-view-slides]")?.getAttribute("aria-pressed"), "true");
  assert.ok(document.querySelector("[data-catalog-track]")?.classList.contains("is-active"));

  const garbage = fakeStorage();
  garbage.setItem("pl:v1:prefs:catalogView", JSON.stringify("nonsense"));
  const restored = await mountLanding({ storage: garbage });
  assert.equal(restored.document.querySelector("[data-view-list]")?.getAttribute("aria-pressed"), "true");
});

test("clicking List/Slides persists the choice for next load", async () => {
  const storage = fakeStorage();
  const { document } = await mountLanding({ storage });
  assert.equal(storage.getItem("pl:v1:prefs:catalogView"), null);
  /** @type {HTMLElement} */ (document.querySelector("[data-view-slides]")).click();
  assert.equal(storage.getItem("pl:v1:prefs:catalogView"), JSON.stringify("slides"));
});

test("Clear my progress also clears the persisted catalogView", async () => {
  const storage = fakeStorage();
  storage.setItem("pl:v1:prefs:catalogView", JSON.stringify("slides"));
  const { document } = await mountLanding({ storage });
  /** @type {HTMLElement} */ (document.querySelector("[data-clear-progress]")).click();
  assert.equal(storage.getItem("pl:v1:prefs:catalogView"), null);
});
