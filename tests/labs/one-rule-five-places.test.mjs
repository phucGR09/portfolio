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
  const mod = await import("../../scripts/labs/one-rule-five-places.js");
  return mod.default;
}

/**
 * @param {import("../../scripts/types.d.ts").LabSpec} spec
 * @param {import("../../scripts/types.d.ts").Mode} mode
 */
async function runLab(spec, mode) {
  const { document } = makeDom("<div></div>");
  globalThis.document = document;
  const store = createStore(() => buildDataset(spec.model.seed));
  const clock = createClock({ speed: 1000 });
  const server = createServer(store, { clock });
  const els = {
    control: document.createElement("div"),
    response: document.createElement("div"),
    internals: document.createElement("div"),
    verdict: document.createElement("div")
  };
  const outcome = await spec.run({ mode, inputs: { rate: 10 }, db: store, server, log: () => {}, clock, els });
  const tiles = [...els.response.querySelectorAll(".lab-screen-tile")];
  const staleCount = tiles.filter((t) => t.getAttribute("data-sig") === "bad").length;
  return { outcome, staleCount, tileCount: tiles.length };
}

test("duplicated mode always ends with exactly 1 of 5 screens stale", async () => {
  const spec = await loadSpec();
  const { staleCount, tileCount, outcome } = await runLab(spec, "naive");
  assert.equal(tileCount, 5);
  assert.equal(staleCount, 1);
  assert.equal(outcome.metrics.missed, 1);
  assert.equal(outcome.metrics.filesChanged, 5);
});

test("single-source mode ends with 0 of 5 screens stale", async () => {
  const spec = await loadSpec();
  const { staleCount, tileCount, outcome } = await runLab(spec, "principled");
  assert.equal(tileCount, 5);
  assert.equal(staleCount, 0);
  assert.equal(outcome.metrics.missed, 0);
  assert.equal(outcome.metrics.filesChanged, 1);
});

test("which screen is missed is deterministic across runs (seeded, not hand-picked)", async () => {
  const spec = await loadSpec();
  const first = await runLab(spec, "naive");
  const second = await runLab(spec, "naive");
  assert.equal(first.staleCount, second.staleCount);
});
