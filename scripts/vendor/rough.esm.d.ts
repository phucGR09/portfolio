// Minimal hand-written type surface for the vendored rough.esm.js — only the
// shapes scripts/kernel/sketch.js actually calls, not the full rough.js API.
export interface RoughOptions {
  stroke?: string;
  strokeWidth?: number;
  roughness?: number;
  bowing?: number;
  seed?: number;
  fill?: string;
  fillStyle?: string;
}

export interface RoughSVG {
  line(x1: number, y1: number, x2: number, y2: number, options?: RoughOptions): SVGGElement;
  rectangle(x: number, y: number, width: number, height: number, options?: RoughOptions): SVGGElement;
  path(d: string, options?: RoughOptions): SVGGElement;
}

interface Rough {
  svg(svg: SVGSVGElement, config?: { options?: RoughOptions }): RoughSVG;
}

declare const rough: Rough;
export default rough;
