// Builds the static agency pages into ../agencies. No dependencies: node agencies-src/build.mjs
// Expands <!--@include name-->, <!--@head ...-->, {{tokens}} from site.config.js, and marks the current nav link.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, rmSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import site from './site.config.js';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'agencies');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const partial = (name) => readFileSync(join(here, 'partials', `${name}.html`), 'utf8');

function headTags(attrs) {
  const a = Object.fromEntries([...attrs.matchAll(/(\w+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
  const url = site.url + a.path;
  const image = `${site.url}/brand_assets/og-agencies.png`;
  return `<meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(a.title)}</title>
  <meta name="description" content="${esc(a.desc)}">
  <link rel="canonical" href="${url}">
  <meta name="theme-color" content="#2D5F3F">
  <link rel="icon" type="image/png" href="/brand_assets/favicon.png">
  <link rel="apple-touch-icon" href="/brand_assets/apple-touch-icon.png">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Vouch SoCal">
  <meta property="og:title" content="${esc(a.title)}">
  <meta property="og:description" content="${esc(a.desc)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:alt" content="Vouch SoCal logo and the line: Review replies your clients will think you wrote.">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(a.title)}">
  <meta name="twitter:description" content="${esc(a.desc)}">
  <meta name="twitter:image" content="${image}">
  <script>
    // Hide-then-reveal animations only run with JS and when motion is allowed.
    // If main.js has not run after 3s, drop the class so nothing stays hidden.
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('js');
      setTimeout(function () { if (!window.__vouchReady) document.documentElement.classList.remove('js'); }, 3000);
    }
  </script>
  <link rel="stylesheet" href="/agencies/assets/styles.css">`;
}

const norm = (p) => p.replace(/\/$/, '') || '/';

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'assets', 'fonts'), { recursive: true });

for (const file of readdirSync(join(here, 'pages'))) {
  const name = file.replace(/\.html$/, '');
  const route = name === 'index' ? '/agencies' : `/agencies/${name}`;
  const html = readFileSync(join(here, 'pages', file), 'utf8')
    .replace(/<!--@include (\w+)-->/g, (_, n) => partial(n))
    .replace(/<!--@head\s+([\s\S]*?)-->/g, (_, attrs) => headTags(attrs))
    .replace(/<a href="([^"]+)"([^>]*?) data-nav/g, (m, href) => (norm(href) === route ? `${m} aria-current="page"` : m))
    .replace(/\{\{(\w+)\}\}/g, (m, k) => (k in site ? String(site[k]) : m));
  writeFileSync(join(out, name === 'index' ? 'index.html' : file), html);
}

const copyDir = (from, to) => {
  mkdirSync(to, { recursive: true });
  for (const f of readdirSync(from)) {
    statSync(join(from, f)).isDirectory() ? copyDir(join(from, f), join(to, f)) : copyFileSync(join(from, f), join(to, f));
  }
};
copyDir(join(here, 'assets'), join(out, 'assets'));
console.log(`Built ${readdirSync(join(here, 'pages')).length} pages into ${out}`);
