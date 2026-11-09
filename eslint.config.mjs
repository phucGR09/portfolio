import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules/**", "assets/**", "certificates/**", "scripts/vendor/**"] },

  js.configs.recommended,

  // Code that runs in the browser
  {
    files: ["scripts/**/*.js"],
    languageOptions: { ecmaVersion: 2022, sourceType: "module", globals: globals.browser },
    rules: {
      "no-console": "error",
      eqeqeq: ["error", "always"],
      "prefer-const": "error",
      "no-var": "error",
      curly: ["error", "multi-line"],
      "no-implicit-globals": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[property.name=/^(innerHTML|outerHTML|insertAdjacentHTML)$/]",
          message: "Use textContent or build nodes instead. A security-teaching site must not use innerHTML."
        }
      ]
    }
  },

  // RULE 16: every simulated time must go through clock.js
  {
    files: ["scripts/labs/**/*.js", "scripts/hub.js"],
    rules: {
      "no-restricted-globals": [
        "error",
        { name: "setTimeout", message: "Use clock.js (4s cap, Skip, Esc)." },
        { name: "setInterval", message: "Use clock.js." }
      ]
    }
  },

  // Tools and tests that run on Node
  {
    files: ["tools/**/*.mjs", "tests/**/*.mjs"],
    languageOptions: { ecmaVersion: 2022, sourceType: "module", globals: globals.node },
    rules: { "no-console": "off" }
  }
];
