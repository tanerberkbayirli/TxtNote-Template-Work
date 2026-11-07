import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "../../../engine/tools/node_modules/playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1450, height: 1000 } });
const base = process.argv[2] || "http://127.0.0.1:5184";
const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const size = page.getByLabel("Yazı boyutu (pt)", { exact: true });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
try {
  await page.goto(`${base}/tests/thesis.html`);
  await page.evaluate(() => localStorage.setItem("txtnote-thesis-regression", JSON.stringify({
    title: "MCBU live metrics", content: "", researchData: { thesis: { templateId: "mcbu-lee-master-tr-v1", values: { YEAR: "2026" }, enabledSections: [], sectionContent: {} } },
  })));
  await page.reload();
  const tc = page.locator('.thesis-layout-text').filter({ hasText: /^T\.C\.$/ }).first();
  await tc.waitFor();
  await page.getByLabel("Yakınlaştır", { exact: true }).selectOption("150");
  await tc.scrollIntoViewIfNeeded();
  const point = await tc.evaluate(node => { const rect = node.getBoundingClientRect(); return { x: rect.left + 20, y: rect.top - 80 }; });
  await page.mouse.dblclick(point.x, point.y);
  const editing = page.locator('[data-layout-editing="true"]');
  await editing.waitFor();
  await size.fill("12"); await size.press("Enter"); await settle();
  await page.keyboard.type("T.C.");
  await settle();
  const measured = async locator => locator.evaluate(node => {
    const range = document.createRange(); range.selectNodeContents(node);
    return { pt: parseFloat(getComputedStyle(node).fontSize) * .75, height: range.getBoundingClientRect().height };
  });
  assert.equal(await size.inputValue(), "12");
  const frameSize = await measured(editing), templateSize = await measured(tc);
  assert.ok(Math.abs(frameSize.pt - 12) < .001); assert.ok(Math.abs(templateSize.pt - 14) < .001);
  assert.ok(templateSize.height > frameSize.height, `14pt cover text must be larger than 12pt frame: ${JSON.stringify({ frameSize, templateSize })}`);
  console.log("PASS actual MCBU cover: 12pt frame is smaller than 14pt T.C. at 150% zoom");

  // Imported/styled runs may carry their own size. A caret move within an open
  // frame must refresh the ribbon before any blur or document transaction.
  await editing.evaluate(node => {
    node.innerHTML = '<span class="fmt-pt-12">Twelve</span><span class="fmt-pt-14">Fourteen</span>';
    node.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }));
  });
  for (const pt of [14, 12, 14]) {
    await editing.locator(`.fmt-pt-${pt}`).evaluate(node => {
      const range = document.createRange(); range.setStart(node.firstChild, 2); range.collapse(true);
      getSelection().removeAllRanges(); getSelection().addRange(range);
    });
    await settle();
    assert.equal(await size.inputValue(), String(pt), "live caret size must win over frame defaults");
  }
  console.log("PASS caret moves refresh point size inside the same open frame without blur");
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
