// one-rule-five-places.js — Change Propagation. Response is 5 ScreenTiles
// that should all agree on one rate; Internals is a FileGraph showing which
// file the change actually reached. Which tile gets missed in duplicated
// mode is chosen by rng(seed), so it is random-looking but reproducible.
import { defineLab } from "../runtime/lab.js";
import { createRng } from "../runtime/rng.js";

const SEED = 20261115;
const SCREENS = ["Cart", "Invoice", "Email receipt", "Admin report", "Mobile app"];
const OLD_RATE = 8;

/** @param {HTMLElement} el @param {readonly number[]} rates @param {number} missedIndex @param {boolean} duplicated */
function renderTiles(el, rates, missedIndex, duplicated) {
  el.replaceChildren();
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
  el.append(grid);
}

/** @param {HTMLElement} el @param {number} missedIndex @param {boolean} duplicated */
function renderFileGraph(el, missedIndex, duplicated) {
  el.replaceChildren();
  const list = document.createElement("ol");
  list.className = "lab-file-graph";
  for (let i = 0; i < SCREENS.length; i += 1) {
    const li = document.createElement("li");
    const reached = !duplicated || i !== missedIndex;
    li.dataset.sig = reached ? "ok" : "bad";
    li.textContent = `${SCREENS[i]}.rate ${reached ? "updated" : "NOT updated"}`;
    list.append(li);
  }
  el.append(list);
}

export default defineLab({
  id: "one-rule-five-places",
  stage: {
    bg: "raised",
    layout: "propagation",
    zones: { control: "1/1/2/3", response: "2/2/3/3", internals: "2/1/3/2", verdict: "3/1/4/3" },
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
    renderTiles(els.response, rates, -1, false);
    renderFileGraph(els.internals, -1, false);
  },
  async run({ mode, inputs, clock, els }) {
    const newRate = inputs.rate ?? 10;
    const duplicated = mode === "naive";
    const missedIndex = createRng(SEED).int(0, SCREENS.length - 1);

    await clock.sleep(40);
    const rates = SCREENS.map((_, i) => (duplicated && i === missedIndex ? OLD_RATE : newRate));
    renderTiles(els.response, rates, missedIndex, duplicated);
    renderFileGraph(els.internals, missedIndex, duplicated);

    const missed = duplicated ? 1 : 0;
    const filesChanged = duplicated ? SCREENS.length : 1;
    return { metrics: { filesChanged, missed } };
  }
});
