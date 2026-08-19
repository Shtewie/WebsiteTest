# Tabletop Teachings — website

https://claude.ai/public/artifacts/88abd9d7-54c5-4a77-b0ea-1cd4a4d3ceb9

A plain static site: HTML, CSS and a little vanilla JavaScript. No build step,
no framework, no `npm install`. Any browser (and Netlify) serves these files
exactly as they are.

---

## Before you publish

Every `[[PLACEHOLDER]]` the first draft shipped with has been filled in. To
confirm none crept back in:

```sh
grep -rn '\[\[' --include=*.html --include=*.js --include=*.xml --include=*.txt .
```

**The domain is set to `tabletopteachings.com`** in the canonical tag, the
Open Graph tags, `sitemap.xml` and `robots.txt`. If you end up on a different
domain, find and replace that string across those four files.

**If a claim isn't true, delete the line rather than softening it.** The
credentials answers in the FAQ are only worth having because every item in
them is verifiable.

### Then, in order of value

1. **Install an analytics tag.** There's a commented block in the `<head>` of
   `index.html` — paste your GA4 / Google Ads / Meta tag there. Without this
   you're buying traffic you can't measure.

   Mark **`generate_lead`** as your conversion, not `cta_click`. `cta_click`
   fires whenever someone taps a "Join an Adventure" button, which on this
   single-page site only scrolls them to the form. `generate_lead` fires once,
   on the `?done=1` page Netlify returns to after a booking is accepted.
2. **Add two or three real parent quotes.** The testimonials section is built
   and commented out in `index.html`; delete the comment markers and fill it
   in. Get written permission, use first name + year level only, never a
   child's full name.
3. **Add one photo of you and one of a table mid-session.** The site has no
   images of real people. For a stranger running activities with kids, this is
   the biggest remaining trust gap.
4. **Decide your offer.** Most CTAs say "Join an Adventure". A free
   15-minute intro call converts better if you're willing to run them — change
   the button text and keep it identical everywhere.
5. **Pick one host.** This repo is configured for Netlify (`netlify.toml`). If
   you're also running the GitHub Pages workflow, turn one of them off so
   there's a single canonical domain.

---

## File map

```
index.html               → the whole site: hero, how it works, adventures,
                            pricing, FAQ and the booking form
404.html                 → shown for any missing page
css/style.css            → all page styling (colours, fonts, layout)
css/booking.css          → styling for the booking form and time picker

js/availability.js       → ★ YOUR TEACHING WEEK. Days, times, booked slots
                            and holidays. This is the file you will edit
                            most often — see "Changing your availability"
js/schedule.js           → turns availability.js into the time picker and
                            runs the three-step booking form. Don't edit
js/adventures-data.js    → the campaign content — edit THIS to change what
                            the Adventures section shows
js/quests.js             → renders the campaign cards and the detail panel
                            that expands inline when a card is clicked
js/track.js              → reports CTA clicks to your analytics tag

assets/og-image.png      → the 1200×630 image shown when the site is shared
favicon.ico, robots.txt, sitemap.xml
netlify.toml             → hosting config (caching, security headers)
```

There is no `/adventures/` page. It was folded into the homepage; anything
still referring to one is out of date.

---

## Making everyday content edits

**Homepage text** — edit `index.html` directly. Each section is a plain HTML
block; change the words between the tags.

**Campaigns** — edit `js/adventures-data.js`. It's a list of campaigns with a comment block at the
top explaining every field. Copy a campaign to add one, delete a block to
remove one.

Two fields drive the sales behaviour:

- `"status": "recruiting"` → the card shows a spots badge and an "Ask About a
  Spot" button, and the Learning tab shows the goals the quest is built around
  instead of a 0% progress bar.
- `"status": "playing"` → the card shows a progress bar and the latest world
  log entry, and the button becomes "Join the Waitlist".

`"spots"` is the text in the badge. **Keep it honest** — "3 spots open" only
works while it's true, and a parent who turns up to a full table won't come
back.

