/**
 * Number + unit formatting (RULE 4c). Every measurable number shown on a
 * Verdict must go through here — one place owns "how a number looks" for
 * the whole site. Never leaks NaN/undefined text; falls back to "—".
 */

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * @param {number} n
 * @returns {string}
 */
function groupThousands(n) {
  const sign = n < 0 ? "-" : "";
  const digits = Math.abs(Math.round(n)).toString();
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return sign + grouped;
}

/**
 * @param {number} ms
 * @returns {string}
 */
export function duration(ms) {
  if (!isFiniteNumber(ms)) return "— ms";
  if (Math.abs(ms) < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/**
 * @param {number} n
 * @param {string} [unit]
 * @returns {string}
 */
export function count(n, unit = "") {
  if (!isFiniteNumber(n)) return unit ? `— ${unit}` : "—";
  const value = groupThousands(n);
  return unit ? `${value} ${unit}` : value;
}

/**
 * @param {number} n
 * @returns {string}
 */
export function bytes(n) {
  if (!isFiniteNumber(n)) return "— B";
  const abs = Math.abs(n);
  if (abs < 1024) return `${Math.round(n)} B`;
  if (abs < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * @param {number} vnd
 * @returns {string}
 */
export function money(vnd) {
  if (!isFiniteNumber(vnd)) return "— đ";
  return `${groupThousands(vnd)} đ`;
}

/**
 * @param {number} x
 * @returns {string}
 */
export function pct(x) {
  if (!isFiniteNumber(x)) return "— %";
  return `${x.toFixed(1)}%`;
}
