# Agency product pages (source)

The agency product lives under `/agencies` on the main Vouch SoCal site. The pages in `/agencies` are **generated static HTML**.
There is no build step on Vercel: the generated files are committed, so the site deploys exactly like the rest of it.

## Change something
1. Edit the source here: `pages/*.html`, `partials/header.html`, `partials/footer.html`, `assets/styles.css`, `assets/main.js`, `assets/pilot.js`.
2. Run `node agencies-src/build.mjs` (Node 18 or newer, no dependencies).
3. Commit both the source and the regenerated `/agencies` folder.

Do not edit files in `/agencies` by hand. The next build overwrites them.

## Shared values: `site.config.js`
| What | Key |
| --- | --- |
| Price per location | `price` (the monthly minimum and the 10 location example are calculated) |
| Minimum locations | `minLocations` |
| Pilot length and size | `pilotDays`, `pilotLocations` |
| Contact email | `email` |
| Formspree endpoint (same one the audit form uses) | `formspree` |
| Canonical host | `url` |

Pages use `{{token}}` placeholders for these. Rebuild after changing them.

## Pilot form
Posts JSON to Formspree, validates inline, shows the thank-you inline, no alert popups. It sends `form_type=agency-pilot` so you can tell
these leads apart from the audit form, which uses the same endpoint. `_gotcha` is a hidden spam trap.

## Files outside this folder that belong to it
- `brand_assets/logo-mark-cutout.png`, `logo-mark-light.png`, `apple-touch-icon.png`, `og-agencies.png`
- The "For agencies" nav link, the `#agencies` teaser section and one footer link in the main `index.html`
