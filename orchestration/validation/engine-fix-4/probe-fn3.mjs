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
const zoom = page.getByLabel("Yakınlaştır", { exact: true }); if (await zoom.count()) await zoom.selectOption("100");
await page.waitForTimeout(5000);
const out = await page.evaluate(() => {
  const lis=[...document.querySelectorAll(".thesis-footnote-area:not([data-thesis-footnote-measure]) .thesis-footnote")]; const li = lis.find(x=>getComputedStyle(x).fontSize==="16px")||lis[0]; const info=lis.map(x=>[x.closest(".thesis-footnote-area").dataset.thesisFootnoteGroup,getComputedStyle(x).fontSize]);
  const stack = li.closest(".thesis-page-stack"); const z = new DOMMatrixReadOnly(getComputedStyle(stack).transform).a;
  const res = []; const rg = document.createRange();
  const walk = document.createTreeWalker(li, NodeFilter.SHOW_TEXT);
  for (let n; (n = walk.nextNode());) {
    for (const m of n.data.matchAll(/\S+/g)) { rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length); const r = [...rg.getClientRects()]; const st=getComputedStyle(n.parentElement); const c=document.createElement('canvas').getContext('2d'); c.font=`${st.fontStyle} ${st.fontWeight} ${st.fontSize} ${st.fontFamily}`; const asc=c.measureText('Hg').fontBoundingBoxAscent; res.push([m[0].slice(0, 8), st.fontSize, Math.round((r[0].top / z+asc) * 100) / 100, asc]); }
  }
  const sheets=[...document.querySelectorAll('.thesis-sheet')].map(e=>{const b=e.getBoundingClientRect();return [e.dataset.thesisPageLabel, b.top/z]}); const stackTop=stack.getBoundingClientRect().top/z; return { stackTop, sheets: sheets.map(x=>[x[0], x[1]-stackTop]).slice(10,16), res: res.filter((x,i)=>i<2||i==10||i==20) }; });
console.log(JSON.stringify(out, null, 1));
await browser.close();
