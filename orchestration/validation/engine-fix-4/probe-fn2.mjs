import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const { chromium } = require((process.env.PLAYWRIGHT_MODULE||"C:/Users/CASPER/Desktop/TxtNote-Template-Work/orchestration/tools/node_modules/playwright"));
const [fx] = process.argv.slice(2);
const doc = JSON.parse(await readFile(fx, "utf8"));
const browser = await chromium.launch({ executablePath: (process.env.THESIS_BROWSER_EXECUTABLE||"C:/Program Files/Google/Chrome/Application/chrome.exe"), args: ["--enable-blink-features=MulticolColumnWrapping", "--font-render-hinting=none"] });
const context = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
await context.grantPermissions(["local-fonts"], { origin: "http://127.0.0.1:5175" });
const page = await context.newPage();
await page.goto("http://127.0.0.1:5175/tests/thesis.html");
await page.evaluate(([k, v]) => { localStorage.clear(); localStorage.setItem(k, v); }, ["txtnote-thesis-regression", JSON.stringify(doc)]);
await page.reload();
await page.locator(".thesis-sheet").first().waitFor({ timeout: 60000 });
await page.waitForFunction(() => document.querySelector('[aria-label="Belge sayfaları"]')?.getAttribute("data-thesis-pagination-ready") === "true", undefined, { timeout: 120000 });
const out = await page.evaluate(() => {
  const li = document.querySelector(".thesis-footnote-area:not([data-thesis-footnote-measure]) .thesis-footnote");
  const pitch = () => { const r = document.createRange(); r.selectNodeContents(li); const tops = [...new Set([...r.getClientRects()].map((x) => Math.round(x.top * 10) / 10))]; return tops.map((t, i) => i ? Math.round((t - tops[i - 1]) * 100) / 100 : 0); };
  const res = { base: pitch(), css: li.style.cssText, cls: li.className, cs: { disp: getComputedStyle(li).display, pos: getComputedStyle(li).position, lh: getComputedStyle(li).lineHeight, va: getComputedStyle(li).verticalAlign } };
  for (const v of ["10px","18.4px","30px","normal"]) { li.style.lineHeight = v; res["lh_"+v] = pitch(); } li.style.lineHeight = "";
  for (const v of ["12px","16px","20px"]) { li.style.fontSize = v; res["fs_"+v] = pitch(); } li.style.fontSize = "";
  const area = li.closest(".thesis-footnote-area"); res.areaLh = getComputedStyle(area).lineHeight; res.areaFs = getComputedStyle(area).fontSize;
  res.rules = [];
  for (const sh of document.styleSheets) { try { for (const r of sh.cssRules) if (r.cssText.includes("thesis-footnote") && !r.cssText.includes("[data-thesis-footnote-group=")) res.rules.push(r.cssText.slice(0,300)); else if (r.cssText.includes("thesis-footnote-area") ) res.rules.push(r.cssText.slice(0,500)); } catch(e){} }
  return res; });
console.log(JSON.stringify(out, null, 1));
await browser.close();
