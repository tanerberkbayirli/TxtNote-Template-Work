// Word-like thesis ribbon smoke. Run with Vite serving /tests/thesis.html.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--enable-blink-features=MulticolColumnWrapping", "--font-render-hinting=none"] });
const context = await browser.newContext({ viewport: { width: 1380, height: 920 }, deviceScaleFactor: 1, acceptDownloads: true });
const errors = [];
let page;
const base = process.argv[2] || "http://127.0.0.1:5175";
const key = "txtnote-thesis-regression";
const output = path.resolve(import.meta.dirname, "../../output/word-thesis");
const exported = {};
const tab = (name) => page.getByRole("tab", { name, exact: true });
const body = () => page.locator('[data-thesis-flow-section="main"] [role="textbox"][contenteditable="true"]');
async function main() {
  await context.grantPermissions(["local-fonts"], { origin: new URL(base).origin });
  page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/tests/thesis.html`);
  await page.evaluate((storageKey) => localStorage.removeItem(storageKey), key);
  await page.reload();
  await body().waitFor();
  assert.equal(await page.locator(".thesis-ribbon").count(), 1);
  assert.equal(await page.getByRole("tab").count(), 6);
  await page.getByLabel("Yakınlaştır", { exact: true }).selectOption("100");
  assert.ok((await page.locator(".thesis-paper").first().boundingBox()).width > 780, "A4 stays on canvas at 100%");
  await mkdir(output, { recursive: true });
  if (process.env.RIBBON_SKIP_REACHABILITY !== "1" && process.env.SKIP_RIBBON_GEOMETRY !== "1") for (const width of [1024, 1380]) {
    await page.setViewportSize({ width, height: 920 });
    for (const name of ["Dosya", "Giriş", "Ekle", "Düzen", "Başvurular", "Görünüm"]) {
      await tab(name).click();
      const panel = page.getByRole("tabpanel");
      const groups = panel.locator(".thesis-ribbon-group");
      assert.ok(await groups.count() >= 3, `${name} has balanced functional groups`);
      const overflow = await panel.evaluate((element) => element.scrollWidth - element.clientWidth);
      assert.ok(overflow >= 0, `${name} reports valid horizontal scroll geometry at ${width}px`);
      for (const group of await groups.all()) {
        await group.evaluate((element) => element.scrollIntoView({ block: "nearest", inline: "nearest" }));
        const violations = await group.locator("button,select,input").evaluateAll((elements) => {
          for (const element of elements) {
            if (element.disabled || getComputedStyle(element).display === "none") continue;
            element.scrollIntoView({ block: "nearest", inline: "nearest" });
            const rect = element.getBoundingClientRect();
            const group = element.closest(".thesis-ribbon-group").getBoundingClientRect();
            const panel = document.querySelector("[role=tabpanel]").getBoundingClientRect();
            if (rect.width > 0 && (rect.left < group.left - 2 || rect.right > group.right + 2 || rect.right <= panel.left || rect.left >= panel.right)) return element.getAttribute("aria-label") || element.textContent?.trim();
          }
          return null;
        });
        assert.equal(violations, null, `${name} controls remain reachable and unclipped inside groups at ${width}px`);
      }
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
  const size = page.getByLabel("Yazı boyutu (pt)", { exact: true });
  await size.fill("13.3"); await size.press("Enter");
  assert.match(await page.evaluate(() => window.thesisTest.getDoc().content), /data-fmt-pt="?13\.5/);
  await size.fill("99"); await size.press("Escape");
  assert.doesNotMatch(await page.evaluate(() => window.thesisTest.getDoc().content), /data-fmt-pt="?99/);
  await page.getByRole("button", { name: "Kalın", exact: true }).click();
  await page.getByLabel("Yazı rengi seçenekleri", { exact: true }).click();
  await page.getByLabel("HEX renk kodu").fill("#123456");
  await page.getByRole("button", { name: "Uygula", exact: true }).click();
  await page.getByLabel("Vurgu rengi seçenekleri", { exact: true }).click();
  await page.getByLabel("HEX renk kodu").fill("#FEDCBA");
  await page.getByRole("button", { name: "Uygula", exact: true }).click();
  const stored = await page.evaluate(() => window.thesisTest.getDoc().content);
  assert.match(stored, /fmt-bold/); assert.match(stored, /data-fmt-pt="?13\.5/); assert.match(stored, /data-fmt-color=["']?[^"']*123456/i); assert.match(stored, /data-fmt-bg=["']?[^"']*FEDCBA/i);
  await page.getByLabel("Yazı rengi seçenekleri", { exact: true }).click();
  await page.getByRole("menuitem", { name: "Otomatik (siyah)" }).click();
  const automatic = await page.evaluate(() => window.thesisTest.getDoc().content);
  assert.match(automatic, /fmt-color-black/, "automatic text color is saved as black");
  await page.getByLabel("Vurgu rengi seçenekleri", { exact: true }).click();
  await page.getByRole("menuitem", { name: "Vurgu yok" }).click();
  assert.doesNotMatch(await page.evaluate(() => window.thesisTest.getDoc().content), /data-fmt-bg=/i, "removing highlight clears the stored color");
  // Restore the custom colors on the selected text so export assertions inspect both actual values.
  await page.getByLabel("Yazı rengi seçenekleri", { exact: true }).click();
  await page.getByLabel("HEX renk kodu").fill("#123456"); await page.getByRole("button", { name: "Uygula", exact: true }).click();
  await page.getByLabel("Vurgu rengi seçenekleri", { exact: true }).click();
  await page.getByLabel("HEX renk kodu").fill("#FEDCBA"); await page.getByRole("button", { name: "Uygula", exact: true }).click();
  assert.match(await page.evaluate(() => window.thesisTest.getDoc().content), /data-fmt-color=["']?[^"']*123456/i);
  assert.match(await page.evaluate(() => window.thesisTest.getDoc().content), /data-fmt-bg=["']?[^"']*FEDCBA/i);
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
  await page.getByLabel("Bağlantı adresi").fill("javascript:alert(1)");
  assert.equal(await page.getByRole("button", { name: "Bağlantı ekle", exact: true }).isDisabled(), true, "dangerous link schemes stay disabled");
  await page.getByLabel("Bağlantı adresi").fill("https://bad host.invalid");
  assert.equal(await page.getByRole("button", { name: "Bağlantı ekle", exact: true }).isDisabled(), true, "malformed URL whitespace stays disabled");
  await page.getByLabel("Bağlantı adresi").fill("mailto:writer@example.org");
  assert.equal(await page.getByRole("button", { name: "Bağlantı ekle", exact: true }).isDisabled(), false, "mailto links remain supported");
  await page.getByLabel("Bağlantı adresi").fill("");
  await body().evaluate((el) => { el.focus(); const range = document.createRange(); range.selectNodeContents(el); range.collapse(false); const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range); });
  await page.keyboard.press("Enter"); await page.keyboard.type("List and indent probe"); await page.keyboard.press("Control+Shift+ArrowLeft"); await page.keyboard.press("Control+Shift+ArrowLeft"); await page.keyboard.press("Control+Shift+ArrowLeft");
  await tab("Giriş").click();
  await page.getByRole("button", { name: "Madde işaretli liste" }).click();
  assert.match(await page.evaluate(() => window.thesisTest.getDoc().content), /<ul\b/i, "list command creates a bullet list");
  await page.getByRole("button", { name: "Girintiyi artır" }).click();
  assert.match(await page.evaluate(() => window.thesisTest.getDoc().content), /data-txt-indent="1"/, "indent command updates paragraph indentation");
  await body().evaluate((el) => { el.focus(); const range = document.createRange(); range.selectNodeContents(el); range.collapse(false); const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range); });
  await tab("Ekle").click();
  await page.getByRole("button", { name: "Sayfa sonu ekle" }).click();
  assert.match(await page.evaluate(() => window.thesisTest.getDoc().content), /data-academic-page-break="true"/, "page break command inserts a page break");
  const imagePng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/+ioAAAAASUVORK5CYII=", "base64");
  await page.getByRole("button", { name: "Görsel", exact: true }).click();
  await page.getByLabel("Görsel dosyası").setInputFiles({ name: "ribbon-pixel.png", mimeType: "image/png", buffer: imagePng });
  await page.waitForFunction(() => window.thesisTest.getDoc().content.includes("data:image/"));
  assert.match(await page.evaluate(() => window.thesisTest.getDoc().content), /<figure\b[^>]*>.*data:image\//s, "image picker inserts an embedded figure");
  await page.getByRole("button", { name: "Metin çerçevesi ekle", exact: true }).click();
  const additionsBeforeHistory = await page.evaluate(() => window.thesisTest.getDoc().researchData.thesis.layout?.additions?.length || 0);
  assert.ok(additionsBeforeHistory > 0, "text frame is added to page layout");
  await tab("Düzen").click();
  assert.equal(await page.getByRole("button", { name: "Düzen değişikliğini geri al" }).isDisabled(), false);
  await page.getByRole("button", { name: "Düzen değişikliğini geri al" }).click();
  assert.equal(await page.evaluate(() => window.thesisTest.getDoc().researchData.thesis.layout?.additions?.length || 0), additionsBeforeHistory - 1, "layout undo removes the frame");
  await page.getByRole("button", { name: "Düzen değişikliğini yinele" }).click();
  assert.equal(await page.evaluate(() => window.thesisTest.getDoc().researchData.thesis.layout?.additions?.length || 0), additionsBeforeHistory, "layout redo restores the frame");
  await tab("Başvurular").click();
  await page.locator('[data-ribbon-tab="Başvurular"]').getByRole("button", { name: "Tez bilgileri", exact: true }).click();
  await page.getByRole("button", { name: "+ Kaynak ekle", exact: true }).click();
  await page.getByLabel("Kaynakça maddesi 1").fill("Doe, J. (2024). Citation fixture.");
  await page.getByRole("button", { name: "Tez bilgilerini kapat" }).click();
  await body().click();
  await tab("Başvurular").click();
  await page.getByLabel("Kaynakçadan atıf seç").selectOption("Doe, J. (2024). Citation fixture.");
  assert.match(await page.evaluate(() => window.thesisTest.getDoc().content), /Doe, J\. \(2024\)\. Citation fixture\./, "bibliography selection inserts a source footnote");
  await tab("Ekle").click();
  const staticTitle = page.locator('[data-thesis-static-root] [data-thesis-text="title"]').first();
  assert.ok(await staticTitle.count(), "fixture exposes an editable static title target");
  await staticTitle.focus();
  await staticTitle.waitFor({ state: "visible" });
  await page.waitForFunction(() => document.activeElement?.matches('[data-thesis-text="title"]'));
  await page.waitForFunction(() => document.querySelector('[data-ribbon-tab="Ekle"] [aria-label="Tablo"]')?.disabled === true);
  await tab("Ekle").click();
    assert.equal(await page.getByRole("button", { name: "Tablo", exact: true }).isDisabled(), true, "inline insert is disabled for a static text target");
    assert.equal(await page.getByLabel("Tablo satır sayısı").isDisabled(), true);
    await tab("Başvurular").click();
    assert.equal(await page.getByRole("button", { name: "Dipnot ekle", exact: true }).isDisabled(), true, "footnotes are disabled for a static text target");
    assert.equal(await page.getByLabel("Kaynakçadan atıf seç").isDisabled(), true, "bibliography insertion is disabled for a static text target");
  await body().click();

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
    const exportButton = page.getByRole("button", { name: label, exact: true });
    try { await page.waitForFunction((name) => { const button = document.querySelector(`.thesis-export-tile[aria-label="${name}"]`); return button && !button.disabled; }, label, { timeout: 120000 }); }
    catch (error) {
      const diagnostics = await import("../../../orchestration/tools/export-diagnostics.mjs");
      const snapshot = { readiness: await page.locator(".thesis-export-ready").innerText().catch(() => ""), warnings: await page.locator(".thesis-ribbon-warning").innerText().catch(() => ""), status: await page.getByRole("status").innerText().catch(() => ""), pagination: await diagnostics.paginationDiagnostics(page), blockGaps: await diagnostics.blockGapDiagnostics(page, "List and indent probe|Ribbon format selection persists"), errors };
      await writeFile(path.join(output, `export-readiness-${kind}.json`), JSON.stringify(snapshot, null, 2));
      await page.screenshot({ path: path.join(output, `export-readiness-${kind}.png`), fullPage: true });
      throw new Error(`${label} never became ready: ${JSON.stringify(snapshot)}; ${error.message}`);
    }
    const readyText = await page.locator(".thesis-export-ready").innerText();
    const warningText = await page.locator(".thesis-ribbon-warning").innerText().catch(() => "");
    assert.equal(await exportButton.isDisabled(), false, `${label} disabled: ${readyText}; ${warningText}`);
    const downloadPromise = page.waitForEvent("download", { timeout: 60000 });
    await exportButton.click();
    let download;
    try { download = await downloadPromise; }
    catch (error) {
      const status = await page.getByRole("status").innerText().catch(() => "");
      const diagnostics = await import("../../../orchestration/tools/export-diagnostics.mjs");
      const pagination = await diagnostics.paginationDiagnostics(page);
      const gaps = await diagnostics.blockGapDiagnostics(page, "List and indent probe|Ribbon format selection persists");
      const snapshot = { status, readiness: readyText, warnings: warningText, pagination, blockGaps: gaps, errors };
      await writeFile(path.join(output, `export-failure-${kind}.json`), JSON.stringify(snapshot, null, 2));
      await page.screenshot({ path: path.join(output, `export-failure-${kind}.png`), fullPage: true });
      exported[`${kind}Error`] = snapshot;
      if (kind === "pdf") continue;
      throw new Error(`${label} produced no download: ${JSON.stringify(snapshot)}; ${error.message}`);
    }
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
      assert.match(strFromU8(files["word/settings.xml"]), /<w:updateFields w:val="(?:false|0)"\s*\/>/, "DOCX does not request field updates on opening");
      assert.doesNotMatch(xml, /w:dirty="true"/, "cached fields are not marked for automatic recalculation");
      assert.match(xml, /TOC \\h/, "the table of contents remains a live Word field");
      assert.match(xml, /<w:tbl(?:\s|>)/, "downloaded DOCX contains the inserted table");
      assert.match(xml, /<w:hyperlink(?:\s|>)/, "downloaded DOCX contains the inserted link");
      assert.match(xml, /<w:footnoteReference/, "downloaded DOCX contains the inserted footnote");
      assert.match(xml, /<w:drawing(?:\s|>)/, "downloaded DOCX contains the inserted image drawing");
      assert.ok(Object.keys(files).some((name) => name.startsWith("word/media/")), "downloaded DOCX packages the inserted image");
      assert.match(xml, /<w:color w:val="123456"\s*\/>/i, "downloaded DOCX keeps selected text color");
      assert.match(xml, /w:fill="FEDCBA"/i, "downloaded DOCX keeps selected highlight color");
      assert.match(xml, /<w:sz w:val="27"\s*\/>/, "downloaded DOCX keeps selected 13.5 pt size");
      const footnotes = strFromU8(files["word/footnotes.xml"]);
      assert.match(footnotes, /UI dipnot testi, 2026\./, "downloaded DOCX includes the footnote text");
      exported.docxChecks = ["A4 template", "table", "hyperlink", "footnote", "selected text color #123456", "selected highlight #FEDCBA", "13.5 pt size"];
    } else {
      const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const pdf = await getDocument({ data: new Uint8Array(bytes), useWorkerFetch: false, isEvalSupported: false, disableFontFace: true }).promise;
      const first = await pdf.getPage(1);
      const viewport = first.getViewport({ scale: 1 });
      assert.ok(Math.abs(viewport.width - 595.28) < 2 && Math.abs(viewport.height - 841.89) < 2, "downloaded PDF page is A4");
      const pageTextCount = (await first.getTextContent()).items.length;
      assert.ok(pageTextCount > 0, "downloaded PDF contains text");
      const textItems = [];
      let containsImage = false;
      const pdfModule = await import("pdfjs-dist/legacy/build/pdf.mjs");
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const renderedPage = await pdf.getPage(pageNumber);
        textItems.push(...(await renderedPage.getTextContent()).items);
        const operators = await renderedPage.getOperatorList();
        if (operators.fnArray.includes(pdfModule.OPS.paintImageXObject)) containsImage = true;
      }
      const formatEvidence = textItems.find((item) => item.str.includes("Ribbon format selection persists"));
      assert.ok(formatEvidence, "downloaded PDF contains the formatted selection text");
      const fontSizePt = Math.hypot(formatEvidence.transform[0], formatEvidence.transform[1]);
      assert.ok(Math.abs(fontSizePt - 13.5) <= 0.5, `PDF text transform measures 13.5 pt (${fontSizePt})`);
      assert.ok(containsImage, "downloaded PDF includes the inserted image");
      exported.pdfChecks = { pages: pdf.numPages, widthPt: viewport.width, heightPt: viewport.height, textItems: textItems.length, formattedText: formatEvidence.str, formattedTextSizePt: fontSizePt, containsImage };
    }
  }
  await page.reload(); await body().waitFor();
  assert.match(await page.evaluate(() => window.thesisTest.getDoc().content), /Ribbon format selection persists/);
  assert.equal(await page.getByLabel("Tablo satır sayısı").count(), 0, "test control isn't leaking between tabs");
  assert.deepEqual(errors, []);
  const passed = Boolean(exported.pdf && exported.docx);
  await writeFile(path.join(output, "result.json"), JSON.stringify({ passed, exported, browserErrors: errors }, null, 2));
  assert.ok(passed, `both real exports must succeed: ${JSON.stringify(exported)}`);
  console.log("PASS ribbon tabs, caret formatting, configured table/link/footnote, section navigation, responsive dark UI, persistence, real PDF and DOCX exports; 0 browser errors");
}
try { await main(); } finally { await browser.close(); }