**Never put a real child's name in `player`.** Use `Player A` style labels, or
leave it as `""` for NPCs. The site states publicly that you don't publish
players' names; that promise has to hold.

**Prices** — plain text in `index.html`, one set of figures, no switch. But
each price appears in **three** places: the visible pricing card, the
`LocalBusiness` schema in `<head>` (`priceRange` and `hasOfferCatalog`), and
the `<meta name="description">`. Change all three together or Google will
show a price you no longer charge.

**Colours / fonts** — all at the top of `css/style.css` under `:root`. Six
"quest" tones (`--quest-1` … `--quest-6`) are reused across cards, tags and
badges.

---

## Changing your availability

Open **`js/availability.js`**. It is the only file involved. Commit and push,
and the picker updates within the hour (see the cache headers in
`netlify.toml`).

**Your regular week** — the start time of every session you're willing to run:

```js
week: {
  mon: ["16:00", "17:30"],
  fri: [],                       // a day you don't teach
  sat: ["09:00", "10:30", "13:00"],
},
```

**A slot that's now booked** — it disappears from the picker:

```js
taken: ["2026-08-24 16:00"],
```

**Days off** — one date, or a range (both ends included):

```js
away: ["2026-12-25", "2026-09-28..2026-10-10"],
```

Three rules the file will not forgive:

- Times are **`"HH:MM"` on a 24-hour clock, with the leading zero**. `"09:00"`,
  never `"9:00"` or `"9am"`. Anything else is ignored, so a typo silently
  removes that one time instead of breaking the picker.
- Dates are **`"YYYY-MM-DD"`**, and a `taken` entry is the date, one space,
  then the start time exactly as written in `week`.
- Keep the **commas** between entries and the **quotes** around each one. A
  missing one stops the whole file loading, and the picker then shows the
  "nothing free" message rather than wrong times.

Times are Newcastle time and daylight saving is handled for you — a 4pm
session stays 4pm across the October changeover.

To sanity-check before pushing, run the site locally (below) and look at the
picker. If a time you expected is missing, it's almost always the leading
zero.

---

## Running it locally

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`. A server is required — opening the HTML
files directly breaks the Adventures page and the root-relative paths.

---

## Notes on tracking

The booking form is a Netlify form on this page, so submissions are fully
measurable — no third-party form, nothing to embed.

- **`cta_click`** (`js/track.js`) fires on any button carrying
  `data-track-cta`. On a single-page site these only scroll someone to the
  form, so this is a navigation signal, not a lead.
- **`booking_step`** and **`booking_mode`** (`js/schedule.js`) tell you where
  people drop out of the three steps.
- **`generate_lead`**, plus Meta's standard `Lead`, fires once, on the
  `?done=1` page Netlify returns to after it has accepted the submission.

Import **`generate_lead`** into Google Ads as your conversion and leave the
rest as plain events. Counting CTA clicks as leads inflates conversions by
roughly ten to one and will wreck your bidding.

---

## Accessibility and performance notes

- Critical above-the-fold CSS is inlined in both pages so they paint without
  waiting on a network request. If you change the nav or hero styling in
  `css/style.css`, update the inline `<style>` block too or you'll see a flash
  of unstyled content.
- `.sr-only` in `css/style.css` is load-bearing. Deleting it makes screen
  reader text ("Not yet completed:") render visibly on the objectives list.
- The campaign cards are `<button>` elements, so their title is a styled
  `<span role="heading">` rather than an `<h3>` — a button may only contain
  phrasing content. Don't "fix" it back to a heading tag.
- The site is a single page. Clicking a campaign card expands a detail panel
  inside the same grid; it opens at the end of that card's row on desktop and
  directly beneath the tapped card on a phone. Escape closes it, and
  `/#lantern-marsh` style links still open a specific quest on load.
- Same-page nav links are hidden below 640px (the nav wrapped into three
  ragged lines otherwise). The sticky bottom CTA covers booking on mobile.
