import { test } from "node:test";
import assert from "node:assert/strict";
import { createLogger } from "../scripts/runtime/logger.js";

test("emit() delivers events to listeners in order", () => {
  const logger = createLogger();
  /** @type {unknown[]} */
  const seen = [];
  logger.on("x", (payload) => seen.push(payload));
  logger.emit("x", 1);
  logger.emit("x", 2);
  logger.emit("x", 3);
  assert.deepEqual(seen, [1, 2, 3]);
});

test("off() actually unsubscribes", () => {
  const logger = createLogger();
  let count = 0;
  const fn = () => (count += 1);
  logger.on("x", fn);
  logger.emit("x");
  logger.off("x", fn);
  logger.emit("x");
  assert.equal(count, 1);
});

test("history() is a ring buffer capped at 500 events", () => {
  const logger = createLogger();
  for (let i = 0; i < 600; i += 1) logger.emit("x", i);
  const history = logger.history();
  assert.equal(history.length, 500);
  const first = history[0];
  const last = history[499];
  assert.ok(first && last);
  assert.equal(first.payload, 100);
  assert.equal(last.payload, 599);
});

test("listeners for a different type are not called", () => {
  const logger = createLogger();
  let called = false;
  logger.on("a", () => (called = true));
  logger.emit("b");
  assert.equal(called, false);
});
