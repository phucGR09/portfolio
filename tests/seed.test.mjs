import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDataset } from "../scripts/data/seed.js";

test("the same seed always builds the same dataset", () => {
  const a = buildDataset(123);
  const b = buildDataset(123);
  assert.deepEqual(a, b);
});

test("a different seed builds a different dataset", () => {
  const a = buildDataset(1);
  const b = buildDataset(2);
  assert.notDeepEqual(a, b);
});

test("every candidate.companyId references a real company", () => {
  const { candidates, companies } = buildDataset(20261024);
  const companyIds = new Set(companies.map((c) => c.id));
  for (const candidate of candidates) {
    assert.ok(companyIds.has(candidate.companyId), `candidate ${candidate.id} points to a missing company`);
  }
});

test("every transaction.userId references a real user", () => {
  const { transactions, users } = buildDataset(20261024);
  const userIds = new Set(users.map((u) => u.id));
  for (const tx of transactions) {
    assert.ok(userIds.has(tx.userId));
  }
});

test("every email uses the .invalid TLD (RFC 2606) — obviously fake", () => {
  const { candidates, users } = buildDataset(20261024);
  for (const row of [...candidates, ...users]) {
    assert.match(row.email, /@example\.invalid$/);
  }
});

test("generating 50,000 rows takes under 500ms", () => {
  const started = performance.now();
  buildDataset(1, { candidates: 50000 });
  assert.ok(performance.now() - started < 500);
});
