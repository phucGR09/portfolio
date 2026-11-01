import { test } from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../scripts/runtime/store.js";

/** @returns {{ items: { id: number }[] }} */
function makeDataset() {
  return { items: Array.from({ length: 100 }, (_, i) => ({ id: i })) };
}

test("calling select() twice costs twice — store never caches (RULE 7d)", () => {
  const store = createStore(makeDataset);
  store.select("items", () => true);
  assert.equal(store.costs().length, 1);
  store.select("items", () => true);
  const costs = store.costs();
  assert.equal(costs.length, 2);
  const [first, second] = costs;
  assert.ok(first && second);
  assert.ok(first.ms > 0 && second.ms > 0, "a cache hit would report 0ms — both calls must cost real time");
});

test("full scan reports rowsScanned equal to the table size", () => {
  const store = createStore(makeDataset);
  store.select("items", () => true);
  const cost = store.costs()[0];
  assert.ok(cost);
  assert.equal(cost.rowsScanned, 100);
  assert.equal(cost.usedIndex, false);
});

test("opts.index approximates a B-tree scan at log2(n)", () => {
  const store = createStore(makeDataset);
  store.select("items", () => true, { index: true });
  const cost = store.costs()[0];
  assert.ok(cost);
  assert.equal(cost.usedIndex, true);
  assert.equal(cost.rowsScanned, Math.ceil(Math.log2(100)));
});

test("rowsReturned reflects the actual predicate matches", () => {
  const store = createStore(makeDataset);
  const matched = store.select("items", (row) => Number(row.id) < 10);
  assert.equal(matched.length, 10);
  const cost = store.costs()[0];
  assert.ok(cost);
  assert.equal(cost.rowsReturned, 10);
});

test("insert() accounts for its own cost", () => {
  const store = createStore(makeDataset);
  store.insert("items", { id: 999 });
  assert.equal(store.costs().length, 1);
  assert.equal(store.costs()[0]?.op, "insert");
});

test("insert() on an indexed table costs more than on a plain table (the reverse trade-off)", () => {
  const plain = createStore(makeDataset);
  const indexed = createStore(makeDataset);
  const samples = 40;
  let plainTotal = 0;
  let indexedTotal = 0;
  for (let i = 0; i < samples; i += 1) {
    plain.insert("items", { id: 1000 + i });
    indexed.insert("items", { id: 1000 + i }, { indexed: true });
    plainTotal += plain.costs().at(-1)?.ms ?? 0;
    indexedTotal += indexed.costs().at(-1)?.ms ?? 0;
  }
  assert.ok(indexedTotal > plainTotal, "an indexed table's inserts must average costlier than a plain table's");
  assert.equal(indexed.costs()[0]?.usedIndex, true);
  assert.equal(plain.costs()[0]?.usedIndex, false);
});

test("reset() regenerates from the factory — 3 resets give identical state", () => {
  const store = createStore(makeDataset);
  store.insert("items", { id: 999 });
  for (let i = 0; i < 3; i += 1) {
    store.reset();
    assert.equal(store.costs().length, 0);
    const rows = store.select("items", () => true);
    assert.equal(rows.length, 100, "reset must regenerate from the factory, not keep the mutated table");
  }
});

test("costs() returns a fresh snapshot on every call, not a live reference", () => {
  const store = createStore(makeDataset);
  store.select("items", () => true);
  const a = store.costs();
  const b = store.costs();
  assert.notStrictEqual(a, b);
  assert.deepEqual(a, b);
});
