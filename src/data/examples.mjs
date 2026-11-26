// Fictional example pages for the hero switcher on the landing page (D-103),
// taken from the product's landing page (psatriyo/satupage,
// components/marketing/demo.ts). None is a real person or business (D-61)
// and none links anywhere: only Warung Sari has an example page behind it.
// Every block shown exists in the product: header, social icons, headings,
// catalog items, link buttons, a picture card and the WhatsApp button.
// Merchant content stays Indonesian in both languages, like a real page.
// Prices are integer rupiah; icons are ids in src/partials/icons.html.

export const po = {
  name: "Dapur Kiara",
  initial: "D",
  categoryCity: "Pre-order & jualan online · Bekasi",
  cover: "linear-gradient(120deg,#f6c35b,#f26b3a)",
  socials: ["i-ig", "i-tiktok"],
  heading: "PO batch 12 · tutup 20 Des",
  items: [
    { name: "Nastar premium", price: 120000 },
    { name: "Kastengel keju", price: 110000 },
  ],
  link: "Belanja di Shopee",
  wa: "Pesan via WhatsApp",
};

export const photo = {
  name: "Studio Rana",
  initial: "R",
  categoryCity: "Fotografi & desain · Tangerang",
  cover: "linear-gradient(120deg,#0f1a33,#4f8fd6)",
  socials: ["i-ig", "i-youtube"],
  catalogTitle: "Paket",
  items: [
    { name: "Prewedding", price: 3500000, tone: "linear-gradient(135deg,#f6c35b,#c94a7a)" },
    { name: "Wisuda", price: 750000, tone: "linear-gradient(135deg,#1d3466,#4f8fd6)" },
  ],
  link: "Portofolio lengkap",
  wa: "Booking via WhatsApp",
};

// "Nara Senja": a fictional musician for the public-figure use case (D-102).
export const artist = {
  name: "Nara Senja",
  initial: "N",
  categoryCity: "Musisi & tokoh publik · Jakarta",
  cover: "linear-gradient(120deg,#1d3466,#6b4fa0 55%,#c94a7a)",
  socials: ["i-ig", "i-tiktok", "i-youtube"],
  video: "Video klip terbaru: Lampu Kota",
  listen: "Dengarkan di Spotify",
  showsTitle: "Jadwal manggung",
  shows: ["14 Feb · Jakarta · Tiket"],
  merchTitle: "Merch",
  merch: { name: "Kaos tur 2027", price: 150000 },
  booking: "Booking & manajemen",
};

// A personal page without a WhatsApp number (WhatsApp is optional, D-103).
export const personal = {
  name: "Dimas Pratama",
  initial: "D",
  categoryCity: "Pribadi · Jakarta",
  cover: "linear-gradient(120deg,#cfe3d4,#6aa889)",
  bio: "Product designer. Suka kopi dan lari pagi.",
  socials: ["i-ig", "i-x", "i-link"],
  links: ["Portofolio saya", "Tulisan saya", "LinkedIn"],
};
