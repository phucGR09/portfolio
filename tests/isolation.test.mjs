import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "./_helpers.mjs";

const ROOT = repoRoot();

/**
 * Recursively list files under a directory, relative to repo root.
 * Returns an empty list if the directory does not exist yet.
 * @param {string} relDir
 * @returns {string[]}
 */
function listFiles(relDir) {
  const abs = join(ROOT, relDir);
  /** @type {string[]} */
  const out = [];
  let entries;
  try {
    entries = readdirSync(abs, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const childRel = join(relDir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFiles(childRel));
    } else {
      out.push(childRel);
    }
  }
  return out;
}

/**
 * @param {string} relPath
 * @returns {string}
 */
function read(relPath) {
  return readFileSync(join(ROOT, relPath), "utf8");
}

const portfolioFiles = ["index.html", ...listFiles("pages")].filter((f) =>
  statSync(join(ROOT, f)).isFile()
);
const labFiles = listFiles("principles");

test("case 1: no portfolio file links to principles/", () => {
  const offenders = portfolioFiles.filter((f) => read(f).includes("principles/"));
  assert.deepEqual(offenders, [], `portfolio must not reference principles/: ${offenders.join(", ")}`);
});

test("case 2: no lab file links back to the portfolio", () => {
  const offenders = labFiles.filter((f) => {
    const content = read(f);
    return (
      content.includes("../index.html") ||
      /href=["']\/?index\.html["']/.test(content) ||
      /href=["'](\.\.\/)?pages\/[^"']*\.html["']/.test(content)
    );
  });
  assert.deepEqual(offenders, [], `lab files must not link to the portfolio: ${offenders.join(", ")}`);
});

test("case 3: no lab file loads portfolio CSS", () => {
  const offenders = labFiles.filter((f) => {
    const content = read(f);
    return content.includes("source/styles.css") || content.includes("source/case-study.css");
  });
  assert.deepEqual(offenders, [], `lab files must not load portfolio CSS: ${offenders.join(", ")}`);
});

test("case 4: no lab file references the stack-logo CDN", () => {
  const offenders = labFiles.filter((f) => read(f).includes("cdn.simpleicons.org"));
  assert.deepEqual(offenders, [], `lab files must not use cdn.simpleicons.org: ${offenders.join(", ")}`);
});

test("case 5: every lab HTML page loads principles.css and lab.css", () => {
  const htmlFiles = labFiles.filter((f) => f.endsWith(".html"));
  const offenders = htmlFiles.filter((f) => {
    const content = read(f);
    return !content.includes("source/principles.css") || !content.includes("source/lab.css");
  });
  assert.deepEqual(offenders, [], `every lab page must load both Lab stylesheets: ${offenders.join(", ")}`);
});

test("case 6: principles.css never @imports anything (self-contained chassis, RULE 0)", () => {
  const content = read("source/principles.css");
  assert.doesNotMatch(content, /@import/);
});
