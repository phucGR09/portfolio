const MAX_HISTORY = 500;

/**
 * Event bus. The Internals zone only ever subscribes here — it never calls
 * into a lab's run() directly. Ring buffer caps at 500 events so a long run
 * (500+ rows) doesn't grow memory without bound on a 360px tab.
 * @returns {import("../types.d.ts").Logger}
 */
export function createLogger() {
  /** @type {import("../types.d.ts").LogEvent[]} */
  const buffer = [];
  /** @type {Map<string, Set<import("../types.d.ts").LogListener>>} */
  const listeners = new Map();

  return {
    emit(type, payload) {
      buffer.push({ type, payload, at: Date.now() });
      if (buffer.length > MAX_HISTORY) buffer.shift();
      const set = listeners.get(type);
      if (!set) return;
      for (const fn of set) fn(payload);
    },
    on(type, fn) {
      let set = listeners.get(type);
      if (!set) {
        set = new Set();
        listeners.set(type, set);
      }
      set.add(fn);
    },
    off(type, fn) {
      listeners.get(type)?.delete(fn);
    },
    history() {
      return buffer.slice();
    }
  };
}
