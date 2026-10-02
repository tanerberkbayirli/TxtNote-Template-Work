// DOM geometry of figure/table/caption/body gaps in the real editor (the source of the exported PDF layout).
import { createRequire } from "node:module"; import { readFile } from "node:fs/promises";
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE);
const doc = JSON.parse(await readFile(process.argv[2], "utf8"));
const browser = await chromium.launch({ executablePath: process.env.THESIS_BROWSER_EXECUTABLE, args: ["--enable-blink-features=MulticolColumnWrapping", "--font-render-hinting=none"] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
await ctx.grantPermissions(["local-fonts"], { origin: "http://127.0.0.1:5175" });
const page = await ctx.newPage();
await page.goto("http://127.0.0.1:5175/tests/thesis.html");
await page.evaluate(([k, v]) => { localStorage.clear(); localStorage.setItem(k, v); }, ["txtnote-thesis-regression", JSON.stringify(doc)]);
await page.reload();
await page.locator(".thesis-sheet").first().waitFor({ timeout: 60000 });
await page.waitForFunction(() => ["true","fallback"].includes(document.querySelector('[aria-label="Belge sayfaları"]')?.getAttribute("data-thesis-pagination-ready")), undefined, { timeout: 120000 });
const out = await page.evaluate(() => {
  const f=document.querySelector('figure.academic-figure[data-kind]:not([data-thesis-generated] *)'); const dbg=[...document.querySelectorAll('.thesis-body figure img')].map(i=>{const cs=getComputedStyle(i),fr=i.parentElement.getBoundingClientRect(),ir=i.getBoundingClientRect();return {disp:cs.display,va:cs.verticalAlign,mb:cs.marginBottom,figTop:fr.top,figBottom:fr.bottom,imgTop:ir.top,imgBottom:ir.bottom,figLH:getComputedStyle(i.parentElement).lineHeight,figPad:getComputedStyle(i.parentElement).paddingBottom,figMargin:getComputedStyle(i.parentElement).margin,html:i.parentElement.outerHTML.slice(0,40)+i.parentElement.outerHTML.slice(-120)}}); window.__dbg=dbg;
  const PT = 96 / 72, r = (e) => { const b = e.getBoundingClientRect(); return { top: b.top, bottom: b.bottom }; };
  const res = [];
  for (const cap of document.querySelectorAll("figcaption, .thesis-caption, [data-thesis-caption]")) {
    const text = cap.textContent.slice(0, 20);
    if (cap.closest("[data-thesis-generated]")) continue;
    const prev = cap.previousElementSibling, next = cap.nextElementSibling ?? cap.parentElement?.nextElementSibling;
    res.push({ tag: cap.tagName, cls: cap.className, text, parent: cap.parentElement?.tagName + "." + cap.parentElement?.className, cap: r(cap), prev: prev && { tag: prev.tagName, cls: prev.className, ...r(prev) }, next: next && { tag: next.tagName, cls: next.className, ...r(next), text: next.textContent.slice(0, 20) }, cs: { mt: getComputedStyle(cap).marginTop, mb: getComputedStyle(cap).marginBottom, lh: getComputedStyle(cap).lineHeight } });
  }
  return {dbg:window.__dbg,res};
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
