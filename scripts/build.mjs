#!/usr/bin/env node
// Builds the static site into dist/ from src/, content/ and site.config.mjs.
// Zero dependencies: Node 18+ only.
//
// Template syntax (src/**/*.html):
//   {{ path.to.value }}        HTML-escaped value
//   {{{ path.to.value }}}      raw value
//   {{> name }}                partial from src/partials/name.html
//   {{#if path}}…{{else}}…{{/if}}, {{#unless path}}…{{/unless}}
//   {{#each path}}…{{/each}}   loop; the item's fields are in scope, plus
//                              `this` (the item) and `index` (0-based)
//   {{!-- comment --}}
// Pages start with a JSON front matter block between two "---" lines.
// src/pages/a/b.html is served at /a/b/; index.html at /; 404.html at /404.html.
// Every content/legal/<name>.md is served at /<name>/ through src/legal.html.

import { readFile, writeFile, mkdir, readdir, rm, cp, stat } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { renderMarkdown } from "./markdown.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const OUT = join(ROOT, "dist");

// Legal documents in the order they are listed (D-54).
const LEGAL_ORDER = ["syarat-layanan", "kebijakan-privasi", "kebijakan-konten"];
// Routes of the previous version of the site, kept working as redirects.
const REDIRECTS = { terms: "syarat-layanan/", privacy: "kebijakan-privasi/", pricing: "#harga", help: "#faq" };

