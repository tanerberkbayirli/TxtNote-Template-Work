// Task 10B: the official MCBÜ template on the real thesis editor, its PDF and its DOCX.
// Shared by the Vite e2e (tests/task10b.e2e.mjs) and the packaged WebView2 smoke.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { strFromU8, unzipSync } from "fflate";
import { mcbuThesis } from "./task10b-document.mjs";
import { assertConsistent, footnoteState, settle } from "./task10a1-checks.mjs";
import { assertTimesNewRomanEmbedded } from "./pdf-font-compliance.mjs";

const PX_PER_MM = 96 / 25.4;
const PT_PER_MM = 72 / 25.4;
const WORD_LINE = 1.15;
const near = (a, b, label, tolerance = 0.6) => assert.ok(Math.abs(a - b) <= tolerance, `${label}: ${a} vs ${b}`);
const editable = (page, id) => page.locator(`[data-thesis-flow-section="${id}"] .rich-text-body[contenteditable="true"]`);
const put = (page, id, html) => editable(page, id).evaluate((root, html) => { root.innerHTML = html; root.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" })); }, html);
const details = async (page, open) => {
  const panel = page.getByRole("complementary", { name: "Tez bilgileri" });
  if (open && !(await panel.count())) await page.getByRole("button", { name: "Tez bilgileri", exact: true }).click();
  if (!open && (await panel.count())) await page.getByRole("button", { name: "Tez bilgilerini kapat", exact: true }).click();
};
const METADATA = [["Ad SOYAD *", "STUDENT_NAME"], ["Anabilim dalı *", "DEPARTMENT_NAME"], ["Department (English)", "DEPARTMENT_NAME_EN"], ["Program *", "PROGRAM_NAME"], ["Danışman unvanı (ör. Doç. Dr.) *", "ADVISOR_TITLE"], ["Danışman Ad SOYAD *", "ADVISOR_NAME"], ["İkinci danışman unvanı", "CO_ADVISOR_TITLE"], ["İkinci danışman Ad SOYAD", "CO_ADVISOR_NAME"], ["Yıl *", "YEAR"], ["Anahtar kelimeler (en az 5, virgülle)", "KEYWORDS"], ["Keywords (en az 5, virgülle)", "KEYWORDS_EN"]];

/** Physical sheets in document order: label, group and (unscaled) size. */
export const sheetLabels = (page) => page.evaluate(() => [...document.querySelectorAll(".thesis-sheet")].map((sheet) => sheet.dataset.thesisPageLabel || ""));

/** Fill the representative thesis through the real UI: template, metadata, optional pages, section text. */
export async function fillMcbuThesis(page, { degree = "phd", selectTemplate = true, title } = {}) {
  const image = await page.evaluate(() => {
    const canvas = document.createElement("canvas"); canvas.width = 420; canvas.height = 210;
    const g = canvas.getContext("2d");
    g.fillStyle = "#dde7f3"; g.fillRect(0, 0, 420, 210);
    [["#1f4e79", 20, 40, 130], ["#c0392b", 155, 70, 100], ["#2e8b57", 290, 20, 150]].forEach(([color, x, y, h]) => { g.fillStyle = color; g.fillRect(x, y, 110, h); });
    return canvas.toDataURL("image/png");
  });
  const doc = mcbuThesis(image, { degree });
  if (title) doc.title = title;
  const { values, sectionContent } = doc.researchData.thesis;
  await details(page, true);
  if (selectTemplate) await page.getByLabel("Tez şablonu", { exact: true }).selectOption(`mcbu-lee-${degree}-tr-v1`);
  await page.getByRole("complementary", { name: "Tez bilgileri" }).getByText(/^Resmî kaynak: ShareFileGallery-GTSM221020251445\.pdf/).waitFor();
  await page.getByPlaceholder("Tez başlığını yazın").fill(doc.title);
  for (const [label, key] of METADATA) await page.getByLabel(label, { exact: true }).fill(values[key]);
  for (const name of degree === "phd" ? ["EKLER", "ÖZGEÇMİŞ"] : ["EKLER"]) await page.getByRole("checkbox", { name, exact: true }).check();
  await details(page, false);
  for (const [id, html] of Object.entries(sectionContent)) if (id !== "cv" || degree === "phd") await put(page, id, html);
  await put(page, "main", doc.content);
  await settle(page);
  return doc;
}

/** Rows of a generated index with their labels, and whether every row matches its anchor's sheet. */
const indexState = (page, kind) => page.evaluate((kind) => {
  const rows = [...document.querySelectorAll(`[data-thesis-generated="${kind}"] li`)];
  const matches = rows.every((row) => {
    const anchor = document.querySelector(`[data-thesis-anchor="${row.dataset.indexTarget}"]`);
    if (!anchor) return false;
    const stack = anchor.closest(".thesis-page-stack"); const scale = new DOMMatrixReadOnly(getComputedStyle(stack).transform).a || 1;
    const range = document.createRange(); range.selectNodeContents(anchor);
    const rect = [...range.getClientRects()].find((r) => r.width && r.height);
    const i = Math.floor(((rect.top - stack.getBoundingClientRect().top) / scale + 0.5) / (297 * 96 / 25.4 + 28));
    return row.querySelector(".thesis-index-page").textContent === (stack.querySelectorAll(".thesis-sheet")[i].dataset.thesisPageLabel || "");
  });
  return { rows: rows.map((row) => [row.querySelector(".thesis-index-text").textContent, row.querySelector(".thesis-index-page")?.textContent ?? ""]), matches };
}, kind);

export async function task10bChecks(page, pass, exportFiles, { degree = "phd", title = mcbuThesis("").title } = {}) {
  const result = {};
  // 1) identity
  await details(page, true);
  assert.equal(await page.getByLabel("Tez şablonu", { exact: true }).evaluate((select) => select.selectedOptions[0].textContent), `Manisa Celal Bayar Üniversitesi · Lisansüstü Eğitim Enstitüsü · ${degree === "phd" ? "Doktora" : "Yüksek Lisans"}`);
  await details(page, false);
  pass("MCBÜ template selected in the real editor, full Turkish display name");

  // 2) page model: numbering and geometry
  await settle(page);
  const labels = await sheetLabels(page);
  assert.deepEqual(labels.slice(0, 10), ["", "", "I", "II", "III", "IV", "V", "VI", "VII", "1"]);
  assert.deepEqual(labels.slice(9), labels.slice(9).map((_, i) => String(i + 1)));
  const geometry = await page.evaluate(() => ({
    sheets: [...document.querySelectorAll(".thesis-sheet")].map((s) => [parseFloat(getComputedStyle(s).width), parseFloat(getComputedStyle(s).height)]),
    papers: [...document.querySelectorAll(".thesis-paper")].map((a) => { const s = getComputedStyle(a); return [a.dataset.thesisSection, ...["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"].map((k) => parseFloat(s[k]))]; }),
    columnHeight: parseFloat(getComputedStyle(document.querySelector('.thesis-paper[data-thesis-section="main"] .thesis-page-flow')).columnHeight),
  }));
  for (const [w, h] of geometry.sheets) { near(w, 210 * PX_PER_MM, "sheet width"); near(h, 297 * PX_PER_MM, "sheet height"); }
  for (const [id, top, right, bottom, left] of geometry.papers) { near(top, 25 * PX_PER_MM, `${id} top`); near(right, 25 * PX_PER_MM, `${id} right`); near(bottom, 25 * PX_PER_MM, `${id} bottom`); near(left, 40 * PX_PER_MM, `${id} left`); }
  near(geometry.columnHeight, 247 * PX_PER_MM, "text block height");
  result.labels = labels;
  pass(`${labels.length} A4 sheets, 40/25/25/25 mm on every page group; cover/Taahhütname unnumbered, ÖZET=I … İÇİNDEKİLER=VII, GİRİŞ=1 … ${labels.at(-1)}`);

  // 3) body typography and paragraph semantics
  const style = (selector) => page.locator(selector).first().evaluate((n) => { const s = getComputedStyle(n); return { font: s.fontFamily.replace(/"/g, ""), size: parseFloat(s.fontSize), line: parseFloat(s.lineHeight), align: s.textAlign, indent: parseFloat(s.textIndent), after: parseFloat(s.marginBottom), weight: s.fontWeight, transform: s.textTransform }; });
  const body = await style('[data-thesis-flow-section="main"] .thesis-body p');
  assert.deepEqual([body.font, body.size, body.align], ["Times New Roman", 16, "justify"]);
  near(body.line, 1.5 * 12 * WORD_LINE * 96 / 72, "Word 1.5 lines (20.7 pt)", 0.05);
  near(body.indent, 12.5 * PX_PER_MM, "first-line indent"); near(body.after, 6 * 96 / 72, "paragraph spacing");
  const h1 = await style('[data-thesis-flow-section="main"] h1');
  assert.deepEqual([h1.size, h1.weight, h1.align, h1.transform], [16, "700", "justify", "uppercase"]);
  near(h1.after, 1.5 * 12 * WORD_LINE * 96 / 72, "one empty line after a chapter heading");
  const intro = editable(page, "introduction");
  const paragraphsBefore = await intro.locator("p").count();
  await intro.locator("p").first().evaluate((p) => { const root = p.closest('[contenteditable="true"]'); root.focus(); const range = document.createRange(); range.selectNodeContents(p); range.collapse(false); document.getSelection().removeAllRanges(); document.getSelection().addRange(range); });
  await page.keyboard.press("Shift+Enter"); await page.keyboard.insertText("İç satır ğüşiöç");
  await page.keyboard.press("Enter"); await page.keyboard.insertText("Yeni paragraf İĞÜŞÖÇ");
  await settle(page);
  assert.equal(await intro.locator("p").count(), paragraphsBefore + 1);
  const first = await intro.locator("p").first().evaluate((p) => ({ html: p.innerHTML, text: p.innerText }));
  assert.ok(/<br>|\n/.test(first.html) && first.text.includes("İç satır ğüşiöç"), "Shift+Enter stays in the paragraph");
  assert.equal(await intro.locator("p").nth(1).innerText(), "Yeni paragraf İĞÜŞÖÇ");
  pass("TNR 12 pt / 1.5 / justified, 12.5 mm first line, 6 pt after; H1 bold uppercase + one empty line; Enter = new paragraph, Shift+Enter = line break");

  // 4) special pages: cover, Taahhütname, ÖZET/ABSTRACT, ÖNSÖZ
  const lines = (type) => page.locator(`[data-thesis-special-page="${type}"] .thesis-layout-text`).evaluateAll((nodes) => nodes.map((n) => n.innerText.trim()).filter(Boolean));
  const degreeLine = degree === "phd" ? "DOKTORA TEZİ" : "YÜKSEK LİSANS TEZİ";
  assert.deepEqual(await lines("innerCover"), ["T.C.", "MANİSA CELAL BAYAR ÜNİVERSİTESİ", "LİSANSÜSTÜ EĞİTİM ENSTİTÜSÜ", degreeLine, "EĞİTİM BİLİMLERİ ANABİLİM DALI", "EĞİTİM PROGRAMLARI VE ÖĞRETİM PROGRAMI", title.toLocaleUpperCase("tr"), "Çağrı Şükrü ÖZDOĞAN", "Danışman", "Doç. Dr. İlknur ÇİÇEK", "MANİSA–2026"]);
  const cover = await page.locator('[data-thesis-special-page="innerCover"]').evaluate((root) => ({
    spacers: [...root.querySelectorAll(".thesis-layout-spacer")].map((n) => parseFloat(getComputedStyle(n).height)),
    text: [...root.querySelectorAll(".thesis-layout-text")].map((n) => { const s = getComputedStyle(n); return [s.fontFamily.replace(/"/g, ""), parseFloat(s.fontSize), s.fontWeight, s.textAlign]; }),
  }));
  [13.8, 16.1, 13.8, 98, 80.5, 69, 96.6].forEach((pt, i) => near(cover.spacers[i], pt * 96 / 72, `cover spacer ${i}`));
  [14, 14, 14, 12, 12, 12, 14, 12, 12, 12, 12].forEach((pt, i) => near(cover.text[i][1], pt * 96 / 72, `cover line ${i} size`, 0.01));
  assert.ok(cover.text.every(([font, , weight, align]) => font === "Times New Roman" && weight === "700" && align === "center"));
  const declaration = await lines("declaration");
  assert.equal(declaration[0], "TAAHHÜTNAME");
  assert.equal(declaration[1], "Bu tezin Manisa Celal Bayar Üniversitesi Lisansüstü Eğitim Enstitüsü Eğitim Bilimleri Ana Bilim Dalında akademik ve etik kurallara uygun olarak yazıldığını ve kullanılan tüm literatür bilgilerinin referans gösterilerek tezde yer aldığını, tamamen kendi çalışmam olduğunu, her alıntıya kaynak gösterdiğimi, tezin yazımında akademik ve etik kurallara aykırı herhangi bir yapay zeka ve program kullanmadığımı beyan ederim.");
  assert.deepEqual(declaration.slice(2, 4), ["İmza", "Çağrı Şükrü ÖZDOĞAN"]);
  const abstractPage = await page.locator('.thesis-paper[data-thesis-section="abstract-header"]').evaluate((a) => ({ pages: Number(a.dataset.thesisPageCount), sections: [...a.querySelectorAll("[data-thesis-flow-section]")].map((s) => s.dataset.thesisFlowSection), text: a.innerText }));
  assert.equal(abstractPage.pages, 1);
  assert.deepEqual(abstractPage.sections, ["abstract-header", "abstract", "abstract-footer"]);
  for (const text of ["ÖZET", degree === "phd" ? "Doktora Tezi" : "Yüksek Lisans Tezi", "Manisa Celal Bayar Üniversitesi", "Lisansüstü Eğitim Enstitüsü", "Eğitim Bilimleri Anabilim Dalı", "Danışman: Doç. Dr. İlknur ÇİÇEK", "İkinci Danışman: Dr. Öğr. Üyesi Gökhan IŞIK", "Bu araştırmanın amacı", "Anahtar Kelimeler: dijital okuryazarlık, çevrimiçi öğrenme, öğretmen adayı, öz yeterlik, uzaktan eğitim", `2026, ${labels.length} sayfa`]) assert.ok(abstractPage.text.includes(text), text);
  const english = await page.locator('.thesis-paper[data-thesis-section="abstract-en-header"]').innerText();
  for (const text of ["ABSTRACT", degree === "phd" ? "PhD Thesis" : "M.Sc. Thesis", "Graduate School of Education", "Department of Educational Sciences", "Supervisor: Doç. Dr. İlknur ÇİÇEK", "Keywords: digital literacy", `2026, ${labels.length} pages`]) assert.ok(english.includes(text), text);
  const preface = await page.locator('.thesis-paper[data-thesis-section="preface"]').evaluate((a) => ({ text: a.innerText, p: (() => { const s = getComputedStyle(a.querySelector('[data-thesis-flow-section="preface"] .thesis-body p')); return [parseFloat(s.lineHeight), parseFloat(s.marginBottom), parseFloat(s.textIndent)]; })() }));
  assert.ok(/Çağrı Şükrü ÖZDOĞAN\s+Manisa, 2026/.test(preface.text));
  assert.deepEqual(preface.p.map((v) => Math.round(v * 10) / 10), [16 * WORD_LINE, 16 * WORD_LINE, Math.round(12.5 * PX_PER_MM * 10) / 10].map((v) => Math.round(v * 10) / 10));
  pass("İç Kapak, Taahhütname (official text + department), ÖZET/ABSTRACT (header, editable text, keywords on one page) and ÖNSÖZ (single spacing, signature) from template data");

  // 5) metadata live update + advisory keyword validation
  const warning = page.getByRole("status").filter({ hasText: "belge uyarısı" });
  assert.equal(await warning.count(), 0);
  await details(page, true);
  await page.getByLabel("Anahtar kelimeler (en az 5, virgülle)", { exact: true }).fill("dijital; çevrimiçi, öğretmen");
  await page.getByLabel("Ad SOYAD *", { exact: true }).fill("Ayşe IŞIK");
  await warning.waitFor();
  assert.match(await warning.getAttribute("title"), /Anahtar Kelimeler en az 5 tane olmalı/);
  assert.match(await page.locator('[data-thesis-special-page="innerCover"]').innerText(), /Ayşe IŞIK/);
  await page.getByLabel("Anahtar kelimeler (en az 5, virgülle)", { exact: true }).fill("dijital okuryazarlık, çevrimiçi öğrenme, öğretmen adayı, öz yeterlik, uzaktan eğitim");
  await page.getByLabel("Ad SOYAD *", { exact: true }).fill("Çağrı Şükrü ÖZDOĞAN");
  await warning.waitFor({ state: "detached" });
  pass("metadata edits update the cover live; fewer than 5 comma-separated keywords is a non-blocking warning");

  // 6) caption numbering choice (document-wide), then back to the default
  await page.getByLabel("Şekil ve tablo numaralandırma", { exact: true }).selectOption("chapter");
  await page.waitForFunction(() => document.querySelector('[data-thesis-generated="figures"]')?.textContent.includes("Şekil 1.1."));
  assert.match(await page.locator('[data-thesis-generated="tables"]').innerText(), /Tablo 1\.1\./);
  await page.getByLabel("Şekil ve tablo numaralandırma", { exact: true }).selectOption("document");
  await page.waitForFunction(() => document.querySelector('[data-thesis-generated="figures"]')?.textContent.includes("Şekil 2."));
  await details(page, false);
  await settle(page);
  pass("figure/table numbering: one document-wide choice between 1, 2, 3 and per-chapter 1.1, 2.1");

  // 7) generated indexes with real page labels
  const toc = await indexState(page, "toc");
  const tocText = toc.rows.map(([text]) => text);
  assert.deepEqual(tocText, ["ÖZET", "ABSTRACT", "ÖNSÖZ VE TEŞEKKÜR", "SİMGELER VE KISALTMALAR DİZİNİ", "ŞEKİLLER DİZİNİ", "TABLOLAR DİZİNİ", "İÇİNDEKİLER", "GİRİŞ", "1. KURAMSAL ÇERÇEVE", "1.1. Dijital Okuryazarlığın Boyutları", "1.1.1. Bilgi Okuryazarlığı", "1.1.1.1. Çevrimiçi Kaynak Değerlendirme", "1.2. İlgili Araştırmalar", "2. YÖNTEM", "2.1. Çalışma Grubu", "2.2. Veri Toplama Araçları", "3. BULGULAR VE TARTIŞMA", "4. SONUÇ VE ÖNERİLER", "KAYNAKÇA", "EKLER"]);
  assert.deepEqual(toc.rows.slice(0, 8).map(([, label]) => label), ["I", "II", "III", "IV", "V", "VI", "VII", "1"]);
  assert.ok(toc.matches, "every TOC row equals its heading's sheet label");
  const figures = await indexState(page, "figures"), tables = await indexState(page, "tables");
  assert.deepEqual(figures.rows.map(([t]) => t), ["Şekil 1. Dijital okuryazarlık boyutları", "Şekil 2. Araştırma sürecinin aşamaları: veri toplama, çözümleme, raporlama ve bulguların uzman görüşleriyle karşılaştırılarak doğrulanması adımlarını gösteren ayrıntılı akış şeması"]);
  assert.deepEqual(tables.rows.map(([t]) => t), ["Tablo 1. Katılımcıların demografik özellikleri", "Tablo 2. Ölçeğin alt boyutlarına ilişkin güvenirlik katsayıları ve madde sayıları ile açıklanan varyans oranlarının karşılaştırmalı gösterimi"]);
  assert.ok(figures.matches && tables.matches, "index rows equal their captions' sheet labels");
  assert.equal(await page.locator(".thesis-index-page-heading").allInnerTexts().then((t) => t.join()), "Sayfa,Sayfa");
  result.indexes = { toc: toc.rows, figures: figures.rows, tables: tables.rows };
  pass(`İÇİNDEKİLER (${toc.rows.length} rows, ÖZET I … GİRİŞ 1 … ${toc.rows.at(-1).join(" ")}), ŞEKİLLER/TABLOLAR DİZİNİ with "Sayfa" and measured page labels`);

  // 8) captions: position, alignment, table body
  const captions = await page.locator('[data-thesis-flow-section="main"]').evaluate((root) => ({
    figures: [...root.querySelectorAll("figure")].map((f) => ({ last: f.lastElementChild.tagName, auto: f.querySelector("figcaption").dataset.thesisCaptionAuto, align: getComputedStyle(f.querySelector("figcaption")).textAlign, color: getComputedStyle(f.querySelector("figcaption")).color })),
    tables: [...root.querySelectorAll("table")].map((t) => ({ side: getComputedStyle(t.querySelector("caption")).captionSide, align: getComputedStyle(t.querySelector("caption")).textAlign, cell: [getComputedStyle(t.querySelector("td")).textAlign, parseFloat(getComputedStyle(t.querySelector("td")).lineHeight)] })),
  }));
  assert.deepEqual(captions.figures.map((f) => [f.last, f.auto, f.align, f.color]), [["FIGCAPTION", "center", "center", "rgb(17, 17, 17)"], ["FIGCAPTION", "justify", "justify", "rgb(17, 17, 17)"]]);
  assert.deepEqual(captions.tables.map((t) => [t.side, t.align, t.cell[0], Math.round(t.cell[1] * 100) / 100]), [["top", "center", "center", 16 * WORD_LINE], ["top", "justify", "center", 16 * WORD_LINE]].map((row) => row.map((v) => (typeof v === "number" ? Math.round(v * 100) / 100 : v))));
  pass("Şekil caption below / Tablo caption above; one line centered, longer justified; table cells centered, single spaced");

  // 9) page-bottom footnotes, TNR 10 pt
  const notes = await footnoteState(page, "main");
  assertConsistent(notes, "MCBÜ main");
  assert.ok(notes.areas.length >= 2, "notes on several pages");
  const noteFont = await page.locator('.thesis-footnote-area[data-thesis-footnote-group="main"]:not([data-thesis-footnote-measure]) .thesis-footnote').first().evaluate((n) => [getComputedStyle(n.closest(".thesis-footnote-area")).fontFamily.replace(/"/g, ""), parseFloat(getComputedStyle(n.closest(".thesis-footnote-area")).fontSize)]);
  assert.equal(noteFont[0], "Times New Roman"); near(noteFont[1], 10 * 96 / 72, "footnote size", 0.01);
  const introNotes = await footnoteState(page, "introduction"); assertConsistent(introNotes, "MCBÜ introduction");
  pass(`page-bottom footnotes (Times New Roman 10 pt) on the reference's page: ${notes.refs.map((r) => `${r.label}@${r.page + 1}`).join(", ")} in the body, ${introNotes.refs.length} in GİRİŞ`);

  // 10) CV (doctorate only) and back matter
  if (degree === "phd") {
    const cv = await style('[data-thesis-flow-section="cv"] h1');
    assert.deepEqual([cv.align, cv.weight], ["center", "700"]); near(cv.size, 14 * 96 / 72, "ÖZGEÇMİŞ size", 0.01);
    assert.ok(!tocText.some((t) => /ÖZGEÇMİŞ/.test(t)));
    pass("ÖZGEÇMİŞ present for the doctorate: centered 14 pt bold, no chapter number, not in İÇİNDEKİLER");
  }

  // 11) exports
  const files = await exportFiles();
  const { getDocument, OPS } = await import(new URL("../node_modules/pdfjs-dist/legacy/build/pdf.mjs", import.meta.url).href);
  const pdfBytes = new Uint8Array(await readFile(files.pdf));
  const pdf = await getDocument({ data: pdfBytes.slice(), useSystemFonts: true, disableFontFace: true }).promise;
  const sheets = await sheetLabels(page);
  assert.equal(pdf.numPages, sheets.length, "PDF pages = editor sheets");
  const pdfPages = [], usedFonts = new Set();
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const p = await pdf.getPage(i);
    // Fonts actually selected in the page content (jsPDF also declares the unused standard 14).
    const ops = await p.getOperatorList();
    ops.fnArray.forEach((fn, k) => { if (fn === OPS.setFont) usedFonts.add(String(p.commonObjs.get(ops.argsArray[k][0])?.name || "").replace(/^[A-Z]{6}\+/, "")); });
    const [, , width, height] = p.view;
    const items = (await p.getTextContent()).items.filter((item) => item.str.trim());
    const footer = items.filter((item) => item.transform[5] < 25 * PT_PER_MM).map((item) => item.str.trim()).join("");
    const bodyItems = items.filter((item) => item.transform[5] >= 25 * PT_PER_MM);
    pdfPages.push({ width, height, footer, text: items.map((item) => item.str).join(" "), left: Math.min(...bodyItems.map((item) => item.transform[4])), right: Math.max(...bodyItems.map((item) => item.transform[4] + item.width)), top: Math.max(...bodyItems.map((item) => item.transform[5])) });
  }
  pdfPages.forEach((p, i) => { near(p.width, 595.28, `PDF ${i + 1} width`, 0.5); near(p.height, 841.89, `PDF ${i + 1} height`, 0.5); assert.equal(p.footer, sheets[i], `PDF page ${i + 1} label`); });
  const giris = pdfPages[9];
  near(giris.left, 40 * PT_PER_MM, "PDF left margin", 1); assert.ok(giris.right <= (210 - 25) * PT_PER_MM + 1, `right ${giris.right}`); assert.ok(giris.top <= (297 - 25) * PT_PER_MM, `top ${giris.top}`);
  for (const [i, text] of [[0, "T.C."], [0, "ÇEVRİMİÇİ ÖĞRENME ORTAMLARINDA"], [1, "TAAHHÜTNAME"], [2, "Anahtar Kelimeler:"], [3, "Keywords:"], [8, "İÇİNDEKİLER"], [9, "GİRİŞ"], [9, "ığdır, şişe, ÇĞİÖŞÜ çğıöşü"]]) assert.ok(pdfPages[i].text.replace(/\s+/g, " ").includes(text), `PDF page ${i + 1}: ${text}`);
  const fonts = [...usedFonts].sort();
  assert.ok(fonts.length && fonts.every((name) => /^TimesNewRomanPS/.test(name)), `PDF fonts ${fonts}`);
  assert.doesNotMatch(Buffer.from(pdfBytes).toString("latin1"), /\/BaseFont\s+\/Tinos/);
  result.pdf = { pages: pdf.numPages, fonts, embeddedFonts: assertTimesNewRomanEmbedded(pdfBytes) };
  pass(`PDF: ${pdf.numPages} A4 pages = editor, same labels per page, 40/25 mm text block, Turkish text extractable, fonts ${fonts.join(", ")}`);

  const zip = unzipSync(new Uint8Array(await readFile(files.docx)));
  const xml = strFromU8(zip["word/document.xml"]), stylesXml = strFromU8(zip["word/styles.xml"]), notesXml = strFromU8(zip["word/footnotes.xml"]);
  const has = (text, pattern, label) => assert.ok(pattern.test(text), label);
  const sections = [...xml.matchAll(/<w:sectPr>[\s\S]*?<\/w:sectPr>/g)].map((m) => m[0]);
  assert.ok(sections.length >= 13);
  assert.ok(sections.every((s) => /<w:pgSz w:w="11906" w:h="16838"/.test(s) && /w:top="1417" w:right="1417" w:bottom="1417" w:left="2268"/.test(s)), "A4 + margins in every section");
  const numbering = sections.map((s) => (s.match(/<w:pgNumType([^>]*)\/>/) || [, ""])[1]);
  assert.ok(numbering.some((n) => /w:start="1"/.test(n) && /upperRoman/.test(n)) && numbering.some((n) => /w:start="1"/.test(n) && /decimal/.test(n)));
  has(xml, /<w:ind [^>]*w:firstLine="709"/, "12.5 mm first line"); has(xml, /<w:spacing (?=[^>]*w:after="120")(?=[^>]*w:line="360")(?=[^>]*w:lineRule="auto")[^>]*\/>/, "6 pt / Word 1.5 lines");
  has(xml, /<w:pStyle w:val="Heading4"\/>/, "Heading4 paragraph"); has(stylesXml, /w:styleId="Heading4"/, "Heading4 style");
  assert.equal((xml.match(/<w:footnoteReference /g) || []).length, 4);
  has(notesXml, /<w:sz w:val="20"\/>/, "footnotes 10 pt"); has(notesXml, /Times New Roman/, "footnote font");
  assert.equal((xml.match(/<w:tbl>/g) || []).length, 2); assert.equal((xml.match(/<w:drawing>/g) || []).length, 3); // two thesis figures + official cover logo
  const start = xml.indexOf("1. KURAMSAL ÇERÇEVE");
  assert.ok(xml.indexOf("Tablo 1. Katılımcıların", start) < xml.indexOf("<w:tbl>", start) && xml.indexOf("<w:drawing>", start) < xml.indexOf("Şekil 1. Dijital", start), "caption above table, below figure");
  for (const text of ["TAAHHÜTNAME", "Anahtar Kelimeler:", "Keywords:", "İÇİNDEKİLER", ">Sayfa<", "ÇEVRİMİÇİ ÖĞRENME ORTAMLARINDA", "MANİSA–2026"]) assert.ok(xml.includes(text), `DOCX ${text}`);
  result.docx = { sections: sections.length };
  pass(`DOCX: ${sections.length} Word sections, exact A4 + 40/25/25/25 mm, Roman restart at ÖZET and Arabic restart at GİRİŞ, TNR paragraphs (1.25 cm, 6 pt, 1.5), Heading4, 2 tables, 2 figures + cover logo, captions, 4 real footnotes at 10 pt`);
  result.files = files;
  return result;
}
