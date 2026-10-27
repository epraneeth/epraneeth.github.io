# Praneeth Earlagadda's portfolio

An intentionally small personal homepage, hosted on GitHub Pages. Static HTML/CSS, a theme switcher and an original character-art scene; no build step, analytics, external font download or third-party script dependencies. Two intertwined ribbons are sampled into a canvas character grid, with an interactive paper-plane flight and a static SVG fallback. The homepage brings together a short introduction, early projects, an experiment-design note and completed academic work. Personal schedules and application materials live outside this public repository.

Run a static server from this directory to preview, for example `python -m http.server 8777 --bind 127.0.0.1`, then visit `http://127.0.0.1:8777/`. The site uses relative URLs and semantic HTML. Check the homepage, evaluation note, anchor navigation, certificate disclosure and responsive layout before publishing.

Dark is the initial theme. The light/dark text button saves a preference locally and shares it between the homepage and note. If scripts or local storage are unavailable, all content and navigation still work.

The character ribbons drift at about 15 frames/second while visible. The plane continuously follows an arc-length-sampled figure-eight, with smooth U-turns, occasional inward loops, and a “do a loop” control. Its display-rate movement reuses the cached ribbon layer. Pause/resume is explicit and saved locally. Rendering stops when offscreen or the document is hidden; reduced-motion starts still, and the loop button changes the static composition. There are no required pointer gestures, and the canvas is exposed as a single described image. Small screens use fewer character cells rather than scaling a dense desktop bitmap down.

Content constraints confirmed by the owner:

- Display AI Solutions Engineer at BharatPe, with accurate internship context; do not show dates on the website without asking first.
- Hazon is a completed M.Tech project. The owner confirms being named on a granted patent; add a public patent link only after receiving its exact record. No current association or award claim is implied.
- Certificate names/providers come from the supplied résumé; dates are omitted as requested. Do not invent credential links.
- Old fashion/RAG showcases have been removed. Their repositories and Git history remain intact. Fresh projects need working code and evidence before being called completed or deployed.
- Grounding Desk is a private ChatGPT app prototype; actual connected ChatGPT use is unconfirmed. Eval Review is installed and exercised locally in Codex, with synthetic evaluation runs. Neither has a public release link. The agent sandbox is early work, not a validated reliability result. Mark AI assistance and avoid implying independent study completion.
