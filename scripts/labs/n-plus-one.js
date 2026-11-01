// n-plus-one.js — the reference lab (3/18 pages reuse this shape). Response is
// the DataTable kernel; Internals stacks FlowDiagram above LogTerminal (lab-
// detail-component-system.md §1/§3). Verdict numbers come straight from
// db.costs(). Log lines go through log("query", ...) rather than the default
// "log" type so lab.js's plain-text fallback never mounts alongside these
// richer kernels (both would otherwise render into the same internals zone).
import { defineLab } from "../runtime/lab.js";
import { createDataTable, nameCell, pillCell, subCell } from "../kernel/data-table.js";
import { createFlowDiagram } from "../kernel/flow-diagram.js";
import { createLogTerminal } from "../kernel/log-terminal.js";
import { duration } from "../runtime/fmt.js";

/** @type {readonly import("../kernel/data-table.js").DataTableColumn[]} */
const COLUMNS = [
  { key: "name", label: "Candidate", sortable: true, render: (row) => nameCell(String(row.name)) },
  { key: "company", label: "Company", render: (row) => String(row.company ?? "—") },
  { key: "access", label: "Access", render: (row) => pillCell(String(row.accessKind ?? "fresh"), String(row.accessLabel ?? "—")) },
  { key: "email", label: "Email", sortable: true, render: (row) => (row.email ? subCell(String(row.email)) : "—") }
];

/** @type {import("../kernel/flow-diagram.js").FlowDiagramSpec} */
const DIAGRAM_SPEC = {
  title: "Request path",
  width: 740,
  height: 230,
  viewBox: "0 0 740 230",
  nodes: [
    { id: "browser", title: "Browser", role: "client", icon: "browser", top: 85, left: 0, width: 120 },
    { id: "api", title: "API server", role: "route handler", icon: "server", top: 83, left: 190, width: 130 },
    { id: "candidates", title: "candidates", role: "table", icon: "table", top: 10, left: 420, width: 220 },
    { id: "companies", title: "companies", role: "table", icon: "table", top: 148, left: 420, width: 220, badge: true }
  ],
  edges: [
    { id: "browserApi", d: "M 120 110 H 190" },
    { id: "apiCandidates", d: "M 320 105 H 370 V 45 H 420" },
    { id: "apiCompanies", d: "M 320 120 H 370 V 183 H 420", labelText: "select * (×0)", labelX: 378, labelY: 200 }
  ]
};

/** @param {Readonly<Record<import("../types.d.ts").Zone, HTMLElement>>} els */
function buildIdleInternals(els) {
  els.internals.replaceChildren();
  createFlowDiagram(els.internals, DIAGRAM_SPEC);
  createLogTerminal(els.internals, { tabName: "n-plus-one.log" });
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
    els.response.replaceChildren();
    const dataTable = createDataTable(els.response, COLUMNS);
    dataTable.setStatus("—");
    const hint = document.createElement("p");
    hint.textContent = "Load candidates to see the roster fill in.";
    els.response.append(hint);
    buildIdleInternals(els);
  },
  async run({ mode, inputs, db, log, clock, els }) {
    const rows = inputs.rows ?? 100;

    els.response.replaceChildren();
    const dataTable = createDataTable(els.response, COLUMNS);

    els.internals.replaceChildren();
    const diagram = createFlowDiagram(els.internals, DIAGRAM_SPEC);
    const terminal = createLogTerminal(els.internals, { tabName: "n-plus-one.log" });
    terminal.setLive(true);

    const candidates = db.select("candidates", () => true, { limit: rows });
    dataTable.setGhostRows(candidates);

    diagram.activateNode("browser");
    diagram.activateEdge("browserApi");
    diagram.activateNode("api");
    diagram.activateEdge("apiCandidates");
    diagram.activateNode("candidates");
    terminal.appendLine({ ts: duration(clock.now()), method: "SELECT", path: "candidates", status: "ok", statusText: "200", dur: "—" });

    if (mode === "naive") {
      let i = 0;
      for (const candidate of candidates) {
        const [company] = db.select("companies", (c) => c.id === candidate.companyId);
        const cost = db.costs().at(-1);
        log("query", { text: `SELECT * FROM companies WHERE id = ${candidate.companyId}` });
        diagram.activateEdge("apiCompanies");
        diagram.activateNode("companies");
        diagram.setLabel("apiCompanies", `select * (×${i + 1})`, true);
        diagram.setBadge("companies", i + 1, true);
        terminal.appendLine({
          ts: duration(clock.now()),
          method: "SELECT",
          path: `companies WHERE id = ${candidate.companyId}`,
          status: i > 0 && i % 7 === 6 ? "warn" : "ok",
          statusText: "200",
          dur: cost ? cost.ms.toFixed(1) : "—"
        });
        dataTable.fillRow(i, { company: company ? String(company.name) : "—", email: candidate.email, accessKind: "fresh", accessLabel: "1 query" });
        i += 1;
        await clock.sleep(8);
      }
    } else {
      const companies = db.select("companies", () => true, { index: true });
      const cost = db.costs().at(-1);
      log("query", { text: "SELECT * FROM companies WHERE id IN (...)" });
      diagram.activateEdge("apiCompanies");
      diagram.activateNode("companies");
      diagram.setLabel("apiCompanies", "SELECT * WHERE id IN (...)", true);
      diagram.setBadge("companies", 1, true);
      terminal.appendLine({
        ts: duration(clock.now()),
        method: "SELECT",
        path: "companies WHERE id IN (...)",
        status: "ok",
        statusText: "200",
        dur: cost ? cost.ms.toFixed(1) : "—"
      });
      const byId = new Map(companies.map((c) => [c.id, c]));
      let i = 0;
      for (const candidate of candidates) {
        const company = byId.get(candidate.companyId);
        dataTable.fillRow(i, { company: company ? String(company.name) : "—", email: candidate.email, accessKind: "cached", accessLabel: "joined" });
        i += 1;
        await clock.sleep(2);
      }
    }

    terminal.setLive(false);
    const costs = db.costs();
    const ms = costs.reduce((sum, c) => sum + c.ms, 0);
    dataTable.setStatus("200 OK", ms);
    return { metrics: { queries: costs.length, ms } };
  }
});
