import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { task10aChecks } from "./task10a-checks.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "C:/Users/CASPER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
const errors = [], checks = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (e) => { if (/content security policy|refused to|uncaught/i.test(e.text())) errors.push(e.text()); });
const out = new URL("../../output/task10a/", import.meta.url);
await mkdir(out, { recursive: true });
try {
  await page.goto(`${process.argv[2] || "http://127.0.0.1:5175"}/tests/thesis.html`);
  await page.locator('[data-thesis-flow-section="main"] [contenteditable="true"]').waitFor();
  const result = await task10aChecks(page, (message) => { checks.push(message); console.log(`PASS ${message}`); });
  const source = await page.evaluate(() => window.thesisTest.getDoc());
  assert.doesNotMatch(JSON.stringify(source), /data-thesis-(?:anchor|number|caption)|indexPages|indexRows|data-index-target|thesis-index-page/);
  assert.match(source.content, /<p[^>]*>Birinci paragraf<br>İç satır<\/p>/);
  await page.reload();
  await page.waitForFunction(() => Number(document.querySelector('[data-thesis-generated="tables"] .thesis-index-page')?.textContent) > 1);
  assert.deepEqual(await page.evaluate(() => window.thesisTest.getDoc()), source);
  checks.push("Save/reload retains source paragraphs and captions; no generated rows/pages/anchors persisted");
  const totalPages = await page.locator('[data-thesis-total-pages]').evaluate((node) => Number(node.dataset.thesisTotalPages));
  const exports = {};
  for (const [button, extension] of [["PDF", "pdf"], ["Word", "docx"]]) {
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: button, exact: true }).click();
    const file = await download;
    const path = new URL(`representative.${extension}`, out).pathname.replace(/^\/(\w:)/, "$1");
    await file.saveAs(path); exports[extension] = path;
  }
  const { readFile } = await import("node:fs/promises");
  const { getDocument } = await import("../node_modules/pdfjs-dist/legacy/build/pdf.mjs");
  const { strFromU8, unzipSync } = await import("fflate");
  const task = getDocument({ data: new Uint8Array(await readFile(exports.pdf)), useSystemFonts: true, disableFontFace: true });
  const pdf = await task.promise;
  assert.equal(pdf.numPages, totalPages);
  const text = (await Promise.all(Array.from({ length: pdf.numPages }, async (_, i) => (await (await pdf.getPage(i + 1)).getTextContent()).items.map((item) => item.str).join(" ")))).join(" ");
  for (const phrase of ["1.1.1.1", "Derin", "Şekil", "Tablo"]) assert.ok(text.includes(phrase), phrase);
  const files = unzipSync(new Uint8Array(await readFile(exports.docx))), xml = strFromU8(files['word/document.xml']);
  assert.match(xml, /w:val="Heading4"/); assert.match(xml, /<w:br\/>/); assert.match(xml, /w:firstLine="567"/);
  assert.match(xml, /<w:tbl>/); assert.ok(Object.keys(files).some((file) => file.startsWith("word/media/")));
  assert.match(xml, /Şekil 1\.1\. Şekil caption metni/); assert.match(xml, /Tablo 1\.1\. Tablo caption metni/);
  assert.match(xml, /<w:tab\/>/);
  assert.ok(files['word/footnotes.xml']);
  checks.push(`Editor = PDF: ${pdf.numPages} pages; H4/captions/indexes visible; DOCX paragraphs, breaks, image/table and Word footnote`);
  await task.destroy();
  assert.deepEqual(errors, []);
  await page.screenshot({ path: new URL("editor.png", out).pathname.replace(/^\/(\w:)/, "$1"), fullPage: true });
  await page.locator('[data-thesis-flow-section="main"] .rich-text-body').evaluate((root) => {
    root.innerHTML = '<h1>Uzun dizin</h1>' + Array.from({ length: 90 }, (_, i) => `<h2>Başlık ${i + 1}</h2><p>${"Akademik paragraf metni. ".repeat(15)}</p>`).join("");
    root.dispatchEvent(new InputEvent("input", { bubbles: true }));
  });
  await page.waitForFunction(() => Number(document.querySelector('.thesis-paper[data-thesis-section="toc"]').dataset.thesisPageCount) >= 2 && document.querySelectorAll('[data-thesis-generated="toc"] li').length === 91);
  await page.waitForFunction(() => [...document.querySelectorAll('[data-index-target]')].every((row) => {
    const anchor = document.querySelector(`[data-thesis-anchor="${row.dataset.indexTarget}"]`), stack = anchor?.closest('.thesis-page-stack');
    if (!stack) return false;
    const scale = new DOMMatrixReadOnly(getComputedStyle(stack).transform).a || 1, range = document.createRange(); range.selectNodeContents(anchor);
    const rect = [...range.getClientRects()].find((r) => r.width && r.height); if (!rect) return false;
    const i = Math.floor(((rect.top - stack.getBoundingClientRect().top) / scale + .5) / (297 * 96 / 25.4 + 28));
    return row.querySelector('.thesis-index-page')?.textContent === stack.querySelectorAll('.thesis-sheet')[i]?.dataset.thesisPageLabel;
  }));
  assert.equal(await page.getByRole('alert').filter({ hasText: 'kararlı' }).count(), 0);
  const indexPageCount = await page.locator('.thesis-paper[data-thesis-section="toc"]').getAttribute('data-thesis-page-count');
  checks.push(`Long generated TOC: 91 entries, ${indexPageCount} actual pages, every page label stable and resolved`);
  await writeFile(new URL("browser.json", out), JSON.stringify({ status: "passed", checks, errors, pages: totalPages, indexPages: result.final }, null, 2));
} catch (e) {
  await writeFile(new URL("failure-dom.json", out), JSON.stringify(await page.evaluate(() => ({ html: document.querySelector('[data-thesis-flow-section="main"] .rich-text-body')?.innerHTML, source: window.thesisTest.getDoc() })), null, 2));
  await page.screenshot({ path: new URL("failure.png", out).pathname.replace(/^\/(\w:)/, "$1"), fullPage: true });
  throw e;
} finally { await browser.close(); }
