// hub.js — landing: hero numbers, catalog filter+sort+view, Surprise me.
import { CATALOG, stats } from "./data/catalog.js";
import { createPersist } from "./runtime/persist.js";
import { buildCardBg } from "./lab-card-anim.js";
import { setupCatalogView } from "./hub-view.js";

const BLAST_ORDER = { annoying: 0, expensive: 1, catastrophic: 2 };
const BLAST_BARS = { annoying: 1, expensive: 2, catastrophic: 3 };

/** @type {Readonly<Record<import("./types.d.ts").Provenance, string>>} */
const PROVENANCE_LABEL = {
  classic: "Classic problem",
  "field-report": "From the field",
  derived: "Constructed example"
};

/** @param {string} tag @param {string} className @param {string} [text] @returns {HTMLElement} */
function el(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderHero() {
  const stat = document.querySelector("[data-hero-stats]");
  if (!stat) return;
  const s = stats(CATALOG);
  stat.textContent = `${s.problems} problem${s.problems === 1 ? "" : "s"} · ${s.categoriesUsed} of ${s.categoriesTotal} categories · every one runnable`;
}

/** @param {import("./types.d.ts").BlastRadius} blast @returns {HTMLElement} */
function buildSeverityBadge(blast) {
  const badge = el("span", `badge-severity badge-severity--${blast}`);
  const bars = el("span", "badge-severity__bars");
  const active = BLAST_BARS[blast];
  for (let i = 1; i <= 3; i += 1) bars.append(el("span", i <= active ? "is-active" : ""));
  badge.append(bars, document.createTextNode(blast));
  return badge;
}

/** @param {import("./types.d.ts").Provenance} provenance @returns {HTMLElement} */
function buildProvenanceBadge(provenance) {
  const badge = el("span", `badge-provenance badge-provenance--${provenance}`);
  badge.append(el("span", "badge-provenance__dot"), document.createTextNode(PROVENANCE_LABEL[provenance]));
  return badge;
}

/** @param {import("./types.d.ts").CatalogEntry} entry @returns {HTMLElement} */
function buildCard(entry) {
  const card = /** @type {HTMLAnchorElement} */ (el("a", "catalog-card"));
  card.href = `./${entry.slug}.html`;
  card.append(buildCardBg(entry.slug));

  const content = el("span", "catalog-card__content");
  const meta = el("span", "catalog-card__meta");
  meta.append(buildProvenanceBadge(entry.provenance), buildSeverityBadge(entry.blastRadius));
  content.append(
    meta,
    el("h3", "catalog-card__title", entry.principle),
    el("p", "catalog-card__overview", entry.title),
    el("span", "catalog-card__cta", "Open the lab →")
  );
  card.append(content);
  return card;
}

function setupCatalog() {
  const grid = document.querySelector("[data-catalog-grid]");
  const track = document.querySelector("[data-catalog-track]");
  const trackControls = document.querySelector("[data-track-controls]");
  const listButton = document.querySelector("[data-view-list]");
  const slidesButton = document.querySelector("[data-view-slides]");
  const prevButton = document.querySelector("[data-track-prev]");
  const nextButton = document.querySelector("[data-track-next]");
  if (!grid || !track || !trackControls || !listButton || !slidesButton || !prevButton || !nextButton) return;

  const view = setupCatalogView({
    listEl: /** @type {HTMLElement} */ (grid),
    trackEl: /** @type {HTMLElement} */ (track),
    trackControls: /** @type {HTMLElement} */ (trackControls),
    listButton: /** @type {HTMLButtonElement} */ (listButton),
    slidesButton: /** @type {HTMLButtonElement} */ (slidesButton),
    prevButton: /** @type {HTMLButtonElement} */ (prevButton),
    nextButton: /** @type {HTMLButtonElement} */ (nextButton)
  });

  /** @type {{ category: Set<string>, difficulty: Set<string>, blastRadius: Set<string> }} */
  const active = { category: new Set(), difficulty: new Set(), blastRadius: new Set() };

  function apply() {
    const filtered = CATALOG.filter((e) =>
      (active.category.size === 0 || active.category.has(e.category)) &&
      (active.difficulty.size === 0 || active.difficulty.has(e.difficulty)) &&
      (active.blastRadius.size === 0 || active.blastRadius.has(e.blastRadius))
    );
    if (filtered.length === 0) {
      view.render([el("p", "", "No pages match every filter at once — try removing one.")]);
      return;
    }
    const sorted = filtered.slice().sort((a, b) => BLAST_ORDER[b.blastRadius] - BLAST_ORDER[a.blastRadius]);
    view.render(sorted.map(buildCard));
  }

  for (const chip of document.querySelectorAll("[data-filter-axis]")) {
    chip.addEventListener("click", () => {
      const axis = /** @type {"category" | "difficulty" | "blastRadius"} */ (chip.getAttribute("data-filter-axis") ?? "");
      const value = chip.getAttribute("data-filter-value") ?? "";
      const set = active[axis];
      if (!set) return;
      const pressed = chip.getAttribute("aria-pressed") === "true";
      chip.setAttribute("aria-pressed", String(!pressed));
      if (pressed) set.delete(value);
      else set.add(value);
      apply();
    });
  }

  const surprise = document.querySelector("[data-surprise]");
  surprise?.addEventListener("click", () => {
    const slug = pickSurprise();
    if (slug && typeof window !== "undefined" && window.location) window.location.href = `./${slug}.html`;
  });

  apply();
}

/** @returns {string | undefined} picks only among runnable slugs */
export function pickSurprise() {
  const runnable = CATALOG.filter((e) => e.runnable);
  return runnable[Math.floor(Math.random() * runnable.length)]?.slug;
}

function setupClearProgress() {
  const button = document.querySelector("[data-clear-progress]");
  button?.addEventListener("click", () => {
    const persist = createPersist();
    for (const scope of /** @type {const} */ (["read", "prefs", "hub"])) persist.remove(scope);
    persist.remove("prefs", "catalogView");
  });
}

renderHero();
setupCatalog();
setupClearProgress();
