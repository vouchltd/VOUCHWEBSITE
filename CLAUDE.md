# Vouch SoCal site: guidance for Claude

Read `docs/PROJECT_CONTEXT.md` first. It has the business, the owner's decisions, the old-site findings, and open items.

## Hard rules (from the owner's brief and the brand guidelines)
- No em dashes anywhere in copy. Avoid "seamless", "leverage", "unlock", "elevate", "game-changer", "in today's fast-paced world", and "no card, no catch" style slogans.
- No fake testimonials, client logos, case studies, user counts or results. Mockups say "Illustrative example" and use fictional businesses.
- Only two stats may appear, each with its source line (see `docs/PROJECT_CONTEXT.md`). Never promise ratings, rankings or revenue.
- Never claim Google API access is approved. Current status: pending.
- Never ask for passwords. Negative reviews always wait for a human.
- Palette: oat, deep forest, Alpine green, sage, charcoal, honey, clay. No purple or blue, no gradients. Clay and honey never in the same element.
- Do not rename "Vouch SoCal". Keep the Lens and Ladder footer line and the Google non-affiliation disclaimer.
- Free tiers only. Ask before adding anything paid.

## Working notes
- Change price, email, Formspree endpoint and pilot terms in `site.config.js` only. Pages use `{{token}}` placeholders.
- `public/` is served as-is: legacy business page, Privacy, Terms, and the client portal (`public/portal/`, a live Supabase app). Do not edit the portal casually.
- Verify with `npm run build`, then check at 390px and 1280px. Reveal animations hide content until JS adds `.is-visible`; scroll through before full-page screenshots.
- Do not open a pull request unless the owner asks.