/* ------------------------------------------------------------------ */
/* Formatting helpers (NFR-14: rupiah as integers, "Rp99.000")          */
/* ------------------------------------------------------------------ */
export const rupiah = (n) => "Rp" + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
export const dateLong = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) throw new Error(`Bad date: ${iso}`);
  return `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}`;
};
const digits = (s) => String(s || "").replace(/\D/g, "");
// wa.me by direct navigation (plain <a href>), never window.open (NFR-03).
// Without a number, wa.me opens WhatsApp's "choose a chat" screen.
export const waLink = (number, text) => `https://wa.me/${digits(number)}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

/* ------------------------------------------------------------------ */
/* Context derived from the config                                     */
/* ------------------------------------------------------------------ */
export async function loadContext() {
  const bust = `?t=${Date.now()}`;
  const cfg = (await import(pathToFileURL(join(ROOT, "site.config.mjs")).href + bust)).default;
  const demo = await import(pathToFileURL(join(SRC, "data", "kueburina.mjs")).href + bust);

  const base = cfg.basePath.endsWith("/") ? cfg.basePath : cfg.basePath + "/";
  const siteUrl = cfg.siteUrl.replace(/\/+$/, "");
  const brand = cfg.brandName;
  const p = cfg.pricing;
  const proMonthly = p.proMonthlyOptions[p.proMonthlyDefault];
  if (!Number.isInteger(proMonthly)) throw new Error("pricing.proMonthlyDefault must be a key of pricing.proMonthlyOptions");
  const founderWa = digits(cfg.founderWhatsApp);
  const merchantWa = digits(cfg.demoMerchantWhatsApp) || founderWa;
  const exampleUrl = `${cfg.domain}/${demo.business.slug}`;
  const f = cfg.foundingOffer;

  // WhatsApp templates (F-08; wording still open, Q-P07). The cart's order
  // message (F-09, D-37) is built in assets/js/demo.js.
  const via = `\n\n— via ${exampleUrl}`;
  const askText = (it) =>
    it.price
      ? `Halo ${demo.business.name}, saya mau tanya tentang:\n*${it.name}* (${rupiah(it.price)})\n\nMasih tersedia?${via}`
      : `Halo ${demo.business.name}, saya mau tanya tentang:\n*${it.name}*\n\nBoleh info harganya?${via}`; // derived
  const items = demo.items.map((it) => ({
    ...it,
    askHref: waLink(merchantWa, askText(it)),
    priceText: it.price ? rupiah(it.price) : "",
    priceLabel: it.price ? rupiah(it.price) : "Tanya harga",
    imageUrl: `${base}assets/img/produk/${it.image}.svg`,
    categoryName: demo.categories.find((c) => c.id === it.category).name,
  }));
  const maxOf = (list) => Math.max(...list.map((x) => x.value));
  const bars = (list, unit = "") => list.map((x) => ({ ...x, pct: Math.round((x.value / maxOf(list)) * 100), valueText: `${x.value}${unit}` }));

  const ctx = {
    brandName: brand,
    domain: cfg.domain,
    appDomain: cfg.appDomain,
    base,
    siteUrl,
    exampleUrl,
    copyrightYear: cfg.copyrightYear,
    limits: cfg.limits,
    supportEmail: cfg.supportEmail,
    hasSupportEmail: Boolean(cfg.supportEmail),
    wa: {
      // derived message texts, except the founding-member one (from the export)
      contact: waLink(founderWa, `Halo, saya mau tanya tentang ${brand}.`),
      ujiCoba: waLink(founderWa, `Halo, saya mau dikabari soal ${brand}.`),
      founding: waLink(founderWa, `Halo, saya tertarik jadi anggota pendiri ${brand}.`),
      isPlaceholder: !founderWa,
    },
    price: {
      monthly: rupiah(proMonthly),
      annual: rupiah(proMonthly * p.annualMonthsPaid),
      annualSaving: rupiah(proMonthly * (12 - p.annualMonthsPaid)),
      freeMonths: 12 - p.annualMonthsPaid,
      options: Object.values(p.proMonthlyOptions).map(rupiah).join(" atau "),
    },
    founding: {
      enabled: Boolean(f.enabled),
      deposit: rupiah(f.deposit),
      proMonths: f.proMonths,
      refundText: dateLong(f.refundIfNoLaunchBy),
    },
    betaOpensText: dateLong(cfg.dates.betaOpens),
    demo: {
      ...demo,
      chatHref: waLink(merchantWa, `Halo ${demo.business.name}, saya mau tanya.${via}`), // derived
      items,
      firstItems: items.filter((it) => ["nastar", "hampers-a"].includes(it.id)),
      links: { ...demo.links, list: demo.links.list.map((l) => ({ ...l, showPlatform: l.style === "card" })) },
      orders: demo.orders.map((o) => ({ ...o, totalText: o.total ? rupiah(o.total) : "harga via chat", nameText: o.name || "—", statusClass: o.status.toLowerCase() })),
      topLinks: bars(demo.stats.topLinks),
      sources: bars(demo.insights.sources, "%"),
    },
  };

  // Values the browser scripts need, emitted as inline JSON on every page.
  ctx.runtimeJson = JSON.stringify({
    brand,
    domain: cfg.domain,
    base,
    price: { param: p.priceParam, options: p.proMonthlyOptions, fallback: p.proMonthlyDefault, annualMonthsPaid: p.annualMonthsPaid },
  }).replace(/</g, "\\u003c");
  ctx.demoJson = JSON.stringify({
    merchantWa,
    url: exampleUrl,
    business: demo.business,
    items: demo.items.map(({ id, name, price, description, category }) => ({ id, name, price, description, category })),
    orders: demo.orders,
    nextOrderNo: Math.max(...demo.orders.map((o) => o.no)) + 1,
  }).replace(/</g, "\\u003c");

  return ctx;
}

/* ------------------------------------------------------------------ */
/* Template engine                                                     */
/* ------------------------------------------------------------------ */
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function parse(src, name) {
  src = src.replace(/\{\{!--[\s\S]*?--\}\}/g, "");
  const root = [];
  const stack = [{ list: root }];
  const re = /\{\{(\{?)\s*([#/>]?)\s*([^{}]*?)\s*\}?\}\}/g;
  let i = 0;
  let m;
  while ((m = re.exec(src))) {
    const top = stack[stack.length - 1];
    if (m.index > i) top.list.push({ t: "text", v: src.slice(i, m.index) });
    i = re.lastIndex;
    const [, triple, sigil, body] = m;
    if (sigil === "#") {
      const [kw, path] = body.split(/\s+/);
      if (!["if", "unless", "each"].includes(kw)) throw new Error(`${name}: unknown block {{#${kw}}}`);
      const node = { t: kw === "each" ? "each" : "if", neg: kw === "unless", path, yes: [], no: [] };
      top.list.push(node);
      stack.push({ node, kw, list: node.yes });
    } else if (sigil === "/") {
      const open = stack.pop();
      if (!open.node || open.kw !== body) throw new Error(`${name}: unexpected {{/${body}}}`);
    } else if (sigil === ">") {
      top.list.push({ t: "partial", name: body });
    } else if (body === "else") {
      if (!top.node) throw new Error(`${name}: {{else}} outside a block`);
      top.list = top.node.no;
    } else {
      top.list.push({ t: "var", path: body, raw: Boolean(triple) });
    }
  }
  if (i < src.length) stack[stack.length - 1].list.push({ t: "text", v: src.slice(i) });
  if (stack.length !== 1) throw new Error(`${name}: unclosed {{#${stack[stack.length - 1].kw}}}`);
  return root;
}

