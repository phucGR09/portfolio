// LogTerminal — ported from server-terminal.html mockup (lab-detail-component-
// system.md §3). Deliberately its own fixed phosphor-on-black palette, never
// themed (source/lab.css .lt-* rules carry no dark-mode override, on purpose).
// A just-appended line fades via a CSS animation instead of a JS removeClass
// timer, so this module never needs setTimeout (clock.js owns all sim timing).

/**
 * @typedef {{ ts: string, method: string, path: string, status: "ok" | "warn" | "bad", statusText: string, dur: string }} LogTerminalLine
 */

/** @param {string} tag @param {Record<string, string>} [attrs] @returns {HTMLElement} */
function el(tag, attrs = {}) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}

/**
 * @param {HTMLElement} root
 * @param {{ tabName: string }} options
 */
export function createLogTerminal(root, { tabName }) {
  root.classList.add("lt");

  const chrome = el("div", { class: "lt-chrome" });
  for (let i = 0; i < 3; i += 1) chrome.append(el("span", { class: "lt-dot" }));
  const tab = el("span", { class: "lt-tab" });
  tab.textContent = tabName;
  const live = el("span", { class: "lt-live" });
  live.dataset.state = "idle";
  const led = el("span", { class: "led" });
  const liveLabel = document.createTextNode("idle");
  live.append(led, liveLabel);
  chrome.append(tab, live);

  const prompt = el("div", { class: "lt-prompt" });
  const promptLabel = document.createElement("span");
  promptLabel.textContent = `$ tail -f ${tabName}`;
  prompt.append(promptLabel, el("span", { class: "lt-caret" }));

  const scroll = el("div", { class: "lt-scroll" });
  scroll.append(prompt);

  const jump = /** @type {HTMLButtonElement} */ (el("button", { type: "button", class: "lt-jump" }));
  jump.textContent = "Jump to latest ↓";

  const body = el("div", { class: "lt-body" });
  body.append(scroll, jump);

  const readonly = el("div", { class: "lt-readonly" });
  const badge = el("span", { class: "badge" });
  badge.textContent = "read-only";
  const msg = el("span", { class: "msg" });
  msg.textContent = "Output stream only — nothing here accepts input.";
  readonly.append(badge, msg);

  root.append(chrome, body, readonly);

  let pinned = true;
  scroll.addEventListener("scroll", () => {
    pinned = scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight < 24;
    jump.classList.toggle("show", !pinned);
  });
  jump.addEventListener("click", () => {
    scroll.scrollTop = scroll.scrollHeight;
    pinned = true;
    jump.classList.remove("show");
  });

  return {
    /** @param {boolean} isLive */
    setLive(isLive) {
      live.dataset.state = isLive ? "live" : "idle";
      liveLabel.textContent = isLive ? "live" : "idle";
    },
    /** @param {LogTerminalLine} line */
    appendLine(line) {
      const row = el("div", { class: "line highlight" });
      row.dataset.status = line.status;
      const ts = el("span", { class: "ts" });
      ts.textContent = line.ts;
      const method = el("span", { class: "method" });
      method.textContent = line.method;
      const path = el("span", { class: "path" });
      path.textContent = line.path;
      const status = el("span", { class: "status" });
      status.textContent = line.statusText;
      const dur = el("span", { class: "dur" });
      dur.textContent = line.dur;
      row.append(ts, method, path, status, dur);
      scroll.insertBefore(row, prompt);
      if (pinned) scroll.scrollTop = scroll.scrollHeight;
    },
    reset() {
      scroll.replaceChildren(prompt);
      live.dataset.state = "idle";
      liveLabel.textContent = "idle";
      pinned = true;
      jump.classList.remove("show");
    }
  };
}
