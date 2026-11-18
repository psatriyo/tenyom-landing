// ---------------------------------------------------------------------------
// Site configuration: the ONE place for values that are still undecided or
// that change by launch phase. Edit here, then run `node scripts/build.mjs`.
//
// Source of truth: BookBook requirement documents (exported 18 Nov 2026).
// IDs in comments (D-xx decided, P-xx proposed, Q-xx open) point to
// operations/114-decision-log.md.
// ---------------------------------------------------------------------------

export default {
  // Brand name and domain are not final (Q-04, due before beta 15 Feb 2027).
  brand: "BookBook",
  // Domain shown in merchant link examples, e.g. bookbook.id/kueburina.
  // Merchant pages will live at /[slug] on this domain (technical/301 §3).
  domain: "bookbook.id",

  // Where THIS marketing site is served. Used for canonical URLs, Open Graph
  // and the sitemap. No trailing slash.
  siteUrl: "https://tenyom.com",
  // Path prefix the site is served under. "/" for a custom domain; use
  // "/tenyom-landing/" if served from psatriyo.github.io/tenyom-landing/.
  basePath: "/",

  // Support (D-24): dedicated WhatsApp Business number, replies within 24 h
  // on weekdays. International format without "+" or spaces, e.g.
  // "6281234567890". Empty = the form opens WhatsApp's "choose a chat" screen.
  support: {
    whatsapp: "",
    email: "",
    responseTime: "maksimal 24 jam di hari kerja",
  },

  // Sign-up lives in the product app (Google or email magic link, F-01).
  // Leave empty before the beta: every "Ganti link bio kamu" button then
  // leads to the founding-member / waitlist form on the home page.
  // Once set, the buttons go here and carry utm_*, ref and src (206, F-14).
  signupUrl: "",
  loginUrl: "",

  plans: {
    free: {
      items: 20, // D-32 (visible items)
      links: 10, // D-43 (was 5)
      socialIcons: 8, // D-48
      statsDays: 7,
    },
    pro: {
      // Pro price is NOT decided: Rp49.000 vs Rp99.000 is tested in S9
      // (15–28 Mar 2027), decision at Gate 1, 29 Mar 2027 (Q-03, D-38).
      // Keep null until then; set to an integer, e.g. 49000, afterwards.
      monthlyPrice: null,
      // Annual plan = 12 months for the price of 10 (D-14). Ships in S14 (P1).
      annualMonthsPaid: 10,
      annualAvailable: false,
      statsDays: 90,
    },
  },

  // Founding-member offer (Phase 0, P-06). Shown only while it runs: the page
  // hides it automatically after `deadline`. Set enabled: false to remove it.
  founding: {
    enabled: true,
    price: 149000,
    proMonths: 3, // starts when the merchant's page goes live (D-40)
    deadline: "2026-12-20T23:59:59+07:00",
    refundIfNoLaunchBy: "2027-02-15",
  },

  // Key dates (README, 106 §4). Dates move: keep them here only.
  dates: {
    conciergeWindow: "1–14 Februari 2027", // concierge pages built in S6
    betaOpens: "2027-02-15", // second week of Ramadan
    lebaran: "Lebaran 2027",
  },

  // Who runs the service, as named in the Terms and Privacy pages.
  // D-30: an individual business (NIB perorangan) for all of 2027.
  legal: {
    operator: "", // e.g. "BookBook, usaha perorangan milik …". Empty = "tim {brand}".
    lastUpdated: "2026-11-18",
  },

  // PostHog runs on marketing pages only, never on storefronts (206).
  // Empty key = no analytics script is loaded at all.
  analytics: {
    posthogKey: "",
    posthogHost: "https://us.i.posthog.com",
  },
};
