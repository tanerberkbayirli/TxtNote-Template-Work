// Read-only inspection of the real editor's equation layout after pagination.
// Usage: node attempt-4-dom.mjs <fixture.json> <out.json>
import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const [fixture, output] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: process.env.THESIS_BROWSER_EXECUTABLE,
  args: ["--enable-blink-features=MulticolColumnWrapping", "--font-render-hinting=none"] });
try {
  const context = await browser.newContext({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1 });
  await context.grantPermissions(["local-fonts"], { origin: "http://127.0.0.1:5175" });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5175/tests/thesis.html");
  await page.evaluate(([key, value]) => { localStorage.clear(); localStorage.setItem(key, value); },
    ["txtnote-thesis-regression", await readFile(fixture, "utf8")]);
  await page.reload();
  await page.locator(".thesis-sheet").first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  for (let i = 0, prev = "", same = 0; i < 200 && same < 3; i += 1) {
    await page.waitForTimeout(150);
    const now = await page.evaluate(() => JSON.stringify({
      sheets: [...document.querySelectorAll(".thesis-sheet")].map(s => s.dataset.thesisPageLabel),
      eq: [...document.querySelectorAll(".math-formula--block")].map(e => [e.dataset.thesisEqPadBefore, e.dataset.thesisEqPadAfter]),
    }));
    same = now === prev ? same + 1 : 0;
    prev = now;
  }
  const details = await page.evaluate(() => [...document.querySelectorAll(".math-formula--block")].map(e => {
    const r = e.getBoundingClientRect(), style = getComputedStyle(e), parent = getComputedStyle(e.parentElement);
    const next = e.nextElementSibling, previous = e.previousElementSibling;
    const shape = n => n && ({ tag: n.tagName, text: n.textContent?.slice(0, 80), top: n.getBoundingClientRect().top,
      bottom: n.getBoundingClientRect().bottom, marginTop: getComputedStyle(n).marginTop,
      marginBottom: getComputedStyle(n).marginBottom });
    return { text: e.textContent?.slice(0, 80), dataset: { ...e.dataset },
      top: r.top, bottom: r.bottom, marginTop: style.marginTop, marginBottom: style.marginBottom,
      lineHeight: style.lineHeight, parentLineHeight: parent.lineHeight, previous: shape(previous), next: shape(next) };
  }));
  await writeFile(output, JSON.stringify(details, null, 2));
  console.log(output, details.length, "equations");
} finally { await browser.close(); }
