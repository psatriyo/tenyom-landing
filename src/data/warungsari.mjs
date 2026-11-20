// Demo data for the example merchant "Warung Sari" (a persona, not a real
// business: D-61). Used by /contoh/warungsari/, /contoh/dasbor/ and the hero
// visual on the landing page.
//
// Source: requirement documents, 20 Nov 2026. The working beachhead is food
// and drink businesses with a shop (D-76); the page follows the "Kafe dan
// resto" layout (F-15-FR6, 208 §10): header with hours and address → social
// icons → catalog block titled "Menu" → branch cards (D-74) → links → footer.
// The name and the first menu item come from the F-07 and F-08 examples.
// Everything else here is derived for the demo and labelled "contoh" on the
// page.

export const business = {
  name: "Warung Sari",
  initial: "W",
  categoryCity: "Restoran & warung · PIK",
  slug: "warungsari",
  description: "Masakan rumahan sejak 2012. Makan di tempat, bungkus, atau pesan lewat GoFood dan GrabFood.",
  hours: "Setiap hari, 10.00–22.00 WIB",
  address: "Jl. Contoh Raya No. 8, PIK, Jakarta Utara",
};

// Social icons row (D-48). Icons only: the links go nowhere in the demo.
export const socials = [
  { id: "instagram", label: "Instagram", icon: "i-ig" },
  { id: "tiktok", label: "TikTok", icon: "i-tiktok" },
  { id: "facebook", label: "Facebook", icon: "i-fb" },
];

// The catalog block is titled "Menu" for this template (F-15-FR6).
export const catalogTitle = "Menu";
export const categories = [
  { id: "makanan", name: "Makanan" },
  { id: "minuman", name: "Minuman" },
  { id: "paket", name: "Paket" },
];

// price: integer rupiah, or null for "Tanya harga" (D-35).
// image: a file in assets/img/menu/, or null. Items without a photo show a
// placeholder tile, so a text-first menu still reads well (F-05; 403 finding 15).
// pro: what the Pro view adds (D-75 "promos and new labels", P1, Q-P40):
//   label "Baru" or "Promo", and an optional promoPrice lower than price.
export const items = [
  { id: "nasi-goreng", category: "makanan", name: "Nasi goreng spesial", price: 35000, description: "Nasi goreng kampung dengan telur mata sapi, ayam suwir, kerupuk dan acar.", image: "nasi-goreng", alt: "Ilustrasi sepiring nasi goreng dengan telur mata sapi" },
  { id: "ayam-bakar", category: "makanan", name: "Ayam bakar madu", price: 38000, description: "Ayam bakar bumbu madu, nasi putih, lalapan dan sambal terasi.", image: "ayam-bakar", alt: "Ilustrasi ayam bakar dengan nasi dan lalapan" },
  { id: "sop-buntut", category: "makanan", name: "Sop buntut", price: 65000, description: "Buntut sapi empuk dengan kuah bening, kentang dan wortel. Termasuk nasi.", image: "sop-buntut", alt: "Ilustrasi semangkuk sop buntut", pro: { label: "Baru" } },
  { id: "sayur-asem", category: "makanan", name: "Sayur asem", price: 12000, description: "Semangkuk sayur asem segar.", image: null, alt: "" },
  { id: "tempe-orek", category: "makanan", name: "Tempe orek", price: 8000, description: "Tempe orek manis pedas, satu porsi.", image: null, alt: "" },
  { id: "es-kopi-susu", category: "minuman", name: "Es kopi susu", price: 22000, description: "Kopi robusta dengan susu segar dan gula aren.", image: "es-kopi-susu", alt: "Ilustrasi segelas es kopi susu" },
  { id: "es-teh", category: "minuman", name: "Es teh manis", price: 6000, description: "Teh melati dengan es.", image: null, alt: "" },
  { id: "jus-alpukat", category: "minuman", name: "Jus alpukat", price: 20000, description: "Alpukat mentega dengan susu cokelat.", image: null, alt: "" },
  { id: "paket-siang", category: "paket", name: "Paket makan siang", price: 45000, description: "Nasi, ayam bakar madu, sayur asem dan es teh manis. Senin–Jumat, 11.00–14.00.", image: "paket-siang", alt: "Ilustrasi nampan paket makan siang", pro: { label: "Promo", promoPrice: 39000 } },
  { id: "nasi-kotak", category: "paket", name: "Nasi kotak acara", price: null, description: "Untuk arisan, rapat atau syukuran, minimal 20 kotak. Isi bisa disesuaikan.", image: null, alt: "" },
];

