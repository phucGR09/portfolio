// ResponseCard — status + ms + collapsible body (UI plan §8.2, spec'd there
// since P0 but never wired up). Reuses the existing chassis .lab-response-card
// style (source/lab.css) — no CSS of its own; for labs whose Response is a
// single JSON/text payload rather than a table (DataTable is the latter).

/**
 * @param {HTMLElement} root
 */
export function createResponseCard(root) {
  root.classList.add("lab-response-card");
  const status = document.createElement("p");
  status.className = "lab-response-card__status";
  status.textContent = "—";
  const body = document.createElement("div");
  body.className = "lab-response-card__body";
  root.append(status, body);

  return {
    /** @param {"ok" | "warn" | "bad"} sig @param {string} text */
    setStatus(sig, text) {
      status.dataset.sig = sig;
      status.textContent = text;
    },
    /** @param {string | Node} content */
    setBody(content) {
      if (typeof content === "string") body.textContent = content;
      else body.replaceChildren(content);
    }
  };
}
