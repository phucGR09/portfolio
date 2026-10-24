import { test } from "node:test";
import assert from "node:assert/strict";
import { makeDom, fakeStorage, readFile } from "./_helpers.mjs";

test("linkedom builds a DOM and querySelector works", () => {
  const { document } = makeDom("<body><p class=\"hello\">hi</p></body>");
  const el = document.querySelector(".hello");
  assert.ok(el, "should find .hello");
  assert.equal(el.textContent, "hi");
});

test("fakeStorage({ throwing: true }) throws on setItem", () => {
  const storage = fakeStorage({ throwing: true });
  assert.throws(() => storage.setItem("k", "v"));
});

test("fakeStorage default mode works normally", () => {
  const storage = fakeStorage();
  storage.setItem("k", "v");
  assert.equal(storage.getItem("k"), "v");
});

test("package.json has empty dependencies (RULE 14)", () => {
  const pkg = JSON.parse(readFile("package.json"));
  assert.deepEqual(pkg.dependencies ?? {}, {}, "dependencies must stay empty forever");
});
