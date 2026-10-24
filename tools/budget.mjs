import { statSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

// Byte budgets per UI plan §2.2. Keys are paths relative to repo root;
// a path ending without an extension is treated as a directory total.
const BUDGET = {
  "source/principles.css": 14 * 1024,
  "source/lab.css": 18 * 1024,
  "scripts/runtime": 24 * 1024,
  "scripts/hub.js": 6 * 1024
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
    rows.push({ rel, status: "skip (not created yet)", pct: "-" });
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

if (failed) {
  console.error("Budget check FAILED: one or more files exceed their byte cap.");
  process.exit(1);
}

console.log("Budget check passed.");
