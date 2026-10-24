import { test } from "node:test";
import assert from "node:assert/strict";
import { duration, count, bytes, money, pct } from "../scripts/runtime/fmt.js";

test("duration() switches from ms to s at 1000, and is readable", () => {
  assert.equal(duration(84), "84 ms");
  assert.equal(duration(3180), "3.18 s");
});

test("every fmt function returns a string, never a bare number", () => {
  for (const fn of [duration, count, bytes, money, pct]) {
    assert.equal(typeof fn(123), "string");
  }
});

test("NaN/undefined input never leaks into the output text", () => {
  assert.doesNotMatch(duration(NaN), /NaN/);
  assert.doesNotMatch(count(/** @type {number} */ (/** @type {unknown} */ (undefined))), /NaN|undefined/);
  assert.doesNotMatch(bytes(NaN), /NaN/);
  assert.doesNotMatch(money(NaN), /NaN/);
  assert.doesNotMatch(pct(NaN), /NaN/);
  assert.equal(duration(NaN), "— ms");
  assert.equal(money(NaN), "— đ");
});

test("count() groups thousands and accepts an optional unit", () => {
  assert.equal(count(50000, "rows"), "50.000 rows");
  assert.equal(count(50000), "50.000");
});

test("money() always carries the đ unit", () => {
  assert.equal(money(500000), "500.000 đ");
});

test("bytes() scales from B to KB to MB", () => {
  assert.equal(bytes(512), "512 B");
  assert.equal(bytes(2048), "2.0 KB");
  assert.equal(bytes(5 * 1024 * 1024), "5.0 MB");
});
