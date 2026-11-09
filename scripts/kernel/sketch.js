// Progressive enhancement: replaces straight SVG primitives with a hand-drawn
// rough.js rendering, so a page stays correct (straight lines/boxes) without
// JS and only gets the sketch look where JS actually runs.
import rough from "../vendor/rough.esm.js";

/**
 * Replace every `<line data-sketch>` inside root with a rough.js hand-drawn
 * line of the same geometry and stroke, read straight off the original
 * element's own attributes so the markup stays the single source of truth.
 * @param {SVGSVGElement} root
 */
export function sketchifyLines(root) {
  const rc = rough.svg(root);
  for (const line of [...root.querySelectorAll("line[data-sketch]")]) {
    const x1 = Number(line.getAttribute("x1"));
    const y1 = Number(line.getAttribute("y1"));
    const x2 = Number(line.getAttribute("x2"));
    const y2 = Number(line.getAttribute("y2"));
    const stroke = line.getAttribute("stroke") ?? "currentColor";
    const sketch = rc.line(x1, y1, x2, y2, { stroke, strokeWidth: 2, roughness: 2.2, bowing: 1.4 });
    sketch.setAttribute("class", line.getAttribute("class") ?? "");
    line.replaceWith(sketch);
  }
}
