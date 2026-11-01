// lab-card-anim.js — per-catalog-card architecture/flow background. A
// DEFAULT_ANIM template renders for any lab slug with no entry of its own in
// ANIMATION_MAP; add a slug there to give a new lab its own diagram.

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * @param {string} tag
 * @param {Readonly<Record<string, string>>} attrs
 * @returns {SVGElement}
 */
function svgEl(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return /** @type {SVGElement} */ (node);
}

/** @typedef {{ kind: "flow", pulseCount?: number, speed?: number, endColor?: string } | { kind: "scatter", nodeCount?: number }} CardAnim */

/** @type {CardAnim} */
const DEFAULT_ANIM = { kind: "flow", pulseCount: 1, speed: 2.6 };

/** @type {Readonly<Record<string, CardAnim>>} */
const ANIMATION_MAP = {
  // N+1: one steady request becomes a burst hitting the store — more
  // pulses, faster, on the same client->service->store chain.
  "n-plus-one-query": { kind: "flow", pulseCount: 5, speed: 1.1 },
  // SQL injection: the flow itself is fine; what arrives at the far end is
  // the problem, so only the end node + its pulses turn danger-red.
  "sql-injection-contact-form": { kind: "flow", pulseCount: 1, speed: 1.8, endColor: "var(--sig-bad)" },
  // One rule, five places: not a pipeline at all — five disconnected copies
  // blinking independently, out of sync with each other.
  "one-rule-five-places": { kind: "scatter", nodeCount: 5 }
};

/**
 * @param {{ pulseCount?: number, speed?: number, endColor?: string }} opts
 * @returns {SVGElement}
 */
function buildFlowBg(opts) {
  const pulseCount = opts.pulseCount ?? 1;
  const speed = opts.speed ?? 2.6;
  const endColor = opts.endColor;

  const svg = svgEl("svg", { viewBox: "0 0 240 90", "aria-hidden": "true" });
  svg.append(
    svgEl("line", { class: "flow-line", x1: "20", y1: "45", x2: "120", y2: "45" }),
    svgEl("line", { class: "flow-line", x1: "120", y1: "45", x2: "220", y2: "45" }),
    svgEl("circle", { class: "flow-node", cx: "20", cy: "45", r: "6" }),
    svgEl("circle", { class: "flow-node", cx: "120", cy: "45", r: "6" })
  );

  const endNode = svgEl("circle", { cx: "220", cy: "45", r: "6" });
  if (endColor) {
    endNode.setAttribute("class", "flow-node flow-node--end flow-node--glow");
    endNode.style.setProperty("fill", endColor);
    endNode.style.setProperty("--glow-color", endColor);
  } else {
    endNode.setAttribute("class", "flow-node flow-node--end");
  }
  svg.append(endNode);

  for (let i = 0; i < pulseCount; i += 1) {
    const delay = -(speed / pulseCount) * i;
    const pulse = svgEl("circle", { class: "flow-pulse", r: "3.4" });
    pulse.style.setProperty("--speed", `${speed}s`);
    pulse.style.setProperty("--delay", `${delay}s`);
    if (endColor) pulse.style.setProperty("fill", endColor);
    svg.append(pulse);
  }
  return svg;
}

/** @param {{ nodeCount?: number }} opts @returns {SVGElement} */
function buildScatterBg(opts) {
  const nodeCount = opts.nodeCount ?? 5;
  // fixed, deterministic positions — no need for randomness per render
  const positions = /** @type {const} */ ([
    [30, 20], [90, 55], [150, 15], [195, 60], [60, 75], [210, 30]
  ]);
  const svg = svgEl("svg", { viewBox: "0 0 240 90", "aria-hidden": "true" });
  for (let i = 0; i < nodeCount; i += 1) {
    const [cx, cy] = positions[i % positions.length] ?? [30, 20];
    const speed = 2.2 + (i % 3) * 0.5;
    const delay = -(i * 0.6);
    const node = svgEl("circle", { class: "scatter-node", cx: String(cx), cy: String(cy), r: "5" });
    node.style.setProperty("--speed", `${speed}s`);
    node.style.setProperty("--delay", `${delay}s`);
    svg.append(node);
  }
  return svg;
}

/**
 * @param {string} slug
 * @returns {HTMLSpanElement}
 */
export function buildCardBg(slug) {
  const anim = ANIMATION_MAP[slug] ?? DEFAULT_ANIM;
  const host = document.createElement("span");
  host.className = "catalog-card__bg";
  host.append(anim.kind === "scatter" ? buildScatterBg(anim) : buildFlowBg(anim));
  return host;
}
