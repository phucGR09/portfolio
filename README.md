# Alex Morgan Portfolio

A responsive static portfolio inspired by the **information architecture and editorial, sidebar-based presentation** of [Brittany Chiang's portfolio](https://brittanychiang.com/). It uses original markup, copy, illustrations, and styling, built with plain HTML and CSS.

## Project structure

```text
.
├── index.html          # Main page markup
├── source/
│   └── styles.css      # Site styles and responsive layout
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
