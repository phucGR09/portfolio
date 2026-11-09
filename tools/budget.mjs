import { statSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

// Byte budgets per UI plan §2.2, amended by lab-detail-component-system.md §2
// (scripts/kernel is a new category: shared Lớp B instrument components used
// by labs — e.g. DataTable/FlowDiagram/LogTerminal — distinct from the
// store/clock/logger/server infra that scripts/runtime's cap was sized for).
// labs.css raised 36 -> 42KB when .lab-nav grew into the full .lab-header
// component (sticky state, category dropdown, search, mobile panel) — the
// old 2-link nav left only ~2.6KB of headroom, not enough for a real header.
// Keys are paths relative to repo root; a path ending without an extension
// is treated as a directory total.
// scripts/vendor is the one deliberate exception to this project's zero-
// dependency rule (see docs/implement/README.md D1/D2/D5): a vendored,
// unminified-but-already-bundled rough.esm.js (27.9KB) for hand-drawn
// schematic sketches, loaded straight from a relative import — no bundler,
// no node_modules at deploy time, so its real byte cost still has to be
// tracked here like everything else this site ships.
const BUDGET = {
  "source/labs.css": 42 * 1024,
  "source/lab.css": 22 * 1024,
  "scripts/runtime": 26 * 1024,
  "scripts/kernel": 24 * 1024,
  "scripts/vendor": 32 * 1024,
  // Raised 9KB -> 11KB for the landing's category filter dropdown
  "scripts/hub.js": 11 * 1024,
  "scripts/hub-view.js": 3.5 * 1024,
  "scripts/lab-card-anim.js": 4.5 * 1024,
  "scripts/labs-bg.js": 2.5 * 1024,
  "scripts/lesson-rail.js": 2 * 1024
};

/**
 * Sum the byte size of all files under a directory, recursively.
 * @param {string} abs
 * @returns {number}
 */
function dirSize(abs) {
  let total = 0;
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    const childAbs = join(abs, entry.name);
    if (entry.isDirectory()) {
      total += dirSize(childAbs);
    } else {
      total += statSync(childAbs).size;
    }
  }
  return total;
}

/**
 * @param {string} rel
 * @returns {number | null} size in bytes, or null if the path does not exist
 */
function sizeOf(rel) {
  const abs = join(ROOT, rel);
  let stat;
  try {
    stat = statSync(abs);
  } catch {
    return null;
  }
  return stat.isDirectory() ? dirSize(abs) : stat.size;
}

let failed = false;
const rows = [];

for (const [rel, limit] of Object.entries(BUDGET)) {
  const size = sizeOf(rel);
  if (size === null) {
    rows.push({ rel, status: "MISSING", pct: "-" });
    failed = true;
    continue;
  }
  const pct = ((size / limit) * 100).toFixed(1);
  const ok = size <= limit;
  if (!ok) failed = true;
  rows.push({ rel, status: `${size}B / ${limit}B ${ok ? "OK" : "OVER"}`, pct: `${pct}%` });
}

console.log("Budget check:");
for (const row of rows) {
  console.log(`  ${row.rel.padEnd(28)} ${row.status.padEnd(28)} ${row.pct}`);
}

// Per-lab JS budget (§2.2 UI plan): 10KB per lab file, and shared JS (runtime
// + kernel) + the lab's local import tree must stay under this total.
// Raised 64KB -> 88KB: no-index-no-mercy is the first (so far only) page to
// pull scripts/vendor/rough.esm.js (28.7KB) in via kernel/sketch.js for its
// hand-drawn schematic — labImportSize() only charges vendor's bytes to a
// page whose own import chain actually reaches it, so every other lab's
// page total is unaffected by this raise.
const LAB_FILE_LIMIT = 10 * 1024;
const PAGE_JS_LIMIT = 88 * 1024;
const sharedJsSize = (sizeOf("scripts/runtime") ?? 0) + (sizeOf("scripts/kernel") ?? 0) + (sizeOf("scripts/lesson-rail.js") ?? 0);
const labsDir = join(ROOT, "scripts", "labs");
const kernelDir = join(ROOT, "scripts", "kernel");
const vendorDir = join(ROOT, "scripts", "vendor");
/** @param {string} dir @param {string} target @returns {boolean} */
function isUnder(dir, target) {
  return target.startsWith(dir + "/") || target.startsWith(dir + "\\");
}
/**
 * Include helper modules in the page budget instead of counting only its
 * entry. scripts/kernel is already counted once for every page via
 * sharedJsSize, so walking into it here must not add its bytes again — it's
 * only traversed to find a path to scripts/vendor, which isn't part of that
 * flat shared bucket since only some labs (so far) pull in a vendored lib.
 * @param {string} file @param {Set<string>} [seen] @returns {number}
 */
function labImportSize(file, seen = new Set()) {
  if (seen.has(file)) return 0;
  seen.add(file);
  const countable = isUnder(labsDir, file) || isUnder(vendorDir, file);
  let size = countable ? statSync(file).size : 0;
  for (const [, dependency] of readFileSync(file, "utf8").matchAll(/from\s+["'](\.[^"']+)["']/g)) {
    if (!dependency) continue;
    const target = resolve(dirname(file), dependency);
    if (isUnder(labsDir, target) || isUnder(kernelDir, target) || isUnder(vendorDir, target)) size += labImportSize(target, seen);
  }
  return size;
}
/** @type {import("node:fs").Dirent[]} */
let labEntries = [];
try {
  labEntries = readdirSync(labsDir, { withFileTypes: true }).filter(
    (e) => e.isFile() && e.name.endsWith(".js") && !e.name.startsWith("_")
  );
} catch {
  labEntries = [];
}

console.log("\nPer-lab JS budget:");
for (const entry of labEntries) {
  const size = statSync(join(labsDir, entry.name)).size;
  const pageTotal = sharedJsSize + labImportSize(join(labsDir, entry.name));
  const ok = size <= LAB_FILE_LIMIT && pageTotal <= PAGE_JS_LIMIT;
  if (!ok) failed = true;
  console.log(
    `  scripts/labs/${entry.name.padEnd(24)} ${size}B/${LAB_FILE_LIMIT}B · page total ${pageTotal}B/${PAGE_JS_LIMIT}B ${ok ? "OK" : "OVER"}`
  );
}

if (failed) {
  console.error("Budget check FAILED: one or more files exceed their byte cap.");
  process.exit(1);
}

console.log("Budget check passed.");
