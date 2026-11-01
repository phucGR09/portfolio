import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { makeDom, readFile, repoRoot } from "./_helpers.mjs";
import { join } from "node:path";

const LAB_PAGES_DIR = join(repoRoot(), "labs");
const PUBLIC_PAGES = readdirSync(LAB_PAGES_DIR)
  .filter((f) => f.endsWith(".html") && !f.startsWith("_"))
  .map((f) => `labs/${f}`);

test("exactly the public pages are under test (sanity)", () => {
  assert.ok(PUBLIC_PAGES.length >= 4, "expected landing + 3 lessons");
});

for (const page of PUBLIC_PAGES) {
  test(`${page}: footer has the plain attribution line, with no <a> wrapping it`, () => {
    const { document } = makeDom(readFile(page));
    const footer = document.querySelector("footer");
    assert.ok(footer, `${page} has no footer`);
    assert.match(footer.textContent ?? "", /Built and maintained by Phuc/);
    for (const a of footer.querySelectorAll("a")) {
      assert.doesNotMatch(a.textContent ?? "", /Phuc/, `${page}: attribution line must not be a link`);
    }
  });

  test(`${page}: "Phuc" appears only in the footer signature`, () => {
    const { document } = makeDom(readFile(page));
    const nav = document.querySelector("nav")?.textContent ?? "";
    const hero = document.querySelector('[data-block="hero"], .lesson-hero')?.textContent ?? "";
    assert.doesNotMatch(nav, /Phuc/);
    assert.doesNotMatch(hero, /Phuc/);
  });

  test(`${page}: no job title, full name, or mailto: link anywhere`, () => {
    const source = readFile(page);
    assert.doesNotMatch(source, /mailto:/);
    assert.doesNotMatch(source, /Phan Van Phuc/);
    for (const title of ["Software Engineer", "Developer", "Founder"]) {
      assert.doesNotMatch(source, new RegExp(title));
    }
  });
}
