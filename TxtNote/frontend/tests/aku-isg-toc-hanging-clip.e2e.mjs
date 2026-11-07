import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = path.resolve(import.meta.dirname, "../../..");
const fixture = JSON.parse(await readFile(path.join(root, "engine/specs/aku-isg-tezsiz-proje.fixture.json"), "utf8"));
const base = process.argv[2] || "http://127.0.0.1:5175";
const browser = await chromium.launch({
  ...(process.env.THESIS_BROWSER_EXECUTABLE ? { executablePath: process.env.THESIS_BROWSER_EXECUTABLE } : { channel: "msedge" }),
  args: ["--enable-blink-features=MulticolColumnWrapping", "--font-render-hinting=none"],
});

try {
  const context = await browser.newContext({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1 });
  await context.grantPermissions(["local-fonts"], { origin: base });
  await context.addInitScript(([key, value, origin]) => {
    if (location.origin === origin) { localStorage.clear(); localStorage.setItem(key, value); }
  }, ["txtnote-thesis-regression", JSON.stringify(fixture), base]);
  const page = await context.newPage();
  await page.goto(`${base}/tests/thesis.html`);
  await page.waitForFunction(() => document.querySelector('[aria-label="Belge sayfaları"]')?.getAttribute("data-thesis-pagination-ready") === "true", null, { timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);

  const measurements = await page.evaluate(() => {
    const rows = [...document.querySelectorAll(".thesis-toc li")];
    const rowFor = (prefix) => rows.find((row) => row.querySelector(".thesis-index-title")?.textContent.includes(prefix));
    const measure = (row) => {
      const title = row.querySelector(".thesis-index-title");
      const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
      let textNode = walker.nextNode();
      while (textNode && (!textNode.textContent.trim() || textNode.parentElement.closest(".thesis-index-label,.thesis-index-leader,.thesis-index-page"))) textNode = walker.nextNode();
      if (!textNode) return null;
      const firstCharacter = textNode.textContent.search(/\S/);
      const range = document.createRange(); range.setStart(textNode, firstCharacter); range.setEnd(textNode, firstCharacter + 1);
      const firstGlyph = range.getBoundingClientRect(), titleBox = title.getBoundingClientRect();
      const page = title.querySelector(".thesis-index-page");
      const pageRange = document.createRange(); pageRange.selectNodeContents(page);
      const pageGlyph = pageRange.getBoundingClientRect();
      const labelNode = row.querySelector(".thesis-index-label")?.firstChild;
      let labelGlyph = null;
      if (labelNode) { const labelRange = document.createRange(); labelRange.selectNodeContents(labelNode); labelGlyph = labelRange.getBoundingClientRect(); }
      const paper = row.closest(".thesis-paper").getBoundingClientRect();
      return {
        title: textNode.textContent,
        firstGlyphLeft: firstGlyph.left,
        titleClipLeft: titleBox.left,
        titleClipRight: titleBox.right,
        labelGlyphRight: labelGlyph?.right ?? null,
        pageGlyphLeft: pageGlyph.left,
        pageGlyphRight: pageGlyph.right,
        overflowX: getComputedStyle(title).overflowX,
        mmPerCssPixel: 210 / paper.width,
      };
    };
    return {
      unlabelled: ["BİLİMSEL", "ÖZET"].map((prefix) => measure(rowFor(prefix))),
      numbered: measure(rowFor("GİRİŞ")),
      tocSheet: [...document.querySelectorAll(".thesis-sheet")].findIndex((sheet) => sheet.dataset.thesisPageLabel === "vi"),
    };
  });

  for (const row of measurements.unlabelled) {
    assert.ok(row, "expected the unnumbered TOC row");
    assert.ok(row.firstGlyphLeft >= row.titleClipLeft - 0.5, `${row.title}: first glyph is outside the title clip`);
    assert.equal(row.overflowX, "hidden", `${row.title}: leader and page remain clipped at the title's right edge`);
    assert.ok(row.pageGlyphRight <= row.titleClipRight + 0.5, `${row.title}: page label exceeds the title clip`);
  }
  const numbered = measurements.numbered;
  assert.ok(numbered, "expected numbered GİRİŞ row");
  assert.ok(numbered.firstGlyphLeft >= numbered.titleClipLeft - 0.5, "numbered title's first glyph is outside its overflow clip");
  const gapMm = (numbered.firstGlyphLeft - numbered.labelGlyphRight) * numbered.mmPerCssPixel;
  assert.ok(Math.abs(gapMm - 1.058) <= 0.25, `label/title gap should match the 3 pt source gap (1.058 mm), got ${gapMm.toFixed(2)} mm`);
  assert.ok(numbered.pageGlyphRight <= numbered.titleClipRight + 0.5, "numbered row page label exceeds the title clip");

  if (process.env.THESIS_TOC_SCREENSHOT) {
    await page.locator(".thesis-sheet").nth(measurements.tocSheet).screenshot({ path: process.env.THESIS_TOC_SCREENSHOT });
  }
  console.log(JSON.stringify({ ...measurements, labelTitleGapMm: +gapMm.toFixed(2) }, null, 2));
  await context.close();
} finally {
  await browser.close();
}
