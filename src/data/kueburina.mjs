// Demo data for the example merchant "Kue Bu Rina" (a persona, not a real
// person or shop: D-61). Used by /contoh/kueburina/, /contoh/dasbor/ and the
// hero visual. Fields marked "derived" were written for the export and wait
// for the founder's confirmation.

export const business = {
  name: "Kue Bu Rina",
  categoryCity: "Hampers & kue kering · Bekasi",
  slug: "kueburina",
  // derived
  description: "Kue kering rumahan dan hampers Lebaran. Pre-order dibuka, ambil di Bekasi atau kirim via kurir.",
  // derived
  hours: "Buka Senin–Sabtu, 08.00–17.00 WIB",
  address: "Jl. Contoh No. 1, Bekasi",
};

// derived: icons only, links go nowhere in the demo.
export const socials = [
  { id: "instagram", label: "Instagram", icon: "i-ig" },
  { id: "tiktok", label: "TikTok", icon: "i-tiktok" },
  { id: "facebook", label: "Facebook", icon: "i-fb" },
];

export const categories = [
  { id: "hampers", name: "Hampers Lebaran" },
  { id: "kue-kering", name: "Kue kering" },
];

// price: integer rupiah, or null for "Tanya harga" (D-35).
export const items = [
  { id: "hampers-a", category: "hampers", name: "Hampers Lebaran A", price: 250000, description: "3 toples kue kering pilihan dalam kotak hampers.", image: "hampers-a", alt: "Ilustrasi kotak hampers hijau berpita emas" },
  { id: "hampers-b", category: "hampers", name: "Hampers Lebaran B", price: 375000, description: "5 toples kue kering + kartu ucapan.", image: "hampers-b", alt: "Ilustrasi kotak hampers merah marun dengan kartu ucapan" },
  { id: "hampers-custom", category: "hampers", name: "Hampers custom", price: null, description: "Isi dan kemasan sesuai permintaan.", image: "hampers-custom", alt: "Ilustrasi keranjang hampers dengan label tanda tanya" },
  { id: "nastar", category: "kue-kering", name: "Nastar premium", price: 95000, description: "Toples 500 g, selai nanas homemade.", image: "nastar", alt: "Ilustrasi toples berisi nastar" },
  { id: "kastengel", category: "kue-kering", name: "Kastengel keju", price: 105000, description: "Toples 500 g, keju edam.", image: "kastengel", alt: "Ilustrasi toples berisi kastengel keju" },
  { id: "putri-salju", category: "kue-kering", name: "Putri salju", price: 85000, description: "Toples 500 g.", image: "putri-salju", alt: "Ilustrasi toples berisi kue putri salju" },
  { id: "lidah-kucing", category: "kue-kering", name: "Lidah kucing", price: 80000, description: "Toples 500 g.", image: "lidah-kucing", alt: "Ilustrasi toples berisi kue lidah kucing" },
];

// derived. All demo links go nowhere and show a "Contoh link" toast.
export const links = {
  heading: "Belanja juga di",
  list: [
    { id: "shopee", style: "classic", platform: "Shopee", label: "Belanja di Shopee", icon: "i-bag" },
    { id: "gofood", style: "classic", platform: "GoFood", label: "Pesan lewat GoFood", icon: "i-bowl" },
    { id: "video", style: "card", platform: "Instagram", label: "Video collab bareng @dapurlebaran", icon: "i-play" },
    { id: "testimoni", style: "classic", platform: "", label: "Testimoni pembeli", icon: "i-chat" },
  ],
};

// Dashboard mock data (derived, labelled "contoh" on the page).
export const orders = [
  { no: 12, time: "Hari ini 09.14", name: "Sari", summary: "2× Nastar premium, 1× Hampers Lebaran A", total: 440000, status: "Baru" },
  { no: 11, time: "Kemarin 20.41", name: "", summary: "1× Hampers Lebaran B", total: 375000, status: "Dikonfirmasi" },
  { no: 10, time: "Kemarin 16.05", name: "Dewi", summary: "3× Kastengel keju", total: 315000, status: "Selesai" },
  { no: 9, time: "2 hari lalu", name: "Andi", summary: "1× Hampers custom", total: null, status: "Dikonfirmasi" },
];

export const stats = {
  counters: [
    { label: "Kunjungan", value: 412 },
    { label: "Klik WhatsApp", value: 57 },
    { label: "Pesanan", value: 12 },
  ],
  topLinks: [
    { label: "Belanja di Shopee", value: 38 },
    { label: "Instagram", value: 21 },
    { label: "Pesan lewat GoFood", value: 14 },
    { label: "Video collab", value: 9 },
  ],
};

export const insights = {
  sources: [
    { label: "Instagram", value: 46 },
    { label: "WhatsApp", value: 24 },
    { label: "TikTok", value: 15 },
    { label: "QR", value: 9 },
    { label: "Lainnya", value: 6 },
  ],
  busiestHours: "19.00–21.00 WIB",
  topItems: ["Nastar premium", "Hampers Lebaran A", "Kastengel keju"],
  privacyNote: "Hanya hitungan anonim. Angka di bawah 5 ditampilkan sebagai \"<5\".",
};
