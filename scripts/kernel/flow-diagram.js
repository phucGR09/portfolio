// FlowDiagram — ported from request-architecture.html v2 mockup (lab-detail-
// component-system.md §3). Geometry (node rects, edge paths) is declarative data
// a lab supplies; this module only knows how to draw and activate it, never how
// to lay a new graph out, so no lab hand-rolls its own SVG wiring (plan rule 3).
const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * @typedef {"browser" | "server" | "table"} FlowIcon
 * @typedef {{ id: string, title: string, role: string, icon: FlowIcon, top: number, left: number, width: number, badge?: boolean }} FlowNode
 * @typedef {{ id: string, d: string, labelText?: string, labelX?: number, labelY?: number }} FlowEdge
 * @typedef {{ title: string, width: number, height: number, viewBox: string, nodes: readonly FlowNode[], edges: readonly FlowEdge[] }} FlowDiagramSpec
 */

/** @param {string} tag @param {Record<string, string>} [attrs] @returns {SVGElement} */
function svgEl(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}

/** @param {string} id @param {string} fill @returns {SVGMarkerElement} */
function buildMarker(id, fill) {
  const marker = /** @type {SVGMarkerElement} */ (svgEl("marker", { id, viewBox: "0 0 10 10", refX: "8", refY: "5", markerWidth: "7", markerHeight: "7", orient: "auto-start-reverse" }));
  marker.append(svgEl("path", { d: "M0,0 L10,5 L0,10 z", fill }));
  return marker;
}

/** @param {FlowIcon} kind @returns {HTMLElement} */
function buildIcon(kind) {
  if (kind === "browser") {
    const wrap = document.createElement("span");
    wrap.className = "fd-icon-browser";
    for (let i = 0; i < 3; i += 1) wrap.append(document.createElement("span"));
    return wrap;
  }
  if (kind === "server") {
    const node = document.createElement("span");
    node.className = "fd-icon-server";
    return node;
  }
  const node = document.createElement("span");
  node.className = "fd-icon-table";
  for (let i = 0; i < 3; i += 1) node.append(document.createElement("span"));
  return node;
}

/**
 * @param {HTMLElement} root
 * @param {FlowDiagramSpec} spec
 */
export function createFlowDiagram(root, spec) {
  root.classList.add("fd");
  const title = document.createElement("p");
  title.className = "fd-title";
  title.textContent = spec.title;

  const board = document.createElement("div");
  board.className = "fd-board";
  board.style.width = `${spec.width}px`;
  board.style.height = `${spec.height}px`;

  const svg = svgEl("svg", { viewBox: spec.viewBox, preserveAspectRatio: "xMinYMin meet" });
  const defs = svgEl("defs");
  // Fallback fill only — source/lab.css's `.fd #fdArrow(Active) path` rules
  // own the real color so it tracks --text-mute/--accent, not a literal here.
  defs.append(buildMarker("fdArrow", "#74708a"), buildMarker("fdArrowActive", "#8d7bff"));
  svg.append(defs);

  /** @type {Map<string, SVGPathElement>} */
  const edgeEls = new Map();
  /** @type {Map<string, SVGTextElement>} */
  const labelEls = new Map();
  for (const edge of spec.edges) {
    const path = /** @type {SVGPathElement} */ (svgEl("path", { class: "fd-edge", d: edge.d, "marker-end": "url(#fdArrow)" }));
    svg.append(path);
    edgeEls.set(edge.id, path);
    if (edge.labelText !== undefined) {
      const text = /** @type {SVGTextElement} */ (svgEl("text", { class: "fd-edge-label", x: String(edge.labelX ?? 0), y: String(edge.labelY ?? 0), "text-anchor": "middle" }));
      text.textContent = edge.labelText;
      svg.append(text);
      labelEls.set(edge.id, text);
    }
  }
  board.append(svg);

  /** @type {Map<string, HTMLElement>} */
  const nodeEls = new Map();
  /** @type {Map<string, HTMLElement>} */
  const badgeEls = new Map();
  for (const node of spec.nodes) {
    const nodeEl = document.createElement("div");
    nodeEl.className = "fd-node";
    nodeEl.dataset.active = "false";
    nodeEl.style.top = `${node.top}px`;
    nodeEl.style.left = `${node.left}px`;
    nodeEl.style.width = `${node.width}px`;
    const icon = document.createElement("span");
    icon.className = "fd-icon";
    icon.append(buildIcon(node.icon));
    const text = document.createElement("div");
    const titleDiv = document.createElement("div");
    titleDiv.className = "title";
    titleDiv.textContent = node.title;
    const roleDiv = document.createElement("div");
    roleDiv.className = "role";
    roleDiv.textContent = node.role;
    text.append(titleDiv, roleDiv);
    nodeEl.append(icon, text);
    if (node.badge) {
      const badge = document.createElement("span");
      badge.className = "fd-badge";
      badge.textContent = "0";
      nodeEl.append(badge);
      badgeEls.set(node.id, badge);
    }
    board.append(nodeEl);
    nodeEls.set(node.id, nodeEl);
  }

  const scroll = document.createElement("div");
  scroll.className = "fd-scroll";
  scroll.append(board);
  root.append(title, scroll);

  return {
    clear() {
      for (const node of nodeEls.values()) node.dataset.active = "false";
      for (const edge of edgeEls.values()) {
        edge.dataset.active = "false";
        edge.setAttribute("marker-end", "url(#fdArrow)");
      }
      for (const badge of badgeEls.values()) {
        badge.classList.remove("show");
        badge.textContent = "0";
      }
      for (const label of labelEls.values()) label.classList.remove("active");
    },
    /** @param {string} id */
    activateNode(id) {
      const node = nodeEls.get(id);
      if (node) node.dataset.active = "true";
    },
    /** @param {string} id */
    activateEdge(id) {
      const edge = edgeEls.get(id);
      if (!edge) return;
      edge.dataset.active = "true";
      edge.setAttribute("marker-end", "url(#fdArrowActive)");
    },
    /** @param {string} id @param {string | number} value @param {boolean} [show] */
    setBadge(id, value, show = true) {
      const badge = badgeEls.get(id);
      if (!badge) return;
      badge.textContent = String(value);
      badge.classList.toggle("show", show);
    },
    /** @param {string} id @param {string} text @param {boolean} [active] */
    setLabel(id, text, active = false) {
      const label = labelEls.get(id);
      if (!label) return;
      label.textContent = text;
      label.classList.toggle("active", active);
    }
  };
}
