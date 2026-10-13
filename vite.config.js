import { defineConfig } from 'vite';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import site from './site.config.js';

const root = import.meta.dirname;
const pages = readdirSync(root).filter((f) => f.endsWith('.html'));

const read = (name) => readFileSync(join(root, 'src/partials', `${name}.html`), 'utf8');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// <!--@head title="..." desc="..." path="/pricing"--> expands to the shared <head> tags.
function headTags(attrs) {
  const a = Object.fromEntries([...attrs.matchAll(/(\w+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
  const url = site.url + (a.path === '/' ? '/' : a.path);
  const image = `${site.url}/og-image.png`;
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
  <link rel="stylesheet" href="/src/styles.css">`;
}

function currentPath(p) {
  return p.replace(/\.html$/, '').replace(/\/index$/, '') || '/';
}

function templatePlugin() {
  return {
    name: 'vouch-template',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const here = currentPath(ctx.path.split('?')[0]);
        return html
          .replace(/<!--@include (\w+)-->/g, (_, name) => read(name))
          .replace(/<!--@head\s+([\s\S]*?)-->/g, (_, attrs) => headTags(attrs))
          .replace(/<a href="([^"]+)" data-nav/g, (m, href) =>
            currentPath(href) === here ? `${m} aria-current="page"` : m)
          .replace(/\{\{(\w+)\}\}/g, (m, k) => (k in site ? String(site[k]) : m));
      },
    },
  };
}

// Serve /pricing as pricing.html in dev and preview, like Vercel's cleanUrls does in production.
function cleanUrlsPlugin() {
  const rewrite = (req, _res, next) => {
    const [p, q] = req.url.split('?');
    if (p !== '/' && !p.endsWith('/') && !/\.[a-z0-9]+$/i.test(p)) {
      const found = ['', 'public', 'dist'].some((d) => existsSync(join(root, d, `${p}.html`)));
      if (found) req.url = `${p}.html${q ? `?${q}` : ''}`;
    }
    next();
  };
  return {
    name: 'vouch-clean-urls',
    // Braces matter: returning use()'s result makes Vite treat it as a post-hook.
    configureServer(s) { s.middlewares.use(rewrite); },
    configurePreviewServer(s) { s.middlewares.use(rewrite); },
  };
}

export default defineConfig({
  plugins: [templatePlugin(), cleanUrlsPlugin()],
  build: {
    rollupOptions: {
      input: Object.fromEntries(pages.map((f) => [f.replace('.html', ''), resolve(root, f)])),
    },
  },
});
