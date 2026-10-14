# Project context: Vouch SoCal, main site plus the agency product

Curated record of the working session (not a raw transcript). Last updated 2026-10-14.

## The business
Vouch SoCal is run by two Long Beach students. The **main service** manages Google Business Profiles and reviews for local business owners
($179.99/month, $199.99 setup). That was slow because it needed in-person sales, so they built a **second product**:
AI review-response software for SEO and digital marketing agencies. The agency connects its clients' profiles, the agent drafts replies in each
client's voice, the agency's team approves, then replies post. The agency serves more locations without hiring and keeps the margin by reselling.

**Decision (2026-10-14):** the agency product is marketed as another product *under the existing website*, not as a replacement for it.
This came after a misunderstanding between the two founders. The main site stays as it was. The agency product lives at `/agencies`.

## Product facts the agency pages may state
- Positive reviews can auto-post if the agency allows it. Negative reviews always wait for a human.
- Each client location has its own voice profile (tone, selling points, things never to say).
- One dashboard for all locations. A weekly report the agency can forward to its client.
- Founding pilot: free for 30 days on 3 to 5 locations, for the first agencies.
- Pricing: $25 per location per month, 5 location minimum.
- Google API access: **pending**. Never claim approval unless the owners say so.

## Rules that apply to the agency pages
- Headline: Review replies your clients will think you wrote. Voice: plain, direct, calm, short sentences.
- No em dashes in copy. No "seamless", "leverage", "unlock", "elevate", "game-changer", "in today's fast-paced world", no "no card, no catch" slogans.
- No fake testimonials, logos, case studies, user counts or results. Mockups say "Illustrative example" with fictional businesses.
  Only two stats, each with its source: 97% of consumers read online reviews for local businesses (BrightLocal Local Consumer Review Survey);
  a one-star Yelp rating increase raised restaurant revenue 5 to 9% (Harvard Business School study).
- Promise time saved and safe, approved replies. Never ratings, rankings or revenue.
- Footer disclaimer: not affiliated with or endorsed by Google. Keep the Lens and Ladder line.
- Palette: oat, deep forest, Alpine green, sage, charcoal, honey, clay. No purple or blue, no gradients. Clay and honey never in one element.
- Free tiers only. Ask before adding anything paid. Never ask for passwords.

## Owner decisions
Formspree endpoint `https://formspree.io/f/mrewovza` (shared with the audit form). Price $25 per location per month, 5 minimum.
Google API status pending. Contact email `vouchsocal@gmail.com`. Lens and Ladder line stays. No Client Login link on the agency pages.

## History, and what to know
1. First build replaced the main site with an agency-only site (Vite). It was merged to `main` as PR #1 on 2026-10-13, so the live domain
   briefly showed only the agency site. That was the founders' misunderstanding, not a bug.
2. The fix is this branch: the **old site restored exactly** (file list and contents identical to the commit before PR #1, `c3b0ea4`),
   plus the agency product added under `/agencies` as plain static pages. The Vite setup is gone, so no Vercel build settings are involved.
3. Changes to the old site are additive: a "For agencies" nav link, a teaser section before the final form, and a footer link in `index.html`;
   new files in `brand_assets/`; the `agencies/` and `agencies-src/` folders; this `docs/` folder.
4. The portal (`/portal/*`, a live Supabase app) and `supabase/` are untouched. Privacy and Terms are the old pages.
5. The old branch `claude/agency-site-rebuild` is superseded. Do not merge it again.

## Open items
See `docs/agencies-placeholders.md`.

## Bugs worth remembering (from the build)
- Scroll-reveal CSS must hide with `:where(...)`, not `:is(...)`, or the "hidden" rule outranks the "visible" rule.
- Full-page screenshots need a scroll-through first, because reveal animations hide content until JS adds `.is-visible`.

## How to work on it
Main site: edit the root HTML files directly (Tailwind via CDN, as before). Agency pages: see `agencies-src/README.md`.
