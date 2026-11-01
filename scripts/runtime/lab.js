// Renders 4 zones, runs 6 states, binds controls, merges compare. Never draws instruments.
import { createStore } from "./store.js";
import { createServer } from "./server.js";
import { createClock } from "./clock.js";
import { createLogger } from "./logger.js";
import { buildDataset } from "../data/seed.js";
import { duration, count, bytes, money, pct } from "./fmt.js";
const SKIP_DELAY_MS = 1200;
const ZONE_ORDER = ["control", "response", "internals", "verdict"];
/** @param {string} tag @param {Record<string, string>} [attrs] @returns {HTMLElement} */
function el(tag, attrs = {}) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}
/** @param {Element} node */
function clearNode(node) {
  while (node.firstChild) node.firstChild.remove();
}
/** @param {import("../types.d.ts").MetricSpec} metric @param {number} value @returns {string} */
function fmtMetric(metric, value) {
  if (metric.fmt === "duration") return duration(value);
  if (metric.fmt === "bytes") return bytes(value);
  if (metric.fmt === "money") return money(value);
  if (metric.fmt === "pct") return pct(value);
  return count(value, metric.unit);
}
/** @returns {boolean} */
function prefersReducedMotion() {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}
/** @param {unknown} err @returns {boolean} */
function isAbort(err) {
  return err instanceof Error && err.message === "aborted";
}
/** @param {Element} root @param {import("../types.d.ts").StageSpec} stage @returns {Record<import("../types.d.ts").Zone, HTMLElement>} */
function buildZones(root, stage) {
  /** @type {Partial<Record<import("../types.d.ts").Zone, HTMLElement>>} */
  const zones = {};
  for (const name of ZONE_ORDER) {
    const zone = /** @type {import("../types.d.ts").Zone} */ (name);
    const node = el("div", { "data-zone": name });
    node.style.gridArea = stage.zones[zone];
    if (zone === "response") node.setAttribute("aria-live", "polite");
    root.append(node);
    zones[zone] = node;
  }
  return /** @type {Record<import("../types.d.ts").Zone, HTMLElement>} */ (zones);
}
/** @param {HTMLElement} controlZone @param {readonly import("../types.d.ts").Control[]} controls @returns {Record<string, () => number>} */
function buildRangeControls(controlZone, controls) {
  /** @type {Record<string, () => number>} */
  const getters = {};
  for (const control of controls) {
    if (control.type !== "range") continue;
    const defaultIndex = Math.max(0, control.values.indexOf(control.default));
    const attrs = { type: "range", min: "0", max: String(control.values.length - 1), step: "1", value: String(defaultIndex), id: `ctl-${control.id}` };
    const input = /** @type {HTMLInputElement} */ (el("input", attrs));
    const label = el("label", { for: `ctl-${control.id}` });
    label.textContent = control.label;
    const readout = el("output", { class: "lab-dial-value" });
    readout.textContent = String(control.default);
    input.addEventListener("input", () => {
      readout.textContent = String(control.values[Number(input.value)] ?? control.default);
    });
    controlZone.append(label, input, readout);
    getters[control.id] = () => control.values[Number(input.value)] ?? control.default;
  }
  return getters;
}
/** @param {HTMLElement} controlZone @param {import("../types.d.ts").LabSpec} spec */
function buildChrome(controlZone, spec) {
  let mode = "naive";
  let speed = 1;
  let skipRequested = false;
  /** @type {() => void} */ let onRun = () => {};
  /** @type {() => void} */ let onReset = () => {};
  /** @type {() => void} */ let onSkip = () => {};
  if (spec.modes) {
    const modeSwitch = el("button", { type: "button", role: "switch", "aria-checked": "false", class: "lab-switch" });
    const naiveLabel = el("span");
    naiveLabel.textContent = spec.modes.naive;
    const principledLabel = el("span");
    principledLabel.textContent = spec.modes.principled;
    modeSwitch.append(naiveLabel, principledLabel);
    modeSwitch.addEventListener("click", () => {
      mode = mode === "naive" ? "principled" : "naive";
      modeSwitch.setAttribute("aria-checked", String(mode === "principled"));
      modeSwitch.setAttribute("data-mode", mode);
    });
    controlZone.append(modeSwitch);
  }
  const inputGetters = buildRangeControls(controlZone, spec.controls);
  const runButton = el("button", { type: "button", class: "lab-run" });
  const buttonSpec = spec.controls.find((c) => c.type === "button");
  runButton.textContent = buttonSpec ? buttonSpec.label : "Run";
  runButton.addEventListener("click", () => (skipRequested ? onSkip() : onRun()));
  const resetButton = el("button", { type: "button", class: "lab-reset" });
  resetButton.textContent = "Reset";
  resetButton.addEventListener("click", () => onReset());
  const speedToggle = el("button", { type: "button", class: "lab-sim-clock" });
  speedToggle.textContent = "1×";
  speedToggle.addEventListener("click", () => {
    speed = speed === 1 ? 10 : 1;
    speedToggle.textContent = `${speed}×`;
  });
  const banner = el("p", { class: "lab-state-banner" });
  controlZone.append(runButton, resetButton, speedToggle, banner);
  if (spec.renderControls) {
    controlZone.replaceChildren();
    spec.renderControls(controlZone, {
      run: () => onRun(),
      reset: () => onReset(),
      setMode: (next) => { mode = next; },
      getMode: () => /** @type {import("../types.d.ts").Mode} */ (mode)
    });
    banner.hidden = true;
    controlZone.append(banner);
  }
  return {
    banner,
    resetButton,
    getMode: () => /** @type {import("../types.d.ts").Mode} */ (mode),
    getSpeed: () => speed,
    getInputs: () => Object.fromEntries(Object.entries(inputGetters).map(([id, get]) => [id, get()])),
    showSkip: (/** @type {boolean} */ show) => {
      skipRequested = show;
      runButton.textContent = show ? "Skip to result" : buttonSpec ? buttonSpec.label : "Run";
    },
    onRun: (/** @type {() => void} */ fn) => (onRun = fn),
    onReset: (/** @type {() => void} */ fn) => (onReset = fn),
    onSkip: (/** @type {() => void} */ fn) => (onSkip = fn),
    setDisabled: (/** @type {boolean} */ disabled) => {
      for (const node of controlZone.querySelectorAll("button, input")) {
        if (node === resetButton || node.hasAttribute("data-lab-reset")) continue;
        /** @type {HTMLButtonElement | HTMLInputElement} */ (node).disabled = disabled;
      }
    }
  };
}
/** @param {HTMLElement} verdictZone @param {import("../types.d.ts").LabSpec} spec */
function buildVerdict(verdictZone, spec) {
  return spec.metrics.map((metric) => {
    const row = el("div", { class: "lab-readout", "data-metric": metric.key });
    const label = el("span", { class: "lab-readout__label" });
    label.textContent = metric.label;
    const before = el("span", { class: "lab-readout__before" });
    before.textContent = "—";
    const arrow = el("span", { class: "lab-readout__arrow" });
    arrow.textContent = "→";
    const after = el("span", { class: "lab-readout__after" });
    after.textContent = "—";
    row.append(label, before, arrow, after);
    verdictZone.append(row);
    return { metric, before, after };
  });
}
/**
 * A lab passing `{ text: "..." }` gets that string rendered verbatim (no
 * type prefix, no JSON wrapper) — the convention for a pre-formatted line
 * such as a SQL statement. Any other payload shape falls back to the raw
 * `type {...}` dump, which is intended for incidental/debug events only.
 * @param {string} type @param {unknown} payload @returns {string}
 */
