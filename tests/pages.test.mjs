import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { makeDom, readFile, repoRoot } from "./_helpers.mjs";

const ROOT = repoRoot();
const LAB_PAGES_DIR = join(ROOT, "labs");

const PAGES = [
  { file: "n-plus-one-query.html", security: false },
  { file: "sql-injection-contact-form.html", security: true },
  { file: "one-rule-five-places.html", security: false },
  { file: "no-index-no-mercy.html", security: false }
];

const BLOCKS = ["hero", "situation", "lab", "under-the-hood", "principle", "tradeoffs", "bites", "carry-away"];

/** @param {string} file @returns {Promise<Document>} */
async function mount(file) {
  const html = readFile(`labs/${file}`);
  const { document } = makeDom(html);
  const scriptEl = document.querySelector('script[type="module"][src*="scripts/labs/"]');
  const src = scriptEl?.getAttribute("src");
  globalThis.document = document;
  if (src) await import(pathToFileURL(resolve(LAB_PAGES_DIR, src)).href + `?t=${Math.random()}`);
  return document;
}

for (const { file, security } of PAGES) {
  test(`${file}: has all 8 content blocks`, async () => {
    const document = await mount(file);
    for (const block of BLOCKS) {
      assert.ok(document.querySelector(`[data-block="${block}"]`), `missing data-block="${block}"`);
    }
  });

  test(`${file}: Trade-offs block is never empty (RULE 6b)`, async () => {
    const document = await mount(file);
    const block = document.querySelector('[data-block="tradeoffs"]');
    const paragraphs = [...(block?.querySelectorAll("p") ?? [])].map((p) => p.textContent?.trim() ?? "");
    assert.ok(paragraphs.every((p) => p.length > 0), "a trade-off paragraph is empty");
    assert.ok(paragraphs.length >= 2, "expected at least an apply-when and a don't-when paragraph");
  });

  test(`${file}: has a <noscript> fallback`, async () => {
    const document = await mount(file);
    assert.ok(document.querySelector("noscript"));
  });

  test(`${file}: has a ProvenanceTag in the hero`, async () => {
    const document = await mount(file);
    const hero = document.querySelector('[data-block="hero"]');
    assert.ok(hero?.querySelector(".provenance-tag"));
  });

  test(`${file}: mounted lab has a ModelNote`, async () => {
    const document = await mount(file);
    assert.ok(document.querySelector(".lab-model-note"));
  });

  if (security) {
    test(`${file}: security lab has a SafetyLine inside the stage`, async () => {
      const document = await mount(file);
      const stage = document.querySelector("[data-lab]");
      assert.ok(stage?.querySelector(".lab-safety-line"));
    });
  }

  test(`${file}: nav and footer are the Lab's own`, async () => {
    const document = await mount(file);
    assert.ok(document.querySelector(".lab-nav__wordmark")?.textContent?.includes("Principles Lab"));
    assert.match(document.querySelector("footer")?.textContent ?? "", /Built and maintained by Phuc/);
  });

  test(`${file}: every internal link points to a file that exists`, () => {
    const html = readFile(`labs/${file}`);
    const { document } = makeDom(html);
    for (const a of document.querySelectorAll("a[href]")) {
      const href = a.getAttribute("href") ?? "";
      if (href.startsWith("http") || href.startsWith("#")) continue;
      const target = resolve(LAB_PAGES_DIR, href === "./" ? "index.html" : href);
      assert.ok(existsSync(target), `${file}: broken link ${href}`);
    }
    for (const link of document.querySelectorAll('link[rel="stylesheet"]')) {
      const href = link.getAttribute("href") ?? "";
      if (href.startsWith("http")) continue;
      assert.ok(existsSync(resolve(LAB_PAGES_DIR, href)), `${file}: missing stylesheet ${href}`);
    }
    const scriptEl = document.querySelector('script[type="module"][src*="scripts/labs/"]');
    const src = scriptEl?.getAttribute("src") ?? "";
    assert.ok(existsSync(resolve(LAB_PAGES_DIR, src)), `${file}: missing lab script ${src}`);
  });
}
