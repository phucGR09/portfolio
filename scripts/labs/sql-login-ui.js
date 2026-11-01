import { LOGIN_EXAMPLES, resetLogin } from "./sql-login-state.js";

/** @param {string} tag @param {string} [className] @param {string} [text] */
function node(tag, className = "", text = "") {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

/** @param {HTMLElement} root @param {import("../types.d.ts").LabControlActions} actions */
export function renderLoginControls(root, actions) {
  const heading = node("div", "sqli-heading");
  const intro = node("div");
  intro.append(node("p", "sqli-eyebrow", "Interactive scenario / Authentication"), node("h2", "", "One login. Two backend implementations."));
  const toolbar = node("div", "sqli-toolbar");
  const modes = node("div", "sqli-modes");
  modes.setAttribute("role", "group");
  modes.setAttribute("aria-label", "Login backend implementation");
  for (const [mode, label] of [["naive", "Vulnerable SQL"], ["principled", "Parameterized SQL"]]) {
    const button = node("button", "", label);
    button.setAttribute("type", "button");
    button.setAttribute("aria-pressed", String(mode === "naive"));
    button.addEventListener("click", () => {
      clearAttempt();
      actions.setMode(/** @type {import("../types.d.ts").Mode} */ (mode));
      for (const option of modes.children) option.setAttribute("aria-pressed", String(option === button));
    });
    modes.append(button);
  }
  const reset = node("button", "sqli-reset", "Reset demo");
  reset.setAttribute("type", "button");
  reset.setAttribute("data-lab-reset", "");
  reset.addEventListener("click", () => { actions.reset(); resetLogin(root); });
  toolbar.append(modes, reset);
  heading.append(intro, toolbar);
  const layout = node("div", "sqli-layout");
  const examples = node("aside", "sqli-examples");
  examples.setAttribute("aria-label", "Login examples");
  examples.append(node("p", "sqli-eyebrow", "01 / Choose an attempt"), node("h3", "", "Who is signing in?"), node("p", "sqli-help", "Load an example, then submit the login. Compare both backends with the same input."));
  const cards = node("div", "sqli-example-list");
  for (const [index, example] of LOGIN_EXAMPLES.entries()) {
    const card = node("button", "sqli-example");
    card.setAttribute("type", "button");
    card.setAttribute("aria-pressed", String(index === 0));
    card.dataset.kind = example.kind;
    const top = node("span", "sqli-example-top");
    top.append(node("strong", "", example.title), node("span", "sqli-tag", example.kind));
    card.append(top, node("code", "", example.email), node("span", "sqli-example-description", example.description), node("span", "sqli-example-password", `Password: ${example.password}`));
    card.addEventListener("click", () => {
      actions.reset();
      email.value = example.email;
      password.value = example.password;
      replay.checked = example.api;
      form.noValidate = example.api;
      for (const option of cards.children) option.setAttribute("aria-pressed", String(option === card));
      email.focus();
    });
    cards.append(card);
  }
  const replayLabel = node("label", "sqli-replay-label");
  const replay = /** @type {HTMLInputElement} */ (node("input", "sqli-api-replay"));
  replay.type = "checkbox";
  replay.addEventListener("change", () => { clearAttempt(); form.noValidate = replay.checked; });
  replayLabel.append(replay, node("span", "", "Replay a direct API request"));
  examples.append(cards, replayLabel, node("p", "sqli-api-note", "Attack examples replay a request sent directly to the login API. This bypasses browser email validation, just as an attacker can. The server must still treat the email as data."));
  const browser = node("section", "sqli-browser");
  browser.setAttribute("aria-label", "Fictional Northstar app login");
  const chrome = node("div", "sqli-browser-bar");
  const dots = node("span", "sqli-browser-dots");
  dots.setAttribute("aria-hidden", "true");
  dots.append(node("i"), node("i"), node("i"));
  chrome.append(dots, node("span", "sqli-address", "app.example.invalid / sign-in"), node("span", "sqli-preview-label", "Demo app"));
  const app = node("div", "sqli-app");
  const brand = node("aside", "sqli-brand");
  brand.append(node("div", "sqli-wordmark", "✳ northstar"), node("span", "sqli-brand-kicker", "A little space for your next big thing."), node("h3", "", "Good work\nstarts here."), node("p", "", "Your projects, your team, and a clearer view of what comes next."));
  const board = node("div", "sqli-mini-board");
  board.setAttribute("aria-hidden", "true");
  board.append(node("span", "", "Website launch"), node("strong", "", "Everything, moving forward."), node("div", "sqli-mini-progress"), node("span", "", "Design ✓    Build ✓    Launch →"));
  brand.append(board, node("small", "", "Built for teams that care about their craft."));
  const content = node("div", "sqli-app-content");
  const form = /** @type {HTMLFormElement} */ (node("form", "sqli-login-form"));
  form.append(node("div", "sqli-form-icon", "↗"), node("p", "sqli-form-kicker", "YOUR WORKSPACE AWAITS"), node("h3", "", "Welcome back"), node("p", "sqli-form-description", "Sign in to continue to Northstar."));
  const emailLabel = node("label", "", "Email address");
  emailLabel.setAttribute("for", "sqli-email");
  const email = /** @type {HTMLInputElement} */ (node("input", "lab-email-input"));
  email.id = "sqli-email";
  email.type = "email";
  email.name = "email";
  email.required = true;
  email.autocomplete = "off";
  email.spellcheck = false;
  const passwordLabel = node("label", "", "Password");
  passwordLabel.setAttribute("for", "sqli-password");
  const passwordWrap = node("div", "sqli-password-wrap");
  const password = /** @type {HTMLInputElement} */ (node("input", "sqli-password"));
  password.id = "sqli-password";
  password.name = "password";
  password.type = "password";
  password.required = true;
  password.autocomplete = "off";
  const reveal = node("button", "sqli-reveal", "Show");
  reveal.setAttribute("type", "button");
  reveal.setAttribute("aria-pressed", "false");
  reveal.setAttribute("aria-controls", password.id);
  reveal.setAttribute("aria-label", "Show password");
  reveal.addEventListener("click", () => {
    const showing = password.type === "password";
    password.type = showing ? "text" : "password";
    reveal.textContent = showing ? "Hide" : "Show";
    reveal.setAttribute("aria-pressed", String(showing));
    reveal.setAttribute("aria-label", showing ? "Hide password" : "Show password");
  });
  passwordWrap.append(password, reveal);
  const submit = node("button", "sqli-submit", "Sign in →");
  submit.setAttribute("type", "submit");
  form.append(emailLabel, email, passwordLabel, passwordWrap, submit);
  const message = node("p", "sqli-login-message");
  message.id = "sqli-login-message";
  message.setAttribute("role", "status");
  message.setAttribute("aria-live", "polite");
  form.setAttribute("aria-describedby", message.id);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!email.value.trim() || !password.value) {
      message.textContent = "Enter both an email address and a password.";
      message.dataset.sig = "bad";
      return;
    }
    if (!replay.checked && typeof form.reportValidity === "function" && !form.reportValidity()) return;
    actions.run();
  });
  const workspace = node("section", "sqli-workspace");
  workspace.hidden = true;
  workspace.append(node("span", "sqli-workspace-check", "✓"), node("p", "sqli-form-kicker", "YOU'RE SIGNED IN"), node("h3", "", "Your workspace"), node("p", "sqli-identity"), node("div", "sqli-project", "↗ Website launch\nYour team's next chapter is ready."));
  const signOut = node("button", "sqli-signout", "Sign out");
  signOut.setAttribute("type", "button");
  signOut.addEventListener("click", () => { actions.reset(); resetLogin(root); });
  workspace.append(signOut);
  content.append(form, workspace, message, node("small", "sqli-app-footer", "Northstar · Your team's shared space"));
  app.append(brand, content);
  browser.append(chrome, app);
  layout.append(examples, browser);
  root.append(heading, layout);
  resetLogin(root);
  function clearAttempt() {
    actions.reset();
  }
  function editCredentials() {
    clearAttempt();
    for (const card of cards.children) card.setAttribute("aria-pressed", "false");
  }
  email.addEventListener("input", editCredentials);
  password.addEventListener("input", editCredentials);
}