function formatLogLine(type, payload) {
  if (payload && typeof payload === "object" && "text" in payload && typeof /** @type {{ text: unknown }} */ (payload).text === "string") {
    return /** @type {{ text: string }} */ (payload).text;
  }
  return `${type}${payload !== undefined ? ` ${JSON.stringify(payload)}` : ""}`;
}
/** @param {HTMLElement} internalsZone */
function buildLogStream(internalsZone) {
  const header = el("p", { class: "lab-log__header" });
  const list = el("ol", { class: "lab-log__list" });
  let lineCount = 0;
  let mounted = false;
  return {
    /** @param {string} type @param {unknown} [payload] */
    push(type, payload) {
      if (!mounted) {
        internalsZone.append(header, list);
        mounted = true;
      }
      lineCount += 1;
      header.textContent = `${lineCount} line${lineCount === 1 ? "" : "s"}`;
      const line = el("li", { class: "lab-log__line" });
      line.textContent = formatLogLine(type, payload);
      list.append(line);
    },
    clear() {
      lineCount = 0;
      header.textContent = "0 lines";
      clearNode(list);
      header.remove();
      list.remove();
      mounted = false;
    }
  };
}
/** @param {import("../types.d.ts").LabSpec} spec */
export function defineLab(spec) {
  const root = typeof document === "undefined" ? null : document.querySelector("[data-lab]");
  if (root) mountLab(root, spec); return spec;
}
/** @param {Element} root @param {import("../types.d.ts").LabSpec} spec */
function mountLab(root, spec) {
  root.setAttribute("data-stage-bg", spec.stage.bg);
  root.classList.add(`stage--${spec.id}`); const zones = buildZones(root, spec.stage);
  const chrome = buildChrome(zones.control, spec);
  const metricRows = buildVerdict(zones.verdict, spec);
  const logStream = buildLogStream(zones.internals);
  const noteDetails = el("details", { class: "lab-model-note" });
  const summary = el("summary");
  summary.textContent = "ⓘ simulated";
  const noteBody = el("p");
  noteBody.textContent = `${spec.model.note} (seed ${spec.model.seed}). Runs entirely in your browser.`;
  noteDetails.append(summary, noteBody);
  root.append(noteDetails);
  if (spec.safety) {
    const safetyLine = el("p", { class: "lab-safety-line" });
    safetyLine.textContent = spec.safety;
    root.append(safetyLine);
  }
  /** @type {Record<string, import("../types.d.ts").RunResult>} */
  const lastByMode = {};
  /** @type {import("../types.d.ts").Clock | null} */
  let activeClock = null;
  let runToken = 0;
  /** @param {import("../types.d.ts").LabState} state */
  function setState(state) {
    root.setAttribute("data-state", state);
    chrome.banner.textContent = state;
  }
  function resetToIdle() {
    runToken += 1;
    activeClock?.abort();
    activeClock = null;
    for (const key of Object.keys(lastByMode)) delete lastByMode[key];
    setState("idle");
    for (const row of metricRows) {
      row.before.textContent = "—";
      row.after.textContent = "—";
    }
    logStream.clear();
    clearNode(zones.response);
    clearNode(zones.internals);
    spec.renderIdle?.(zones);
    chrome.showSkip(false);
    chrome.setDisabled(false);
  }
  /** @param {Record<string, import("../types.d.ts").RunResult>} results */
  function applyCompare(results) {
    const naiveResult = results.naive;
    const principledResult = results.principled;
    if (!naiveResult || !principledResult) return;
    for (const row of metricRows) {
      row.before.textContent = fmtMetric(row.metric, naiveResult.metrics[row.metric.key] ?? NaN);
      row.after.textContent = fmtMetric(row.metric, principledResult.metrics[row.metric.key] ?? NaN);
    }
  }
  async function startRun() {
    const token = (runToken += 1);
    setState("running");
    chrome.setDisabled(true);
    logStream.clear();
    const mode = chrome.getMode();
    const clock = createClock({ speed: chrome.getSpeed(), reducedMotion: prefersReducedMotion() });
    activeClock = clock;
    const store = createStore(() => buildDataset(spec.model.seed, spec.model.datasetSize));
    const logger = createLogger();
    logger.on("log", (payload) => logStream.push("log", payload));
    const server = createServer(store, { clock, logger });
    const skipTimer = setTimeout(() => chrome.showSkip(true), SKIP_DELAY_MS);
    try {
      const outcome = await spec.run({
        mode,
        inputs: chrome.getInputs(),
        db: store,
        server,
        log: (type, payload) => logger.emit(type, payload),
        clock,
        els: zones
      });
      if (token !== runToken) return;
      for (const row of metricRows) {
        row.after.textContent = fmtMetric(row.metric, outcome.metrics[row.metric.key] ?? NaN);
      }
      lastByMode[mode] = { mode, metrics: outcome.metrics, costs: store.costs(), state: "settled" };
      const modeNames = spec.modes ? Object.keys(spec.modes) : [];
      const bothDone = modeNames.length > 0 && modeNames.every((m) => m in lastByMode);
      if (bothDone) {
        applyCompare(lastByMode);
        setState("compare");
      } else {
        setState("settled");
      }
    } catch (err) {
      if (token !== runToken) return;
      setState(isAbort(err) ? "idle" : "error");
      if (!isAbort(err)) {
        clearNode(zones.response);
        const message = el("p", { class: "lab-error" });
        message.textContent = err instanceof Error ? err.message : "Simulated failure.";
        zones.response.append(message);
      }
    } finally {
      clearTimeout(skipTimer);
      chrome.showSkip(false);
      chrome.setDisabled(false);
      activeClock = null;
    }
  }
  chrome.onRun(startRun);
  chrome.onReset(resetToIdle);
  chrome.onSkip(() => activeClock?.skip());
  root.addEventListener("keydown", (event) => {
    if (/** @type {KeyboardEvent} */ (event).key === "Escape") activeClock?.abort();
  });
  resetToIdle();
}
