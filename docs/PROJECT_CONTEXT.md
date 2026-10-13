# Project context: Vouch SoCal agency site rebuild

This is a curated record of the working session (not a raw transcript), so a future session or person can pick up without the chat.
Written 2026-10-13. Branch: `claude/jolly-knuth-auqtav`.

## Who and what
Vouch SoCal is a two-person startup run by two Long Beach students. Until now it sold Google Business Profile and review management
directly to local business owners ($179.99/month, $199.99 setup). That was slow because it needed in-person sales.
The company is moving to B2B: **AI review-response agents sold to SEO and digital marketing agencies.**
The agency connects its clients' Google Business Profiles, the agent drafts replies in each client's brand voice, the agency's team approves,
then replies post. The agency serves more locations without hiring more people and keeps the margin by reselling.

Product facts the site may state:
- Positive reviews can auto-post if the agency allows it. Negative reviews always wait for a human.
- Each client location has its own voice profile (tone, selling points, things never to say).
- One dashboard for all locations. A weekly report the agency can forward to its client.
- Founding pilot: free for 30 days on 3 to 5 locations, for the first agencies.
- Pricing: $25 per location per month, 5 location minimum.
- Google API access status: **pending**. Never claim approval unless the owners say it is approved.

Target visitor: owners and account managers at small local SEO agencies (2 to 20 people). Busy, skeptical of AI, burned by overpromising vendors.
Their biggest worry is a bad auto-reply costing them a client.

## The original brief (key rules, kept close to verbatim)
- Headline: **Review replies your clients will think you wrote.**
- Subhead: Vouch SoCal drafts replies in each client's voice and posts them after your team approves. Handle more locations without hiring more people.
- Buttons: Start a free pilot / See how approval works
- Voice: plain, direct, calm. Short sentences. Sounds like a person, not a SaaS template.
- Keep the logo (two overlapping speech bubbles with an upward arrow), the name "Vouch SoCal", and the vouchsocal.com domain. Do not rename anything.
- Palette: Alpine green #2D5F3F, Sage #5C9C6B, Charcoal #2A2D2E, Off-white #F7F6F2, Clay #A6432E, Ochre #A87F2A. No purple or blue gradients.
- Pages: Home, How it works, Safety, Pricing, Pilot (form to Formspree), FAQ, About.
- Footer: "For local businesses" link to the old direct-to-business page (kept, not in main nav). Disclaimer: Vouch SoCal is not affiliated with or endorsed by Google.
- **Honesty rules:** no fake testimonials, client logos, case studies, user counts or results. Mockups labeled "Illustrative example" with fictional business names.
  Only two stats, each with a source line: 97% of consumers read online reviews for local businesses (BrightLocal Local Consumer Review Survey);
  a one-star Yelp rating increase raised restaurant revenue 5 to 9% (Harvard Business School study).
  Promise time saved and safe, approved replies. Never promise ratings, rankings or revenue.
- **Writing rules:** no em dashes anywhere. No "seamless", "leverage", "unlock", "elevate", "game-changer", "in today's fast-paced world". No "no card, no catch" slogans.
- **Budget:** near zero. Free tiers only (Vercel free, Formspree free). No paid UI libraries or analytics. Ask before spending.
- Tech: mobile-first, fast, accessible. Title, description and Open Graph on every page. Favicon from the logo. Clean commented code and a short README.

## Decisions the owner made during the session
| Question | Answer |
| --- | --- |
| Formspree endpoint | Reuse the existing one: `https://formspree.io/f/mrewovza` |
| Pricing | $25 per location per month, 5 location minimum |
| Google API status | Pending |
| Contact email | `vouchsocal@gmail.com` (not hello@vouchsocal.com) |
| Lens and Ladder footer line | Must stay |
| Client Login link | Omit from the new site |
| Visual feedback | After the first build: "a little bland and doesn't match the same color scheming" as the old site. Restyled to match the old code. |

