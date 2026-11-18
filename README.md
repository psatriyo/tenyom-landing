# BookBook landing page

Landing page for **BookBook** (working name): one link for a catalog and WhatsApp orders, built for Indonesian UMKM.
It implements the Phase 0 goal from the *2027 Project Plan v2.0*: collect founding-member sign-ups before Gate 0 (21 Dec 2026).

- Static HTML, CSS and JavaScript. No framework and no build step.
- Interface in Bahasa Indonesia (plan decision D-17), mobile-first, tested at 390 px and 1440 px.
- The JavaScript is about 10 KB and has no dependencies. The only external request is the Google Font, Plus Jakarta Sans.

## What's on the page

| Section | Purpose |
| --- | --- |
| Hero + interactive phone | Visitors can add items to a demo storefront ("Kue Bu Rina") and tap **Pesan via WhatsApp**. The demo shows the formatted order in a WhatsApp chat and in the order log. |
| Problem | Messy chats compared with a tidy order log |
| Cara kerja | The 4-step flow: sign up, publish, share, receive orders |
| Fitur | Free features plus the paid Pro wedge (WhatsApp order flow and order log) |
| Untuk siapa + comparison | Beachhead segments compared with alternatives |
| Harga | Free, Pro (price still being tested, Q-03) and the founding-member offer (Rp149k, P-06) |
| Founding member | Countdown to 20 Dec 2026, timeline to Lebaran, and a form that opens a pre-filled WhatsApp message |
| Trust, FAQ, final CTA | Covers no commission, no handling of buyer money, PDP and moderation |

## Before going live

1. **WhatsApp number.** In `assets/js/main.js`, set `CONFIG.WA_NUMBER` (for example `"6281234567890"`).
   While it is empty, the form opens WhatsApp's "choose a chat" screen.
2. **Domain.** The page shows `bookbook.id/<slug>` as an illustration. Change it in `index.html` once Q-04 (name and domain) is decided.
3. **Social preview URLs.** `og:url` and `og:image` in `index.html` point to `https://psatriyo.github.io/tenyom-landing/`. Update them if you use a custom domain.
4. **Dates.** The countdown deadline is set by `data-countdown` in `index.html`. After the deadline, the page switches the label to "closed" automatically.

## Deploy to GitHub Pages

**Option A: GitHub Actions** (recommended; `.github/workflows/pages.yml` is included)

1. Merge into `main`.
2. Go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. Every push to `main` deploys the site. You can also run the workflow by hand from the Actions tab.

**Option B: Deploy from a branch**

Go to **Settings → Pages**, choose **Deploy from a branch**, then pick `main` and `/ (root)`. The `.nojekyll` file makes Pages serve the files as they are.

All asset paths are relative, so the site works both under `/tenyom-landing/` and on a custom domain.

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Files

```
index.html              page
404.html                not-found page served by GitHub Pages
assets/css/styles.css   styles (design tokens at the top)
assets/js/main.js       demo, countdown, form -> WhatsApp, scroll reveal
assets/img/             favicon.svg, og-image.png (1200x630)
.github/workflows/      Pages deploy workflow
```
