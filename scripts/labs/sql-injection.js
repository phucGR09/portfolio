// Bounded login simulation: documented examples only, not a SQL engine.
import { defineLab } from "../runtime/lab.js";
import { buildDataset } from "../data/seed.js";
import { createResponseCard } from "../kernel/response-card.js";
import { createFlowDiagram } from "../kernel/flow-diagram.js";
import { createLogTerminal } from "../kernel/log-terminal.js";
import { duration } from "../runtime/fmt.js";
import { renderLoginControls } from "./sql-login-ui.js";
import { DEMO_PASSWORD, clearLoginResult, loginInput, showLoginResult } from "./sql-login-state.js";

const SEED = 20261101;
const DEMO_USER = buildDataset(SEED).users[0];
// Fixture lookup only: this does not hash passwords or implement real auth.
/** @param {string} password */
function fixtureHash(password) {
  return password === DEMO_PASSWORD ? String(DEMO_USER?.passwordHash) : "$2b$fake$incorrect";
}
/** @param {string} email @param {string} hash @param {import("../types.d.ts").Mode} mode */
function buildSql(email, hash, mode) {
  return mode === "principled"
    ? "SELECT id, email FROM users WHERE email = ? AND passwordHash = ? LIMIT 1;"
    : `SELECT id, email FROM users WHERE email = '${email}' AND passwordHash = '${hash}' LIMIT 1;`;
}
/** @type {import("../kernel/flow-diagram.js").FlowDiagramSpec} */
const DIAGRAM = {
  title: "Behind the sign-in button",
  width: 760, height: 150, viewBox: "0 0 760 150",
  nodes: [
    { id: "browser", title: "Login form", role: "email + password", icon: "browser", top: 45, left: 0, width: 130 },
    { id: "api", title: "Login API", role: "POST /api/session", icon: "server", top: 45, left: 170, width: 150 },
    { id: "query", title: "Query builder", role: "authentication lookup", icon: "server", top: 45, left: 360, width: 170 },
    { id: "users", title: "users", role: "account match", icon: "table", top: 45, left: 580, width: 150 }
  ],
  edges: [
    { id: "request", d: "M130 70 H170" },
    { id: "build", d: "M320 70 H360" },
    { id: "lookup", d: "M530 70 H580", labelText: "Awaiting sign-in", labelX: 555, labelY: 125 }
  ]
};
/** @param {Readonly<Record<import("../types.d.ts").Zone, HTMLElement>>} els */
function idleTrace(els) {
  els.internals.replaceChildren();
  createFlowDiagram(els.internals, DIAGRAM);
  createLogTerminal(els.internals, { tabName: "authentication.log" });
}

