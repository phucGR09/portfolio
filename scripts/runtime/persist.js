/** @type {ReadonlySet<import("../types.d.ts").PersistScope>} */
const VALID_SCOPES = new Set(["read", "prefs", "hub"]);

/**
 * @param {string} scope
 * @returns {void}
 */
function assertValidScope(scope) {
  if (!VALID_SCOPES.has(/** @type {import("../types.d.ts").PersistScope} */ (scope))) {
    throw new RangeError(`Unknown persist scope: ${scope}`);
  }
}

/**
 * @param {string} ns
 * @param {string} scope
 * @param {string} [id]
 * @returns {string}
 */
function buildKey(ns, scope, id) {
  return id === undefined ? `${ns}:${scope}` : `${ns}:${scope}:${id}`;
}

/**
 * localStorage wrapper: key schema `pl:<ver>:<scope>[:<id>]` (12b), scope
 * whitelist in code (18), try/catch on every access (12c).
 * @param {string} [ns]
 * @param {Storage | undefined} [storage]
 * @returns {import("../types.d.ts").Persist}
 */
export function createPersist(ns = "pl:v1", storage = globalThis.localStorage) {
  /**
   * @returns {boolean}
   */
  function storageAvailable() {
    if (!storage) return false;
    try {
      const probeKey = `${ns}:__probe__`;
      storage.setItem(probeKey, "1");
      storage.removeItem(probeKey);
      return true;
    } catch {
      return false;
    }
  }

  return {
    get(scope, id) {
      assertValidScope(scope);
      if (!storage) return null;
      try {
        const raw = storage.getItem(buildKey(ns, scope, id));
        return raw === null ? null : JSON.parse(raw);
      } catch {
        return null;
      }
    },
    set(scope, id, value) {
      assertValidScope(scope);
      if (!storage) return;
      try {
        storage.setItem(buildKey(ns, scope, id), JSON.stringify(value));
      } catch {
        // Storage blocked (Safari private mode, quota) — never crash the page.
      }
    },
    remove(scope, id) {
      assertValidScope(scope);
      if (!storage) return;
      try {
        storage.removeItem(buildKey(ns, scope, id));
      } catch {
        // ignore
      }
    },
    available() {
      return storageAvailable();
    }
  };
}
