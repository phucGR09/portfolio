import { createRng } from "./rng.js";

const NETWORK_BASE_MS = 20;
const NETWORK_JITTER_PCT = 0.15;

/**
 * Fake HTTP layer — no real network, no real backend. fetch() returns
 * {status, headers, body, ms}. Error states (500, 429) are injected on
 * purpose so a lab's error state shows them as data, not a broken page.
 * @param {import("../types.d.ts").Store} store
 * @param {{ clock: import("../types.d.ts").Clock, logger?: import("../types.d.ts").Logger }} deps
 * @returns {import("../types.d.ts").Server}
 */
export function createServer(store, deps) {
  const { clock, logger } = deps;
  const netRng = createRng(7);
  /** @type {Map<string, import("../types.d.ts").RouteHandler>} */
  const routes = new Map();

  /**
   * @param {string} path
   * @param {import("../types.d.ts").ServerInit} [init]
   * @returns {Promise<import("../types.d.ts").ServerResponse>}
   */
  async function fetchOne(path, init = {}) {
    const latencyMs = Math.max(1, netRng.jitter(NETWORK_BASE_MS, NETWORK_JITTER_PCT));
    const handler = routes.get(path);

    /** @type {import("../types.d.ts").ServerResponse} */
    let result;
    if (!handler) {
      result = { status: 404, headers: {}, body: { error: "Not found" }, ms: latencyMs };
    } else {
      try {
        const raw = await handler(init, store);
        result = { ...raw, ms: latencyMs };
      } catch (err) {
        result = {
          status: 500,
          headers: {},
          body: { error: err instanceof Error ? err.message : "Internal error" },
          ms: latencyMs
        };
      }
    }

    await clock.sleep(latencyMs);
    if (logger) logger.emit("request", { path, status: result.status, ms: result.ms });
    return result;
  }

  return {
    route(path, handler) {
      routes.set(path, handler);
    },
    fetch(path, init) {
      return fetchOne(path, init);
    },
    parallel(reqs) {
      return Promise.all(reqs.map((req) => fetchOne(req.path, req.init)));
    }
  };
}
