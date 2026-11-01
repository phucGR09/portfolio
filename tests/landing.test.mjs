import { test } from "node:test";
import assert from "node:assert/strict";
import { makeDom, readFile } from "./_helpers.mjs";

const html = readFile("labs/index.html");

test("landing has hero and catalog blocks via data-block", () => {
  const { document } = makeDom(html);
  for (const name of ["hero", "catalog"]) {
    assert.ok(document.querySelector(`[data-block="${name}"]`), `missing data-block="${name}"`);
  }
  assert.ok(document.querySelector("footer"), "missing footer block");
});

test("hero has the wordmark, the tagline, and a stats mount point", () => {
  const { document } = makeDom(html);
  assert.ok(document.querySelector(".lab-nav__wordmark")?.textContent?.includes("Principles Lab"));
  const hero = document.querySelector('[data-block="hero"]');
  assert.match(hero?.textContent ?? "", /Flip the principle off/);
  assert.ok(hero?.querySelector("[data-hero-stats]"));
});

test("hero loop demo is decorative: aria-hidden, no focusable descendants", () => {
  const { document } = makeDom(html);
  const demo = document.querySelector(".hero-demo");
  assert.ok(demo, "missing .hero-demo");
  assert.equal(demo.getAttribute("aria-hidden"), "true");
  for (const button of demo.querySelectorAll("button")) {
    assert.equal(button.getAttribute("tabindex"), "-1", "hero-demo control must not be tab-reachable");
  }
});

test(".labs-bg is aria-hidden and ships no content of its own (populated at runtime)", () => {
  const { document } = makeDom(html);
  const bg = document.querySelector(".labs-bg");
  assert.ok(bg, "missing .labs-bg mount point");
  assert.equal(bg.getAttribute("aria-hidden"), "true");
  assert.equal(bg.children.length, 0);
});

test("catalog block ships filters, a List/Slides toggle, and both view mount points", () => {
  const { document } = makeDom(html);
  const block = document.querySelector('[data-block="catalog"]');
  assert.ok(block);
  assert.ok(block.querySelector("[data-catalog-grid]"), "missing list mount point");
  assert.ok(block.querySelector("[data-catalog-track]"), "missing slide-track mount point");
  assert.ok(block.querySelector("[data-track-controls]"), "missing track prev/next controls");
  assert.ok(block.querySelector("[data-view-list]"));
  assert.ok(block.querySelector("[data-view-slides]"));
  assert.ok(block.querySelector("[data-surprise]"));
});

test("footer has the safety line, a changelog entry point, and the plain attribution line", () => {
  const { document } = makeDom(html);
  const footer = document.querySelector("footer");
  assert.match(footer?.textContent ?? "", /computed by a simulation that runs in your browser/);
  assert.ok(footer?.querySelector("details summary")?.textContent?.match(/changelog/i));
  assert.match(footer?.textContent ?? "", /Built and maintained by Phuc/);
});

test("no link on the landing page leaves /labs/", () => {
  const { document } = makeDom(html);
  for (const a of document.querySelectorAll("a[href]")) {
    const href = a.getAttribute("href") ?? "";
    assert.ok(!href.startsWith("http") && !href.includes("../"), `external/escaping link found: ${href}`);
  }
});
