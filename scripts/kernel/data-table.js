// DataTable — ported from candidates-admin.html mockup (lab-detail-component-system.md
// §3). Lesson 1 of 18 is the only lab wired to it so far; the other response tables
// stay as lab-row-table until the plan's rollout step. Rows reveal one at a time via
// setGhostRows()/fillRow() so a naive per-row loop reads as a waterfall, not a jump-cut.
import { duration } from "../runtime/fmt.js";

/**
 * @typedef {{ key: string, label: string, sortable?: boolean, render: (row: Record<string, unknown>) => string | Node }} DataTableColumn
 */

/** @param {string} tag @param {Record<string, string>} [attrs] @returns {HTMLElement} */
function el(tag, attrs = {}) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}

/** @param {string} name @returns {string} */
function initials(name) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** @param {string} name @returns {HTMLElement} */
export function nameCell(name) {
  const wrap = el("span", { class: "rc-name-cell" });
  const avatar = el("span", { class: "rc-avatar" });
  avatar.textContent = initials(name);
  const label = el("span", { class: "rc-cand-name" });
  label.textContent = name;
  wrap.append(avatar, label);
  return wrap;
}

/** @param {string} kind @param {string} label @returns {HTMLElement} */
export function pillCell(kind, label) {
  const pill = el("span", { class: "rc-pill" });
  pill.dataset.k = kind;
  pill.textContent = label;
  return pill;
}

/** @param {string} text @returns {HTMLElement} */
export function subCell(text) {
  const span = el("span", { class: "rc-sub" });
  span.textContent = text;
  return span;
}

/**
 * @param {HTMLElement} root
 * @param {readonly DataTableColumn[]} columns
 */
export function createDataTable(root, columns) {
  root.classList.add("rc");
  const head = el("div", { class: "rc-head" });
  const statusEl = el("span", { class: "rc-status" });
  statusEl.textContent = "—";
  const msEl = el("span", { class: "rc-ms" });
  msEl.textContent = "— ms";
  head.append(statusEl, msEl);

  const table = el("table", { class: "rc-table" });
  const headRow = el("tr");
  for (const column of columns) {
    const th = el("th");
    if (column.sortable) th.dataset.key = column.key;
    th.textContent = column.label;
    if (column.sortable) {
      const arrow = el("span", { class: "arrow" });
      arrow.textContent = "↑";
      th.append(arrow);
      th.addEventListener("click", () => sortBy(column.key));
    }
    headRow.append(th);
  }
  const thead = el("thead");
  thead.append(headRow);
  const tbody = el("tbody");
  table.append(thead, tbody);
  const scroll = el("div", { class: "rc-scroll" });
  scroll.append(table);
  root.append(head, scroll);

  /** @type {Record<string, unknown>[]} */
  let currentRows = [];
  /** @type {HTMLElement[]} */
  let rowEls = [];
  /** @type {string | null} */
  let sortKey = null;
  let sortDir = 1;

  /** @param {Record<string, unknown>} row @returns {HTMLElement} */
  function renderRow(row) {
    const tr = el("tr");
    for (const column of columns) {
      const td = el("td");
      const value = column.render(row);
      if (typeof value === "string") td.textContent = value;
      else td.append(value);
      tr.append(td);
    }
    return tr;
  }

  /** @param {string} key */
  function sortBy(key) {
    sortDir = sortKey === key ? -sortDir : 1;
    sortKey = key;
    for (const th of headRow.querySelectorAll("th[data-key]")) th.removeAttribute("aria-sort");
    headRow.querySelector(`th[data-key="${key}"]`)?.setAttribute("aria-sort", sortDir === 1 ? "ascending" : "descending");
    currentRows = currentRows.slice().sort((a, b) => String(a[key] ?? "").localeCompare(String(b[key] ?? ""), undefined, { numeric: true }) * sortDir);
    rowEls = currentRows.map(renderRow);
    tbody.replaceChildren(...rowEls);
  }

  return {
    /** @param {string} text @param {number} [ms] */
    setStatus(text, ms) {
      statusEl.textContent = text;
      msEl.textContent = typeof ms === "number" ? duration(ms) : "— ms";
    },
    /** @param {number} count */
    setLoading(count) {
      const skeleton = Array.from({ length: count }, () => {
        const tr = el("tr", { class: "rc-skel" });
        for (let i = 0; i < columns.length; i += 1) {
          const td = el("td");
          td.append(el("div", { class: "rc-skel-bar" }));
          tr.append(td);
        }
        return tr;
      });
      tbody.replaceChildren(...skeleton);
    },
    /** @param {readonly Record<string, unknown>[]} rows */
    setGhostRows(rows) {
      currentRows = rows.slice();
      sortKey = null;
      rowEls = currentRows.map(() => {
        const tr = el("tr", { "data-ghost": "true" });
        for (let i = 0; i < columns.length; i += 1) {
          const td = el("td");
          td.textContent = "…";
          tr.append(td);
        }
        return tr;
      });
      tbody.replaceChildren(...rowEls);
    },
    /** @param {number} index @param {Record<string, unknown>} [patch] */
    fillRow(index, patch) {
      const tr = rowEls[index];
      const existing = currentRows[index];
      if (!tr || !existing) return;
      const row = patch ? { ...existing, ...patch } : existing;
      currentRows[index] = row;
      tr.removeAttribute("data-ghost");
      tr.replaceChildren(...Array.from(renderRow(row).children));
    }
  };
}
