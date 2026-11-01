import { readdirSync, readFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseHTML } from "linkedom";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const LAB_PAGES_DIR = join(ROOT, "labs");
const LAB_MODULES_DIR = join(ROOT, "scripts", "labs");
const EXPECTED_ZONES = ["control", "response", "internals", "verdict"];

/** @returns {string[]} */
function listPrincipleFiles() {
  let entries;
  try {
    entries = readdirSync(LAB_PAGES_DIR, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".html") && !e.name.startsWith("_"))
    .map((e) => e.name);
}

/** @returns {string[]} */
function listLabFiles() {
  /** @param {string} dir @param {string} rel @returns {string[]} */
  function walk(dir, rel) {
    /** @type {string[]} */
    const out = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const childRel = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) out.push(...walk(join(dir, entry.name), childRel));
      else out.push(childRel);
    }
    return out;
  }
  try {
    return walk(LAB_MODULES_DIR, "");
  } catch {
    return [];
  }
}

/**
 * Stage Contract #1/#2: mount the page's real lab script against a real DOM
 * (same way tests/lab.test.mjs does) and read back the zones it rendered —
 * parsing the static HTML would find nothing, since lab.js builds the 4
 * zones at runtime.
 * @param {string} fileName
 * @returns {Promise<string[]>}
 */
async function checkPageZones(fileName) {
  const abs = join(LAB_PAGES_DIR, fileName);
  const html = readFileSync(abs, "utf8");
  const { document } = parseHTML(html);
  const scriptEl = document.querySelector('script[type="module"][src*="scripts/labs/"]');
  const src = scriptEl?.getAttribute("src");
  if (!src) return [`${fileName}: no scripts/labs/*.js <script type="module"> found in the stage`];

  const modulePath = resolve(LAB_PAGES_DIR, src);
  globalThis.document = document;
  try {
    await import(pathToFileURL(modulePath).href);
  } finally {
    globalThis.document = /** @type {Document} */ (/** @type {unknown} */ (undefined));
  }

  const zoneEls = [...document.querySelectorAll("[data-zone]")];
  const names = zoneEls.map((el) => el.getAttribute("data-zone"));
  if (names.join(",") !== EXPECTED_ZONES.join(",")) {
    return [`${fileName}: zones rendered as ${names.join(" -> ") || "(none)"}, expected ${EXPECTED_ZONES.join(" -> ")}`];
  }
  return [];
}

// Doc-specified whitelist (phase-02-mvp.md Step 2.2): 0, 1, -1 are common
// legitimate defaults/fallbacks, not a faked result.
const LITERAL_WHITELIST = new Set(["0", "1", "-1"]);

/** Stage Contract #4: every Verdict number must trace back to store.js accounting — never a bare literal. */
function checkNoHardcodedMetrics() {
  /** @type {string[]} */
  const problems = [];
  for (const rel of listLabFiles()) {
    if (!rel.endsWith(".js")) continue;
    const source = readFileSync(join(LAB_MODULES_DIR, rel), "utf8");
    const match = source.match(/metrics:\s*{([^}]*)}/);
    const captured = match?.[1];
    if (!captured) continue;
    const found = captured.match(/:\s*(-?\d+(?:\.\d+)?)\s*(?:,|$)/);
    const literal = found?.[1];
    if (literal && !LITERAL_WHITELIST.has(literal)) {
      problems.push(`scripts/labs/${rel} returns literal ${literal} inside metrics — trace it to store.js accounting instead`);
    }
  }
  return problems;
}

/** Stage Contract #7/#8: stage CSS is scoped under .stage--<id> and stays <= 120 lines. */
function checkStageCss() {
  /** @type {string[]} */
  const problems = [];
  for (const rel of listLabFiles()) {
    if (!rel.endsWith(".css")) continue;
    const abs = join(LAB_MODULES_DIR, rel);
    const source = readFileSync(abs, "utf8");
    const lines = source.split("\n").length;
    if (lines > 120) problems.push(`scripts/labs/${rel} is ${lines} lines, over the 120-line stage CSS cap`);
    if (!/\.stage--[\w-]+/.test(source)) {
      problems.push(`scripts/labs/${rel} must scope every rule under .stage--<lab-id>`);
    }
  }
  return problems;
}

const pages = listPrincipleFiles();
if (pages.length === 0) {
  console.error("check:contract FAILED: no principle pages found — the lab pages directory is empty or missing.");
  process.exit(1);
}
// index.html's mini lab is lazy-loaded via dynamic import (no direct
// <script src>), so it has nothing for the static per-page mount check to
// find. It reuses the same kernel as every lesson page, which lab.test.mjs
// already verifies independently.
const lessonPages = pages.filter((p) => p !== "index.html");
/** @type {string[]} */
const pageProblems = [];
for (const page of lessonPages) {
  pageProblems.push(...(await checkPageZones(page)));
}

const problems = [...pageProblems, ...checkNoHardcodedMetrics(), ...checkStageCss()];

if (problems.length > 0) {
  console.error("check:contract FAILED:");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(
  lessonPages.length === 0
    ? "check:contract — no pages yet; metrics and stage CSS checks passed"
    : `contract: ${lessonPages.length}/${lessonPages.length} pages pass automated checks (1,2,4,7,8)`
);
console.log("manual still required: 3 (six states) 5 (360px) 6 (keyboard/SR) 9 (reset) 10 (ModelNote/CLS)");
