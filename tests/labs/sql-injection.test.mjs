import { test } from "node:test";
import assert from "node:assert/strict";
import { makeDom } from "../_helpers.mjs";
import { defineLab } from "../../scripts/runtime/lab.js";
import { createStore } from "../../scripts/runtime/store.js";
import { createServer } from "../../scripts/runtime/server.js";
import { createClock } from "../../scripts/runtime/clock.js";
import { buildDataset } from "../../scripts/data/seed.js";
import { DEMO_EMAIL, DEMO_PASSWORD, LOGIN_EXAMPLES } from "../../scripts/labs/sql-login-state.js";

/** @param {Document} document @param {string} selector */
function element(document, selector) {
  const found = document.querySelector(selector);
  assert.ok(found, `missing ${selector}`);
  return /** @type {HTMLElement & { textContent: string }} */ (found);
}
/** @param {Document} document @param {string} selector */
function input(document, selector) {
  const found = element(document, selector);
  assert.equal(found.tagName, "INPUT");
  return /** @type {HTMLInputElement} */ (found);
}

async function mount() {
  globalThis.document = makeDom("<div></div>").document;
  const { default: spec } = await import("../../scripts/labs/sql-injection.js");
  const { document, window } = makeDom("<div data-lab></div>");
  globalThis.document = document;
  defineLab(spec);
  return { spec, document, window: /** @type {Window & typeof globalThis} */ (window), root: element(document, "[data-lab]") };
}

/** @param {import("../../scripts/types.d.ts").Mode} mode @param {string} email @param {string} [password] */
async function runLab(mode, email, password = "wrong-password") {
  const { spec, document } = await mount();
  const db = createStore(() => buildDataset(spec.model.seed));
  const clock = createClock({ speed: 1000 });
  const els = {
    control: element(document, '[data-zone="control"]'),
    response: element(document, '[data-zone="response"]'),
    internals: element(document, '[data-zone="internals"]'),
    verdict: element(document, '[data-zone="verdict"]')
  };
  input(document, ".lab-email-input").value = email;
  input(document, ".sqli-password").value = password;
  const result = await spec.run({ mode, inputs: {}, db, server: createServer(db, { clock }), clock, log: () => {}, els });
  return { result, document, db, sql: element(document, ".sqli-query").textContent, response: els.response.textContent };
}

/** @type {import("../../scripts/types.d.ts").Mode[]} */
const MODES = ["naive", "principled"];
for (const mode of MODES) {
  test(`${mode}: correct demo credentials open the workspace`, async () => {
    const { result, document, response } = await runLab(mode, DEMO_EMAIL, DEMO_PASSWORD);
    assert.equal(result.metrics.unauthorizedSessions, 0);
    assert.equal(element(document, ".sqli-workspace").hidden, false);
    assert.equal(element(document, ".sqli-login-form").hidden, true);
    assert.equal(element(document, ".sqli-identity").textContent, DEMO_EMAIL);
    assert.match(response, /200 Session created/);
  });
  test(`${mode}: a wrong password leaves the workspace locked`, async () => {
    const { result, document, response } = await runLab(mode, DEMO_EMAIL);
    assert.equal(result.metrics.unauthorizedSessions, 0);
    assert.equal(element(document, ".sqli-workspace").hidden, true);
    assert.match(response, /401 Invalid credentials/);
  });
  for (const example of LOGIN_EXAMPLES.filter((item) => item.api)) {
    test(`${mode}: ${example.title} ${mode === "naive" ? "bypasses" : "cannot bypass"} authentication`, async () => {
      const { result, document, sql, db, response } = await runLab(mode, example.email, example.password);
      const bypassed = mode === "naive";
      assert.equal(result.metrics.unauthorizedSessions, bypassed ? Math.min(1, db.costs()[0]?.rowsReturned ?? 0) : 0);
      assert.equal(element(document, ".sqli-workspace").hidden, !bypassed);
      if (bypassed) {
        assert.equal(result.metrics.unauthorizedSessions, 1);
        assert.ok(sql.includes(example.email));
        assert.match(response, /Authentication bypass/);
      } else {
        assert.ok(sql.includes("email = ? AND passwordHash = ?"));
        assert.ok(!sql.includes(example.email));
        assert.match(element(document, '[data-zone="internals"]').textContent, /Bound values \(separate from SQL\)/);
        assert.match(response, /Attack blocked/);
      }
    });
  }
}

