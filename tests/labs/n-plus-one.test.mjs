import { test } from "node:test";
import assert from "node:assert/strict";
import { makeDom } from "../_helpers.mjs";
import { createStore } from "../../scripts/runtime/store.js";
import { createServer } from "../../scripts/runtime/server.js";
import { createClock } from "../../scripts/runtime/clock.js";
import { buildDataset } from "../../scripts/data/seed.js";

/** @returns {Promise<import("../../scripts/types.d.ts").LabSpec>} */
async function loadSpec() {
  const { document } = makeDom("<div></div>");
  globalThis.document = document;
  const mod = await import("../../scripts/labs/n-plus-one.js");
  return mod.default;
}

/**
 * @param {import("../../scripts/types.d.ts").LabSpec} spec
 * @param {import("../../scripts/types.d.ts").Mode} mode
 * @param {number} rows
 */
async function runLab(spec, mode, rows) {
  const { document } = makeDom("<div></div>");
  globalThis.document = document;
  const store = createStore(() => buildDataset(spec.model.seed, spec.model.datasetSize));
  const clock = createClock({ speed: 1000 });
  const server = createServer(store, { clock });
  const els = {
    control: document.createElement("div"),
    response: document.createElement("div"),
    internals: document.createElement("div"),
    verdict: document.createElement("div")
  };
  /** @type {{ type: string, payload: unknown }[]} */
  const logs = [];
  const outcome = await spec.run({
    mode,
    inputs: { rows },
    db: store,
    server,
    log: (type, payload) => logs.push({ type, payload }),
    clock,
    els
  });
  return { outcome, costs: store.costs(), logs };
}

test("naive mode runs exactly rows+1 queries", async () => {
  const spec = await loadSpec();
  const { costs, outcome } = await runLab(spec, "naive", 10);
  assert.equal(costs.length, 11);
  assert.equal(outcome.metrics.queries, 11);
});

test("principled mode always runs exactly 2 queries, regardless of rows", async () => {
  const spec = await loadSpec();
  const ten = await runLab(spec, "principled", 10);
  const hundred = await runLab(spec, "principled", 100);
  assert.equal(ten.costs.length, 2);
  assert.equal(hundred.costs.length, 2);
});

test("naive total ms is at least 10x principled for the same rows", async () => {
  const spec = await loadSpec();
  const naive = await runLab(spec, "naive", 100);
  const principled = await runLab(spec, "principled", 100);
  assert.ok((naive.outcome.metrics.ms ?? 0) >= (principled.outcome.metrics.ms ?? 0) * 10);
});

test("rows=500 logs exactly 500 lines, never one over the ring-buffer cap", async () => {
  const spec = await loadSpec();
  const { logs } = await runLab(spec, "naive", 500);
  assert.equal(logs.length, 500);
});

test("every Verdict metric traces back to db.costs(), never a literal", async () => {
  const spec = await loadSpec();
  const { costs, outcome } = await runLab(spec, "naive", 10);
  const expectedMs = costs.reduce((sum, c) => sum + c.ms, 0);
  assert.equal(outcome.metrics.ms, expectedMs);
  assert.equal(outcome.metrics.queries, costs.length);
});
