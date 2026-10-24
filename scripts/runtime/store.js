import { createRng } from "./rng.js";

const SELECT_BASE_MS = 0.8;
const SELECT_MS_PER_ROW = 0.02;
const INSERT_BASE_MS = 0.5;
const JITTER_PCT = 0.12;

/**
 * In-memory DB that accounts for every access (RULE 7a/7d). Never caches,
 * batches, or reorders on a lab's behalf — select() 101 times costs 101
 * times, or the N+1 lesson stops being true.
 * @param {() => unknown} datasetFactory
 * @param {{ seed?: number }} [options]
 * @returns {import("../types.d.ts").Store}
 */
export function createStore(datasetFactory, options = {}) {
  const { seed = 1 } = options;
  const rng = createRng(seed);

  let tables = /** @type {Record<string, import("../types.d.ts").Row[]>} */ (datasetFactory());

  /** @type {import("../types.d.ts").QueryCost[]} */
  let costs = [];

  return {
    select(table, predicate, opts = {}) {
      const rows = tables[table];
      if (!rows) throw new Error(`Unknown table: ${table}`);

      const matched = rows.filter(predicate);
      const n = rows.length;
      const usedIndex = Boolean(opts.index);
      const rowsScanned = usedIndex ? Math.max(1, Math.ceil(Math.log2(Math.max(n, 1)))) : n;
      const ms = Math.max(0, rng.jitter(SELECT_BASE_MS + SELECT_MS_PER_ROW * rowsScanned, JITTER_PCT));

      costs.push({ table, op: "select", rowsScanned, rowsReturned: matched.length, usedIndex, ms });

      return typeof opts.limit === "number" ? matched.slice(0, opts.limit) : matched;
    },

    insert(table, row) {
      const rows = tables[table];
      if (!rows) throw new Error(`Unknown table: ${table}`);

      rows.push(row);
      const ms = Math.max(0, rng.jitter(INSERT_BASE_MS, JITTER_PCT));
      costs.push({ table, op: "insert", rowsScanned: 0, rowsReturned: 1, usedIndex: false, ms });
    },

    tx(fn) {
      return fn();
    },

    costs() {
      return costs.slice();
    },

    reset() {
      tables = /** @type {Record<string, import("../types.d.ts").Row[]>} */ (datasetFactory());
      costs = [];
    }
  };
}