// Branch blocks (D-69, in the MVP since D-74). Until the details sheet ships
// in S17, a branch card shows every detail on the page (F-04-FR35 note).
// Contacts: "whatsapp" opens a chat prefilled per F-04-FR35; the others are
// demo links.
export const branches = [
  {
    id: "cabang-pik",
    name: "Cabang PIK",
    address: "Jl. Contoh Raya No. 8, PIK, Jakarta Utara",
    hours: "Setiap hari, 10.00–22.00",
    contacts: [
      { type: "whatsapp", label: "WhatsApp", icon: "i-wa" },
      { type: "instagram", label: "Instagram", icon: "i-ig" },
    ],
  },
  {
    id: "cabang-puri",
    name: "Cabang Puri Indah",
    address: "Jl. Contoh Puri No. 3, Kembangan, Jakarta Barat",
    hours: "Setiap hari, 10.00–21.00",
    contacts: [
      { type: "whatsapp", label: "WhatsApp", icon: "i-wa" },
      { type: "facebook", label: "Facebook", icon: "i-fb" },
    ],
  },
];

// Link blocks (F-04). Placeholder links from the "Kafe dan resto" template
// (F-15-FR5), plus one picture card. All demo links show a "Contoh link"
// toast, except "Reservasi via WhatsApp", which opens WhatsApp.
export const links = {
  heading: "Pesan & ulasan",
  list: [
    { id: "gofood", style: "classic", platform: "GoFood", label: "Pesan di GoFood", icon: "i-bowl" },
    { id: "grabfood", style: "classic", platform: "GrabFood", label: "Pesan di GrabFood", icon: "i-bowl" },
    { id: "maps", style: "classic", platform: "Google Maps", label: "Ulasan di Google Maps", icon: "i-star" },
    { id: "reservasi", style: "classic", platform: "WhatsApp", label: "Reservasi via WhatsApp", icon: "i-calendar", whatsapp: "Halo Warung Sari, saya mau reservasi meja." },
    { id: "video", style: "card", platform: "Instagram", label: "Video: dapur kami bikin sambal tiap pagi", icon: "i-play" },
  ],
};

// Dashboard mock data (labelled "contoh" on the page). Stats as in F-11:
// views, WhatsApp clicks, link clicks; clicks per link, social icon and
// branch contact ("{branch} · {platform}", F-04-FR36).
export const stats = {
  counters: [
    { label: "Kunjungan", value: 612 },
    { label: "Klik WhatsApp", value: 48 },
    { label: "Klik link", value: 131 },
  ],
  topLinks: [
    { label: "Pesan di GoFood", value: 41 },
    { label: "Cabang PIK · WhatsApp", value: 24 },
    { label: "Instagram", value: 19 },
    { label: "Ulasan di Google Maps", value: 16 },
    { label: "Pesan di GrabFood", value: 13 },
    { label: "Cabang Puri Indah · WhatsApp", value: 11 },
  ],
};

// Insights (P1, Pro, F-20): anonymous aggregate counts only (D-44).
export const insights = {
  sources: [
    { label: "Instagram", value: 36 },
    { label: "Google", value: 22 },
    { label: "QR di meja", value: 17 },
    { label: "WhatsApp", value: 13 },
    { label: "TikTok", value: 8 },
    { label: "Lainnya", value: 4 },
  ],
  busiestHours: "11.00–13.00 WIB",
  topItems: ["Nasi goreng spesial", "Paket makan siang", "Es kopi susu"],
  privacyNote: "Hanya hitungan anonim. Angka di bawah 5 ditampilkan sebagai \"<5\".",
};
