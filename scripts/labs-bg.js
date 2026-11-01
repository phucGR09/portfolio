// labs-bg.js — full-screen animated background for /labs/index.html (Phase B).
// Squares as "transfer size": random size, fade in/out, repositioned between
// fades. CSS @keyframes drives the fade; this module only repositions a
// square (on "animationiteration") and handles reduced-motion + visibility.

const SQUARE_COUNT = 22;
const SIZE_MIN = 8;
const SIZE_MAX = 64;

/**
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function between(min, max) {
  return min + Math.random() * (max - min);
}

/** @param {HTMLElement} square */
function reposition(square) {
  square.style.left = `${between(0, 100)}%`;
  square.style.top = `${between(0, 100)}%`;
  const size = between(SIZE_MIN, SIZE_MAX);
  square.style.width = `${size}px`;
  square.style.height = `${size}px`;
  square.style.setProperty("--peak", between(0.06, 0.18).toFixed(2));
}

/** @param {HTMLElement} host */
function mountAnimated(host) {
  for (let i = 0; i < SQUARE_COUNT; i += 1) {
    const square = document.createElement("span");
    square.className = "labs-bg__square";
    reposition(square);
    square.style.animationDelay = `${-between(0, 7).toFixed(2)}s`;
    square.addEventListener("animationiteration", () => reposition(square));
    host.append(square);
  }

  document.addEventListener("visibilitychange", () => {
    host.style.animationPlayState = document.hidden ? "paused" : "running";
    for (const square of host.querySelectorAll(".labs-bg__square")) {
      /** @type {HTMLElement} */ (square).style.animationPlayState = document.hidden ? "paused" : "running";
    }
  });
}

/** @param {HTMLElement} host */
function mountStatic(host) {
  const count = 6;
  for (let i = 0; i < count; i += 1) {
    const square = document.createElement("span");
    square.className = "labs-bg__square labs-bg__square--static";
    reposition(square);
    host.append(square);
  }
}

const host = document.querySelector(".labs-bg");
if (host) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) mountStatic(/** @type {HTMLElement} */ (host));
  else mountAnimated(/** @type {HTMLElement} */ (host));
}
