// no-index-no-mercy.js — Performance. Searching 50k candidates by email with
// no index means a full sequential scan every time; a B-tree index turns it
// into a log2(n) lookup. Response/Internals reuse the same kernel shape as
// the other labs (ResponseCard + FlowDiagram above LogTerminal); Control
// also carries a self-contained "Insert 1,000 rows" benchmark for the
// reverse trade-off (an index that speeds up search slows down every write)
// — this is a real measured number from store.js, not a literal (RULE 7a),
// but it's independent of the main naive/principled run, so it reports its
// own inline readout instead of going through the Verdict zone.
import { defineLab } from "../runtime/lab.js";
import { createStore } from "../runtime/store.js";
import { buildDataset } from "../data/seed.js";
import { createResponseCard } from "../kernel/response-card.js";
import { createFlowDiagram } from "../kernel/flow-diagram.js";
import { createLogTerminal } from "../kernel/log-terminal.js";
import { sketchifyLines } from "../kernel/sketch.js";
import { duration } from "../runtime/fmt.js";

const SEED = 20261201;
const DEFAULT_SIZE = 10000;

// Hand-draw the "Under the hood" seq-scan/index-scan lines — the two static
// <line data-sketch> in no-index-no-mercy.html stay a correct schematic with
// no JS; this only swaps them for a rough.js sketch where JS does run.
const schematic = /** @type {SVGSVGElement | null} */ (document.querySelector('svg[data-schematic="no-index-scan"]'));
if (schematic) sketchifyLines(schematic);

/** @param {number} size @returns {string} */
function targetEmail(size) {
  return `fake.candidate+${String(size).padStart(4, "0")}@example.invalid`;
}

/** @type {import("../kernel/flow-diagram.js").FlowDiagramSpec} */
const DIAGRAM_SPEC = {
  title: "Request path",
  width: 620,
  height: 170,
  viewBox: "0 0 620 170",
  nodes: [
    { id: "browser", title: "Browser", role: "client", icon: "browser", top: 60, left: 0, width: 110 },
    { id: "api", title: "API server", role: "route handler", icon: "server", top: 60, left: 150, width: 140 },
    { id: "candidates", title: "candidates", role: "table", icon: "table", top: 60, left: 400, width: 200, badge: true }
  ],
  edges: [
    { id: "browserApi", d: "M 110 85 H 150" },
    { id: "apiCandidates", d: "M 290 85 H 400", labelText: "Seq Scan on candidates", labelX: 345, labelY: 120 }
  ]
};

/** @param {HTMLElement} control */
function ensureControls(control) {
  if (control.querySelector(".lab-search-input")) return;

  const field = document.createElement("div");
  field.className = "lab-console-field";
  const prefix = document.createElement("span");
  prefix.className = "lab-console-field__prefix";
  prefix.textContent = "search:";
  const input = document.createElement("input");
  input.type = "text";
  input.className = "lab-search-input";
  input.value = targetEmail(DEFAULT_SIZE);
  input.setAttribute("aria-label", "Email to search");
  field.append(prefix, input);

  const bench = document.createElement("div");
  bench.className = "lab-insert-bench";
  const benchButton = document.createElement("button");
  benchButton.type = "button";
  benchButton.className = "lab-insert-bench__button";
  benchButton.textContent = "Insert 1,000 rows";
  const benchReadout = document.createElement("span");
  benchReadout.className = "lab-insert-bench__readout";
  benchReadout.textContent = "the reverse trade-off: an index speeds up search, but every insert now has to update it too";
  benchButton.addEventListener("click", () => {
    const sizeText = control.querySelector(".lab-dial-value")?.textContent ?? String(DEFAULT_SIZE);
    const size = Number(sizeText) || DEFAULT_SIZE;
    const plain = createStore(() => buildDataset(SEED, { candidates: size }));
    const indexed = createStore(() => buildDataset(SEED, { candidates: size }));
    for (let i = 0; i < 1000; i += 1) {
      const row = { id: size + i, companyId: 1, name: "Candidate (bench)", email: `bench+${i}@example.invalid` };
      plain.insert("candidates", row);
      indexed.insert("candidates", row, { indexed: true });
    }
    const plainMs = plain.costs().reduce((sum, c) => sum + c.ms, 0);
    const indexedMs = indexed.costs().reduce((sum, c) => sum + c.ms, 0);
    const slowerPct = plainMs > 0 ? Math.round((indexedMs / plainMs - 1) * 100) : 0;
    benchReadout.textContent = `1,000 inserts on a ${size.toLocaleString()}-row table — no index: ${duration(plainMs)} · with index: ${duration(indexedMs)} (${slowerPct}% slower)`;
  });
  bench.append(benchButton, benchReadout);

  control.append(field, bench);
}

