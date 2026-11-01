# /labs rename + landing revamp — plan (draft, no code written yet)

> Scope: (1) move the Lab section from `/principles/` to `/labs/`, (2) revamp the landing page (`/labs/index.html`): fix layout/typography first, then add a full-screen animated background and a list/slideshow toggle for the catalog.
> Out of scope: `docs/implement/instrument-revamp.md` and the server-map/terminal revamp — separate work, awaiting its own approval.
> Status: **plan**, no real file touched except this one.
> Rev 2 (2026-11-01): after review — fixed the Phase A file inventory, added a "gate must not pass vacuously" step, added Phase B0 (layout/typography), revised Phase B/C design rules.

---

## 0. Assumptions to confirm before coding

| # | Assumption | Rationale |
|---|---|---|
| A1 | Rename the **directory** `principles/` → `labs/`, keep **flat files** per slug (`labs/n-plus-one-query.html`), no nested folders (`labs/n-plus-one-query/index.html`) | Static GitHub Pages, no server routing; flat files are the cheapest path change with no rewrite rules |
| A2 | Keep the `slug` strings in `catalog.js` unchanged (e.g. `"n-plus-one-query"`) — only *where* slugs live changes | Slugs are already kebab-case; no technical reason to change the text |
| A3 | `source/principles.css` (landing + lesson chassis) → `source/labs.css`; `source/lab.css` (4-zone Stage Contract) **keeps its name** | Different roles; renaming both invites confusion |
| A4 | Background + catalog toggle apply to **`/labs/index.html` only** | Lesson pages must keep the 4-zone Stage Contract (RULE 0) — no scope creep there |
| A5 | The view toggle persists via the existing `persist.js` `"prefs"` scope (no new scope) | Keeps `PersistScope` in `types.d.ts` unchanged; "Clear my progress" already clears `prefs` |
| A6 | **Brand stays "Principles Lab"** (wordmark, `<title>`, `package.json` name); only the URL path changes | Path rename is mechanical; a brand rename is a content decision — confirm if you want it too |
| A7 | **No redirect from `/principles/` is needed** | `principles/index.html` and the 3 lessons are not committed yet, so they were never deployed. Only `_demo.html`, `_states.html`, `_template.html` are tracked, and those are internal dev pages |

If any assumption is wrong, say so before Phase A — later phases depend on these.

---

## 1. Phase A — Path rename (mechanical, no behavior change)

Goal: `/principles/` disappears, `/labs/` replaces it 1:1, `npm run verify` stays green **and the green actually means something** (see A.0). Not mixed with B0/B/C so the diff is easy to review and revert on its own.

### A.0 — Harden the gates first (separate commit, before moving anything)

Several checks currently **pass vacuously** when their directory is missing. Move the folder and forget one path, and the gate still goes green:

| Check | Current behavior on missing dir | Fix |
|---|---|---|
| `tests/isolation.test.mjs` `listFiles()` | `catch { return [] }` → cases 2–5 loop over nothing and pass | Add `assert.ok(labFiles.length > 0, "no lab files found")` |
| `tools/check-contract.mjs` `listPrincipleFiles()` | `catch { return [] }` → no pages checked, exits 0 | Exit non-zero when the list of pages is empty |
| `tools/budget.mjs` `sizeOf()` | returns `null` → prints `skip (not created yet)`, does not fail | Treat `skip` as a failure for every key now that all budgeted files exist |
| `tests/attribution.test.mjs` | `readdirSync` throws (loud) + sanity `>= 4` | Already OK |
| `tests/pages.test.mjs` | `readFile` throws (loud) | Already OK |

Run `npm run verify` after A.0 — must be green **before** the rename, so any later red is caused by the rename.

### A.1 — File inventory (re-grepped 2026-11-01)

**Move (`git mv`, keeps history):**

| From | To | Edits inside |
|---|---|---|
| `principles/index.html` | `labs/index.html` | `<link>` → `../source/labs.css` |
| `principles/n-plus-one-query.html` | `labs/…` | `<link>` → `../source/labs.css` |
| `principles/sql-injection-contact-form.html` | `labs/…` | `<link>` → `../source/labs.css` |
| `principles/one-rule-five-places.html` | `labs/…` | `<link>` → `../source/labs.css` |
| `principles/_demo.html` | `labs/_demo.html` | `<link>` → `../source/labs.css` |
| `principles/_states.html` | `labs/_states.html` | `<link>` → `../source/labs.css` |
| `principles/_template.html` | `labs/_template.html` | `<link>` → `../source/labs.css` |
| `source/principles.css` | `source/labs.css` | Header comment + the `/principles/` mention on line 92 |

Every page links `../source/principles.css` (e.g. `principles/n-plus-one-query.html:10`), so **no page moves "as-is"**.

**Edit in place:**

