// hub-view.js — catalog List/Slides toggle: a native CSS scroll-snap track
// for the slide view, persisted via persist.js ("prefs" scope, A5).
import { createPersist } from "./runtime/persist.js";

/**
 * @param {unknown} value
 * @returns {"list" | "slides"}
 */
function sanitizeView(value) {
  return value === "slides" ? "slides" : "list";
}

/**
 * @param {{
 *   listEl: HTMLElement,
 *   trackEl: HTMLElement,
 *   trackControls: HTMLElement,
 *   listButton: HTMLButtonElement,
 *   slidesButton: HTMLButtonElement,
 *   prevButton: HTMLButtonElement,
 *   nextButton: HTMLButtonElement
 * }} opts
 * @returns {{ render: (cards: readonly HTMLElement[]) => void }}
 */
export function setupCatalogView(opts) {
  const { listEl, trackEl, trackControls, listButton, slidesButton, prevButton, nextButton } = opts;
  const reduceMotion = typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const persist = createPersist();
  let view = sanitizeView(persist.get("prefs", "catalogView"));
  let cardCount = 0;

  /** @returns {number} */
  function cardWidth() {
    const first = /** @type {HTMLElement | null} */ (trackEl.querySelector(".catalog-card"));
    return first ? first.getBoundingClientRect().width + 18 : 280;
  }

  function updateTrackButtons() {
    prevButton.disabled = trackEl.scrollLeft <= 2;
    nextButton.disabled = trackEl.scrollLeft >= trackEl.scrollWidth - trackEl.clientWidth - 2;
  }

  function applyView() {
    const isSlides = view === "slides" && cardCount > 1;
    listButton.setAttribute("aria-pressed", String(!isSlides));
    slidesButton.setAttribute("aria-pressed", String(isSlides));
    listEl.classList.toggle("is-hidden", isSlides);
    trackEl.classList.toggle("is-active", isSlides);
    trackControls.classList.toggle("is-hidden", !isSlides || cardCount <= 1);
    if (isSlides) {
      trackEl.scrollLeft = 0;
      updateTrackButtons();
    }
  }

  /** @param {"list" | "slides"} next */
  function setView(next) {
    view = next;
    persist.set("prefs", "catalogView", view);
    applyView();
  }

  listButton.addEventListener("click", () => setView("list"));
  slidesButton.addEventListener("click", () => setView("slides"));
  prevButton.addEventListener("click", () => {
    trackEl.scrollBy({ left: -cardWidth(), behavior: reduceMotion ? "auto" : "smooth" });
  });
  nextButton.addEventListener("click", () => {
    trackEl.scrollBy({ left: cardWidth(), behavior: reduceMotion ? "auto" : "smooth" });
  });
  trackEl.addEventListener("scroll", updateTrackButtons);
  trackEl.addEventListener("keydown", (event) => {
    const key = /** @type {KeyboardEvent} */ (event).key;
    if (key === "ArrowRight") trackEl.scrollBy({ left: cardWidth(), behavior: reduceMotion ? "auto" : "smooth" });
    if (key === "ArrowLeft") trackEl.scrollBy({ left: -cardWidth(), behavior: reduceMotion ? "auto" : "smooth" });
  });

  return {
    render(cards) {
      listEl.replaceChildren(...cards);
      trackEl.replaceChildren(.../** @type {HTMLElement[]} */ (cards.map((card) => card.cloneNode(true))));
      cardCount = cards.length;
      applyView();
    }
  };
}
