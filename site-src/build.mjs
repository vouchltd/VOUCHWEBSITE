// Builds the main-site pages into the repo root. No dependencies: node site-src/build.mjs
// Writes only: index.html, services.html, how-it-works.html, pricing.html, faq.html, audit.html and assets/.
// It never touches agencies/, portal/, privacy-policy.html or terms.html.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import site from './site.config.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const esc = (s) => s.replace(/"/g, '&quot;');
const partial = (name) => readFileSync(join(here, 'partials', `${name}.html`), 'utf8');

function headTags(attrs) {
  const a = Object.fromEntries([...attrs.matchAll(/(\w+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
  const url = site.url + a.path;
  const image = `${site.url}/brand_assets/og-main.png`;
  // Titles and descriptions are written with &amp; already, so they are not escaped again here.
  return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${a.title}</title>
<meta name="description" content="${esc(a.desc)}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#F5F1E8">
<link rel="icon" type="image/png" href="/brand_assets/favicon-64.png">
<link rel="apple-touch-icon" href="/brand_assets/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Vouch SoCal">
<meta property="og:title" content="${esc(a.title)}">
<meta property="og:description" content="${esc(a.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="og:image:alt" content="Vouch SoCal logo and the line: Get found. Get chosen. Get reviewed.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(a.title)}">
<meta name="twitter:description" content="${esc(a.desc)}">
<meta name="twitter:image" content="${image}">
<script>
  // Reveal animations only run with JS and when motion is allowed.
  // If site.js has not run after 3s, drop the class so nothing stays hidden.
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('js');
    setTimeout(function () { if (!window.__vouchReady) document.documentElement.classList.remove('js'); }, 3000);
  }
</script>
<script src="https://cdn.tailwindcss.com"></script>
${partial('tailwind-config')}
<link rel="stylesheet" href="/assets/site.css">`;
}

const norm = (p) => p.replace(/\/$/, '') || '/';

for (const file of readdirSync(join(here, 'pages'))) {
  const name = file.replace(/\.html$/, '');
  const route = name === 'index' ? '/' : `/${name}`;
  const html = readFileSync(join(here, 'pages', file), 'utf8')
    .replace(/<!--@include ([\w-]+)-->/g, (_, n) => partial(n))
    .replace(/<!--@head\s+([\s\S]*?)-->/g, (_, attrs) => headTags(attrs))
    .replace(/<a href="([^"]+)"([^>]*?) data-nav/g, (m, href) => (norm(href) === route ? `${m} aria-current="page"` : m))
    .replace(/\{\{(\w+)\}\}/g, (m, k) => (k in site ? String(site[k]) : m));
  writeFileSync(join(root, `${name}.html`), html);
}

mkdirSync(join(root, 'assets'), { recursive: true });
for (const f of readdirSync(join(here, 'assets'))) copyFileSync(join(here, 'assets', f), join(root, 'assets', f));
console.log('Built main-site pages into', root);
