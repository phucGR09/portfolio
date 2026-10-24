import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PRINCIPLES_DIR = join(ROOT, "principles");
const LABS_DIR = join(ROOT, "scripts", "labs");
const EXPECTED_ZONES = ["control", "response", "internals", "verdict"];

/** @returns {string[]} */
function listPrincipleFiles() {
  let entries;
  try {
    entries = readdirSync(PRINCIPLES_DIR, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".html") && !e.name.startsWith("_"))
    .map((e) => e.name);
}

/**
 * Recursively list files under scripts/labs, relative to that directory.
 * @returns {string[]}
 */
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
    return walk(LABS_DIR, "");
  } catch {
    return [];
  }
}

/** Stage Contract #1/#2: lab.js must render exactly these 4 zones, in this order. */
function checkZoneOrder() {
  const source = readFileSync(join(ROOT, "scripts/runtime/lab.js"), "utf8");
  const match = source.match(/ZONE_ORDER\s*=\s*\[([^\]]+)]/);
  const captured = match?.[1];
  if (!captured) return ["lab.js is missing a ZONE_ORDER constant"];
  const zones = captured.split(",").map((s) => s.trim().replace(/["']/g, ""));
  if (zones.join(",") !== EXPECTED_ZONES.join(",")) {
    return [`ZONE_ORDER must be exactly ${EXPECTED_ZONES.join(" -> ")}, found ${zones.join(" -> ")}`];
  }
  return [];
}

/** Stage Contract #4: every Verdict number must trace back to store.js accounting — never a bare literal. */
function checkNoHardcodedMetrics() {
  /** @type {string[]} */
  const problems = [];
  for (const rel of listLabFiles()) {
    if (!rel.endsWith(".js")) continue;
    const source = readFileSync(join(LABS_DIR, rel), "utf8");
    const match = source.match(/metrics:\s*{([^}]*)}/);
    const captured = match?.[1];
    if (!captured) continue;
    if (/:\s*-?\d+(\.\d+)?\s*(,|$)/.test(captured)) {
      problems.push(`scripts/labs/${rel} returns a literal number inside metrics — trace it to store.js accounting instead`);
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
    const abs = join(LABS_DIR, rel);
    const source = readFileSync(abs, "utf8");
    const lines = source.split("\n").length;
    if (lines > 120) problems.push(`scripts/labs/${rel} is ${lines} lines, over the 120-line stage CSS cap`);
    if (!/\.stage--[\w-]+/.test(source)) {
      problems.push(`scripts/labs/${rel} must scope every rule under .stage--<lab-id>`);
    }
  }
  return problems;
}

const problems = [...checkZoneOrder(), ...checkNoHardcodedMetrics(), ...checkStageCss()];

if (problems.length > 0) {
  console.error("check:contract FAILED:");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

const pages = listPrincipleFiles();
console.log(
  pages.length === 0
    ? "check:contract — no pages yet; zone order, metrics and stage CSS checks passed"
    : `check:contract — ${pages.length} page(s), zone order, metrics and stage CSS checks passed`
);
