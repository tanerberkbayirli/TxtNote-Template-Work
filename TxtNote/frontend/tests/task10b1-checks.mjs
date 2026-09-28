// Task 10B.1: MCBÜ final polish on the real thesis editor, its PDF and its DOCX — Word line
// pitch, per-chapter caption numbers without 0.x, the optional co-advisor line and the derived
// total page count. Shared by the Vite e2e (tests/task10b1.e2e.mjs) and the packaged smoke.
// Runs on a thesis filled by fillMcbuThesis (co-advisor given, default caption numbering).
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { strFromU8, unzipSync } from "fflate";
import { settle } from "./task10a1-checks.mjs";

// Official PDF (ShareFileGallery-GTSM221020251445.pdf): single 13.8 pt, "1,5 satır" 20.6–20.8 pt.
const OFFICIAL = { single: 13.8, oneAndHalf: 20.7, tolerance: 0.15 };
const near = (a, b, label, tolerance = OFFICIAL.tolerance) => assert.ok(Math.abs(a - b) <= tolerance, `${label}: ${a} vs ${b}`);
const editable = (page, id) => page.locator(`[data-thesis-flow-section="${id}"] .rich-text-body[contenteditable="true"]`);
const put = (page, id, html) => editable(page, id).evaluate((root, html) => { root.innerHTML = html; root.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" })); }, html);
const details = async (page, open) => {
  const panel = page.getByRole("complementary", { name: "Tez bilgileri" });
  if (open && !(await panel.count())) await page.getByRole("button", { name: "Tez bilgileri", exact: true }).click();
  if (!open && (await panel.count())) await page.getByRole("button", { name: "Tez bilgilerini kapat", exact: true }).click();
};
const mode = (values) => {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
};

/** Line pitch (pt) of the first paragraph of a section, from its rendered line boxes. */
const editorPitch = (page, id) => page.locator(`[data-thesis-flow-section="${id}"] .thesis-body p`).first().evaluate((p) => {
  const scale = new DOMMatrixReadOnly(getComputedStyle(p.closest(".thesis-page-stack")).transform).a || 1;
  const range = document.createRange(); range.selectNodeContents(p);
  const tops = [...new Set([...range.getClientRects()].filter((r) => r.width && r.height).map((r) => Math.round(r.top / scale * 100) / 100))].sort((a, b) => a - b);
  const steps = tops.slice(1).map((top, i) => (top - tops[i]) * 72 / 96);
  return { lines: tops.length, pitch: steps.reduce((sum, v) => sum + v, 0) / steps.length };
});

const totals = (page) => page.evaluate(() => {
  const number = (id, word) => Number((document.querySelector(`.thesis-paper[data-thesis-section="${id}"]`)?.innerText.match(new RegExp(`\\d{4}, (\\d+) ${word}`)) || [])[1]);
  return { toolbar: Number(document.querySelector("[data-thesis-total-pages]")?.dataset.thesisTotalPages), sheets: document.querySelectorAll(".thesis-sheet").length, ozet: number("abstract-header", "sayfa"), abstract: number("abstract-en-header", "pages") };
});

export async function task10b1Checks(page, pass, exportFiles) {
  const result = {};
  await settle(page);

  // A) Word line pitch in the editor (the layout PDF draws the same boxes; measured below).
  const body = await editorPitch(page, "introduction");
  assert.ok(body.lines >= 3, "multi-line GİRİŞ paragraph");
  near(body.pitch, OFFICIAL.oneAndHalf, "editor body line pitch (1,5 satır)");
  const preface = await editorPitch(page, "preface");
  near(preface.pitch, OFFICIAL.single, "editor Önsöz line pitch (tek satır)");
  result.editor = { oneAndHalf: Math.round(body.pitch * 100) / 100, single: Math.round(preface.pitch * 100) / 100 };
  pass(`editor line pitch: 1,5 satır ${result.editor.oneAndHalf} pt, tek satır ${result.editor.single} pt (official ${OFFICIAL.oneAndHalf} / ${OFFICIAL.single} pt)`);

  // B) Per-chapter captions: an unnumbered GİRİŞ never reads 0.x.
  const introBefore = await editable(page, "introduction").evaluate((root) => root.innerHTML);
  const image = await page.locator('[data-thesis-flow-section="main"] figure img').first().getAttribute("src");
  await put(page, "introduction", `${introBefore}<figure class="academic-figure" data-kind="figure" contenteditable="false"><img width="420" height="210" src="${image}" alt=""><figcaption>Giriş şekli</figcaption></figure><div class="academic-table-wrap" data-academic-table="true"><table class="academic-table" data-kind="table"><caption>Giriş tablosu</caption><tbody><tr><td>a</td><td>b</td></tr></tbody></table></div>`);
  await details(page, true);
  await page.getByLabel("Şekil ve tablo numaralandırma", { exact: true }).selectOption("chapter");
  await details(page, false);
  await page.waitForFunction(() => document.querySelector('[data-thesis-generated="figures"]')?.textContent.includes("Şekil 1.1."));
  await settle(page);
  const captionLabels = await page.evaluate(() => [...document.querySelectorAll("[data-thesis-caption]")].map((n) => n.dataset.thesisCaption.trim()));
  const indexRows = await page.evaluate(() => ["figures", "tables"].map((kind) => [...document.querySelectorAll(`[data-thesis-generated="${kind}"] .thesis-index-text`)].map((n) => n.textContent)));
  assert.deepEqual(captionLabels.slice(0, 2), ["Şekil 1.", "Tablo 1."], "GİRİŞ captions without a chapter number");
  assert.ok(captionLabels.length === 6 && captionLabels.slice(2).every((label) => /^(Şekil|Tablo) [1-9]\d*\.[1-9]\d*\.$/.test(label)), `chapter captions: ${captionLabels}`);
  assert.ok(captionLabels.every((label) => !/ 0\./.test(label)), `no 0.x caption: ${captionLabels}`);
  assert.equal(indexRows[0][0], "Şekil 1. Giriş şekli"); assert.equal(indexRows[1][0], "Tablo 1. Giriş tablosu");
  assert.ok(indexRows[0].some((row) => row.startsWith("Şekil 1.1. ")) && indexRows[1].some((row) => row.startsWith("Tablo 1.1. ")));
  assert.ok(indexRows.flat().every((row) => !/^(Şekil|Tablo) 0\./.test(row)));
  result.chapterCaptions = captionLabels;
  await details(page, true);
  await page.getByLabel("Şekil ve tablo numaralandırma", { exact: true }).selectOption("document");
  await details(page, false);
  await page.waitForFunction(() => document.querySelector('[data-thesis-generated="figures"] .thesis-index-text')?.textContent === "Şekil 1. Giriş şekli");
  await settle(page);
  assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('[data-thesis-generated="figures"] .thesis-index-text')].map((n) => n.textContent.split(" ").slice(0, 2).join(" "))), ["Şekil 1.", "Şekil 2.", "Şekil 3."]);
  await put(page, "introduction", introBefore);
  await settle(page);
  pass(`per-chapter captions: GİRİŞ ${captionLabels.slice(0, 2).join(", ")} (no 0.x), chapters ${captionLabels.slice(2).join(", ")}; global mode 1, 2, 3; lists follow`);

  // C) Co-advisor lines: shown when given, fully hidden (TR + EN) when empty.
  const header = async () => ({ tr: await page.locator('.thesis-paper[data-thesis-section="abstract-header"]').innerText(), en: await page.locator('.thesis-paper[data-thesis-section="abstract-en-header"]').innerText() });
  let text = await header();
  assert.match(text.tr, /İkinci Danışman: Dr\. Öğr\. Üyesi Gökhan IŞIK/); assert.match(text.en, /Co-Supervisor: Dr\. Öğr\. Üyesi Gökhan IŞIK/);
  await details(page, true);
  await page.getByLabel("İkinci danışman unvanı", { exact: true }).fill("");
  await page.getByLabel("İkinci danışman Ad SOYAD", { exact: true }).fill("");
  await details(page, false);
  await settle(page);
  text = await header();
  assert.doesNotMatch(text.tr, /İkinci Danışman/); assert.doesNotMatch(text.en, /Co-Supervisor/);
  assert.match(text.tr, /Danışman: Doç\. Dr\. İlknur ÇİÇEK/); assert.match(text.en, /Supervisor: Doç\. Dr\. İlknur ÇİÇEK/);
  await details(page, true);
  await page.getByLabel("İkinci danışman Ad SOYAD", { exact: true }).fill("Gökhan IŞIK");
  await details(page, false);
  await settle(page);
  text = await header();
  assert.match(text.tr, /İkinci Danışman:\s+Gökhan IŞIK/); assert.match(text.en, /Co-Supervisor:\s+Gökhan IŞIK/);
  await details(page, true);
  await page.getByLabel("İkinci danışman unvanı", { exact: true }).fill("Dr. Öğr. Üyesi");
  await details(page, false);
  await settle(page);
  pass("İkinci Danışman / Co-Supervisor: hidden in ÖZET and ABSTRACT when empty, shown with a name alone or title + name");

  // D) Total pages: derived from the current pagination, follows reflow, never stored, no input.
  await details(page, true);
  assert.equal(await page.getByLabel("Toplam sayfa sayısı (Özet/Abstract)", { exact: true }).count(), 0, "no manual page count input");
  await details(page, false);
  let pages = await totals(page);
  assert.ok(pages.sheets > 20, `representative thesis: ${pages.sheets} sheets`);
  assert.deepEqual([pages.toolbar, pages.ozet, pages.abstract], [pages.sheets, pages.sheets, pages.sheets]);
  const before = pages.sheets;
  const mainBefore = await editable(page, "main").evaluate((root) => root.innerHTML);
  const filler = Array.from({ length: 16 }, (_, i) => `<p>Ek paragraf ${i + 1}. ${"Çevrimiçi öğrenme ortamlarında öğretmen adaylarının dijital okuryazarlık düzeyleri ayrıntılı biçimde incelenmiştir. ".repeat(6)}</p>`).join("");
  await put(page, "main", mainBefore + filler);
  await settle(page);
  pages = await totals(page);
  assert.ok(pages.sheets > before, `content added: ${before} → ${pages.sheets}`);
  assert.deepEqual([pages.toolbar, pages.ozet, pages.abstract], [pages.sheets, pages.sheets, pages.sheets]);
  const stored = await page.evaluate(() => window.thesisTest?.getDoc?.() ?? null);
  if (stored) {
    const values = stored.researchData.thesis.values;
    assert.ok(values.PAGE_COUNT === undefined || values.PAGE_COUNT === "48", "derived count never written to metadata");
    assert.doesNotMatch(JSON.stringify(stored), new RegExp(`${pages.sheets} (sayfa|pages)`));
  }
  result.pages = { before, after: pages.sheets };
  pass(`total pages derived: Özet = Abstract = editor = ${before}; +16 paragraphs → ${pages.sheets} everywhere; not stored, no input`);

  // E/F) Exports carry the same derived count; PDF line pitch = editor = official.
  const files = await exportFiles();
  const { getDocument } = await import(new URL("../node_modules/pdfjs-dist/legacy/build/pdf.mjs", import.meta.url).href);
  const pdf = await getDocument({ data: new Uint8Array(await readFile(files.pdf)), useSystemFonts: true, disableFontFace: true }).promise;
  assert.equal(pdf.numPages, pages.sheets, "PDF pages = editor total");
  const pageText = async (n) => (await (await pdf.getPage(n)).getTextContent()).items;
  const joined = async (n) => (await pageText(n)).map((item) => item.str).join(" ").replace(/\s+/g, " ");
  assert.ok((await joined(3)).includes(`2026, ${pages.sheets} sayfa`), "PDF Özet total");
  assert.ok((await joined(4)).includes(`2026, ${pages.sheets} pages`), "PDF Abstract total");
  const labels = await page.evaluate(() => [...document.querySelectorAll(".thesis-sheet")].map((s) => s.dataset.thesisPageLabel || ""));
  const giris = labels.indexOf("1") + 1;
  const baselines = [...new Set((await pageText(giris)).filter((item) => item.str.trim() && Math.abs(Math.hypot(item.transform[2], item.transform[3]) - 12) < 0.2).map((item) => Math.round(item.transform[5] * 100) / 100))].sort((a, b) => b - a);
  const pdfPitch = mode(baselines.slice(1).map((y, i) => Math.round((baselines[i] - y) * 10) / 10));
  near(pdfPitch, OFFICIAL.oneAndHalf, "PDF body line pitch");
  const zip = unzipSync(new Uint8Array(await readFile(files.docx)));
  const xml = strFromU8(zip["word/document.xml"]);
  assert.ok(xml.includes(`2026, ${pages.sheets} sayfa`) && xml.includes(`2026, ${pages.sheets} pages`), "DOCX snapshot total");
  assert.match(xml, /<w:spacing (?=[^>]*w:line="360")(?=[^>]*w:lineRule="auto")[^>]*\/>/, "DOCX Word 1.5 lines");
  assert.match(xml, /<w:spacing (?=[^>]*w:line="240")(?=[^>]*w:lineRule="auto")[^>]*\/>/, "DOCX Word single lines");
  result.pdf = { pages: pdf.numPages, pitch: pdfPitch };
  pass(`PDF: ${pdf.numPages} pages, Özet/Abstract "${pages.sheets} sayfa/pages", body line pitch ${pdfPitch} pt; DOCX: same snapshot, Word auto 1.5 (360) and single (240) lines`);

  await put(page, "main", mainBefore);
  await settle(page);
  result.files = files;
  return result;
}