## What the old site was (found in Step 0 and in the uploaded source zip)
- A single hand-written `index.html` on Vercel, Tailwind via the CDN script, Inter self-hosted. Redirects apex to `www.vouchsocal.com`.
- Audit form posted to Formspree `mrewovza` (name, business, category, address, phone, email, Maps link).
- It also hosts a **live client portal** at `/portal/*` (login, dashboard, admin, reset-password), built on Supabase auth with row level security.
  The uploaded zip also holds `supabase/` (schema, trigger, edge functions). Those are NOT in this repo and were not touched.
- Old design system: oat #F5F1E8 paper, deep forest #1F3A2E dark bands with an SVG grain overlay, honey #CF9640 pill buttons with brown #3D2A08 text,
  italic green headline accent, mono-style uppercase tracked labels, green-tinted card shadows, a scrolling category strip, reveal-on-scroll, a dark form section.
- `brand_assets/vouch_brand_guidelines.txt` (in the zip) rules: no purple or blue, no gradients, clay and ochre never in the same element,
  never ask for passwords, no guaranteed results, placeholder stats never ship as real claims, backend/AI infrastructure stays off client-facing materials.
  It names Fraunces / Archivo / Spline Sans Mono, but the live site used Inter everywhere, so the new site uses Inter.
- Logo PNGs had a gray vignette baked in (about 590 KB and 540 KB). The new `public/brand_assets/` files are a cut-out of the same artwork on transparency.

## What was built
1. **Skills added to this repo** from two GitHub repos (both MIT): `ibelick/ui-skills` (8 skills) and `greensock/gsap-skills` (8 skills), in `.claude/skills/`.
   One of them, `ui-skills-root`, runs `npx ui-skills` at runtime. Zips of each were also handed to the owner for upload to claude.ai.
2. **The site**: Vite multi-page static site, plain CSS, one small script per concern. See `README.md` for commands and where to change values.
3. **Restyle** to match the old site, after the owner's feedback (colors, grain, honey buttons, italic accents, strip, dark form band).
4. Verified in headless Chromium at 390px and 1280px: no horizontal overflow, no console errors; pilot form tested with a mocked Formspree
   response (validation, inline server error, inline thank-you, focus handling, zero alert dialogs). Copy grep found no em dashes or banned words in the new pages.

## Bugs found and fixed along the way (worth remembering)
- Vite plugin hooks `configureServer` / `configurePreviewServer` must not return the result of `middlewares.use()`. Vite treats a returned function as a post-hook and crashes.
- Scroll-reveal CSS used `:is(...)`, whose specificity is its most specific argument, so the "hidden" rule beat the "visible" rule. Use `:where(...)` for the hide rule.
- The preview server dies when its shell call ends; start it in the background with `nohup`.

## State of things at the end of the session
- All work is committed and pushed to `claude/jolly-knuth-auqtav`. **No pull request has been opened.** The owner has not asked for one yet.
- Nothing is deployed from this repo. The live site is still the old one.
- Open items live in `PLACEHOLDERS.md` (founder names and photos, terms I wrote that the owner has not confirmed, product claims to verify)
  and `CHANGES.md` (everything removed or changed from the old site).

## Things to decide or watch
- **Deploying replaces the live site.** The repo started empty, so the portal pages were copied into `public/portal/` unchanged to keep existing client logins working.
  Confirm that before pointing the domain here, or deploy as a separate Vercel project first.
- `/privacy-policy` and `/terms` are the old pages and describe the direct-to-business service, not the agency product.
- The legacy page still shows the old before/after card and "2 to 18 reviews / 12% to 93%" numbers, which break the new honesty rules.
- Font choice: Inter (matches live) versus Fraunces/Archivo/Spline Sans Mono (matches the guidelines file).
- Brand guideline 4 says backend/AI infrastructure stays off client-facing materials. That was written for the old consumer model.
  The new B2B pitch is explicitly about AI reply drafts, per the brief, so the new site names it. Worth a conscious yes from the owners.

## How to resume
```bash
npm install
npm run dev          # dev server
npm run build && npm run preview   # production check at :4173
```
Shared values: `site.config.js`. Styles: `src/styles.css`. Page chrome: `src/partials/`. Form logic: `src/pilot.js`. Reveal and strip motion: `src/main.js`.
