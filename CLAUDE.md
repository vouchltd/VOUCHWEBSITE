# Vouch SoCal site: guidance for Claude

Read `docs/PROJECT_CONTEXT.md` first (business, decisions, history, open items).

## Two parts, both generated static HTML (no build step on Vercel)
- **Main site** (`/`, `/services`, `/how-it-works`, `/pricing`, `/faq`, `/audit`): edit `site-src/`, run `node site-src/build.mjs`, commit both. Styled with Tailwind via CDN plus `site-src/assets/site.css`. Never hand-edit the generated root pages.
- **Agency product** (`/agencies/*`): edit `agencies-src/`, run `node agencies-src/build.mjs`, commit both. Never hand-edit `/agencies`.
- **Left alone:** `portal/` (a live Supabase app), `supabase/`, `privacy-policy.html`, `terms.html`. Do not touch them casually.

## Hard rules for the agency pages (and any new copy anywhere)
- No em dashes in copy. Avoid "seamless", "leverage", "unlock", "elevate", "game-changer", "in today's fast-paced world", and "no card, no catch" slogans.
- No fake testimonials, client logos, case studies, user counts or results. Mockups say "Illustrative example" with fictional businesses.
- Only two stats may appear, each with its source line (see `docs/PROJECT_CONTEXT.md`). Never promise ratings, rankings or revenue.
- Never claim Google API access is approved. Current status: pending.
- Never ask for passwords. Negative reviews always wait for a human.
- Palette: oat, deep forest, Alpine green, sage, charcoal, honey, clay. No purple or blue, no gradients. Clay and honey never share an element.
- Do not rename "Vouch SoCal". Keep the Lens and Ladder footer line and the Google non-affiliation disclaimer.
- Free tiers only. Ask before adding anything paid. There is no build step on Vercel; keep it that way unless asked.

## Checking changes
Serve the repo root with a static server that supports clean URLs, then check at 390px and 1280px. Reveal animations hide content until JS adds `.is-visible`, so scroll through before full-page screenshots.
Do not open a pull request unless the owner asks. Never push to `main` directly.