function lookup(ctx, path, name) {
  let v = ctx;
  for (const key of path.split(".")) {
    if (v == null || !(key in Object(v))) throw new Error(`${name}: unknown value "${path}"`);
    v = v[key];
  }
  return v;
}

function renderNodes(nodes, ctx, partials, name) {
  let out = "";
  for (const n of nodes) {
    if (n.t === "text") out += n.v;
    else if (n.t === "var") {
      const v = lookup(ctx, n.path, name);
      out += n.raw ? String(v ?? "") : esc(v ?? "");
    } else if (n.t === "partial") {
      if (!(n.name in partials)) throw new Error(`${name}: unknown partial "${n.name}"`);
      out += renderNodes(partials[n.name], ctx, partials, `partial ${n.name}`);
    } else if (n.t === "if") {
      const v = lookup(ctx, n.path, name);
      const truthy = Array.isArray(v) ? v.length > 0 : Boolean(v);
      out += renderNodes(truthy !== n.neg ? n.yes : n.no, ctx, partials, name);
    } else if (n.t === "each") {
      const list = lookup(ctx, n.path, name);
      if (!Array.isArray(list)) throw new Error(`${name}: {{#each ${n.path}}} is not a list`);
      if (!list.length) out += renderNodes(n.no, ctx, partials, name);
      list.forEach((item, index) => {
        const scope = { ...ctx, ...(item && typeof item === "object" ? item : {}), this: item, index };
        out += renderNodes(n.yes, scope, partials, name);
      });
    }
  }
  return out;
}

export function render(src, ctx, partials = {}, name = "template") {
  return renderNodes(parse(src, name), ctx, partials, name);
}

export async function loadPartials() {
  const dir = join(SRC, "partials");
  const partials = {};
  for (const f of await readdir(dir)) {
    if (f.endsWith(".html")) partials[f.slice(0, -5)] = parse(await readFile(join(dir, f), "utf8"), `partial ${f}`);
  }
  return partials;
}

function splitFrontMatter(src, name) {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(src);
  if (!m) throw new Error(`${name}: missing front matter`);
  return { meta: JSON.parse(m[1]), body: src.slice(m[0].length) };
}

async function listPages(dir, prefix = "") {
  const out = [];
  for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isDirectory()) out.push(...(await listPages(join(dir, entry.name), `${prefix}${entry.name}/`)));
    else if (entry.name.endsWith(".html")) out.push(`${prefix}${entry.name}`);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Build                                                               */
/* ------------------------------------------------------------------ */
async function exists(p) { try { await stat(p); return true; } catch { return false; } }

