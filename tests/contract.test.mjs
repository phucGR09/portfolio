import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { repoRoot } from "./_helpers.mjs";

const ROOT = repoRoot();
const TOOL = join(ROOT, "tools", "check-contract.mjs");

/** @returns {{ status: number | null, stdout: string, stderr: string }} */
function runContract() {
  const result = spawnSync(process.execPath, [TOOL], { cwd: ROOT, encoding: "utf8" });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

test("check-contract passes on all real lesson pages", () => {
  const pageCount = readdirSync(join(ROOT, "labs")).filter(
    (name) => name.endsWith(".html") && !name.startsWith("_") && name !== "index.html"
  ).length;
  assert.ok(pageCount > 0, "expected at least one real lesson page");
  const { status, stdout } = runContract();
  assert.equal(status, 0);
  assert.ok(stdout.includes(`contract: ${pageCount}/${pageCount} pages pass automated checks (1,2,4,7,8)`));
  assert.match(stdout, /manual still required/);
});

test("a hardcoded literal in a lab's metrics fails check-contract at the right file", () => {
  const target = join(ROOT, "scripts", "labs", "n-plus-one.js");
  const original = readFileSync(target, "utf8");
  const broken = original.replace(
    "return { metrics: { queries: costs.length, ms } };",
    "return { metrics: { queries: costs.length, ms: 3180 } };"
  );
  assert.notEqual(broken, original, "fixture replacement did not match — update this test");
  writeFileSync(target, broken);
  try {
    const { status, stderr } = runContract();
    assert.equal(status, 1);
    assert.match(stderr, /n-plus-one\.js returns literal 3180 inside metrics/);
  } finally {
    writeFileSync(target, original);
  }
});
