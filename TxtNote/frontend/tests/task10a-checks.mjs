import assert from "node:assert/strict";
import { TYPE_DELAY_MS } from "../src/lib/undoHistory.js";

const main = (page) => page.locator('[data-thesis-flow-section="main"] .rich-text-body[contenteditable="true"]');
const frames = (page) => page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const put = async (page, html) => {
  await main(page).evaluate((root, html) => { root.innerHTML = html; root.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" })); }, html);
  await frames(page);
  // The complete app coalesces input bursts in its document undo stack. Finish
  // the fixture burst before testing a separate user edit/undo transaction.
  await page.waitForTimeout(TYPE_DELAY_MS + 100);
};
const caret = (page, selector, end = true) => main(page).evaluate((root, { selector, end }) => {
  root.focus(); const node = selector ? root.querySelector(selector) : root;
  const range = document.createRange(); range.selectNodeContents(node); range.collapse(!end);
  document.getSelection().removeAllRanges(); document.getSelection().addRange(range);
}, { selector, end });
const pages = (page) => page.locator('[data-thesis-generated] li').evaluateAll((rows) => rows.map((row) => [row.dataset.indexTarget, row.querySelector('.thesis-index-page')?.textContent || ""]));

/** Reuses the real editor, persistence and physical flow in Vite AND packaged WebView2. */
export async function task10aChecks(page, pass = console.log) {
  await page.getByLabel("Yakınlaştır", { exact: true }).selectOption("100");
  await put(page, '<p class="fmt-align-right">Birinci</p>'); await caret(page, "p");
  await page.keyboard.press("Enter"); await page.keyboard.insertText("İkinci");
  assert.equal(await main(page).locator("p").count(), 2);
  assert.equal(await main(page).locator("p").last().evaluate((p) => getComputedStyle(p).textAlign), "right");
  await page.keyboard.press("Shift+Enter"); await page.keyboard.insertText("Aynı paragraf");
  assert.equal(await main(page).locator("p").count(), 2);
  assert.match(await main(page).locator("p").last().innerHTML(), /<br|\n/);
  const props = await main(page).locator("p").last().evaluate((p) => { const s = getComputedStyle(p); return { indent: parseFloat(s.textIndent), after: parseFloat(s.marginBottom), before: parseFloat(s.marginTop) }; });
  assert.ok(props.indent > 0 && props.after > 0);
  await page.keyboard.press("Control+z"); await frames(page);
  assert.doesNotMatch(await main(page).innerText(), /Aynı paragraf/);
  await page.keyboard.press("Control+y"); await frames(page);
  assert.match(await main(page).innerText(), /Aynı paragraf/);
  pass("Enter = two real paragraphs; Shift+Enter = in-paragraph break; alignment, indent, spacing and undo/redo");
  await caret(page, "p"); await page.getByLabel("Paragraf biçimi", { exact: true }).selectOption("4");
  assert.equal(await main(page).locator("h4").count(), 1);
  await page.getByLabel("Paragraf biçimi", { exact: true }).selectOption("0");
  assert.equal(await main(page).locator("h4").count(), 0);
  await put(page, '<h1>Başlık devamı</h1>');
  await main(page).evaluate((root) => { root.focus(); const text = root.querySelector("h1").firstChild; document.getSelection().collapse(text, 6); });
  await page.keyboard.press("Enter"); await frames(page);
  assert.equal(await main(page).locator("h1").innerText(), "Başlık");
  assert.equal((await main(page).locator("p").innerText()).trim(), "devamı");
  assert.equal(await main(page).locator("span[style]").count(), 0);
  pass("Enter in the middle of a heading keeps both text halves and continues in a normal paragraph without inline styles");

  await page.getByRole("button", { name: "Tez bilgileri", exact: true }).click();
  for (const label of ["Şekiller listesi", "Tablolar listesi"]) {
    const input = page.getByLabel(label, { exact: true });
    if (!(await input.isChecked())) await input.check();
  }
  await page.getByRole("button", { name: "Tez bilgilerini kapat", exact: true }).click();
  const image = await page.evaluate(() => { const c = document.createElement("canvas"); c.width = c.height = 32; const ctx = c.getContext("2d"); ctx.fillStyle = "#075985"; ctx.fillRect(0, 0, 32, 32); return c.toDataURL("image/png"); });
  await put(page, `<figure class="academic-figure" contenteditable="false"><img src="${image}" width="120" height="120"><figcaption></figcaption></figure>`);
  assert.ok(await main(page).locator("figcaption").evaluate((caption) => caption.getBoundingClientRect().height > 0));
  await caret(page, "figcaption"); await page.keyboard.insertText("Yeni caption");
  await page.waitForFunction(() => document.querySelector('[data-thesis-generated="figures"]')?.textContent.includes("Yeni caption"));
  pass("Empty figure captions have an editable line; typing creates a semantic numbered caption/index row");
  await put(page, `<p data-test-padding="true">Başlangıç.</p><h1>Birinci bölüm</h1><p>Birinci paragraf<br>İç satır</p><h2>Alt bölüm</h2><h3>Alt başlık</h3><h4>Derin başlık</h4><p>İçerik</p><figure class="academic-figure"><img src="${image}" width="120" height="120"><figcaption>Şekil caption metni</figcaption></figure><table><caption>Tablo caption metni</caption><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table><h1>İkinci bölüm</h1><p>Son paragraf<sup class="academic-footnote" data-fn-text="Gerçek Word dipnotu">1</sup></p>`);
  await page.waitForFunction(() => [...document.querySelectorAll('[data-thesis-generated] li .thesis-index-page')].every((p) => p.textContent === "1"));
  assert.equal(await main(page).locator("h4").getAttribute("data-thesis-number"), "1.1.1.1");
  assert.equal(await page.locator('[data-thesis-generated="toc"] li').count(), 5);
  assert.match(await page.locator('[data-thesis-generated="figures"]').innerText(), /Şekil 1\.1\. Şekil caption metni/);
  assert.match(await page.locator('[data-thesis-generated="tables"]').innerText(), /Tablo 1\.1\. Tablo caption metni/);
  assert.equal(await page.locator('[data-thesis-section-mode="generated"] [contenteditable="true"]').count(), 0);
  pass("H1–H4 numbering and the same generated engine for TOC/figures/tables; generated content is read-only");

  const before = await pages(page);
  await caret(page, "figcaption");
  // Native caret navigation ends the previous typing transaction. A scripted
  // range move alone can coalesce typing across two innerHTML fixtures in WebView2.
  await page.keyboard.press("ArrowLeft"); await page.keyboard.press("ArrowRight");
  await page.keyboard.insertText(" güncellendi");
  await page.waitForFunction(() => document.querySelector('[data-thesis-generated="figures"]')?.textContent.includes("güncellendi"));
  await page.keyboard.press("Control+z");
  await page.waitForFunction(() => !document.querySelector('[data-thesis-generated="figures"]')?.textContent.includes("güncellendi"));
  assert.equal(await main(page).locator("figure").count(), 1);
  assert.equal(await main(page).locator("figcaption").innerText(), "Şekil caption metni");
  const representative = await main(page).innerHTML();
  await main(page).evaluate((root) => { root.querySelector("figure").remove(); root.querySelector("table").closest(".academic-table-wrap").remove(); root.dispatchEvent(new InputEvent("input", { bubbles: true })); });
  await page.waitForFunction(() => document.querySelectorAll('[data-thesis-generated="figures"] li,[data-thesis-generated="tables"] li').length === 0);
  await put(page, representative);
  await page.waitForFunction(() => document.querySelectorAll('[data-thesis-generated="figures"] li,[data-thesis-generated="tables"] li').length === 2);
  pass("Caption text edits/undo and figure/table deletion/reinsertion update derived indexes");
  await caret(page, '[data-test-padding]');
  await page.keyboard.insertText(" Önceki içerik sayfayı doldurur.".repeat(400));
  await page.waitForFunction(() => Number(document.querySelector('[data-thesis-generated="toc"] .thesis-index-page').textContent) > 1);
  const expanded = await pages(page);
  assert.notDeepEqual(expanded, before);
  for (const zoom of ["50", "100", "150"]) {
    await page.getByLabel("Yakınlaştır", { exact: true }).selectOption(zoom); await frames(page);
    assert.deepEqual(await pages(page), expanded);
  }
  await page.getByLabel("Yakınlaştır", { exact: true }).selectOption("100");
  await main(page).evaluate((root) => {
    const p = root.querySelector('[data-test-padding]'); root.focus();
    const range = document.createRange(); range.selectNodeContents(p);
    document.getSelection().removeAllRanges(); document.getSelection().addRange(range);
  });
  await page.keyboard.insertText("Başlangıç.");
  await page.waitForFunction(() => document.querySelector('[data-thesis-generated="toc"] .thesis-index-page').textContent === "1");
  assert.deepEqual(await pages(page), before);
  pass("Real TOC and caption pages update after text insertion and deletion; zoom 50/100/150 preserves page labels");

  // Check every row against its rendered anchor and numbered sheet, independent of the generator.
  const matches = await page.locator('[data-index-target]').evaluateAll((rows) => rows.every((row) => {
    const anchor = document.querySelector(`[data-thesis-anchor="${row.dataset.indexTarget}"]`);
    const stack = anchor.closest('.thesis-page-stack'); const scale = new DOMMatrixReadOnly(getComputedStyle(stack).transform).a || 1;
    const range = document.createRange(); range.selectNodeContents(anchor);
    const rect = [...range.getClientRects()].find((r) => r.width && r.height);
    const i = Math.floor(((rect.top - stack.getBoundingClientRect().top) / scale + .5) / (297 * 96 / 25.4 + 28));
    return row.querySelector('.thesis-index-page').textContent === stack.querySelectorAll('.thesis-sheet')[i].dataset.thesisPageLabel;
  }));
  assert.ok(matches);
  await main(page).evaluate((root) => { root.focus(); root.dispatchEvent(new InputEvent("input", { bubbles: true })); });
  await frames(page);
  pass("Every generated row matches its actual rendered anchor/sheet");
  await caret(page, '[data-test-padding]');
  await page.keyboard.insertText(" Dışa aktarım için birkaç sayfalık paragraf.".repeat(220));
  await page.waitForFunction(() => Number(document.querySelector('[data-thesis-generated="toc"] .thesis-index-page').textContent) > 1);
  return { before, props, final: await pages(page) };
}
