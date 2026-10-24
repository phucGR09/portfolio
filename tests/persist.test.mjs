import { test } from "node:test";
import assert from "node:assert/strict";
import { createPersist } from "../scripts/runtime/persist.js";
import { fakeStorage } from "./_helpers.mjs";

test("keys follow pl:<ver>:<scope>[:<id>]", () => {
  const storage = fakeStorage();
  const persist = createPersist("pl:v1", storage);
  persist.set("prefs", undefined, { simSpeed: 1 });
  assert.equal(storage.getItem("pl:v1:prefs"), JSON.stringify({ simSpeed: 1 }));
  persist.set("read", "some-slug", 123);
  assert.equal(storage.getItem("pl:v1:read:some-slug"), "123");
});

test("a throwing storage (Safari private mode) never escapes set()", () => {
  const storage = fakeStorage({ throwing: true });
  const persist = createPersist("pl:v1", storage);
  assert.doesNotThrow(() => persist.set("prefs", undefined, { lang: "en" }));
});

test("a scope outside the whitelist is rejected", () => {
  const storage = fakeStorage();
  const persist = createPersist("pl:v1", storage);
  assert.throws(() => persist.set(/** @type {any} */ ("secrets"), undefined, "nope"));
  assert.throws(() => persist.get(/** @type {any} */ ("secrets")));
});

test("get() round-trips a stored value", () => {
  const storage = fakeStorage();
  const persist = createPersist("pl:v1", storage);
  persist.set("hub", undefined, { cat: ["data"] });
  assert.deepEqual(persist.get("hub"), { cat: ["data"] });
});

test("available() reflects whether storage actually works", () => {
  assert.equal(createPersist("pl:v1", fakeStorage()).available(), true);
  assert.equal(createPersist("pl:v1", fakeStorage({ throwing: true })).available(), false);
  assert.equal(createPersist("pl:v1", undefined).available(), false);
});
