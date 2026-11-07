import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "../../../engine/tools/node_modules/playwright");
const base = process.argv[2] || "http://127.0.0.1:5184";
const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--enable-blink-features=MulticolColumnWrapping"] });
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 950 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/tests/thesis.html`);
  const source = { id: "src_test", kind: "book", authors: "Yılmaz, Ayşe", year: "2024", title: "Deneme" };
  const intro = '<p>Birinci cümle burada yer alır. İkinci cümle de buradadır.</p><p>Yeni paragrafın ilk cümlesi. Son cümle.</p>';
  await page.evaluate(({ source, intro }) => localStorage.setItem("txtnote-thesis-regression", JSON.stringify({
    title: "Citation caret", content: "", researchData: { thesis: { templateId: "mcbu-lee-master-tr-v1", templateVersion: "1.0.0", values: { YEAR: "2026" }, sources: [source], sectionContent: { introduction: intro }, enabledSections: [] } },
  })), { source, intro });
  await page.reload();
  const body = page.locator('[data-thesis-flow-section="introduction"] [role="textbox"]').first();
  await body.waitFor();
  const paragraph = (start) => body.locator("p").filter({ hasText: start }).first();
  // Caret inside a word of `start`'s paragraph, the way a click puts it.
  const caretIn = (start, word) => paragraph(start).evaluate((node, word) => {
    node.closest('[role="textbox"]').focus();
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    let text; while ((text = walker.nextNode()) && !text.data.includes(word));
    const range = document.createRange(); range.setStart(text, text.data.indexOf(word) + 1); range.collapse(true);
    getSelection().removeAllRanges(); getSelection().addRange(range);
    document.dispatchEvent(new Event("selectionchange"));
  }, word);
  // Viewport x of the point just before the sentence's full stop that follows `word`.
  const stopX = (start, word) => paragraph(start).evaluate((node, word) => {
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    let text; while ((text = walker.nextNode()) && !text.data.includes(word));
    const stop = text.data.indexOf(".", text.data.indexOf(word));
    const range = document.createRange(); range.setStart(text, stop); range.setEnd(text, stop + 1);
    return range.getBoundingClientRect().left;
  }, word);
  const marker = page.getByTestId("citation-caret");
  const markerBox = async () => { await page.waitForTimeout(400); return marker.boundingBox(); };

  await caretIn("Yeni paragrafın", "ilk");
  const panel = page.getByRole("complementary", { name: "Yan paneller", exact: true });
  await page.getByRole("button", { name: "Paneller", exact: true }).click();
  await page.getByRole("button", { name: "Paneli kapat", exact: true }).waitFor();
  await panel.evaluate((node) => node.getAnimations().forEach((animation) => animation.finish()));
  await panel.getByRole("navigation", { name: "Panel seç" }).getByRole("button", { name: "Kaynaklar", exact: true }).click();
  await panel.getByRole("button", { name: "Atıf yap" }).click();
  let box = await markerBox();
  assert.ok(box, "marker visible while the cite form is open");
  assert.ok(Math.abs(box.x + box.width / 2 - await stopX("Yeni paragrafın", "ilk")) < 3, "marker sits just before the full stop of the caret's sentence");
  assert.ok(box.width >= 2.5 && box.height > 10, "marker is a thick line");
  console.log("PASS citation caret: shown at the insertion point");

  // Focus leaves for the locator field, then a click in another sentence moves the marker there.
  await panel.getByLabel("Atıf sayfası").fill("45");
  await caretIn("Birinci cümle", "burada");
  box = await markerBox();
  assert.ok(Math.abs(box.x + box.width / 2 - await stopX("Birinci cümle", "burada")) < 3, "marker follows a new caret");
  console.log("PASS citation caret: follows the caret after the panel had focus");

  await panel.getByRole("button", { name: "Atfı ekle" }).click();
  assert.equal(await paragraph("Birinci cümle").textContent(), "Birinci cümle burada yer alır (Yılmaz, 2024, s. 45). İkinci cümle de buradadır.");
  assert.equal(await marker.count(), 0, "marker leaves with the cite form");
  console.log("PASS citation caret: citation inserted where the marker was");

  // Reopen: stored HTML has no space before a citation; the label must still get one.
  await page.reload(); await body.waitFor(); await page.waitForTimeout(500);
  assert.equal(await paragraph("Birinci cümle").textContent(), "Birinci cümle burada yer alır (Yılmaz, 2024, s. 45). İkinci cümle de buradadır.");
  const stored = await page.evaluate(() => window.thesisTest.getDoc().researchData.thesis.sectionContent.introduction);
  assert.match(stored, /alır<span class="thesis-cite"/, "stored form unchanged (no space before the citation)");
  console.log("PASS citation label spacing after reopen");
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