| File | Change |
|---|---|
| `tests/isolation.test.mjs` | `listFiles("principles")` → `"labs"`; case 1 string check; case 5 + 6 `source/principles.css` → `source/labs.css`; update test titles |
| `tests/attribution.test.mjs` | `PRINCIPLES_DIR` → `LAB_PAGES_DIR = join(…, "labs")`; `` `principles/${f}` `` → `` `labs/${f}` `` |
| `tests/hub.test.mjs` | `readFile("principles/index.html")` → `"labs/index.html"` |
| `tests/landing.test.mjs` | `readFile(…)` path + test title "leaves /principles/" → "/labs/" |
| `tests/pages.test.mjs` | `PRINCIPLES_DIR` + 2× `` `principles/${file}` `` |
| `tools/budget.mjs` | Key `"source/principles.css"` → `"source/labs.css"` |
| `tools/check-contract.mjs` | `PRINCIPLES_DIR` → `LAB_PAGES_DIR` pointing at `labs/` (see naming note below) |
| `scripts/hub.js` | No change — links use `./${slug}.html`. Verified. |
| `docs/implement/README.md`, `phase-00/01/02/04/05-*.md`, `_self-check-template.md` | Update paths in tables/examples only |
| `docs/principles-lab-plan.md`, `docs/principles-lab-ui-plan.md` | Update example paths only; **do not** touch design decisions or file names |
| `docs/implement/decisions.log` | Append 1 entry recording the rename (existing format) |

### A.2 — Naming collision: three `labs` directories

After the rename there will be `labs/` (pages), `scripts/labs/` (lab modules), `tests/labs/` (lab tests). Mitigations:

- `tools/check-contract.mjs` already has `LABS_DIR = scripts/labs`. Name the new constant `LAB_PAGES_DIR`, and rename the existing one to `LAB_MODULES_DIR`, so the two are never confused.
- Isolation case 1 currently does `content.includes("principles/")`. As `includes("labs/")` it would false-positive on any portfolio text mentioning `scripts/labs/`. Tighten it to a link check anchored at the start of the URL, so `../scripts/labs/…` never matches: `/(href|src)=["'](\.\.?\/|\/)?labs\//`.

### A.3 — Not changed in Phase A

- Variable/file names `hub` / `hub.js` (D12 in README — prose says "landing", code keeps `hub`).
- Brand text "Principles Lab" (A6).
- File names of `docs/principles-lab-*.md` — they are design docs, not routes.

### Gate

1. `npm run verify` green, with A.0 hardening in place.
2. `npm run serve` → open `http://localhost:8000/labs/`, click into each of the 3 labs, confirm styles load (no unstyled flash = CSS link correct) and the "Surprise me" button lands on a real page.
3. `git grep -n "principles/"` → only hits in historical `decisions.log` lines and `docs/principles-lab-*.md` design text.

---

## 2. Phase B0 — Layout + typography fixes (new)

Background and toggle are polish. The most visible problems on the current landing (see `docs/implement/image.png`) are structural and must be fixed first:

| Problem | Cause (from the CSS) | Fix direction |
|---|---|---|
| "Browse problems" CTA and hero text sit offset from the content column below | `.landing .lesson-hero` is `max-width: 68ch` centered, while `.landing .lesson-block` is `max-width: 1100px` centered → different left edges (`principles.css:224-226`) | One shared content width/left edge for hero + blocks (a `--landing-col` token), hero text constrained by `max-width` on the text, not on the container |
| Mini-lab fills only the left half; the "simulated" disclosure floats alone on the right | `[data-lab-size="mini"]` uses `repeat(auto-fit, minmax(160px, 1fr))` (`lab.css:21-24`) but the zones end up stacked in one column next to the disclosure — confirm the exact DOM shape in B0 before choosing the fix | Mini variant: zones in a 2×2 grid (control+response / internals+verdict) on ≥900px, stacked below; disclosure placed under the grid, not as a grid column |
| Weak hierarchy: h2 (`--fs-h2: 1.1rem`) barely larger than body text | Scale tuned for lesson pages, reused unchanged on the landing | Landing-only heading scale (`.landing h2` ~1.5–1.75rem), keep lesson tokens untouched |
| Too much empty vertical space between sections | `--sp-5`/`--sp-6` paddings stacked with the 0.43fr/1fr two-column grid that the landing then overrides to 1fr | Review section rhythm in the mockup; one padding token per section |

Constraints: `lab.css` changes are allowed **only** under `[data-lab-size="mini"]` so full lesson stages are untouched (RULE 0 / Stage Contract).

---

## 3. Phase B — Full-screen animated background for `/labs/index.html`

### Rules