async function build() {
  const t0 = Date.now();
  const ctx = await loadContext();
  const partials = await loadPartials();
  const layout = await readFile(join(SRC, "layout.html"), "utf8");

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const sitemap = [];
  let count = 0;

  const emit = async (urlPath, meta, bodySrc, extra, name) => {
    const page = {
      title: "",
      description: "",
      noindex: false,
      demo: false,
      legal: false,
      ...meta,
      ...extra,
      path: urlPath,
      url: `${ctx.siteUrl}${ctx.base}${urlPath}`,
      isHome: urlPath === "",
    };
    const pageCtx = { ...ctx, page };
    page.title = render(page.title, pageCtx, partials, `${name} title`);
    page.description = render(page.description, pageCtx, partials, `${name} description`);
    pageCtx.body = render(bodySrc, pageCtx, partials, name);
    const html = render(layout, pageCtx, partials, "layout.html");
    const dest = join(OUT, urlPath.endsWith(".html") ? urlPath : `${urlPath}index.html`);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, html);
    count++;
    if (!page.noindex && !urlPath.endsWith(".html")) sitemap.push(page.url);
  };

  // Template pages
  const pagesDir = join(SRC, "pages");
  for (const file of await listPages(pagesDir)) {
    const { meta, body } = splitFrontMatter(await readFile(join(pagesDir, file), "utf8"), file);
    const slug = file.slice(0, -5);
    const urlPath = slug === "index" ? "" : slug === "404" ? "404.html" : `${slug}/`;
    await emit(urlPath, meta, body, { slug: slug.replace(/\//g, "-") }, file);
  }

  // Legal pages (Markdown)
  const legalDir = join(ROOT, "content", "legal");
  const names = (await readdir(legalDir)).filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3));
  names.sort((a, b) => (LEGAL_ORDER.indexOf(a) + 1 || 99) - (LEGAL_ORDER.indexOf(b) + 1 || 99));
  const docs = [];
  for (const n of names) {
    const doc = renderMarkdown(await readFile(join(legalDir, `${n}.md`), "utf8"), { base: ctx.base });
    // "Syarat Layanan BookBook" -> "Syarat Layanan"
    doc.short = doc.title.replace(new RegExp(`\\s+${ctx.brandName}$`), "");
    doc.route = n;
    docs.push(doc);
  }
  const legalTemplate = await readFile(join(SRC, "legal.html"), "utf8");
  for (const doc of docs) {
    const others = docs.map((d) => ({ short: d.short, href: `${ctx.base}${d.route}/`, current: d === doc }));
    await emit(
      `${doc.route}/`,
      {
        title: `${doc.short} (draf) · ${ctx.brandName}`,
        description: `Draf ${doc.short} ${ctx.brandName} (v0.1, belum berlaku).`,
        noindex: true,
      },
      legalTemplate,
      { slug: `legal-${doc.route}`, legal: true, doc: { ...doc, others } },
      `content/legal/${doc.route}.md`,
    );
  }

  // Redirects from the previous routes
  for (const [from, to] of Object.entries(REDIRECTS)) {
    const target = `${ctx.base}${to}`;
    const dest = join(OUT, from, "index.html");
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(
      dest,
      `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Halaman dipindahkan</title>` +
        `<meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=${esc(target)}">` +
        `<link rel="canonical" href="${esc(ctx.siteUrl + target)}"></head>` +
        `<body><p>Halaman ini sudah pindah ke <a href="${esc(target)}">${esc(target)}</a>.</p></body></html>\n`,
    );
  }

  // Static files
  await cp(join(ROOT, "assets"), join(OUT, "assets"), { recursive: true });
  for (const f of ["CNAME", ".nojekyll"]) if (await exists(join(ROOT, f))) await cp(join(ROOT, f), join(OUT, f));
  await writeFile(join(OUT, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${ctx.siteUrl}${ctx.base}sitemap.xml\n`);
  await writeFile(
    join(OUT, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      sitemap.map((u) => `  <url><loc>${esc(u)}</loc></url>`).join("\n") +
      `\n</urlset>\n`,
  );

  console.log(`Built ${count} pages and ${Object.keys(REDIRECTS).length} redirects into ${relative(ROOT, OUT)}/ in ${Date.now() - t0} ms`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  build().catch((e) => { console.error(e.message || e); process.exit(1); });
}
