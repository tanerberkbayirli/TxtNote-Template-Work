// Real TxtNote export harness.
//
// Loads the thesis editor fixture (TxtNote/frontend/tests/thesis.html → the real
// ThesisEditor component) with a deterministic document seeded into its storage,
// waits until the editor's own pagination / index / footnote loop is stable, then
// presses the editor's own "PDF" and "Word" buttons and saves the downloads.
// Nothing here builds a PDF itself: the files are exactly what a user gets.
//
// Usage: node orchestration/tools/export.mjs <fixture.json> <outPrefix> [baseUrl]
//   fixture.json = { title, content, researchData: { thesis: {...} } }
//   writes <outPrefix>.pdf, <outPrefix>.docx, <outPrefix>.layout.json
//
// Requires: vite dev server of TxtNote/frontend (default http://127.0.0.1:5175),
// Chromium with CSS multicol column-wrap (Blink feature MulticolColumnWrapping) and
// the local-fonts permission, so the browser export embeds the installed system fonts.
import { createRequire } from "node:module";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "/opt/node22/lib/node_modules/playwright");

const [fixturePath, outPrefixArg, baseUrl = "http://127.0.0.1:5175"] = process.argv.slice(2);
if (!fixturePath || !outPrefixArg) { console.error("usage: export.mjs <fixture.json> <outPrefix> [baseUrl]"); process.exit(2); }
const outPrefix = resolve(outPrefixArg);
await mkdir(dirname(outPrefix), { recursive: true });
const doc = JSON.parse(await readFile(fixturePath, "utf8"));
const KEY = "txtnote-thesis-regression";
// Another fixture page (e.g. /tests/thesis-batchb.html, which seeds a custom template) may be named here.
const fixturePage = process.env.THESIS_FIXTURE_PAGE || "/tests/thesis.html";

const browser = await chromium.launch({
  ...(process.env.THESIS_BROWSER_EXECUTABLE ? { executablePath: process.env.THESIS_BROWSER_EXECUTABLE } : {}),
  args: ["--enable-blink-features=MulticolColumnWrapping", "--font-render-hinting=none"],
});
const context = await browser.newContext({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1, acceptDownloads: true });
await context.grantPermissions(["local-fonts"], { origin: new URL(baseUrl).origin });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (e) => { if (e.type() === "error" || /content security policy|refused to|uncaught/i.test(e.text())) errors.push(`console: ${e.text()}`); });

const frames = (n = 3) => page.evaluate((n) => new Promise((r) => { const step = (i) => (i ? requestAnimationFrame(() => step(i - 1)) : r()); step(n); }), n);
/** Stable when sheet labels, index rows and footnote areas stop changing. */
const snapshot = () => page.evaluate(() => JSON.stringify({
  sheets: [...document.querySelectorAll(".thesis-sheet")].map((s) => s.dataset.thesisPageLabel || ""),
  index: [...document.querySelectorAll("[data-thesis-generated] li")].map((li) => li.textContent),
  notes: [...document.querySelectorAll(".thesis-footnote-area:not([data-thesis-footnote-measure])")].map((a) => a.getBoundingClientRect().top + ":" + a.textContent.length),
  warn: document.body.innerText.includes("kararlı hale gelmedi"),
}));
async function settle() {
  let last = "", same = 0;
  for (let i = 0; i < 200 && same < 3; i += 1) {
    await frames(3);
    await page.waitForTimeout(150);
    const now = await snapshot();
    same = now === last ? same + 1 : 0;
    last = now;
  }
  return JSON.parse(last);
}

try {
  await page.goto(`${baseUrl}${fixturePage}`);
  await page.evaluate(([key, value]) => { localStorage.clear(); localStorage.setItem(key, value); }, [KEY, JSON.stringify(doc)]);
  await page.reload();
  await page.locator(".thesis-sheet").first().waitFor({ timeout: 60000 });
  const zoom = page.getByLabel("Yakınlaştır", { exact: true });
  if (await zoom.count()) await zoom.selectOption("100");
  await page.evaluate(() => document.fonts.ready);
  const state = await settle();
  if (state.warn) errors.push("editor: Dizin/dipnot sayfalaması kararlı hale gelmedi");
  const layout = await page.evaluate(() => ({
    pagedLayout: Boolean(document.querySelector('.thesis-paper[data-thesis-layout="paged"]')),
    templateNotice: document.body.innerText.match(/Şablon yüklenemedi[^\n]*|kayıtlı tez şablonu bulunamadı[^\n]*/)?.[0] || "",
    sheets: [...document.querySelectorAll(".thesis-sheet")].map((s) => ({ label: s.dataset.thesisPageLabel || "", group: s.dataset.thesisPageGroup || s.dataset.thesisGroup || "" })),
    validation: [...document.querySelectorAll("[data-thesis-validation], .thesis-validation")].map((n) => n.textContent),
  }));
  for (const [button, extension] of [["PDF", "pdf"], ["Word", "docx"]]) {
    const event = page.waitForEvent("download", { timeout: 240000 });
    const bodyBefore = await page.evaluate(() => document.body.innerText);
    await page.getByRole("button", { name: button, exact: true }).click();
    // The editor reports a failed export as a message instead of a download.
    const failure = page.waitForFunction((before) => {
      const busy = [...document.querySelectorAll("button")].some((b) => b.textContent === "Hazırlanıyor…");
      return !busy && document.body.innerText !== before && !/indirildi|Kaydedildi/.test(document.body.innerText) ? document.body.innerText.split("\n").find((line) => !before.includes(line)) || "export failed" : false;
    }, bodyBefore, { timeout: 240000, polling: 500 }).then((handle) => handle.jsonValue());
    const outcome = await Promise.race([event.then((download) => ({ download })), failure.then((message) => ({ message }))]);
    if (!outcome.download) throw new Error(`${button} export failed in the editor: ${outcome.message}`);
    await outcome.download.saveAs(`${outPrefix}.${extension}`);
  }
  await writeFile(`${outPrefix}.layout.json`, JSON.stringify({ fixture: fixturePath, exportedAt: new Date().toISOString(), chromium: browser.version(), ...layout, errors }, null, 2));
  if (!layout.pagedLayout) throw new Error("paged layout not active: PDF would come from the fallback writer");
  if (layout.templateNotice) throw new Error(`template fallback: ${layout.templateNotice}`);
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(`exported ${outPrefix}.{pdf,docx} (${layout.sheets.length} sheets)`);
} catch (error) {
  await page.screenshot({ path: `${outPrefix}.failure.png`, fullPage: false }).catch(() => {});
  console.error(error?.stack || error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
