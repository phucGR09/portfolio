// lab-nav.js — behavior for .lab-header, shared by every /labs/*.html page:
// sticky/compact on scroll, Browse-by-category dropdown + mobile panel (both
// built from the live catalog, never hardcoded counts), inline search, and
// the hamburger menu. Loaded on every lab page; the landing page also loads
// hub.js, which owns the catalog grid/filter chips themselves.
import { CATALOG, CATEGORIES, stats } from "./data/catalog.js";
import { createPersist } from "./runtime/persist.js";

/** @type {Readonly<Record<string, string>>} */
const CATEGORY_LABELS = {
  data: "Data & Database",
  security: "Security & Trust",
  "code-design": "Code Design",
  api: "API & Contracts",
  performance: "Performance & Scale",
  reliability: "Reliability & Ops"
};

const persist = createPersist();

function renderStat() {
  const stat = document.querySelector("[data-nav-stat]");
  if (!stat) return;
  const s = stats(CATALOG);
  stat.textContent = `${s.problems} problem${s.problems === 1 ? "" : "s"} · ${s.categoriesUsed}/${s.categoriesTotal} categories`;
}

/**
 * Jumping to a category from the landing page re-uses its own filter chips
 * (click the existing [data-filter-axis="category"] button) instead of
 * re-implementing filtering here. From any other page, the chosen category
 * is handed to the landing page via persist("hub", "navCategory") and
 * applied there on load (see hub.js).
 * @param {string} category
 */
function goToCategory(category) {
  const isLanding = document.body.classList.contains("landing");
  if (isLanding) {
    const chip = /** @type {HTMLElement | null} */ (
      document.querySelector(`[data-filter-axis="category"][data-filter-value="${category}"]`)
    );
    chip?.click();
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  persist.set("hub", "navCategory", category);
  window.location.href = "./index.html";
}

/** @param {(category: string) => void} onPick @returns {DocumentFragment} */
function buildCategoryItems(onPick) {
  const fragment = document.createDocumentFragment();
  for (const category of CATEGORIES) {
    const count = CATALOG.filter((entry) => entry.category === category).length;
    const button = document.createElement("button");
    button.type = "button";
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.style.background = `var(--cat-${category})`;
    button.append(dot, document.createTextNode(CATEGORY_LABELS[category] ?? category));
    const countEl = document.createElement("span");
    countEl.className = "count";
    countEl.textContent = count === 0 ? "none yet" : String(count);
    button.append(countEl);
    button.addEventListener("click", () => onPick(category));
    fragment.append(button);
  }
  return fragment;
}

function setupBrowseDropdown() {
  const root = document.querySelector("[data-nav-browse]");
  const toggle = document.querySelector("[data-nav-browse-toggle]");
  const menu = document.querySelector("[data-nav-browse-menu]");
  if (!root || !toggle || !menu) return;

  menu.append(buildCategoryItems((category) => {
    root.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    goToCategory(category);
  }));

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
}

function setupMobileCategories() {
  const group = document.querySelector("[data-nav-mobile-categories]");
  if (!group) return;
  group.append(buildCategoryItems((category) => goToCategory(category)));
}

/**
 * @param {HTMLInputElement} input
 * @param {HTMLElement} results
 */
function setupSearch(input, results) {
  /** @param {string} query */
  function render(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
      results.hidden = true;
      results.replaceChildren();
      return;
    }
    const matches = CATALOG.filter(
      (entry) => entry.principle.toLowerCase().includes(q) || entry.title.toLowerCase().includes(q)
    ).slice(0, 5);
    results.replaceChildren();
    if (matches.length === 0) {
      results.hidden = true;
      return;
    }
    for (const entry of matches) {
      const link = document.createElement("a");
      link.href = `./${entry.slug}.html`;
      const sub = document.createElement("span");
      sub.textContent = ` — ${entry.title}`;
      link.append(entry.principle, sub);
      results.append(link);
    }
    results.hidden = false;
  }

  input.addEventListener("input", () => render(input.value));
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const first = /** @type {HTMLAnchorElement | null} */ (results.querySelector("a"));
      if (first) window.location.href = first.href;
    } else if (event.key === "Escape") {
      input.value = "";
      render("");
      input.blur();
    }
  });
  document.addEventListener("click", (event) => {
    const target = /** @type {Node} */ (event.target);
    if (!input.contains(target) && !results.contains(target)) results.hidden = true;
  });
}

function setupDesktopSearch() {
  const input = /** @type {HTMLInputElement | null} */ (document.querySelector("[data-nav-search-input]"));
  const results = /** @type {HTMLElement | null} */ (document.querySelector("[data-nav-search-results]"));
  if (!input || !results) return;
  setupSearch(input, results);
}

function setupMobileSearch() {
  const input = /** @type {HTMLInputElement | null} */ (document.querySelector("[data-nav-mobile-search-input]"));
  const results = document.querySelector("[data-nav-mobile-search-results]");
  if (!input || !results) return;
  setupSearch(input, /** @type {HTMLElement} */ (results));
}

function setupBurger() {
  const header = document.querySelector("[data-lab-header]");
  const burger = document.querySelector("[data-nav-burger]");
  if (!header || !burger) return;
  burger.addEventListener("click", () => {
    const open = header.classList.toggle("is-menu-open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  });
}

function setupStickyHeader() {
  const header = document.querySelector("[data-lab-header]");
  if (!header) return;
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

renderStat();
setupBrowseDropdown();
setupMobileCategories();
setupDesktopSearch();
setupMobileSearch();
setupBurger();
setupStickyHeader();
