// Word-like thesis ribbon smoke. Run with Vite serving /tests/thesis.html.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1380, height: 920 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const base = process.argv[2] || "http://127.0.0.1:5175";
const key = "txtnote-thesis-regression";
const output = path.resolve(import.meta.dirname, "../../output/word-thesis");
const exported = {};
const tab = (name) => page.getByRole("tab", { name, exact: true });
const body = () => page.locator('[data-thesis-flow-section="main"] [contenteditable="true"]');
async function main() {
  await page.goto(`${base}/tests/thesis.html`);
  await page.evaluate((storageKey) => localStorage.removeItem(storageKey), key);
  await page.reload();
  await body().waitFor();
  assert.equal(await page.locator(".thesis-ribbon").count(), 1);
  assert.equal(await page.getByRole("tab").count(), 6);
  await page.getByLabel("Yakınlaştır", { exact: true }).selectOption("100");
  assert.ok((await page.locator(".thesis-paper").first().boundingBox()).width > 780, "A4 stays on canvas at 100%");
  await mkdir(output, { recursive: true });
  for (const width of [1024, 1380, 1920]) {
    await page.setViewportSize({ width, height: 920 });
    for (const name of ["Dosya", "Giriş", "Ekle", "Düzen", "Başvurular", "Görünüm"]) {
      await tab(name).click();
      const panel = page.getByRole("tabpanel");
      const panelBox = await panel.boundingBox();
      const groups = panel.locator(".thesis-ribbon-group");
      assert.ok(await groups.count() >= 3, `${name} has balanced functional groups`);
      const lastBox = await groups.last().boundingBox();
      const ribbonRight = lastBox.x + lastBox.width;
      assert.ok(ribbonRight >= panelBox.x + panelBox.width * 0.95, `${name} fills the desktop ribbon width at ${width}px`);
      const overflow = await panel.evaluate((element) => element.scrollWidth - element.clientWidth);
      assert.ok(overflow <= 2, `${name} has no desktop horizontal overflow at ${width}px (overflow ${overflow}px)`);
      const clipping = await panel.locator("button,select,input").evaluateAll((elements, bounds) => elements.filter((element) => {
        if (element.disabled || getComputedStyle(element).display === "none") return false;
        const rect = element.getBoundingClientRect();
        const groupRect = element.closest(".thesis-ribbon-group")?.getBoundingClientRect();
        return rect.width > 0 && (rect.left < bounds.left - 2 || rect.right > bounds.right + 2 || (groupRect && (rect.left < groupRect.left - 2 || rect.right > groupRect.right + 2)));
      }).map((element) => element.getAttribute("aria-label") || element.textContent?.trim()).filter(Boolean), { left: panelBox.x, right: panelBox.x + panelBox.width });
      assert.deepEqual(clipping, [], `${name} controls fit inside the ribbon at ${width}px`);
      if (width >= 1380) await page.screenshot({ path: path.join(output, `ribbon-${name.toLocaleLowerCase("tr-TR")}-${width}.png`), fullPage: false });
    }
  }
  await page.setViewportSize({ width: 1380, height: 920 });
  await tab("Giriş").click();

  await body().click(); await page.keyboard.type("Style gallery probe"); await page.keyboard.press("Control+a");
  await page.locator(".thesis-style-card").first().click();
  assert.doesNotMatch(await body().evaluate((element) => element.innerHTML), /<h1\b/, "Normal gallery command keeps body text normal");
  await page.keyboard.press("Control+a"); await page.locator(".thesis-style-card").nth(1).click();
  assert.match(await body().evaluate((element) => element.innerHTML), /<h1\b[^>]*data-academic-heading="1"/, "Heading 1 gallery command changes the selected paragraph");
  await page.keyboard.press("Control+a"); await page.keyboard.press("Backspace");

  await body().click(); await page.keyboard.type("Ribbon format selection persists"); await page.keyboard.press("Control+a");
  await page.getByLabel("Yazı boyutu", { exact: true }).selectOption("pt16");
  await page.getByRole("button", { name: "Kalın", exact: true }).click();
  await page.getByLabel("Yazı rengi", { exact: true }).selectOption("red");
  await page.getByLabel("Vurgu rengi", { exact: true }).selectOption("yellow");
  const stored = await page.evaluate(() => window.thesisTest.getDoc().content);
  assert.match(stored, /fmt-bold/); assert.match(stored, /fmt-pt-16/); assert.match(stored, /fmt-color-red/); assert.match(stored, /fmt-highlight-yellow/);
  await body().evaluate((el) => { el.focus(); const range = document.createRange(); range.selectNodeContents(el); range.collapse(false); const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range); });
  await page.keyboard.press("End"); await page.keyboard.press("Enter"); await page.keyboard.type("caret remains after ribbon actions");
  assert.match(await page.evaluate(() => window.thesisTest.getDoc().content), /Ribbon format selection persists/);
  await tab("Ekle").click();
  await page.getByLabel("Tablo satır sayısı").fill("2"); await page.getByLabel("Tablo sütun sayısı").fill("3");
  await page.getByRole("button", { name: "Tablo", exact: true }).click();
  assert.equal(await body().locator("table td, table th").count(), 6, "configured table inserted");
  await page.getByLabel("Bağlantı adresi").fill("https://example.org/thesis");
  await page.getByLabel("Bağlantı metni").fill("kaynak bağlantısı");
  await page.getByRole("button", { name: "Bağlantı ekle", exact: true }).click();
  assert.match(await page.evaluate(() => window.thesisTest.getDoc().content), /href="https:\/\/example\.org\/thesis"/);

  await tab("Görünüm").click();
  await page.getByRole("button", { name: "Gezinti bölmesini aç veya kapat", exact: true }).click();
  assert.ok(await page.getByRole("complementary", { name: "Gezinti bölmesi" }).isVisible());
  await page.getByRole("complementary", { name: "Gezinti bölmesi" }).locator("button").first().click();
  await tab("Giriş").click();
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.getByRole("tab", { selected: true }).innerText(), "Ekle", "arrow keys move between ribbon tabs");
  await page.keyboard.press("ArrowLeft");
  assert.equal(await page.getByRole("tab", { selected: true }).innerText(), "Giriş");
  await body().evaluate((el) => { el.focus(); const range = document.createRange(); range.selectNodeContents(el); range.collapse(false); const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range); });
  await tab("Başvurular").click();
  await page.getByLabel("Dipnot metni").fill("UI dipnot testi, 2026.");
  await page.getByRole("button", { name: "Dipnot ekle", exact: true }).click();
  assert.match(await page.evaluate(() => window.thesisTest.getDoc().content), /UI dipnot testi, 2026\./);
  await tab("Giriş").click();
  await page.getByLabel("Yakınlaştır", { exact: true }).selectOption("75");
  assert.equal(await page.getByLabel("Yakınlaştır", { exact: true }).inputValue(), "75");
  assert.match(await page.locator(".thesis-statusbar").innerText(), /sözcük/);

  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.setViewportSize({ width: 620, height: 900 });
  const screenshot = path.join(output, "dark-responsive.png");
  await page.screenshot({ path: screenshot, fullPage: false });
  assert.ok((await readFile(screenshot)).byteLength > 1000);

  await page.evaluate(() => document.documentElement.classList.remove("dark"));
  await page.setViewportSize({ width: 1380, height: 920 });
  await tab("Dosya").click();
  for (const [kind, label, suffix, signature] of [["pdf", "PDF", ".pdf", "%PDF"], ["docx", "Word", ".docx", "PK"]]) {
    const downloadPromise = page.waitForEvent("download", { timeout: 60000 });
    await page.getByRole("button", { name: label, exact: true }).click();
    const download = await downloadPromise;
    const target = path.join(output, `thesis${suffix}`);
    await download.saveAs(target);
    const bytes = await readFile(target);
    assert.ok(bytes.byteLength > 1000, `${kind} is nonempty`);
    assert.equal(bytes.subarray(0, signature.length).toString("latin1"), signature, `${kind} signature`);
    exported[kind] = { file: path.basename(target), bytes: bytes.byteLength };
    if (kind === "docx") {
      const { unzipSync, strFromU8 } = await import("fflate");
      const files = unzipSync(bytes);
      const xml = strFromU8(files["word/document.xml"]);
      assert.match(xml, /<w:tbl(?:\s|>)/, "downloaded DOCX contains the inserted table");
      assert.match(xml, /<w:hyperlink(?:\s|>)/, "downloaded DOCX contains the inserted link");
      assert.match(xml, /<w:footnoteReference/, "downloaded DOCX contains the inserted footnote");
      assert.match(xml, /<w:color w:val="E8A0A0"\s*\/>/, "downloaded DOCX keeps named red text color");
      assert.match(xml, /w:fill="FFF2A8"/, "downloaded DOCX keeps yellow highlight");
      assert.match(xml, /<w:sz w:val="32"\s*\/>/, "downloaded DOCX keeps 16 pt size");
      const footnotes = strFromU8(files["word/footnotes.xml"]);
      assert.match(footnotes, /UI dipnot testi, 2026\./, "downloaded DOCX includes the footnote text");
      exported.docxChecks = ["A4 template", "table", "hyperlink", "footnote", "red text", "yellow highlight", "16 pt size"];
    } else {
      const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const pdf = await getDocument({ data: new Uint8Array(bytes), useWorkerFetch: false, isEvalSupported: false, disableFontFace: true }).promise;
      const first = await pdf.getPage(1);
      const viewport = first.getViewport({ scale: 1 });
      assert.ok(Math.abs(viewport.width - 595.28) < 2 && Math.abs(viewport.height - 841.89) < 2, "downloaded PDF page is A4");
      const pageTextCount = (await first.getTextContent()).items.length;
      assert.ok(pageTextCount > 0, "downloaded PDF contains text");
      exported.pdfChecks = { pages: pdf.numPages, widthPt: viewport.width, heightPt: viewport.height, textItems: pageTextCount };
    }
  }
  await page.reload(); await body().waitFor();
  assert.match(await page.evaluate(() => window.thesisTest.getDoc().content), /Ribbon format selection persists/);
  assert.equal(await page.getByLabel("Tablo satır sayısı").count(), 0, "test control isn't leaking between tabs");
  assert.deepEqual(errors, []);
  await writeFile(path.join(output, "result.json"), JSON.stringify({ passed: true, exported, browserErrors: errors }, null, 2));
  console.log("PASS ribbon tabs, caret formatting, configured table/link/footnote, section navigation, responsive dark UI, persistence, real PDF and DOCX exports; 0 browser errors");
}
try { await main(); } finally { await browser.close(); }
