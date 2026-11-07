import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "../../../engine/tools/node_modules/playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const base = process.argv[2] || "http://127.0.0.1:5184";
const page = await browser.newPage({ viewport: { width: 1450, height: 1000 } });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const size = page.getByLabel("Yazı boyutu (pt)", { exact: true });
async function caret(locator) {
  await locator.scrollIntoViewIfNeeded();
  await locator.evaluate(node => {
    node.closest('[contenteditable="true"]')?.focus({ preventScroll: true });
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    const text = walker.nextNode() || node;
    const range = document.createRange(); range.setStart(text, 0); range.collapse(true);
    getSelection().removeAllRanges(); getSelection().addRange(range);
  });
  await settle();
}
async function matches(locator, label) {
  const actual = await locator.evaluate(node => {
    const style = getComputedStyle(node);
    return { pt: parseFloat(style.fontSize) * .75, bold: parseInt(style.fontWeight) >= 600, italic: /italic|oblique/.test(style.fontStyle), align: style.textAlign };
  });
  assert.ok(Math.abs(Number(await size.inputValue()) - actual.pt) < .01, `${label}: ribbon ${await size.inputValue()} vs rendered ${actual.pt}pt`);
  for (const [key, name] of [["bold", "Kalın"], ["italic", "İtalik"]]) assert.equal(await page.getByRole("button", { name, exact: true }).getAttribute("aria-pressed"), String(actual[key]), `${label}: ${key}`);
  const alignName = { left: "Sola hizala", center: "Ortala", right: "Sağa hizala", justify: "İki yana yasla" }[actual.align];
  if (alignName) assert.equal(await page.getByRole("button", { name: alignName, exact: true }).getAttribute("aria-pressed"), "true", `${label}: alignment`);
}
try {
  await page.goto(`${base}/tests/thesis.html`);
  await page.evaluate(() => {
    localStorage.removeItem("txtnote-thesis-regression");
  });
  await page.reload();
  const doc = await page.evaluate(() => window.thesisTest.getDoc());
  // Keep the fixture's template but supply explicit semantic and inline samples.
  await page.evaluate(doc => {
    const value = doc || { title: "Metrics", researchData: { thesis: { templateId: "fixture-university-a-master-tr-v1", templateVersion: "1.0.0", values: {}, sectionContent: {}, enabledSections: [] } } };
    value.content = '<h1>Metric heading</h1><p>Metric body</p><p><strong><em><u>Semantic marks</u></em></strong></p><p><span class="fmt-pt-12">Twelve</span> <span class="fmt-pt-18">Eighteen</span></p>';
    localStorage.setItem("txtnote-thesis-regression", JSON.stringify(value));
  }, doc);
  await page.reload();
  const body = page.locator('[data-thesis-flow-section="main"] .rich-text-body').first();
  await body.waitFor();
  const heading = body.locator("h1").first(), paragraph = body.locator("p").first();
  for (const zoom of ["100", "75", "125"]) {
    await page.getByLabel("Yakınlaştır", { exact: true }).selectOption(zoom);
    for (const [locator, label] of [[heading, "heading"], [paragraph, "body"], [body.locator("u").first(), "semantic marks"], [body.locator(".fmt-pt-12"), "explicit 12pt"]]) {
      await caret(locator); await matches(locator, `${label} at ${zoom}%`);
    }
  }
  console.log("PASS displayed point size, bold, italic and alignment match rendered text at three zooms");
  await caret(body.locator("u").first());
  assert.equal(await page.getByRole("button", { name: "Altı çizili", exact: true }).getAttribute("aria-pressed"), "true");
  // Mixed sizes must leave the point box empty instead of claiming the first size.
  await body.locator("p").last().evaluate(node => {
    const range = document.createRange(); range.selectNodeContents(node);
    getSelection().removeAllRanges(); getSelection().addRange(range);
  });
  await settle();
  assert.equal(await size.inputValue(), "");
  assert.equal(await size.getAttribute("placeholder"), "Karışık");
  console.log("PASS semantic underline and mixed-size selection are reported accurately");
  // Style changes while the caret stays in place must refresh the toolbar.
  await caret(paragraph);
  await page.getByRole("listbox", { name: "Stil galerisi" }).getByRole("option", { name: "Başlık 1", exact: true }).click();
  await settle();
  await matches(body.locator("h1").filter({ hasText: "Metric body" }), "style change without moving caret");
  // Template-owned objects have a separate selection path.
  const cover = page.locator('[data-layout-id="cover:block:1"]').first();
  await cover.scrollIntoViewIfNeeded(); await cover.click(); await settle();
  await matches(cover, "cover selection");
  await size.fill("13.5"); await size.press("Enter"); await settle();
  await matches(cover, "cover size edit");
  assert.ok(Math.abs(await cover.evaluate(node => parseFloat(getComputedStyle(node).fontSize) * .75) - 13.5) < .01, "size change alters the rendered font");
  const heights = [];
  for (const pt of [12, 14]) {
    await size.fill(String(pt)); await size.press("Enter"); await settle();
    await matches(cover, `${pt}pt cover`);
    heights.push(await cover.evaluate(node => {
      const range = document.createRange(); range.selectNodeContents(node);
      return range.getBoundingClientRect().height;
    }));
  }
  assert.ok(heights[1] > heights[0], "14pt glyphs really render larger than 12pt glyphs at the same zoom");
  console.log("PASS heading changes and cover edits show the actual resulting typography");
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
