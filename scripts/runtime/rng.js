/**
 * Deterministic PRNG (mulberry32). Same seed -> same sequence, every time,
 * every machine. Used so every number a lab shows is reproducible (RULE 7c).
 * @param {number} seed
 * @returns {import("../types.d.ts").Rng}
 */
export function createRng(seed) {
  let a = seed | 0;

  function nextRaw() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    next() {
      return nextRaw();
    },
    int(min, max) {
      return min + Math.floor(nextRaw() * (max - min + 1));
    },
    /**
     * @template T
     * @param {readonly T[]} arr
     * @returns {T}
     */
    pick(arr) {
      const index = Math.min(Math.floor(nextRaw() * arr.length), arr.length - 1);
      return /** @type {T} */ (arr[index]);
    },
    jitter(value, pct) {
      const delta = value * pct * (nextRaw() * 2 - 1);
      return value + delta;
    }
  };
}
