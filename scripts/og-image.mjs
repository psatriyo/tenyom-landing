#!/usr/bin/env node
// Renders assets/img/og-image.png (1200×630) from src/og.html and site.config.mjs.
// Run it again whenever the brand name, domain or tagline changes.
// Needs Playwright with Chromium: `npm i -D playwright && npx playwright install chromium`.

import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadContext, render } from "./build.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  console.error("Playwright is not installed. Run: npm i -D playwright && npx playwright install chromium");
  process.exit(1);
}

const ctx = await loadContext();
ctx.fontUrl = "data:font/woff2;base64," + (await readFile(join(ROOT, "assets/fonts/plus-jakarta-sans-latin-wght.woff2"))).toString("base64");
const html = render(await readFile(join(ROOT, "src/og.html"), "utf8"), ctx, {}, "og.html");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
const out = join(ROOT, "assets/img/og-image.png");
await page.screenshot({ path: out, type: "png" });
await browser.close();
console.log(`Wrote ${out}`);
