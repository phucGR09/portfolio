# Phan Van Phuc Portfolio

A responsive static portfolio for Phan Van Phuc, a fullstack developer and computer science student. Built with plain HTML and CSS.

## Project structure

```text
.
├── index.html          # Main page markup
├── pages/              # Individual experience case studies
│   ├── golden-owl.html
│   ├── saigon-solutions.html
│   └── shub-solution.html
├── source/
│   ├── case-study.css  # Shared case-study page styles
│   └── styles.css      # Homepage styles and responsive layout
├── .gitignore
└── README.md
```

## Run locally

No dependencies or build step are required. From the project root, run:

```bash
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000) in a browser.

Use `Ctrl+C` to stop the local server.

## Customize

- Update the content and links in `index.html`.
- Adjust colors, typography, and layout tokens at the top of `source/styles.css`.
