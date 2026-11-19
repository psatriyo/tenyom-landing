// ---------------------------------------------------------------------------
// Site configuration: the ONE place for brand, domain, price and contact
// values. Edit here, then run `node scripts/build.mjs`.
//
// Source of truth: "BookBook · landing-page and demo export" (19 Nov 2026,
// requirement-documents commit 1ef6476). IDs in comments (D-xx decided,
// P-xx proposed, Q-xx open) point to the decision log in that export.
// Values marked OPEN are undecided: the default is used until they are.
// ---------------------------------------------------------------------------

export default {
  // OPEN (Q-04, due before 15 Feb 2027). Working name only (D-22).
  brandName: "BookBook",
  // OPEN (Q-04). Example domain used throughout the docs; not registered.
  // Merchant pages live at /[slug] on this domain, e.g. bookbook.id/kueburina.
  domain: "bookbook.id",
  // The merchant app lives on an app. subdomain (D-70). Not linked during the
  // demo: "Masuk" and "Coba gratis" open the "uji coba" sheet instead.
  appDomain: "app.bookbook.id",

  // Where THIS site is served: canonical URLs, Open Graph, sitemap.
  // No trailing slash. basePath is "/" on a custom domain; use
  // "/tenyom-landing/" if served from psatriyo.github.io/tenyom-landing/.
  siteUrl: "https://tenyom.com",
  basePath: "/",

  // OPEN: founder's WhatsApp number, international format without "+" or
  // spaces, e.g. "6281234567890". Used by "Hubungi kami", the "uji coba" sheet
  // and the founding-member button. Empty = the placeholder: wa.me opens
  // WhatsApp's "choose a chat" screen with the message filled in.
  // Do not put an invented number here.
  founderWhatsApp: "6281212345678",
  // OPEN: support email. Empty = not shown (the legal drafts keep their own
  // [EMAIL DUKUNGAN] placeholders, which are never replaced automatically).
  supportEmail: "",
  // Number the demo shop "Kue Bu Rina" sends its WhatsApp messages to.
  // Empty = founderWhatsApp; if that is empty too, the "choose a chat" screen.
  // Never a stranger's number.
  demoMerchantWhatsApp: "",

  pricing: {
    // OPEN (Q-03, D-14, D-38): Pro is tested at Rp49.000 vs Rp99.000 a month,
    // decided at Gate 1 (29 Mar 2027). The founder switches the price shown
    // per interview with ?harga=49 or ?harga=99 (kept for the browser tab).
    proMonthlyOptions: { 49: 49000, 99: 99000 },
    proMonthlyDefault: 99,
    priceParam: "harga",
    // Annual = 12 months for the price of 10 ("2 bulan gratis").
    annualMonthsPaid: 10,
  },

  // Plan limits (204, D-32, D-43, D-48). Used on every page so they never disagree.
  limits: {
    freeItems: 20,
    freeLinks: 10,
    socialIcons: 8,
    freeStatsDays: 7,
    proStatsDays: 90,
  },

  // Founding-member offer (104 §4, P-06 "to confirm"). Set enabled: false to
  // hide the section and its links. No countdown, no fake scarcity.
  foundingOffer: {
    enabled: true,
    deposit: 149000,
    proMonths: 3, // start when the merchant's page goes live (D-40)
    refundIfNoLaunchBy: "2027-02-15",
  },

  dates: {
    betaOpens: "2027-02-15",
  },

  // Footer: "© 2026 BookBook · nama kerja · prototipe untuk riset".
  copyrightYear: 2026,
};