export default defineLab({
  id: "sql-injection-contact-form",
  stage: {
    bg: "void", layout: "login",
    zones: { control: "1/1/2/2", response: "2/1/3/2", internals: "3/1/4/2", verdict: "4/1/5/2" },
    hues: []
  },
  modes: { naive: "Vulnerable SQL", principled: "Parameterized SQL" },
  controls: [],
  renderControls: renderLoginControls,
  model: {
    note: "A deliberately vulnerable legacy login compares a fake password marker inside SQL. Only the two attack cards are modeled; this is not a SQL parser. The demo password maps to the first account's seeded fake hash; no cryptography runs. Real authentication should bind the email lookup, then verify a securely stored password hash with a password library",
    seed: SEED
  },
  safety: "Fictional app, demo credentials, browser-only simulation. No requests or real accounts.",
  metrics: [{ key: "unauthorizedSessions", label: "Unauthorized sessions", unit: "sessions" }],
  renderIdle(els) {
    clearLoginResult(els.control);
    els.response.replaceChildren();
    const card = createResponseCard(els.response);
    card.setStatus("ok", "No login request yet");
    card.setBody("Start with a valid login, then try a wrong password. Finally, replay an injection and compare the two backend implementations.");
    idleTrace(els);
  },
  async run({ mode, db, els, clock, log }) {
    const email = loginInput(els.control, ".lab-email-input").value;
    const password = loginInput(els.control, ".sqli-password").value;
    const hash = fixtureHash(password);
    const sql = buildSql(email, hash, mode);
    const vulnerable = mode === "naive";
    // Whitespace after -- is required by some dialects. An arbitrary quote
    // must never be interpreted as a successful authentication bypass.
    const tautology = /^'\s+OR\s+(?:'1'\s*=\s*'1'|1\s*=\s*1)\s+--[ \t]+(?:-[ \t]*)?$/i.test(email);
    const targeted = /^([^'\r\n]+)'\s+--[ \t]+(?:-[ \t]*)?$/.exec(email);
    const attack = vulnerable && (tautology || Boolean(targeted));
    const syntaxError = vulnerable && email.includes("'") && !attack;
    const rows = syntaxError || !email.trim() || !password ? [] : db.select("users", (user) => {
      if (attack) return tautology || user.email === targeted?.[1];
      return user.email === email && user.passwordHash === hash;
    }, { limit: 1 });
    const account = rows[0];
    const bypassed = Boolean(account && attack);
    showLoginResult(els.control, Boolean(account), String(account?.email ?? ""));
    els.internals.replaceChildren();
    const diagram = createFlowDiagram(els.internals, DIAGRAM);
    const terminal = createLogTerminal(els.internals, { tabName: "authentication.log" });
    for (const id of ["browser", "api", "query", "users"]) diagram.activateNode(id);
    for (const id of ["request", "build", "lookup"]) diagram.activateEdge(id);
    diagram.setLabel("lookup", syntaxError ? "SQL syntax error" : attack ? "Password predicate commented out" : vulnerable ? "Email AND password marker" : "Bound values, fixed SQL grammar", true);
    diagram.setEdgeSig("lookup", bypassed || syntaxError ? "bad" : "ok");
    const statement = document.createElement("pre");
    statement.className = "sqli-query";
    statement.textContent = sql;
    els.internals.append(statement);
    const status = syntaxError ? "500" : account ? "200" : "401";
    terminal.appendLine({ ts: duration(clock.now()), method: "POST", path: "/api/session", status: bypassed || syntaxError ? "bad" : "ok", statusText: status, dur: "—" });
    terminal.appendLine({ ts: duration(clock.now()), method: "SQL", path: sql, status: attack || syntaxError ? "bad" : "ok", statusText: syntaxError ? "ERROR" : "QUERY", dur: "—" });
    log("query", { text: sql });
    if (!vulnerable) {
      const bindings = `Bound values (separate from SQL): ${JSON.stringify([email, hash])}`;
      terminal.appendLine({ ts: duration(clock.now()), method: "BIND", path: bindings, status: "ok", statusText: "DATA", dur: "—" });
      log("bindings", { text: bindings });
    }
    const explanation = syntaxError
      ? "This quoted input is not one of the supported attack examples. The model reports a query error, not a successful login."
      : bypassed
        ? `Authentication bypass: the app opened ${account?.email}'s workspace even though the supplied password was wrong. The email changed the query and removed the password check.`
        : account
          ? "Legitimate login: both the email and demo password matched. The app opened the account owner's workspace."
          : mode === "principled" && (tautology || targeted)
            ? "Attack blocked: the complete email input was bound as data. It matched no account, and the wrong password did not create a session."
            : "Login rejected: the credentials did not match. The workspace remains locked.";
    els.response.replaceChildren();
    const card = createResponseCard(els.response);
    card.setStatus(bypassed || syntaxError ? "bad" : account ? "ok" : "warn", `${status} ${syntaxError ? "Query error" : account ? "Session created" : "Invalid credentials"}`);
    card.setBody(explanation);
    return { metrics: { unauthorizedSessions: bypassed ? rows.length : 0 } };
  }
});
