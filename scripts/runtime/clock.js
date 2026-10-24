/**
 * Two time axes (RULE 16): now() is simulated time a Verdict reports;
 * sleep() spends real time so a run feels slow, capped by ceilingMs.
 * Only module allowed to call setTimeout.
 * @param {import("../types.d.ts").ClockOptions} [options]
 * @returns {import("../types.d.ts").Clock}
 */
export function createClock(options = {}) {
  const { speed = 1, ceilingMs = 4000, reducedMotion = false } = options;

  let simMs = 0;
  let realElapsed = 0;
  let skipped = false;
  let aborted = false;

  /** @type {Set<(simMs: number) => void>} */
  const tickListeners = new Set();

  /**
   * @typedef {{ timeoutIds: ReturnType<typeof setTimeout>[], resolve: () => void, reject: (err: Error) => void }} PendingSleep
   */
  /** @type {Set<PendingSleep>} */
  const pending = new Set();

  function emitTick() {
    for (const fn of tickListeners) fn(simMs);
  }

  return {
    now() {
      return simMs;
    },

    sleep(ms) {
      if (aborted) return Promise.reject(new Error("Clock aborted"));

      return new Promise((resolve, reject) => {
        /** @type {PendingSleep} */
        const entry = {
          timeoutIds: [],
          resolve: () => {
            simMs += ms;
            pending.delete(entry);
            resolve();
          },
          reject: (err) => {
            for (const id of entry.timeoutIds) clearTimeout(id);
            pending.delete(entry);
            reject(err);
          }
        };

        if (skipped || realElapsed >= ceilingMs) {
          entry.resolve();
          return;
        }

        const realMs = Math.min(ms / speed, Math.max(ceilingMs - realElapsed, 0));
        const steps = reducedMotion ? 3 : 1;

        for (let i = 1; i <= steps; i += 1) {
          const id = setTimeout(() => {
            realElapsed += realMs / steps;
            emitTick();
            if (i === steps) entry.resolve();
          }, (realMs * i) / steps);
          entry.timeoutIds.push(id);
        }

        pending.add(entry);
      });
    },

    skip() {
      skipped = true;
      for (const entry of pending) {
        for (const id of entry.timeoutIds) clearTimeout(id);
        entry.resolve();
      }
    },

    abort() {
      aborted = true;
      for (const entry of pending) entry.reject(new Error("Clock aborted"));
    },

    onTick(fn) {
      tickListeners.add(fn);
      return () => tickListeners.delete(fn);
    }
  };
}
