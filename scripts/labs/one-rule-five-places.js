// one-rule-five-places.js — Change Propagation. Response keeps the existing
// ScreenTiles grid (its own 5-parallel-screens shape stays bespoke — a table
// metaphor doesn't fit this problem), just mounted inside ResponseCard for
// the shared status/ms chrome. Internals replaces the plain file list with
// FlowDiagram (1 "VAT rate" source fanning out to the 5 screens) stacked
// above LogTerminal, the same two-block shape as the other labs
// (lab-detail-component-system.md §1/§3). Which tile/edge gets missed in
// duplicated mode is chosen by rng(seed), so it is random-looking but
// reproducible — unchanged from before.
import { defineLab } from "../runtime/lab.js";
import { createRng } from "../runtime/rng.js";
import { createResponseCard } from "../kernel/response-card.js";
import { createFlowDiagram } from "../kernel/flow-diagram.js";
import { createLogTerminal } from "../kernel/log-terminal.js";
import { duration } from "../runtime/fmt.js";

const SEED = 20261115;
const SCREENS = ["Cart", "Invoice", "Email receipt", "Admin report", "Mobile app"];
const SCREEN_IDS = ["cart", "invoice", "email", "admin", "mobile"];
const OLD_RATE = 8;

/** @type {import("../kernel/flow-diagram.js").FlowDiagramSpec} */
const DIAGRAM_SPEC = {
  title: "Rate propagation",
  width: 700,
  height: 370,
  viewBox: "0 0 700 370",
  nodes: [
    { id: "source", title: "VAT rate", role: "shared value", icon: "server", top: 130, left: 0, width: 140 },
    { id: "cart", title: "Cart", role: "screen", icon: "browser", top: 0, left: 460, width: 200 },
    { id: "invoice", title: "Invoice", role: "screen", icon: "browser", top: 70, left: 460, width: 200 },
    { id: "email", title: "Email receipt", role: "screen", icon: "browser", top: 140, left: 460, width: 200 },
    { id: "admin", title: "Admin report", role: "screen", icon: "browser", top: 210, left: 460, width: 200 },
    { id: "mobile", title: "Mobile app", role: "screen", icon: "browser", top: 280, left: 460, width: 200 }
  ],
  edges: [
    { id: "cart", d: "M 140 165 H 300 V 35 H 460" },
    { id: "invoice", d: "M 140 165 H 300 V 105 H 460" },
    { id: "email", d: "M 140 165 H 300 V 175 H 460" },
    { id: "admin", d: "M 140 165 H 300 V 245 H 460" },
    { id: "mobile", d: "M 140 165 H 300 V 315 H 460" }
  ]
};

/** @param {readonly number[]} rates @param {number} missedIndex @param {boolean} duplicated @returns {HTMLElement} */
function renderTiles(rates, missedIndex, duplicated) {
  const grid = document.createElement("div");
  grid.className = "lab-screen-tiles";
  for (let i = 0; i < SCREENS.length; i += 1) {
    const tile = document.createElement("div");
    tile.className = "lab-screen-tile";
    const stale = duplicated && i === missedIndex;
    tile.dataset.sig = stale ? "bad" : "ok";
    const name = document.createElement("p");
    name.textContent = SCREENS[i] ?? "";
    const value = document.createElement("p");
    value.textContent = `${rates[i]}% VAT${stale ? " — inconsistent" : ""}`;
    tile.append(name, value);
    grid.append(tile);
  }
  return grid;
}

/** @param {Readonly<Record<import("../types.d.ts").Zone, HTMLElement>>} els */
function buildIdleInternals(els) {
  els.internals.replaceChildren();
  createFlowDiagram(els.internals, DIAGRAM_SPEC);
  createLogTerminal(els.internals, { tabName: "one-rule.log" });
}

export default defineLab({
  id: "one-rule-five-places",
  stage: {
    bg: "raised",
    layout: "propagation",
    zones: { control: "1/1/2/2", response: "2/1/3/2", internals: "3/1/4/2", verdict: "4/1/5/2" },
    hues: []
  },
  modes: { naive: "Duplicated", principled: "Single source" },
  controls: [
    { type: "button", id: "deploy", label: "Deploy new rate" },
    { type: "range", id: "rate", label: "New VAT %", values: [8, 10, 12], default: 10 }
  ],
  model: { note: "Which screen gets missed is chosen by a seeded RNG, not hand-picked.", seed: SEED },
  metrics: [
    { key: "filesChanged", label: "Files changed", unit: "files" },
    { key: "missed", label: "Missed", unit: "screens" }
  ],
  renderIdle(els) {
    const rates = SCREENS.map(() => OLD_RATE);
    els.response.replaceChildren();
    const card = createResponseCard(els.response);
    card.setBody(renderTiles(rates, -1, false));
    buildIdleInternals(els);
  },
  async run({ mode, inputs, clock, els }) {
    const newRate = inputs.rate ?? 10;
    const duplicated = mode === "naive";
    const missedIndex = createRng(SEED).int(0, SCREENS.length - 1);

    await clock.sleep(40);
    const rates = SCREENS.map((_, i) => (duplicated && i === missedIndex ? OLD_RATE : newRate));

    els.response.replaceChildren();
    const card = createResponseCard(els.response);
    card.setStatus(
      duplicated ? "bad" : "ok",
      duplicated ? "200 OK — 1 of 5 inconsistent" : "200 OK — all 5 consistent"
    );
    card.setBody(renderTiles(rates, missedIndex, duplicated));

    els.internals.replaceChildren();
    const diagram = createFlowDiagram(els.internals, DIAGRAM_SPEC);
    const terminal = createLogTerminal(els.internals, { tabName: "one-rule.log" });
    terminal.setLive(true);
    diagram.activateNode("source");
    for (let i = 0; i < SCREENS.length; i += 1) {
      const id = SCREEN_IDS[i] ?? "";
      const reached = !duplicated || i !== missedIndex;
      diagram.activateEdge(id);
      diagram.activateNode(id);
      if (!reached) diagram.setEdgeSig(id, "bad");
      terminal.appendLine({
        ts: duration(clock.now()),
        method: "PATCH",
        path: `${SCREENS[i]}.rate`,
        status: reached ? "ok" : "bad",
        statusText: reached ? "200" : "409",
        dur: "—"
      });
    }
    terminal.setLive(false);

    const missed = duplicated ? 1 : 0;
    const filesChanged = duplicated ? SCREENS.length : 1;
    return { metrics: { filesChanged, missed } };
  }
});
