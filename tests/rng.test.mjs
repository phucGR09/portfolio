import { test } from "node:test";
import assert from "node:assert/strict";
import { createRng } from "../scripts/runtime/rng.js";

test("same seed produces the same first 1000 numbers, every time", () => {
  const a = createRng(42);
  const b = createRng(42);
  const seqA = Array.from({ length: 1000 }, () => a.next());
  const seqB = Array.from({ length: 1000 }, () => b.next());
  assert.deepEqual(seqA, seqB);
});

test("different seeds produce different sequences", () => {
  const a = createRng(1);
  const b = createRng(2);
  assert.notEqual(a.next(), b.next());
});

test("int(min, max) stays within bounds, inclusive", () => {
  const rng = createRng(7);
  for (let i = 0; i < 500; i += 1) {
    const value = rng.int(10, 20);
    assert.ok(value >= 10 && value <= 20);
    assert.equal(value, Math.round(value));
  }
});

test("jitter(value, pct) never exceeds +/- pct of value", () => {
  const rng = createRng(3);
  const value = 100;
  const pct = 0.12;
  for (let i = 0; i < 500; i += 1) {
    const jittered = rng.jitter(value, pct);
    assert.ok(Math.abs(jittered - value) <= value * pct + 1e-9);
  }
});

test("pick(arr) always returns an element from the array", () => {
  const rng = createRng(9);
  const arr = ["a", "b", "c"];
  for (let i = 0; i < 100; i += 1) {
    assert.ok(arr.includes(rng.pick(arr)));
  }
});
