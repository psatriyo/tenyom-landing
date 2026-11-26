// ---------------------------------------------------------------------------
// Site configuration: the ONE place for brand, domain, price and contact
// values. Edit here, then run `node scripts/build.mjs`.
//
// Source of truth: the requirement documents (2027-project-requirement-documents,
// 20 Nov 2026, commit b58a8c4, decisions up to D-78), with the copy, price and
// audiences of the product's landing page (psatriyo/satupage, D-97 to D-103).
// IDs in comments (D-xx decided, P-xx proposed, Q-xx open) point to the
// decision log.
// Values marked OPEN are undecided: the default is used until they are.
// ---------------------------------------------------------------------------

export default {
  // Decided (Q-04): the product name and domain.
  brandName: "SatuPage",
  // Merchant pages live at /[slug] on this domain, e.g. satupage.com/warungsari.
  domain: "satupage.com",
  // The merchant app (D-70). "Masuk" opens <appUrl>/login and every sign-up
  // button opens <appUrl>/register, passing on utm_* and ref (F-01-FR9).
  // No trailing slash.
  appUrl: "https://app.satupage.com",

  // Where THIS site is served: canonical URLs, Open Graph, sitemap.
  // No trailing slash on siteUrl. basePath is "/" on a custom domain (then
  // add a CNAME file at the repository root); "/tenyom-landing/" on the
  // GitHub Pages default address psatriyo.github.io/tenyom-landing/.
  siteUrl: "https://psatriyo.github.io",
  basePath: "/tenyom-landing/",

  // OPEN: founder's WhatsApp number, international format without "+" or
  // spaces, e.g. "6281234567890". Used by "Hubungi kami" and the concierge
  // and founding-member buttons. Empty = the placeholder: wa.me opens
  // WhatsApp's "choose a chat" screen with the message filled in.
  // Do not put an invented number here.
  founderWhatsApp: "6281212345678",
  // OPEN: support email. Empty = not shown in the footer.
  supportEmail: "",
  // Number the example page "Warung Sari" sends its WhatsApp messages to
  // ("Tanya via WhatsApp", branch contacts, reservation link).
  // Empty = founderWhatsApp; if that is empty too, the "choose a chat" screen.
  // Never a stranger's number.
  demoMerchantWhatsApp: "",

  pricing: {
    // Interim Pro price shown everywhere, the same as the product (D-79).
    proMonthly: 69000,
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
    // Pro keeps working this many days after it ends (F-10).
    graceDays: 7,
    // Contacts per branch block (F-04).
    branchContacts: 6,
  },

  // Free concierge page for Phase 0 (D-71): the founder builds the page from
  // what the merchant sends, the merchant approves it in writing before it
  // goes live and can ask for it to be taken down at any time. Free for the
  // merchant. Shown in the "Mulai sebelum beta" section. Set enabled: false
  // once Gate 0 has enough pages (pages must be live by 13 Dec 2026).
  conciergeOffer: {
    enabled: true,
    // Where the founder can set pages up (Phase 0 runs in Greater Jakarta).
    area: "Jabodetabek",
  },

  // Founding-member offer (104 §4, P-06 "to confirm"; still offered, no
  // longer a Gate 0 criterion, D-71). Set enabled: false to hide it.
  // No countdown, no fake scarcity.
  // Off since 20 Nov (founder): the free concierge page replaces it on the
  // site, since strangers try first rather than pay a deposit (403, finding 11).
  foundingOffer: {
    enabled: false,
    deposit: 149000,
    proMonths: 3, // start when the merchant's page goes live (D-40)
    refundIfNoLaunchBy: "2027-02-15",
  },

  // Shown in the "Mulai sebelum beta" section and the FAQ.
  dates: {
    betaOpens: "2027-02-15",
  },

  // Footer: "© 2026 SatuPage · prototipe untuk riset" ("research prototype").
  copyrightYear: 2026,
};
