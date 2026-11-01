// Scenario controls surround an ordinary, fictional app login.
export const DEMO_EMAIL = "fake.user+0001@example.invalid";
export const DEMO_PASSWORD = "demo-only-123";
export const LOGIN_EXAMPLES = [
  { title: "Valid credentials", kind: "Baseline", email: DEMO_EMAIL, password: DEMO_PASSWORD, description: "The account owner signs in with the correct password.", api: false },
  { title: "Wrong password", kind: "Rejected", email: DEMO_EMAIL, password: "wrong-password", description: "Same account, wrong password. Access should be denied.", api: false },
  { title: "Skip the password check", kind: "Injection", email: `${DEMO_EMAIL}' -- -`, password: "wrong-password", description: "The quote ends the email; -- comments out the password condition.", api: true },
  { title: "Match any account", kind: "Injection", email: "' OR '1'='1' -- -", password: "wrong-password", description: "An always-true condition matches an account without its password.", api: true }
];

/** @param {HTMLElement} root @param {string} selector */
export function loginInput(root, selector) {
  return /** @type {HTMLInputElement} */ (root.querySelector(selector));
}

/** @param {HTMLElement} root */
export function resetLogin(root) {
  loginInput(root, ".lab-email-input").value = DEMO_EMAIL;
  const password = loginInput(root, ".sqli-password");
  password.value = DEMO_PASSWORD;
  password.type = "password";
  const reveal = root.querySelector(".sqli-reveal");
  if (reveal) { reveal.textContent = "Show"; reveal.setAttribute("aria-pressed", "false"); reveal.setAttribute("aria-label", "Show password"); }
  loginInput(root, ".sqli-api-replay").checked = false;
  const form = /** @type {HTMLFormElement} */ (root.querySelector("form"));
  form.noValidate = false;
  clearLoginResult(root);
  for (const [index, card] of [...root.querySelectorAll(".sqli-example")].entries()) card.setAttribute("aria-pressed", String(index === 0));
}

/** Clear the previous app result without disturbing field values or the caret.
 * @param {HTMLElement} root
 */
export function clearLoginResult(root) {
  const form = /** @type {HTMLFormElement} */ (root.querySelector("form"));
  form.hidden = false;
  const workspace = /** @type {HTMLElement} */ (root.querySelector(".sqli-workspace"));
  workspace.hidden = true;
  const message = /** @type {HTMLElement} */ (root.querySelector(".sqli-login-message"));
  message.textContent = "";
  message.removeAttribute("data-sig");
}

/** @param {HTMLElement} root @param {boolean} signedIn @param {string} email */
export function showLoginResult(root, signedIn, email) {
  const form = /** @type {HTMLElement} */ (root.querySelector("form"));
  const workspace = /** @type {HTMLElement} */ (root.querySelector(".sqli-workspace"));
  form.hidden = signedIn;
  workspace.hidden = !signedIn;
  const message = /** @type {HTMLElement} */ (root.querySelector(".sqli-login-message"));
  message.dataset.sig = signedIn ? "ok" : "bad";
  message.textContent = signedIn ? `Signed in as ${email}` : "The email or password is incorrect. Please try again.";
  const identity = root.querySelector(".sqli-identity");
  if (identity) identity.textContent = email;
}

