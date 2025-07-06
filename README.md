# Nathan Lannon — Portfolio

Static site that shows my work, built with Astro and hosted on GitHub Pages.

**Live site:** https://nathanlannon.work

---

## Stack

* **Astro 5** – static site generator  
* **astro-icon + Lucide** – SVG icons  
* **tailwind-merge** – class helpers  
* **TypeScript** for components and scripts :contentReference[oaicite:0]{index=0}  
* **GitHub Actions** deploys to `gh-pages`

---

## Features

* Projects pulled from Markdown content collections
* Canvas background with particles
* Dark theme colors driven by CSS vars
* Easy to add new pages, components, or icons
* CNAME points the repo to my custom domain :contentReference[oaicite:1]{index=1}

---

## Getting started

```bash
git clone https://github.com/nlannon27/nlannon27.github.io
cd nlannon27.github.io
npm install      # Node 20+
npm run dev      # local dev on http://localhost:4321
npm run build    # static build to ./dist
npm run preview  # test production build
