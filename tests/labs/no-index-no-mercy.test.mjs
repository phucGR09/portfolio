import { test } from "node:test";
import assert from "node:assert/strict";
import { makeDom } from "../_helpers.mjs";
import { createClock } from "../../scripts/runtime/clock.js";

/** @returns {Promise<import("../../scripts/types.d.ts").LabSpec>} */
async function loadSpec() {
  const { document } = makeDom("<div></div>");
  globalThis.document = document;
  const mod = await import("../../scripts/labs/no-index-no-mercy.js");
  return mod.default;
}

/**
 * @param {import("../../scripts/types.d.ts").LabSpec} spec
 * @param {import("../../scripts/types.d.ts").Mode} mode
 * @param {number} size
 * @param {string} email
 */
async function runLab(spec, mode, size, email) {
  const { document } = makeDom("<div></div>");
  globalThis.document = document;
  const control = document.createElement("div");
  const input = document.createElement("input");
  input.className = "lab-search-input";
  input.value = email;
  control.append(input);
  const clock = createClock({ speed: 1000 });
  const els = {
    control,
    response: document.createElement("div"),
    internals: document.createElement("div"),
    verdict: document.createElement("div")
  };
  const outcome = await spec.run({
    mode,
    inputs: { size },
    db: /** @type {any} */ (null),
    server: /** @type {any} */ (null),
    log: () => {},
    clock,
    els
  });
  return { outcome, internalsText: els.internals.textContent ?? "", responseText: els.response.textContent ?? "" };
}

test("naive mode (no index) scans every row for a match at the end of the table", async () => {
  const spec = await loadSpec();
  const { outcome } = await runLab(spec, "naive", 1000, "fake.candidate+1000@example.invalid");
  assert.equal(outcome.metrics.rowsScanned, 1000);
});

test("principled mode (B-tree index) scans roughly log2(n) rows for the same search", async () => {
  const spec = await loadSpec();
  const { outcome } = await runLab(spec, "principled", 1000, "fake.candidate+1000@example.invalid");
  assert.equal(outcome.metrics.rowsScanned, Math.ceil(Math.log2(1000)));
});

test("for the same table and search, naive takes meaningfully longer than principled", async () => {
  const spec = await loadSpec();
  const naive = await runLab(spec, "naive", 10000, "fake.candidate+10000@example.invalid");
  const principled = await runLab(spec, "principled", 10000, "fake.candidate+10000@example.invalid");
  assert.ok((naive.outcome.metrics.ms ?? 0) > (principled.outcome.metrics.ms ?? 0));
  assert.ok((naive.outcome.metrics.rowsScanned ?? 0) > (principled.outcome.metrics.rowsScanned ?? 0));
});

test("a larger table scans proportionally more rows in naive mode", async () => {
  const spec = await loadSpec();
  const small = await runLab(spec, "naive", 1000, "fake.candidate+1000@example.invalid");
  const large = await runLab(spec, "naive", 50000, "fake.candidate+50000@example.invalid");
  assert.equal(small.outcome.metrics.rowsScanned, 1000);
  assert.equal(large.outcome.metrics.rowsScanned, 50000);
});

test("searching an email that doesn't exist still scans the table and reports 0 found", async () => {
  const spec = await loadSpec();
  const { outcome, responseText } = await runLab(spec, "naive", 1000, "nobody@example.invalid");
  assert.equal(outcome.metrics.rowsScanned, 1000);
  assert.match(responseText, /no candidate found/i);
});

test("the request path (seq scan vs index scan) is named in Internals", async () => {
  const spec = await loadSpec();
  const naive = await runLab(spec, "naive", 1000, "fake.candidate+1000@example.invalid");
  const principled = await runLab(spec, "principled", 1000, "fake.candidate+1000@example.invalid");
  assert.match(naive.internalsText, /Seq Scan/);
  assert.match(principled.internalsText, /Index Scan/);
});
