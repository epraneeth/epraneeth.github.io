# Praneeth's portfolio

Static HTML, CSS, and JavaScript for <https://epraneeth.github.io/>. No build step or third-party runtime dependencies.

## Preview locally

From the repository root:

```sh
python -m http.server 8765 --bind 127.0.0.1
```

Open <http://127.0.0.1:8765/>. Check the homepage, both project pages, the engineering note, navigation and theme toggle at desktop and mobile widths.

## Update content

- `index.html`: introduction, existing projects, research directions, internship/academic experience and contact links to both GitHub accounts.
- `work/fashion-search.html` and `work/role-conditioned-rag.html`: source-linked prototype descriptions and evaluation questions. No empirical performance results claimed.
- `notes/evaluating-agents.html`: an initial evaluation design note, not experimental results.
- `styles.css` and `script.js`: shared styles and accessible theme control. A stored choice wins over the operating system preference; unavailable storage does not break the toggle.
- `sitemap.xml`: add a URL when publishing a new note or project page.

Keep project labels accurate. Change a planning label only when there is an implementation to link. A result needs a dataset, method, measurement conditions, and reproducible code. Review AI-assisted draft copy before publishing it as your personal position. Do not include private work or employer information without publication rights.

## GitHub Pages

This repository already exists. In **Settings → Pages**, verify the configured publishing source. For branch deployment, use `main` and `/ (root)`. A change on a feature branch or in a pull request is not a production deployment; merge the reviewed change into the configured publishing source to release it.
