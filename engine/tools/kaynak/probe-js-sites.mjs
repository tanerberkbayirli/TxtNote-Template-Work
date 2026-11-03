#!/usr/bin/env node
// Render university sites in a real browser and collect thesis-guide/template links.
//
// The plain crawler cannot see menus that JavaScript builds. This probe opens the
// university start page and likely institute hosts in headless Chromium, waits for
// the page to settle, follows links whose text mentions an institute / lisansüstü /
// tez (one level deep), and records every pdf/doc/docx/zip link whose text or URL
// mentions thesis writing. It writes candidates in the manual-thesis-sources.json
// shape (sources[]) so fetch-manual-sources.py can download them.
//
// Usage: node scripts/probe-js-sites.mjs --only id1,id2 [--out output/js-probe-sources.json]
//        PLAYWRIGHT_MODULE=/path/to/node_modules/playwright (default: MCBUTEK copy)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(here, "turkey-universities.json");
const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const only = (opt("--only", "") || "").split(",").map((s) => s.trim()).filter(Boolean);
const outPath = path.resolve(opt("--out", path.join(here, "..", "..", "output", "js-probe-sources.json")));
const playwrightModule = process.env.PLAYWRIGHT_MODULE
  || path.join(process.env.HOME, "Desktop/04-Projeler/PROJE-VE-MOCKUPLAR/MCBUTEK/node_modules/playwright");
const { chromium } = await import(path.join(playwrightModule, "index.mjs"));

const INSTITUTE_HOSTS = ["lee", "lisansustu", "lisansustuegitim", "enstitu", "fbe", "sbe", "sabe", "ebe", "fenbilimleri", "sosyalbilimler", "saglikbilimleri", "egitimbilimleri", "graduate"];
const FILE_RE = /\.(pdf|docx?|dotx?|odt|zip|rar)(\?|#|$)/i;
const norm = (s) => (s || "").replace(/İ/g, "i").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const thesisTopic = (s) => /(^|[^a-z0-9])(tez|thesis|dissertation)([^a-z0-9]|$)/.test(norm(s)) && !/tezsiz/.test(norm(s));
const guideWord = (s) => /(kilavuz|klavuz|sablon|template|yazim|format|yonerge|guide|kapak|cover)/.test(norm(s));
const excluded = (s) => /(donem projesi|seminer|staj|faaliyet raporu|takvim|oneri|onerisi|proposal|bitirme projesi|ders plan|mufredat)/.test(norm(s));
const instituteLink = (s) => /(enstitu|lisansustu|graduate|tez|thesis|kilavuz|sablon|formlar|belgeler|dokuman|mevzuat)/.test(norm(s));

const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const universities = config.universities.filter((u) => !only.length || only.includes(u.id));
const browser = await chromium.launch();
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36 TxtEngineThesisTemplateInventory/1.0";
const UNIVERSITY_BUDGET_MS = 150000;

const withTimeout = (promise, ms, label) => Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(`timeout ${ms}ms: ${label}`)), ms))]);
const verbose = args.includes("--verbose");

async function collectLinks(page, url) {
  try {
    return await withTimeout(collectLinksInner(page, url), 40000, url);
  } catch (error) {
    return { ok: false, links: [], error: String(error).slice(0, 120) };
  }
}

async function collectLinksInner(page, url) {
  try {
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
    if (!response || response.status() >= 400) return { ok: false, links: [], status: response?.status() };
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    // Open collapsed menus so their links enter the DOM.
    await page.evaluate(() => { for (const el of document.querySelectorAll("[aria-expanded='false'], details:not([open])")) { try { el.click?.(); if (el.tagName === "DETAILS") el.open = true; } catch {} } });
    await page.waitForTimeout(500);
    const links = await page.evaluate(() => Array.from(document.querySelectorAll("a[href]")).map((a) => ({ href: a.href, text: (a.innerText || a.textContent || a.title || "").replace(/\s+/g, " ").trim() })));
    return { ok: true, links, final: page.url(), title: await page.title() };
  } catch (error) {
    return { ok: false, links: [], error: String(error).slice(0, 120) };
  }
}

const sources = [];
const visitedByUniversity = {};
async function probeUniversity(u, context, found, visited) {
  const domain = u.domain.trim();
  const seeds = new Set([u.start_url, ...(u.seed_urls || []), ...INSTITUTE_HOSTS.map((h) => `https://${h}.${domain}/`)]);
  const page = await context.newPage();
  page.on("dialog", (dialog) => dialog.dismiss().catch(() => {}));
  const queue = [...seeds].map((url) => ({ url, depth: 0 }));
  const inDomain = (href) => { try { const h = new URL(href).hostname; return h === domain || h.endsWith("." + domain); } catch { return false; } };
  const started = Date.now();
  while (queue.length && visited.size < 25 && Date.now() - started < 120000) {
    const { url, depth } = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);
    const result = await collectLinks(page, url);
    if (verbose) console.error(`    ${result.ok ? "✓" : "✗"} ${url.slice(0, 90)} ${result.ok ? result.links.length + " bağlantı" : (result.error || result.status || "")}`);
    if (!result.ok) continue;
    for (const { href, text } of result.links) {
      const blob = `${text} ${decodeURIComponent(href)}`;
      if (FILE_RE.test(href) && thesisTopic(blob) && guideWord(blob) && !excluded(blob)) {
        if (!found.has(href)) found.set(href, { university_id: u.id, classification: /(sablon|template|taslak)/.test(norm(blob)) ? "şablon" : "kılavuz", label: text || path.basename(href), url: href, source_page: result.final || url, found: new Date().toISOString().slice(0, 10), via: "js-probe" });
      } else if (depth < 2 && inDomain(href) && !FILE_RE.test(href) && instituteLink(blob) && !visited.has(href)) {
        queue.push({ url: href, depth: depth + 1 });
      }
    }
  }
}

for (const [index, u] of universities.entries()) {
  const found = new Map();
  const visited = new Set();
  const context = await browser.newContext({ ignoreHTTPSErrors: true, userAgent: UA });
  context.setDefaultTimeout(20000);
  let note = "";
  try {
    await withTimeout(probeUniversity(u, context, found, visited), UNIVERSITY_BUDGET_MS, u.id);
  } catch (error) {
    note = ` (${String(error).slice(0, 60)})`;
  }
  await withTimeout(context.close(), 10000, "close").catch(() => {});
  visitedByUniversity[u.id] = { pages: visited.size, found: found.size };
  sources.push(...found.values());
  console.error(`[${index + 1}/${universities.length}] ${u.name}: ${visited.size} sayfa, ${found.size} belge bağlantısı${note}`);
  // Partial results survive an interrupted run.
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({ note: "probe-js-sites.mjs çıktısı (kısmi olabilir)", generated_at: new Date().toISOString(), visited: visitedByUniversity, sources }, null, 2) + "\n");
}
await withTimeout(browser.close(), 10000, "browser").catch(() => process.exit(0));
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify({ note: "probe-js-sites.mjs çıktısı; fetch-manual-sources.py --sources ile indirilebilir", generated_at: new Date().toISOString(), visited: visitedByUniversity, sources }, null, 2) + "\n");
console.error(`${sources.length} bağlantı → ${outPath}`);
