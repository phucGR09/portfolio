import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../scripts/runtime/server.js";
import { createClock } from "../scripts/runtime/clock.js";
import { createStore } from "../scripts/runtime/store.js";

function makeStore() {
  return createStore(() => ({ items: [] }));
}

test("fetch() returns {status, headers, body, ms}", async () => {
  const clock = createClock({ speed: 50 });
  const server = createServer(makeStore(), { clock });
  server.route("/ping", () => ({ status: 200, headers: {}, body: { ok: true }, ms: 0 }));
  const res = await server.fetch("/ping");
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { ok: true });
  assert.equal(typeof res.ms, "number");
  assert.ok(res.ms > 0);
});

test("an unknown route returns 404", async () => {
  const clock = createClock({ speed: 50 });
  const server = createServer(makeStore(), { clock });
  const res = await server.fetch("/missing");
  assert.equal(res.status, 404);
});

test("a handler can inject simulated error statuses as data, not as a crash", async () => {
  const clock = createClock({ speed: 50 });
  const server = createServer(makeStore(), { clock });
  server.route("/overloaded", () => ({ status: 429, headers: {}, body: { error: "Too many requests" }, ms: 0 }));
  server.route("/boom", () => {
    throw new Error("simulated failure");
  });

  const overloaded = await server.fetch("/overloaded");
  assert.equal(overloaded.status, 429);

  const boom = await server.fetch("/boom");
  assert.equal(boom.status, 500);
});

test("parallel() runs requests concurrently on the same clock", async () => {
  const clock = createClock({ speed: 1000 });
  const server = createServer(makeStore(), { clock });
  server.route("/a", () => ({ status: 200, headers: {}, body: {}, ms: 0 }));
  server.route("/b", () => ({ status: 200, headers: {}, body: {}, ms: 0 }));

  const started = Date.now();
  const results = await server.parallel([{ path: "/a" }, { path: "/b" }]);
  assert.equal(results.length, 2);
  assert.equal(results[0]?.status, 200);
  assert.equal(results[1]?.status, 200);
  assert.ok(Date.now() - started < 1000, "two overlapping requests should not take ~2x as long as one");
});
