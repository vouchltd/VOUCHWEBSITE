# What changed from the old site

## Replaced
- **Home page.** The old single-page direct-to-business site is now the agency site. The old page lives on at `/for-local-businesses`.
- **Navigation.** Old: What we fix, How it works, Pricing, FAQ, Client Login, Get your free audit. New: How it works, Safety, Pricing, FAQ, About, Start a free pilot.
- **Tech.** Tailwind CDN script removed (it is not meant for production). Now plain CSS and a Vite build. Inter is bundled as a small woff2 (from the free `@fontsource-variable/inter` package) instead of the 1.7 MB TTF files, since Inter is what the live site actually uses.
- **Brand assets.** The logo and favicon PNGs had a gray vignette baked in and weighed about 590 KB and 540 KB. I cut the mark out onto a transparent background in flat Alpine green. Same artwork, now about 28 KB and 3 KB, plus a light version for the dark footer. This also changes the logo on the legacy pages, Privacy, Terms and portal, which use the same file names.
- **Look and feel.** Restyled to match the original site's code: oat `#F5F1E8` paper, deep forest `#1F3A2E` bands with the same grain texture, honey `#CF9640` pill buttons, italic green headline accents, small uppercase tracked labels, green-tinted card shadows, a scrolling strip, and the form on a dark band. Alpine green `#2D5F3F`, sage, charcoal, clay and honey are used as in the brand guidelines. Clay and honey never share an element, and there are no gradients, purple or blue.
- **Contact and form.** Same email and same Formspree endpoint. New pilot form fields. Old audit form is only on the legacy page.

## Removed from the new site (not deleted, still on the legacy page)
- Direct-to-business pricing ($179.99 per month, $199.99 setup, $99.99 Yelp and Facebook add-ons).
- **Client Login** link. The portal pages still exist at their old addresses and were copied into `public/portal/` unchanged, so existing clients can still sign in, but nothing on the new site links to them.
- Before and after card (3.8 to 4.7 stars) and the "2 to 18 reviews, 12% to 93% responses" numbers. These break the new honesty rules. They remain on the legacy page, labeled as illustrative. **I recommend removing them there too.**
- Cookie banner. The new site sets no cookies and has no analytics.

## Kept
- Name, domain, logo artwork, Lens and Ladder footer line, Privacy, Terms and Cookie links.

## Added
- Safety, Pilot, About pages, approval queue illustration, Open Graph image, JSON-LD organization data on the home page, one small link on the legacy page back to the agency site.

## Decide
- The legacy page and portal still depend on Tailwind's CDN script and Supabase. I did not touch them.
- The portal's `supabase-client.js` contains Supabase's public (anon) key. That is by design and its own comment says access is enforced by row level security, but make sure RLS is on.

## Fonts: a mismatch to decide on
`brand_assets/vouch_brand_guidelines.txt` names Fraunces (headlines), Archivo (body) and Spline Sans Mono (labels). The live site never used them. It used Inter throughout, so the new site does too. Switching is a small change if you want the editorial serif look: install the matching `@fontsource` packages and change `--font` and the headline rules in `src/styles.css`.

## Taken from the old code
Colors and shadows, button and nav hover behavior, grain texture, reveal-on-scroll and strip motion (both off under reduced motion), form label and card style (borders darkened for contrast), logo artwork, footer structure, the Lens and Ladder line, Formspree endpoint, email, and the brand voice rules.
