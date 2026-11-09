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

function renderCategoryCounts() {
  for (const el of document.querySelectorAll("[data-cat-count]")) {
    const cat = el.getAttribute("data-cat-count");
    const n = CATALOG.filter((e) => e.category === cat).length;
    el.textContent = n === 0 ? "none yet" : `${n} lab${n === 1 ? "" : "s"}`;
  }
}

function setupMoreFilters() {
  const triggerEl = document.querySelector("[data-more-trigger]");
  const panelEl = document.querySelector("[data-more-panel]");
  const badgeEl = document.querySelector("[data-more-badge]");
  const searchEl = document.querySelector("[data-filter-search]");
  if (!triggerEl || !panelEl || !badgeEl || !searchEl) return;
  const trigger = /** @type {HTMLElement} */ (triggerEl);
  const panel = /** @type {HTMLElement} */ (panelEl);
  const badge = /** @type {HTMLElement} */ (badgeEl);
  const search = /** @type {HTMLInputElement} */ (searchEl);

  function close() {
    trigger.setAttribute("aria-expanded", "false");
    panel.classList.add("is-hidden");
  }
  trigger.addEventListener("click", () => {
    const open = trigger.getAttribute("aria-expanded") === "true";
    trigger.setAttribute("aria-expanded", String(!open));
    panel.classList.toggle("is-hidden", open);
  });
  document.addEventListener("click", (event) => {
    const target = /** @type {Node} */ (event.target);
    if (!panel.contains(target) && !trigger.contains(target)) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });

  const rows = Array.from(panel.querySelectorAll("[data-filter-axis]"));
  search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    for (const row of rows) {
      const term = (row.getAttribute("data-term") ?? "").toLowerCase();
      row.classList.toggle("is-search-hidden", q.length > 0 && !term.includes(q));
    }
  });

  function updateBadge() {
    const count = rows.filter((row) => row.getAttribute("aria-pressed") === "true").length;
    badge.hidden = count === 0;
    badge.textContent = String(count);
  }
  for (const row of rows) row.addEventListener("click", updateBadge);
}

/**
 * Category filter — a dropdown wired the same way as the header's own
 * Browse-by-category menu (scripts/lab-nav.js's setupBrowseDropdown), just
 * local to this page and multi-select instead of navigate-on-click. The
 * actual filtering is handled by the generic [data-filter-axis] loop in
 * setupCatalog(); this only owns open/close + the toggle's badge count.
 */
function setupCategoryDropdown() {
  const root = /** @type {HTMLElement | null} */ (document.querySelector("[data-cat-filter]"));
  const toggle = document.querySelector("[data-cat-filter-toggle]");
  const menu = document.querySelector("[data-cat-filter-menu]");
  const badge = /** @type {HTMLElement | null} */ (document.querySelector("[data-cat-filter-badge]"));
  if (!root || !toggle || !menu || !badge) return;

  // An arrow, not a hoisted declaration, so the null checks above still narrow menu and badge inside it
  const updateBadge = () => {
    const count = menu.querySelectorAll('button[aria-pressed="true"]').length;
    badge.hidden = count === 0;
    badge.textContent = String(count);
  };
  for (const button of menu.querySelectorAll("button[data-filter-axis]")) {
    button.addEventListener("click", updateBadge);
  }

  toggle.addEventListener("click", () => {
    const open = root.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  document.addEventListener("click", (event) => {
    if (!root.contains(/** @type {Node} */ (event.target))) {
      root.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      root.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
  updateBadge();
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

  // A category picked from the header nav's Browse menu on another page
  // (scripts/lab-nav.js) lands here as a persisted value, not a URL param —
  // click the matching chip so this page's own filter logic stays the only
  // place that applies category filters.
  const persist = createPersist();
  const pendingCategory = persist.get("hub", "navCategory");
  if (pendingCategory) {
    persist.remove("hub", "navCategory");
    const chip = /** @type {HTMLElement | null} */ (
      document.querySelector(`[data-filter-axis="category"][data-filter-value="${pendingCategory}"]`)
    );
    chip?.click();
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
renderCategoryCounts();
setupCatalog();
setupCategoryDropdown();
setupMoreFilters();
setupClearProgress();
