# oguzsoykan.com

Personal site of Oğuz Soykan — static HTML/CSS/JS served by Cloudflare Workers static assets.

- `public/` — the site (`index.html`, `assets/`, `404.html`, `robots.txt`, `sitemap.xml`)
- `scripts/check.mjs` — axe (WCAG 2.1 AA), horizontal overflow and console errors in light/dark, TR/EN, desktop/mobile
- `scripts/visual-diff.mjs` — pixel comparison against a reference origin
- `scripts/sections.mjs` — per-section screenshots for design review

```sh
npm install
npx wrangler dev                      # local preview
node scripts/check.mjs http://localhost:8787/
npx wrangler deploy --env preview     # https://preview.oguzsoykan.com
npx wrangler deploy                   # https://oguzsoykan.com
```

The live demo it links to is [Workflow Builder](https://workflow.oguzsoykan.com/) ([source](https://github.com/OguzSoykan/Workflow-Builder)).
