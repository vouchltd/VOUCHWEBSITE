# Vouch SoCal website

Marketing site for Vouch SoCal: AI review-reply drafts for SEO and digital marketing agencies.
Plain HTML, one stylesheet, one small script. Built with Vite. No framework, no paid services.

## Run it locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # writes dist/
npm run preview    # serves dist/ at http://localhost:4173
```

## Deploy (Vercel free plan)

1. Push this repo to GitHub.
2. In Vercel, import the repo. Framework preset: **Vite**. Build command `npm run build`. Output directory `dist`.
3. `vercel.json` turns on clean URLs, so `/pricing` serves `pricing.html`.
4. Domain: the old site redirected `vouchsocal.com` to `www.vouchsocal.com`. Keep that, or change `url` in `site.config.js` to match whatever you choose.

**Before you point the domain at this project:** the live site also hosts the client portal (`/portal/*`, a Supabase app). Those files are copied into `public/portal/` so nothing breaks, but see `CHANGES.md`.

## Where to change things

Everything shared lives in **`site.config.js`**. Change a value, rebuild, and every page updates.

| What | Where |
| --- | --- |
| Formspree endpoint | `formspree` in `site.config.js` |
| Price per location, minimum locations | `price`, `minLocations` in `site.config.js` (monthly minimum and the 10 location example are calculated) |
| Pilot length and size | `pilotDays`, `pilotLocations` in `site.config.js` |
| Contact email | `email` in `site.config.js` |
| Site URL (canonical, Open Graph) | `url` in `site.config.js` |
| Nav and footer | `src/partials/header.html`, `src/partials/footer.html` |
| Colors, spacing, type | top of `src/styles.css` (`:root` variables) |
| Scroll reveal and strip animation | `src/main.js` (off when the visitor prefers reduced motion) |
| Pilot form checks | `src/pilot.js` |

## How the pages are put together

`vite.config.js` has a small plugin that, on every page, expands `<!--@include header-->`, `<!--@include footer-->`,
`<!--@head title="..." desc="..." path="/..."-->` (title, description, canonical, Open Graph, Twitter tags, favicon),
and `{{token}}` values from `site.config.js`. Pages in `public/` (the legacy business page, Privacy, Terms, portal) are served as they are.

## Pilot form

Posts to Formspree as JSON, validates inline, shows the thank-you inline, no alert popups. It sends `form_type=agency-pilot`
so you can tell these apart from the old audit form, which shares the same Formspree endpoint. A hidden `_gotcha` field is a spam trap.

## Files

- `index.html`, `how-it-works.html`, `safety.html`, `pricing.html`, `pilot.html`, `faq.html`, `about.html`
- `public/for-local-businesses.html`: the old direct-to-business page, footer link only
- `public/brand_assets/`: logo mark, light logo mark, favicon, touch icon
- `public/og-image.png`: 1200x630 social preview

See `PLACEHOLDERS.md` for everything still to fill in and `CHANGES.md` for what changed from the old site.