/** @param {Readonly<Record<import("../types.d.ts").Zone, HTMLElement>>} els */
function buildIdleInternals(els) {
  els.internals.replaceChildren();
  createFlowDiagram(els.internals, DIAGRAM_SPEC);
  createLogTerminal(els.internals, { tabName: "no-index-no-mercy.log" });
}

export default defineLab({
  id: "no-index-no-mercy",
  stage: {
    bg: "ledger",
    layout: "scan",
    zones: { control: "1/1/2/2", response: "2/1/3/2", internals: "3/1/4/2", verdict: "4/1/5/2" },
    hues: []
  },
  modes: { naive: "No index", principled: "B-tree index" },
  controls: [
    { type: "range", id: "size", label: "Table size", values: [1000, 10000, 50000], default: DEFAULT_SIZE },
    { type: "button", id: "search", label: "Search" }
  ],
  model: {
    note: "Lookup time scales with table size unless an index turns it into a log2(n) scan.",
    seed: SEED,
    datasetSize: { candidates: 1000 }
  },
  metrics: [
    { key: "rowsScanned", label: "Rows scanned", unit: "rows" },
    { key: "ms", label: "Search time", unit: "ms", fmt: "duration" }
  ],
  renderIdle(els) {
    ensureControls(els.control);
    els.response.replaceChildren();
    const card = createResponseCard(els.response);
    const hint = document.createElement("p");
    hint.textContent = "Search by email to see how long the lookup takes.";
    card.setBody(hint);
    buildIdleInternals(els);
  },
  async run({ mode, inputs, els, clock, log }) {
    const size = inputs.size ?? DEFAULT_SIZE;
    const input = /** @type {HTMLInputElement | null} */ (els.control.querySelector(".lab-search-input"));
    const email = input && input.value ? input.value : targetEmail(size);
    const useIndex = mode === "principled";
    const store = createStore(() => buildDataset(SEED, { candidates: size }));

    els.internals.replaceChildren();
    const diagram = createFlowDiagram(els.internals, DIAGRAM_SPEC);
    const terminal = createLogTerminal(els.internals, { tabName: "no-index-no-mercy.log" });
    terminal.setLive(true);
    diagram.activateNode("browser");
    diagram.activateEdge("browserApi");
    diagram.activateNode("api");
    diagram.activateEdge("apiCandidates");
    diagram.activateNode("candidates");

    const matched = store.select("candidates", (c) => c.email === email, { index: useIndex, limit: 1 });
    const cost = store.costs().at(-1);
    const rowsScanned = cost ? cost.rowsScanned : 0;
    const ms = cost ? cost.ms : 0;
    const scanLabel = useIndex
      ? `Index Scan using idx_candidates_email (rows scanned: ${rowsScanned})`
      : `Seq Scan on candidates (rows scanned: ${rowsScanned})`;
    diagram.setLabel("apiCandidates", scanLabel, true);
    diagram.setBadge("candidates", rowsScanned, true);
    log("query", { text: scanLabel });
    terminal.appendLine({
      ts: duration(clock.now()),
      method: "SELECT",
      path: `candidates WHERE email = '${email}'`,
      status: "ok",
      statusText: matched.length > 0 ? "200" : "404",
      dur: ms.toFixed(1)
    });
    terminal.setLive(false);

    els.response.replaceChildren();
    const card = createResponseCard(els.response);
    if (matched.length === 0) {
      card.setStatus("warn", "200 { matched: 0 }");
      const empty = document.createElement("p");
      empty.textContent = "No candidate found with that email.";
      card.setBody(empty);
    } else {
      const candidate = matched[0];
      card.setStatus("ok", "200 OK — 1 row");
      const body = document.createElement("p");
      body.textContent = `Found: ${String(candidate?.name)} · ${String(candidate?.email)}`;
      card.setBody(body);
    }

    return { metrics: { rowsScanned, ms } };
  }
});