test("a standalone apostrophe is a query error, not a successful attack", async () => {
  const { result, document, response } = await runLab("naive", "o'brien@example.invalid");
  assert.equal(result.metrics.unauthorizedSessions, 0);
  assert.equal(element(document, ".sqli-workspace").hidden, true);
  assert.match(response, /500 Query error/);
});

test("a targeted attack against a nonexistent account does not create a session", async () => {
  const { result, response } = await runLab("naive", "missing@example.invalid' -- -");
  assert.equal(result.metrics.unauthorizedSessions, 0);
  assert.match(response, /401 Invalid credentials/);
});

test("SQL comment examples retain whitespace after -- when email inputs trim their ends", () => {
  for (const example of LOGIN_EXAMPLES.filter((item) => item.api)) assert.match(example.email.trim(), /--\s+-$/);
});

test("custom controls replace the old action card with a required login form and four cards", async () => {
  const { document } = await mount();
  assert.equal(document.querySelector(".lab-run"), null);
  assert.equal(document.querySelector(".lab-switch"), null);
  assert.equal(document.querySelectorAll(".sqli-example").length, 4);
  assert.equal(input(document, ".lab-email-input").type, "email");
  assert.equal(input(document, ".lab-email-input").required, true);
  assert.equal(input(document, ".sqli-password").required, true);
  assert.equal(input(document, ".sqli-password").type, "password");
});

test("card selection, form submission, backend change and reset use the actual runtime", async () => {
  const { document, window, root } = await mount();
  const form = /** @type {HTMLFormElement} */ (element(document, "form"));
  const example = LOGIN_EXAMPLES[2];
  assert.ok(example);
  element(document, ".sqli-example:nth-child(3)").click();
  assert.equal(input(document, ".lab-email-input").value, example.email);
  assert.equal(input(document, ".sqli-api-replay").checked, true);
  assert.equal(form.noValidate, true);
  form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(root.dataset.state, "settled");
  assert.equal(element(document, ".sqli-workspace").hidden, false);
  element(document, ".sqli-modes button:nth-child(2)").click();
  assert.equal(input(document, ".lab-email-input").value, example.email);
  assert.equal(element(document, ".sqli-workspace").hidden, true);
  form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await new Promise((resolve) => setImmediate(resolve));
  assert.match(element(document, '[data-zone="response"]').textContent, /Attack blocked/);
  element(document, ".sqli-reset").click();
  assert.equal(root.dataset.state, "idle");
  assert.equal(input(document, ".lab-email-input").value, DEMO_EMAIL);
  assert.equal(input(document, ".sqli-password").value, DEMO_PASSWORD);
  assert.equal(input(document, ".sqli-api-replay").checked, false);
  assert.equal(form.noValidate, false);
});

test("empty credentials do not submit even when replaying the API request", async () => {
  const { document, window, root } = await mount();
  element(document, ".sqli-example[data-kind='Injection']").click();
  input(document, ".sqli-password").value = "";
  element(document, "form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  assert.equal(root.dataset.state, "idle");
  assert.match(element(document, ".sqli-login-message").textContent, /Enter both/);
});

test("editing credentials clears the previous successful session and stale metrics", async () => {
  const { document, window, root } = await mount();
  element(document, "form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await new Promise((resolve) => setImmediate(resolve));
  const password = input(document, ".sqli-password");
  password.value = "changed-password";
  password.dispatchEvent(new window.Event("input"));
  assert.equal(root.dataset.state, "idle");
  assert.equal(password.value, "changed-password");
  assert.equal(element(document, ".sqli-workspace").hidden, true);
  assert.equal(element(document, ".lab-readout__after").textContent, "—");
});

test("password reveal and sign-out controls work", async () => {
  const { document, window } = await mount();
  element(document, ".sqli-reveal").click();
  assert.equal(input(document, ".sqli-password").type, "text");
  element(document, ".sqli-reveal").click();
  assert.equal(input(document, ".sqli-password").type, "password");
  element(document, "form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await new Promise((resolve) => setImmediate(resolve));
  element(document, ".sqli-signout").click();
  assert.equal(element(document, ".sqli-workspace").hidden, true);
  assert.equal(element(document, "form").hidden, false);
});

test("all seeded identities and password hashes remain obviously fictional", async () => {
  const { spec } = await mount();
  for (const user of buildDataset(spec.model.seed).users) {
    assert.match(user.email, /@example\.invalid$/);
    assert.match(user.passwordHash, /^\$2b\$fake\$/);
  }
});
