// Regress cover text styling through the user's ribbon and the real export buttons.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--enable-blink-features=MulticolColumnWrapping", "--font-render-hinting=none"] });
const context = await browser.newContext({ viewport: { width: 1380, height: 920 }, deviceScaleFactor: 1, acceptDownloads: true });
const base = process.argv[2] || "http://127.0.0.1:5181";
const key = "txtnote-thesis-regression";
const output = path.resolve(import.meta.dirname, "../../output/word-thesis-cover-format");
const styleKey = "cover:block:1";
const originalUniversity = "DEMO Üniversite A";
const originalInstitute = "DEMO Lisansüstü Enstitüsü";

async function main() {
  await context.grantPermissions(["local-fonts"], { origin: new URL(base).origin });
  const page = await context.newPage();
  const browserErrors = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  await page.goto(`${base}/tests/thesis.html`);
  await page.evaluate((storageKey) => localStorage.removeItem(storageKey), key);
  await page.reload();
  const university = page.locator(`[data-layout-id="${styleKey}"][data-layout-type="text"]`);
  const institute = page.locator('[data-layout-id="cover:block:2"][data-layout-type="text"]');
  await university.waitFor({ state: "visible" });
  assert.equal((await university.innerText()).trim(), originalUniversity);
  assert.equal((await institute.innerText()).trim(), originalInstitute);
  const instituteBefore = await institute.evaluate((element) => ({ color: getComputedStyle(element).color, fontSize: getComputedStyle(element).fontSize, fontWeight: getComputedStyle(element).fontWeight, fontStyle: getComputedStyle(element).fontStyle, textDecorationLine: getComputedStyle(element).textDecorationLine }));

  // Pointer selection is the user's selection mechanism for template cover blocks.
  await university.scrollIntoViewIfNeeded();
  await university.click();
  await page.locator(`[data-layout-selection-box="${styleKey}"]`).waitFor({ state: "attached" });
  await page.getByLabel("Yazı rengi seçenekleri", { exact: true }).click();
  await page.getByLabel("HEX renk kodu").fill("#123456");
  await page.getByRole("button", { name: "Uygula", exact: true }).click();
  const layoutStyle = () => page.evaluate((id) => window.thesisTest.getDoc()?.researchData?.thesis?.layout?.elements?.[id]?.style || {}, styleKey);
  const undo = page.locator('.thesis-ribbon-tool[aria-label^="Geri al"]');
  const redo = page.locator('.thesis-ribbon-tool[aria-label^="Yinele"]');
  await undo.click();
  await page.waitForFunction((id) => window.thesisTest.getDoc()?.researchData?.thesis?.layout?.elements?.[id]?.style?.color === undefined, styleKey);
  assert.deepEqual(await institute.evaluate((element) => getComputedStyle(element).color), instituteBefore.color, "cover color undo leaves institute unchanged");
  await redo.click();
  await page.waitForFunction((id) => window.thesisTest.getDoc()?.researchData?.thesis?.layout?.elements?.[id]?.style?.color === "#123456", styleKey);
  assert.equal((await layoutStyle()).color, "#123456", "cover color redo restores the chosen HEX");
  await page.getByLabel("Vurgu rengi seçenekleri").click();
  await page.getByLabel("HEX renk kodu").fill("#FEDCBA");
  await page.getByRole("button", { name: "Uygula", exact: true }).click();
  await page.getByLabel("Vurgu rengi seçenekleri").click();
  await page.getByRole("menuitem", { name: "Vurgu yok", exact: true }).click();
  await page.waitForFunction((id) => window.thesisTest.getDoc()?.researchData?.thesis?.layout?.elements?.[id]?.style?.highlight === undefined, styleKey);
  await page.getByLabel("Vurgu rengi seçenekleri").click();
  await page.getByLabel("HEX renk kodu").fill("#FEDCBA");
  await page.getByRole("button", { name: "Uygula", exact: true }).click();
  const size = page.getByLabel("Yazı boyutu (pt)", { exact: true });
  await size.fill("18.5");
  await size.press("Enter");
  const italic = page.locator('.thesis-ribbon-tool[aria-label="İtalik"]');
  await italic.click();
  await page.waitForFunction(() => document.querySelector('.thesis-ribbon-tool[aria-label="İtalik"]')?.getAttribute("aria-pressed") === "true");
  await page.locator('.thesis-ribbon-tool[aria-label="Altı çizili"]').click();
  const bold = page.locator('.thesis-ribbon-tool[aria-label="Kalın"]');
  assert.equal(await bold.getAttribute("aria-pressed"), "true", "cover university text starts bold per its template block style");
  await bold.click();
  await page.waitForFunction(() => document.querySelector('.thesis-ribbon-tool[aria-label="Kalın"]')?.getAttribute("aria-pressed") === "false");
  await page.waitForFunction((id) => window.thesisTest.getDoc()?.researchData?.thesis?.layout?.elements?.[id]?.style?.fontWeight < 600, styleKey);
  await bold.click();
  await page.waitForFunction(() => document.querySelector('.thesis-ribbon-tool[aria-label="Kalın"]')?.getAttribute("aria-pressed") === "true");
  const alignRight = page.getByRole("button", { name: "Sağa hizala", exact: true });
  await alignRight.click();
  await page.waitForFunction((id) => window.thesisTest.getDoc()?.researchData?.thesis?.layout?.elements?.[id]?.style?.align === "right", styleKey);
  assert.equal(await alignRight.getAttribute("aria-pressed"), "true", "alignment ribbon state follows selected cover block");
  await page.getByRole("button", { name: "Ortala", exact: true }).click();
  await page.waitForFunction((id) => window.thesisTest.getDoc()?.researchData?.thesis?.layout?.elements?.[id]?.style?.align === "center", styleKey);

  await page.waitForFunction((id) => {
    const model = window.thesisTest.getDoc()?.researchData?.thesis?.layout?.elements?.[id];
    return model?.style?.color === "#123456" && model?.style?.highlight === "#fedcba" && model?.style?.fontSizePt === 18.5 && model?.style?.italic === true && model?.style?.decoration === "underline" && model?.style?.fontWeight >= 600 && model?.style?.align === "center";
  }, styleKey);
  const savedStyle = await page.evaluate((id) => window.thesisTest.getDoc().researchData.thesis.layout.elements[id].style, styleKey);
  const universityAfter = await university.evaluate((element) => ({ color: getComputedStyle(element).color, fontSize: getComputedStyle(element).fontSize, fontWeight: getComputedStyle(element).fontWeight, fontStyle: getComputedStyle(element).fontStyle, textDecorationLine: getComputedStyle(element).textDecorationLine }));
  assert.deepEqual(savedStyle, { ...savedStyle, color: "#123456", fontSizePt: 18.5, fontWeight: 700, italic: true, decoration: "underline" });
  assert.equal(universityAfter.color, "rgb(18, 52, 86)");
  assert.equal(universityAfter.fontStyle, "italic");
  assert.match(universityAfter.textDecorationLine, /underline/);
  assert.ok(Number.parseFloat(universityAfter.fontSize) > Number.parseFloat(instituteBefore.fontSize));
  assert.deepEqual(await institute.evaluate((element) => ({ color: getComputedStyle(element).color, fontSize: getComputedStyle(element).fontSize, fontWeight: getComputedStyle(element).fontWeight, fontStyle: getComputedStyle(element).fontStyle, textDecorationLine: getComputedStyle(element).textDecorationLine })), instituteBefore);
  assert.equal(await page.evaluate((id) => window.thesisTest.getDoc().researchData.thesis.layout.elements[id]?.style?.color, "cover:block:2"), undefined, "institute template defaults stay untouched");

  await page.reload();
  const persistedUniversity = page.locator(`[data-layout-id="${styleKey}"][data-layout-type="text"]`);
  await page.waitForFunction((id) => window.thesisTest.getDoc()?.researchData?.thesis?.layout?.elements?.[id]?.style?.color === "#123456", styleKey);
  assert.equal((await persistedUniversity.innerText()).trim(), originalUniversity);
  assert.equal(await persistedUniversity.evaluate((element) => getComputedStyle(element).color), "rgb(18, 52, 86)");
  assert.match(await persistedUniversity.innerHTML(), /data-fmt-bg=["']?#?fedcba/i, "cover highlight is rendered through the generic formatted span");
  assert.deepEqual(await page.locator('[data-layout-id="cover:block:2"][data-layout-type="text"]').evaluate((element) => ({ color: getComputedStyle(element).color, fontSize: getComputedStyle(element).fontSize, fontWeight: getComputedStyle(element).fontWeight, fontStyle: getComputedStyle(element).fontStyle, textDecorationLine: getComputedStyle(element).textDecorationLine })), instituteBefore);

  await mkdir(output, { recursive: true });
  const exports = {};
  await page.getByRole("tab", { name: "Dosya", exact: true }).click();
  for (const [kind, label, suffix, signature] of [["pdf", "PDF", ".pdf", "%PDF"], ["docx", "Word", ".docx", "PK"]]) {
    try { await page.waitForFunction((name) => { const button = document.querySelector(`.thesis-export-tile[aria-label="${name}"]`); return button && !button.disabled; }, label, { timeout: 120000 }); }
    catch (error) {
      const diagnostics = await import("../../../orchestration/tools/export-diagnostics.mjs");
      const snapshot = { readiness: await page.locator(".thesis-export-ready").innerText().catch(() => ""), warnings: await page.locator(".thesis-ribbon-warning").innerText().catch(() => ""), status: await page.getByRole("status").innerText().catch(() => ""), pagination: await diagnostics.paginationDiagnostics(page), blockGaps: await diagnostics.blockGapDiagnostics(page, originalUniversity), browserErrors };
      await writeFile(path.join(output, `export-readiness-${kind}.json`), JSON.stringify(snapshot, null, 2));
      await page.screenshot({ path: path.join(output, `export-readiness-${kind}.png`), fullPage: true });
      throw new Error(`${label} never became ready: ${JSON.stringify(snapshot)}; ${error.message}`);
    }
    const downloadPromise = page.waitForEvent("download", { timeout: 60000 });
    await page.getByRole("button", { name: label, exact: true }).click();
    const download = await downloadPromise;
    const target = path.join(output, `cover-${suffix.slice(1)}`);
    await download.saveAs(target);
    const bytes = await readFile(target);
    assert.equal(bytes.subarray(0, signature.length).toString("latin1"), signature);
    assert.ok(bytes.byteLength > 1000);
    exports[kind] = { file: path.basename(target), bytes: bytes.byteLength };
    if (kind === "docx") {
      const { unzipSync, strFromU8 } = await import("fflate");
      const files = unzipSync(bytes);
      const xml = strFromU8(files["word/document.xml"]);
      const paragraph = xml.match(/<w:p\b(?:(?!<w:p\b)[\s\S])*?DEMO Üniversite A(?:(?!<w:p\b)[\s\S])*?<\/w:p>/)?.[0];
      assert.ok(paragraph, "DOCX preserves the original university text block");
      assert.match(paragraph, /<w:color w:val="123456"\s*\/>/i);
      assert.match(paragraph, /<w:sz w:val="37"\s*\/>/);
      assert.match(paragraph, /<w:b\s*\/>/);
      assert.match(paragraph, /<w:i\s*\/>/);
      assert.match(paragraph, /<w:u w:val="single"\s*\/>/);
      assert.match(paragraph, /<w:shd\b[^>]*w:fill="FEDCBA"/i, "DOCX preserves the selected cover highlight");
      assert.match(xml, /DEMO Lisansüstü Enstitüsü/, "DOCX preserves unrelated institute text");
      exports.docxStyle = { color: "123456", sizeHalfPoints: 37, bold: true, italic: true, underline: true };
    } else {
      const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const pdf = await getDocument({ data: new Uint8Array(bytes), useWorkerFetch: false, isEvalSupported: false, disableFontFace: true }).promise;
      const items = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) items.push(...(await (await pdf.getPage(pageNumber)).getTextContent()).items);
      const universityItem = items.find((item) => item.str.trim() === originalUniversity);
      assert.ok(universityItem, "PDF preserves the original university text block");
      const fontSizePt = Math.hypot(universityItem.transform[0], universityItem.transform[1]);
      assert.ok(Math.abs(fontSizePt - 18.5) <= 0.5, `PDF cover text measures 18.5 pt (actual ${fontSizePt})`);
      assert.ok(items.some((item) => item.str.trim() === originalInstitute), "PDF preserves unrelated institute text");
      exports.pdfChecks = { pages: pdf.numPages, universityText: universityItem.str, fontSizePt };
    }
  }
  assert.deepEqual(browserErrors, []);
  // Switching to the editable body clears the cover-block selection; returning to the block
  // restores its effective ribbon state without changing the selected body content.
  await page.locator('[contenteditable="true"]').first().click();
  await page.locator(`[data-layout-selection-box="${styleKey}"]`).waitFor({ state: "detached" });
  assert.deepEqual(await page.evaluate((id) => window.thesisTest.getDoc().researchData.thesis.layout.elements[id].style, styleKey), savedStyle, "switching to the body does not mutate the cover block");
  await persistedUniversity.click();
  await page.locator(`[data-layout-selection-box="${styleKey}"]`).waitFor({ state: "attached" });
  await page.getByRole("tab", { name: "Giriş", exact: true }).click();
  await page.getByRole("button", { name: "Biçimi temizle" }).click();
  await page.waitForFunction((id) => {
    const style = window.thesisTest.getDoc()?.researchData?.thesis?.layout?.elements?.[id]?.style || {};
    return style.color === undefined && style.highlight === undefined && style.fontSizePt === undefined && style.italic === undefined && style.decoration === undefined && style.fontWeight === undefined;
  }, styleKey);
  const clearedUniversity = await persistedUniversity.evaluate((element) => ({ color: getComputedStyle(element).color, fontSize: getComputedStyle(element).fontSize, fontWeight: getComputedStyle(element).fontWeight, fontStyle: getComputedStyle(element).fontStyle, textDecorationLine: getComputedStyle(element).textDecorationLine }));
  assert.deepEqual(clearedUniversity, { color: "rgb(0, 0, 0)", fontSize: "20px", fontWeight: "700", fontStyle: "normal", textDecorationLine: "none" });
  assert.deepEqual(await page.locator('[data-layout-id="cover:block:2"][data-layout-type="text"]').evaluate((element) => ({ color: getComputedStyle(element).color, fontSize: getComputedStyle(element).fontSize, fontWeight: getComputedStyle(element).fontWeight, fontStyle: getComputedStyle(element).fontStyle, textDecorationLine: getComputedStyle(element).textDecorationLine })), instituteBefore);
  await page.reload();
  await page.waitForFunction((id) => {
    const style = window.thesisTest.getDoc()?.researchData?.thesis?.layout?.elements?.[id]?.style || {};
    return style.color === undefined && style.highlight === undefined && style.fontSizePt === undefined && style.italic === undefined && style.decoration === undefined && style.fontWeight === undefined;
  }, styleKey);
  assert.equal(await page.locator(`[data-layout-id="${styleKey}"]`).evaluate((element) => getComputedStyle(element).fontSize), "20px");
  await writeFile(path.join(output, "result.json"), JSON.stringify({ passed: true, savedStyle, instituteBefore, universityAfter, exports, browserErrors }, null, 2));
  console.log("PASS cover text ribbon formatting, per-document persistence, unaffected institute default, and real PDF/DOCX exports");
}

try { await main(); } finally { await context.close(); await browser.close(); }
