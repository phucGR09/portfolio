import { test } from "node:test";
import assert from "node:assert/strict";
import { makeDom } from "./_helpers.mjs";
import { defineLab } from "../scripts/runtime/lab.js";

/** @param {Element | null} node @returns {HTMLElement} */
function must(node) {
  assert.ok(node, "expected element to exist");
  return /** @type {HTMLElement} */ (node);
}

/**
 * @param {{ modes?: boolean }} [options]
 * @returns {import("../scripts/types.d.ts").LabSpec}
 */
function makeSpec(options = {}) {
  return {
    id: "_test",
    stage: {
      bg: "deep",
      layout: "test",
      zones: { control: "1/1/2/2", response: "2/1/3/2", internals: "3/1/4/2", verdict: "4/1/5/2" },
      hues: []
    },
    ...(options.modes ? { modes: { naive: "Loop", principled: "Batch" } } : {}),
    controls: [{ type: "button", id: "load", label: "Load" }],
    model: { note: "1 step ~ 5ms", seed: 1 },
    metrics: [{ key: "steps", label: "Steps", unit: "steps" }],
    async run({ mode }) {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return { metrics: { steps: mode === "principled" ? 1 : 10 } };
    }
  };
}

/**
 * @param {HTMLElement} root
 * @returns {Promise<void>}
 */
function waitSettled(root) {
  return new Promise((resolve) => {
    const check = () => {
      const state = root.getAttribute("data-state");
      if (state === "settled" || state === "compare") resolve();
      else setTimeout(check, 10);
    };
    check();
  });
}

/** @param {Document} document @param {import("../scripts/types.d.ts").LabSpec} spec @returns {HTMLElement} */
function mount(document, spec) {
  globalThis.document = document;
  defineLab(spec);
  return must(document.querySelector("[data-lab]"));
}

test("renders 4 zones with data-zone, in DOM order control/response/internals/verdict", () => {
  const { document } = makeDom("<div data-lab></div>");
  const root = mount(document, makeSpec());
  const zoneNames = [...root.querySelectorAll("[data-zone]")].map((n) => n.getAttribute("data-zone"));
  assert.deepEqual(zoneNames, ["control", "response", "internals", "verdict"]);
});

test("Response zone has aria-live=polite", () => {
  const { document } = makeDom("<div data-lab></div>");
  const root = mount(document, makeSpec());
  const response = must(root.querySelector('[data-zone="response"]'));
  assert.equal(response.getAttribute("aria-live"), "polite");
});

test("ModeSwitch has role=switch and toggles aria-checked", () => {
  const { document } = makeDom("<div data-lab></div>");
  const root = mount(document, makeSpec({ modes: true }));
  const switchEl = must(root.querySelector(".lab-switch"));
  assert.equal(switchEl.getAttribute("role"), "switch");
  assert.equal(switchEl.getAttribute("aria-checked"), "false");
  switchEl.click();
  assert.equal(switchEl.getAttribute("aria-checked"), "true");
});

test("idle -> running -> settled -> reset -> idle, 3 times, identical", async () => {
  const { document } = makeDom("<div data-lab></div>");
  const root = mount(document, makeSpec());
  const runButton = must(root.querySelector(".lab-run"));
  const resetButton = must(root.querySelector(".lab-reset"));

  for (let i = 0; i < 3; i += 1) {
    assert.equal(root.getAttribute("data-state"), "idle");
    assert.equal(must(root.querySelector('[data-metric="steps"] .lab-readout__after')).textContent, "—");

    runButton.click();
    assert.equal(root.getAttribute("data-state"), "running");
    await waitSettled(root);
    assert.equal(root.getAttribute("data-state"), "settled");

    resetButton.click();
    assert.equal(root.getAttribute("data-state"), "idle");
    assert.equal(must(root.querySelector('[data-metric="steps"] .lab-readout__after')).textContent, "—");
  }
});

test("running both modes merges into data-state=compare with before/after", async () => {
  const { document } = makeDom("<div data-lab></div>");
  const root = mount(document, makeSpec({ modes: true }));
  const runButton = must(root.querySelector(".lab-run"));
  const switchEl = must(root.querySelector(".lab-switch"));

  runButton.click();
  await waitSettled(root);
  assert.equal(root.getAttribute("data-state"), "settled");

  switchEl.click();
  runButton.click();
  await waitSettled(root);
  assert.equal(root.getAttribute("data-state"), "compare");

  const before = must(root.querySelector('[data-metric="steps"] .lab-readout__before')).textContent;
  const after = must(root.querySelector('[data-metric="steps"] .lab-readout__after')).textContent;
  assert.notEqual(before, "—");
  assert.notEqual(after, "—");
});
