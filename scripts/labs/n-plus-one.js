// n-plus-one.js — the reference lab (3/18 pages reuse this shape). Response
// draws a RowTable that fills in as it goes; Internals is the kernel
// QueryLogStream; Verdict numbers come straight from db.costs().
import { defineLab } from "../runtime/lab.js";

const COLUMNS = ["Candidate", "Company"];

/** @typedef {{ tr: HTMLElement, cells: HTMLElement[] }} BodyRow */

/** @param {readonly import("../types.d.ts").Row[]} rows @returns {{ table: HTMLTableElement, bodyRows: BodyRow[] }} */
function buildTable(rows) {
  const table = document.createElement("table");
  table.className = "lab-row-table";
  const head = document.createElement("tr");
  for (const col of COLUMNS) {
    const th = document.createElement("th");
    th.textContent = col;
    head.append(th);
  }
  const thead = document.createElement("thead");
  thead.append(head);
  const tbody = document.createElement("tbody");
  /** @type {BodyRow[]} */
  const bodyRows = [];
  for (let i = 0; i < rows.length; i += 1) {
    const tr = document.createElement("tr");
    tr.dataset.sig = "ghost";
    /** @type {HTMLElement[]} */
    const cells = [];
    for (let c = 0; c < COLUMNS.length; c += 1) {
      const td = document.createElement("td");
      td.textContent = "…";
      tr.append(td);
      cells.push(td);
    }
    tbody.append(tr);
    bodyRows.push({ tr, cells });
  }
  table.append(thead, tbody);
  return { table, bodyRows };
}

/**
 * @param {BodyRow[]} bodyRows @param {number} index
 * @param {string} candidateName @param {string} companyName
 */
function fillRow(bodyRows, index, candidateName, companyName) {
  const row = bodyRows[index];
  if (!row) return;
  delete row.tr.dataset.sig;
  const first = row.cells[0];
  const second = row.cells[1];
  if (first) first.textContent = candidateName;
  if (second) second.textContent = companyName;
}

export default defineLab({
  id: "n-plus-one-query",
  stage: {
    bg: "deep",
    layout: "waterfall",
    zones: { control: "1/1/2/3", response: "2/1/3/2", internals: "2/2/3/3", verdict: "3/1/4/3" },
    hues: []
  },
  modes: { naive: "Loop per row", principled: "Join + batch" },
  controls: [
    { type: "button", id: "load", label: "Load candidates" },
    { type: "range", id: "rows", label: "Rows", values: [10, 100, 500], default: 100 }
  ],
  model: { note: "1 round-trip ≈ 0.8ms + 0.02ms/row, jitter ±12%", seed: 20261024, datasetSize: { candidates: 500 } },
  metrics: [
    { key: "queries", label: "Queries", unit: "queries" },
    { key: "ms", label: "Total time", unit: "ms", fmt: "duration" }
  ],
  renderIdle(els) {
    els.response.replaceChildren(buildTable([]).table);
    const hint = document.createElement("p");
    hint.textContent = "Load candidates to see the roster fill in.";
    els.response.append(hint);
  },
  async run({ mode, inputs, db, log, clock, els }) {
    const rows = inputs.rows ?? 100;
    const candidates = db.select("candidates", () => true, { limit: rows });
    const { table, bodyRows } = buildTable(candidates);
    els.response.replaceChildren(table);

    if (mode === "naive") {
      let i = 0;
      for (const candidate of candidates) {
        const [company] = db.select("companies", (c) => c.id === candidate.companyId);
        log("log", { text: `SELECT * FROM companies WHERE id = ${candidate.companyId}` });
        fillRow(bodyRows, i, String(candidate.name), company ? String(company.name) : "—");
        i += 1;
        await clock.sleep(8);
      }
    } else {
      const companies = db.select("companies", () => true, { index: true });
      log("log", { text: "SELECT * FROM companies WHERE id IN (...)" });
      const byId = new Map(companies.map((c) => [c.id, c]));
      let i = 0;
      for (const candidate of candidates) {
        const company = byId.get(candidate.companyId);
        fillRow(bodyRows, i, String(candidate.name), company ? String(company.name) : "—");
        i += 1;
        await clock.sleep(2);
      }
    }

    const costs = db.costs();
    const ms = costs.reduce((sum, c) => sum + c.ms, 0);
    return { metrics: { queries: costs.length, ms } };
  }
});
