// sql-injection.js — Attacker Console. Internals shows the exact SQL string
// being built (StringBuilder); Response shows what the naive query actually
// returns (LeakTable). Model simplification, stated in the lesson text: any
// unescaped quote in naive mode is treated as breaking out of the string
// literal, which this demo always resolves to "return every row".
import { defineLab } from "../runtime/lab.js";

const PAYLOADS = ["' OR '1'='1", "' OR 1=1 --", "admin@example.invalid' OR '1'='1"];
const DEFAULT_EMAIL = "ada@example.invalid";

/** @param {HTMLElement} control */
function ensureControls(control) {
  if (control.querySelector(".lab-email-input")) return;
  const input = document.createElement("input");
  input.type = "text";
  input.className = "lab-email-input";
  input.value = DEFAULT_EMAIL;
  input.setAttribute("aria-label", "Email");
  const chipRow = document.createElement("div");
  for (const payload of PAYLOADS) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "lab-payload-chip";
    chip.textContent = payload;
    chip.addEventListener("click", () => {
      input.value = payload;
    });
    chipRow.append(chip);
  }
  control.append(input, chipRow);
}

/** @param {string} email @returns {boolean} */
function breaksOutOfString(email) {
  return email.includes("'");
}

/** @param {HTMLElement} internals @param {string} email */
function renderSql(internals, email) {
  internals.replaceChildren();
  const pre = document.createElement("p");
  pre.className = "lab-string-builder";
  const prefix = document.createTextNode("SELECT * FROM users WHERE email = '");
  const value = document.createElement("span");
  value.textContent = email;
  value.dataset.sig = breaksOutOfString(email) ? "bad" : "ok";
  const suffix = document.createTextNode("'");
  pre.append(prefix, value, suffix);
  internals.append(pre);
}

export default defineLab({
  id: "sql-injection-contact-form",
  stage: {
    bg: "void",
    layout: "console",
    zones: { control: "1/1/2/3", response: "3/1/4/3", internals: "2/1/3/3", verdict: "4/1/5/3" },
    hues: []
  },
  modes: { naive: "String concat", principled: "Parameterized" },
  controls: [{ type: "button", id: "check", label: "Check email" }],
  model: { note: "Lookup is instant; the lesson is in what the query matches, not how long it takes.", seed: 20261101 },
  safety: "Runs entirely in your browser. No server, no real data.",
  metrics: [{ key: "rowsLeaked", label: "Rows leaked", unit: "rows" }],
  renderIdle(els) {
    ensureControls(els.control);
    els.response.replaceChildren();
    const hint = document.createElement("p");
    hint.textContent = "Check an email to see what the query returns.";
    els.response.append(hint);
    renderSql(els.internals, DEFAULT_EMAIL);
  },
  async run({ mode, db, els }) {
    const input = /** @type {HTMLInputElement | null} */ (els.control.querySelector(".lab-email-input"));
    const email = input ? input.value : DEFAULT_EMAIL;
    renderSql(els.internals, email);

    const leaking = mode === "naive" && breaksOutOfString(email);
    const rows = leaking ? db.select("users", () => true) : db.select("users", (u) => u.email === email);

    els.response.replaceChildren();
    if (rows.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "200 { matched: 0 }";
      els.response.append(empty);
    } else {
      const table = document.createElement("table");
      table.className = "lab-leak-table";
      for (const row of rows) {
        const tr = document.createElement("tr");
        const email2 = document.createElement("td");
        email2.textContent = String(row.email);
        const hash = document.createElement("td");
        hash.textContent = String(row.passwordHash).slice(0, 10) + "…";
        tr.append(email2, hash);
        table.append(tr);
      }
      els.response.append(table);
    }

    return { metrics: { rowsLeaked: leaking ? rows.length : 0 } };
  }
});
