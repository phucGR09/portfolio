import { test } from "node:test";
import assert from "node:assert/strict";
import { createClock } from "../scripts/runtime/clock.js";

test("now() is simulated time, independent of real speed", async () => {
  const clock = createClock({ speed: 100 });
  await clock.sleep(1000);
  assert.equal(clock.now(), 1000);
});

test("skip() resolves immediately but keeps the simulated number unchanged", async () => {
  const clock = createClock({ speed: 1 });
  const started = Date.now();
  const pending = clock.sleep(5000);
  clock.skip();
  await pending;
  assert.equal(clock.now(), 5000);
  assert.ok(Date.now() - started < 200, "skip() must not wait out the real delay");
});

test("ceilingMs caps real wall-clock wait for a run", async () => {
  const clock = createClock({ speed: 1, ceilingMs: 20 });
  const started = Date.now();
  await clock.sleep(1000);
  await clock.sleep(1000);
  assert.ok(Date.now() - started < 200, "a run must never wait longer than ceilingMs of real time");
  assert.equal(clock.now(), 2000, "simulated time still reports the full requested duration");
});

test("abort() rejects the pending sleep", async () => {
  const clock = createClock({ speed: 1 });
  const pending = clock.sleep(1000);
  clock.abort();
  await assert.rejects(pending);
});

test("abort() makes subsequent sleep() calls reject too", async () => {
  const clock = createClock({ speed: 1 });
  clock.abort();
  await assert.rejects(clock.sleep(10));
});

test("onTick() fires during a sleep and can be unsubscribed", async () => {
  const clock = createClock({ speed: 50 });
  let ticks = 0;
  const off = clock.onTick(() => (ticks += 1));
  await clock.sleep(200);
  assert.ok(ticks >= 1);
  off();
  const before = ticks;
  await clock.sleep(200);
  assert.equal(ticks, before);
});
