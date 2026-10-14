# Main site pages (source)

The main Vouch SoCal site is now **multi-page**, like `/agencies`. Pages are generated static HTML committed at the repo root.
There is no build step on Vercel.

| URL | Source | Content (all carried over from the original single page) |
| --- | --- | --- |
| `/` | `pages/index.html` | Hero, category strip, "Where to start" cards, agencies teaser, closing CTA |
| `/services` | `pages/services.html` | What we fix, the "math" section |
| `/how-it-works` | `pages/how-it-works.html` | Three steps, the password promise |
| `/pricing` | `pages/pricing.html` | Pricing cards |
| `/faq` | `pages/faq.html` | FAQ accordion |
| `/audit` | `pages/audit.html` | Free audit form (same fields, checks and Formspree endpoint) |

Old single-page links such as `vouchsocal.com/#pricing` redirect to the matching page (see `assets/site.js`).

## Change something
1. Edit `pages/*.html`, `partials/*.html` (header, top bar, footer, cookie notice, closing CTA, Tailwind config), `assets/site.css` or `assets/site.js`.
2. Run `node site-src/build.mjs` (Node 18 or newer, no dependencies).
3. Commit the source and the regenerated files.

The build writes only `index.html`, `services.html`, `how-it-works.html`, `pricing.html`, `faq.html`, `audit.html` and `assets/`.
It never touches `agencies/`, `portal/`, `privacy-policy.html` or `terms.html`. Do not hand-edit the generated files.

## Shared
- `site.config.js`: site URL and contact email.
- Tailwind still loads from its CDN script, as it did before. It is the one runtime dependency; moving to a compiled stylesheet would be a separate change.
- The "For agencies" button lives in `partials/header.html` (desktop button and first item of the mobile menu) and `partials/banner.html` (top bar).
  The matching bar on the agency pages is in `agencies-src/partials/header.html`.