- **Palette stays in the chassis**: background uses the existing navy tokens (`--stage-bg-void` / `--navy`), accent uses `--mint` (`#64ffda`). No new near-black like `#0a0a0c` — landing → lesson navigation must not jump between two different dark backgrounds. No third color, no multi-stop gradients.
- **Squares as "transfer size"**: each square has a random size within a bounded range (e.g. 8–64px) — large = big payload, small = small payload. Purely decorative, not tied to any lab's real numbers.
- **Fade, never jerk**: opacity 0 → low target (0.06–0.18) → hold → 0. Optional subtle scale; no translate.
- **Repositioning (decision)**: CSS `@keyframes` drives the fade; a tiny JS handler on `animationiteration` moves the square to a new random position/size while it is invisible. No `requestAnimationFrame` loop. Negative `animation-delay` staggers the initial phases.
- **Non-blocking layer**: `position: fixed; inset: 0; z-index: -1` (lowest), `pointer-events: none`, `aria-hidden="true"`, no focusable children.
- **`prefers-reduced-motion: reduce`**: no animation, no `animationiteration` handler; render a few static faint squares (RULE 17 convention as in `lab.css`).
- **Performance cap**: max ~20–24 squares; animate only `opacity`/`transform` (compositor-only). Pause when the tab is hidden (`visibilitychange` → `animation-play-state: paused`).

### Files

- CSS: own block in `source/labs.css` (not `source/lab.css`, not `source/styles.css` — RULE 0 / D11).
- Markup: `<div class="labs-bg" aria-hidden="true"></div>` in `labs/index.html`; children generated by a new `scripts/labs-bg.js` (not under `scripts/runtime/` — not part of the Stage Contract; not under `scripts/labs/` — that dir is lab modules and budget-checked as such).
- **Budget**: add `"scripts/labs-bg.js": 2 * 1024` to `tools/budget.mjs`.

---

## 4. Phase C — Catalog cards + list/slideshow toggle

### Prerequisite: split the shared grid class

`.catalog-grid` is used by **both** "Browse by category" (`hub.js` → `[data-block="browse"] .catalog-grid`) and "Every problem" (`[data-catalog-grid]`). Split into `.category-grid` and `.catalog-grid` first so card/view changes affect only the catalog.

### Cards

- Keep the `repeat(auto-fill, minmax(260px, 1fr))` grid for equal column widths; cards **hug their content vertically** (`align-items: start`) instead of stretching to the tallest card in the row.
- **No `width: fit-content` / `flex-wrap`** — variable title lengths produce a ragged, uneven row.
- Content unchanged: category pill, provenance tag, principle title, "Open the lab →" CTA.

### View toggle

- **List view**: the current filtered grid.
- **Slide view**: a horizontal track built on native CSS scroll snapping:
  - `overflow-x: auto; scroll-snap-type: x mandatory;` cards `scroll-snap-align: center`.
  - Touch swipe, trackpad and shift+wheel work natively; ‹ › buttons call `track.scrollBy({ left: ±cardWidth })`.
  - Arrow keys ← → when the track has focus (`tabindex="0"`, `role="region"`, `aria-label="Problems, slide view"`).
  - `prefers-reduced-motion` → `scroll-behavior: auto` (instant).
  - Hide ‹ › when the filtered result has ≤ 1 card; disable ‹ at start / › at end (via `scroll` event + `scrollLeft` bounds).
  - Filter changes reset `scrollLeft` to 0.
- Switching views may use `document.startViewTransition()` when available, plain swap otherwise (and always plain under reduced motion).
- Control: segmented control "List / Slides" above `#catalog`, `aria-pressed` on each button.
- Persist: `persist.set("prefs", "catalogView", "list" | "slides")`, read on load (A5); invalid/missing value → `"list"`.
- **Note**: with 3 problems the slideshow is low-value; it is built for when the catalog grows. List stays the default.
- **Budget**: `scripts/hub.js` is capped at 7KB. If the toggle pushes it over, move view logic to `scripts/hub-view.js` with its own budget entry rather than raising the cap silently.

### Gate

Add/update tests in `tests/landing.test.mjs` / `tests/hub.test.mjs`:
- Both views render exactly the filtered `CATALOG` count.
- Toggling views keeps active filters; filtering in slide view resets position.
- Persisted `catalogView` is restored; garbage value falls back to `"list"`.
- `.labs-bg` is `aria-hidden`, has no focusable descendants.
- Browse-by-category grid is unaffected by view mode.

---

## 5. Execution order

1. **Phase A.0** — gate hardening, verify green.
2. **Phase A** — rename, verify green, manual smoke test; reviewed on its own.
3. **Mockup Artifact** for **B0 + B + C together** (fake data, like previous mockups): layout/typography, background motion, card + slideshow — approve before real code.
4. Implement B0 → B → C in that order in `labs/index.html`, `scripts/hub.js`, `source/labs.css`, `scripts/labs-bg.js` (+ the mini-variant rules in `source/lab.css`).
5. Update tests, run `npm run verify`.
6. Append a `decisions.log` entry for each deviation from this plan (existing convention).

---

## 6. Out of scope

- The 4-zone Stage Contract structure of lesson pages (only the landing's `mini` variant is restyled in B0).
- `scripts/runtime/lab.js` and the server-map/terminal revamp (`docs/implement/instrument-revamp.md`).
- New labs, `catalog.js` data changes (none needed per A2).
- Brand rename (A6) and `/principles/` redirect (A7) unless confirmed otherwise.
