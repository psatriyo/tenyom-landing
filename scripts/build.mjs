#!/usr/bin/env node
// Builds the static site into dist/ from src/ and site.config.mjs.
// Zero dependencies: Node 18+ only.
//
// Template syntax (src/**/*.html):
//   {{ path.to.value }}        HTML-escaped value
//   {{{ path.to.value }}}      raw value
//   {{> name }}                partial from src/partials/name.html
//   {{#if path}}…{{else}}…{{/if}}, {{#unless path}}…{{/unless}}
//   {{!-- comment --}}
// Pages start with a JSON front matter block between two "---" lines.

import { readFile, writeFile, mkdir, readdir, rm, cp, stat } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const OUT = join(ROOT, "dist");

/* ------------------------------------------------------------------ */
/* Formatting helpers (NFR-14: rupiah as integers, "Rp99.000")          */
/* ------------------------------------------------------------------ */
export const rupiah = (n) => "Rp" + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
// Dates are shown in WIB (NFR-16). Parse the calendar date as written.
const ymd = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) throw new Error(`Bad date: ${iso}`);
  return { y: +m[1], mo: +m[2] - 1, d: +m[3] };
};
export const dateLong = (iso) => { const { y, mo, d } = ymd(iso); return `${d} ${MONTHS[mo]} ${y}`; };
export const dateShort = (iso) => { const { y, mo, d } = ymd(iso); return `${d} ${MONTHS_SHORT[mo]} ${y}`; };

/* ------------------------------------------------------------------ */
/* Context derived from the config                                     */
/* ------------------------------------------------------------------ */
export async function loadContext() {
  const url = pathToFileURL(join(ROOT, "site.config.mjs")).href + `?t=${Date.now()}`;
  const cfg = (await import(url)).default;

  const base = cfg.basePath.endsWith("/") ? cfg.basePath : cfg.basePath + "/";
  const siteUrl = cfg.siteUrl.replace(/\/+$/, "");
  const waDigits = String(cfg.support.whatsapp || "").replace(/\D/g, "");
  const pro = cfg.plans.pro;
  const hasProPrice = Number.isInteger(pro.monthlyPrice) && pro.monthlyPrice > 0;
  const founding = cfg.founding;
  const foundingDeadlineMs = Date.parse(founding.deadline);
  if (Number.isNaN(foundingDeadlineMs)) throw new Error("founding.deadline is not a valid date");
  const hasSignup = Boolean(cfg.signupUrl);

  const ctx = {
    ...cfg,
    base,
    siteUrl,
    year: new Date().getFullYear(),
    exampleUrl: `${cfg.domain}/kueburina`,
    support: {
      ...cfg.support,
      whatsapp: waDigits,
      waLink: waDigits ? `https://wa.me/${waDigits}` : "",
      hasWhatsapp: Boolean(waDigits),
      hasEmail: Boolean(cfg.support.email),
    },
    hasSignup,
    // Every primary CTA ("Ganti link bio kamu") points here.
    ctaHref: hasSignup ? cfg.signupUrl : `${base}#daftar`,
    operatorName: cfg.legal.operator || `tim ${cfg.brand}`,
    legalUpdatedText: dateLong(cfg.legal.lastUpdated),
    pro: {
      ...pro,
      hasPrice: hasProPrice,
      priceText: hasProPrice ? rupiah(pro.monthlyPrice) : "",
      annualPriceText: hasProPrice ? rupiah(pro.monthlyPrice * pro.annualMonthsPaid) : "",
      annualMonthsSaved: 12 - pro.annualMonthsPaid,
    },
    free: cfg.plans.free,
    founding: {
      ...founding,
      enabled: Boolean(founding.enabled),
      priceText: rupiah(founding.price),
      deadlineMs: foundingDeadlineMs,
      deadlineText: dateLong(founding.deadline),
      deadlineShort: dateShort(founding.deadline),
      refundText: dateLong(founding.refundIfNoLaunchBy),
      // Open at build time? The page re-checks in the browser, so a build made
      // before the deadline still closes the offer on time.
      openAtBuild: Boolean(founding.enabled) && Date.now() < foundingDeadlineMs,
    },
    dates: {
      ...cfg.dates,
      betaOpensText: dateLong(cfg.dates.betaOpens),
      betaOpensShort: dateShort(cfg.dates.betaOpens),
    },
    analytics: { ...cfg.analytics, enabled: Boolean(cfg.analytics.posthogKey) },
  };

  // Values main.js needs at runtime. Emitted as inline JSON on every page.
  ctx.runtimeJson = JSON.stringify({
    brand: cfg.brand,
    domain: cfg.domain,
    waNumber: waDigits,
    signupUrl: cfg.signupUrl,
    founding: { enabled: ctx.founding.enabled, deadline: founding.deadline },
    posthog: ctx.analytics.enabled ? { key: cfg.analytics.posthogKey, host: cfg.analytics.posthogHost } : null,
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
      if (kw !== "if" && kw !== "unless") throw new Error(`${name}: unknown block {{#${kw}}}`);
      const node = { t: "if", neg: kw === "unless", path, yes: [], no: [] };
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
      const truthy = Boolean(lookup(ctx, n.path, name));
      out += renderNodes(truthy !== n.neg ? n.yes : n.no, ctx, partials, name);
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

  const pagesDir = join(SRC, "pages");
  const sitemap = [];
  for (const file of (await readdir(pagesDir)).sort()) {
    if (!file.endsWith(".html")) continue;
    const { meta, body } = splitFrontMatter(await readFile(join(pagesDir, file), "utf8"), file);
    // index.html -> /, 404.html -> /404.html, pricing.html -> /pricing/
    const slug = file.slice(0, -5);
    const outRel = slug === "index" ? "index.html" : slug === "404" ? "404.html" : `${slug}/index.html`;
    const urlPath = slug === "index" ? "" : slug === "404" ? "404.html" : `${slug}/`;
    const page = {
      ...meta,
      slug,
      url: `${ctx.siteUrl}${ctx.base}${urlPath}`,
      isHome: slug === "index",
      isPricing: slug === "pricing",
      isHelp: slug === "help",
      noindex: Boolean(meta.noindex),
    };
    const pageCtx = { ...ctx, page };
    pageCtx.page.title = render(meta.title, pageCtx, partials, `${file} title`);
    pageCtx.page.description = render(meta.description, pageCtx, partials, `${file} description`);
    pageCtx.body = render(body, pageCtx, partials, file);
    const html = render(layout, pageCtx, partials, "layout.html");
    const dest = join(OUT, outRel);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, html);
    if (!page.noindex) sitemap.push(page.url);
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

  console.log(`Built ${sitemap.length + 1} pages into ${relative(ROOT, OUT)}/ in ${Date.now() - t0} ms`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  build().catch((e) => { console.error(e.message || e); process.exit(1); });
}
