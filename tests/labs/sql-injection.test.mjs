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
  const mod = await import("../../scripts/labs/sql-injection.js");
  return mod.default;
}

/**
 * @param {import("../../scripts/types.d.ts").LabSpec} spec
 * @param {import("../../scripts/types.d.ts").Mode} mode
 * @param {string} email
 */
async function runLab(spec, mode, email) {
  const { document } = makeDom("<div></div>");
  globalThis.document = document;
  const store = createStore(() => buildDataset(spec.model.seed));
  const clock = createClock({ speed: 1000 });
  const server = createServer(store, { clock });
  const control = document.createElement("div");
  const input = document.createElement("input");
  input.className = "lab-email-input";
  input.value = email;
  control.append(input);
  const els = {
    control,
    response: document.createElement("div"),
    internals: document.createElement("div"),
    verdict: document.createElement("div")
  };
  const outcome = await spec.run({
    mode,
    inputs: {},
    db: store,
    server,
    log: () => {},
    clock,
    els
  });
  return { outcome, sql: els.internals.textContent ?? "" };
}

const PAYLOAD = "' OR '1'='1";

test("naive mode with a quote payload leaks every row, and the payload sits in the query text", async () => {
  const spec = await loadSpec();
  const { outcome, sql } = await runLab(spec, "naive", PAYLOAD);
  assert.ok((outcome.metrics.rowsLeaked ?? 0) > 0);
  assert.ok(sql.includes(PAYLOAD));
});

test("principled mode with the same payload matches zero rows", async () => {
  const spec = await loadSpec();
  const { outcome } = await runLab(spec, "principled", PAYLOAD);
  assert.equal(outcome.metrics.rowsLeaked, 0);
});

test("naive mode with a clean email leaks nothing", async () => {
  const spec = await loadSpec();
  const { outcome } = await runLab(spec, "naive", "ada@example.invalid");
  assert.equal(outcome.metrics.rowsLeaked, 0);
});

test("every seeded user email ends in .invalid (RFC 2606)", async () => {
  const spec = await loadSpec();
  const dataset = buildDataset(spec.model.seed);
  for (const user of dataset.users) {
    assert.match(user.email, /@example\.invalid$/);
  }
});

test("every seeded password hash is an obviously fake pattern", async () => {
  const spec = await loadSpec();
  const dataset = buildDataset(spec.model.seed);
  for (const user of dataset.users) {
    assert.match(user.passwordHash, /^\$2b\$fake\$/);
  }
});
