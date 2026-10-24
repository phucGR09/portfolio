import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseHTML } from "linkedom";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

/**
 * Build a DOM from an HTML string using linkedom.
 * @param {string} html
 * @returns {{ document: Document, window: Window }}
 */
export function makeDom(html) {
  const { document, window } = parseHTML(html);
  return { document, window };
}

/**
 * Fake localStorage. `throwing: true` simulates Safari private mode
 * (setItem throws QuotaExceededError) — used to test RULE 12c.
 * @param {{ throwing?: boolean }} [options]
 * @returns {Storage}
 */
export function fakeStorage(options = {}) {
  const { throwing = false } = options;
  const data = new Map();

  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      if (throwing) {
        throw new DOMException("QuotaExceededError", "QuotaExceededError");
      }
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
    clear() {
      data.clear();
    },
    key(index) {
      return Array.from(data.keys())[index] ?? null;
    },
    get length() {
      return data.size;
    }
  };
}

/**
 * Read a repo file by a path relative to the repo root.
 * @param {string} rel
 * @returns {string}
 */
export function readFile(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}

/**
 * Repo root (the directory containing package.json).
 * @returns {string}
 */
export function repoRoot() {
  return ROOT;
}
