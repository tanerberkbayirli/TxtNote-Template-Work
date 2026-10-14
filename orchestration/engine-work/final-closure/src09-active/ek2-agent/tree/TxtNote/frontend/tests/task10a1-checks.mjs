import assert from "node:assert/strict";
import { TYPE_DELAY_MS } from "../src/lib/undoHistory.js";

const main = (page) => page.locator('[data-thesis-flow-section="main"] .rich-text-body[contenteditable="true"]');
const frames = (page, n = 2) => page.evaluate((n) => new Promise((resolve) => { const step = (i) => i ? requestAnimationFrame(() => step(i - 1)) : resolve(); step(n); }), n);
const put = async (page, html) => {
  await main(page).evaluate((root, html) => { root.innerHTML = html; root.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" })); }, html);
  await settle(page);
  await page.waitForTimeout(TYPE_DELAY_MS + 100);
};
/** Wait until the note areas and index rows stop changing (the editor's own bounded loop). */
export async function settle(page) {
  let last = "";
  for (let i = 0; i < 40; i += 1) {
    await frames(page, 3);
    const now = JSON.stringify(await footnoteState(page));
    if (now === last) return;
    last = now;
  }
}
export const fn = (id, text) => `<sup class="academic-footnote" contenteditable="false" data-fn-id="${id}" data-fn-text="${text}">1</sup>`;
export const para = (text, n = 1) => `<p>${Array.from({ length: n }, () => text).join(" ")}</p>`;

/**
 * Physical facts read from the editor DOM: page of every reference (by its rendered
 * rect), page/labels of every drawn note area, and the lowest body line of each page.
 */
export function footnoteState(page, sectionId = "main") {
  return page.evaluate((sectionId) => {
    const article = document.querySelector(`.thesis-paper[data-thesis-section="${sectionId}"]`);
    if (!article) return null;
    const stack = article.closest(".thesis-page-stack");
    const scale = new DOMMatrixReadOnly(getComputedStyle(stack).transform).a || 1;
    const origin = stack.getBoundingClientRect().top;
    const sheets = [...stack.querySelectorAll(".thesis-sheet")];
    const stride = sheets.length > 1 ? (sheets[1].getBoundingClientRect().top - sheets[0].getBoundingClientRect().top) / scale : 297 * 96 / 25.4 + 28;
    const y = (value) => (value - origin) / scale;
    const pageOf = (value) => Math.floor((y(value) + 0.5) / stride);
    const refs = [...article.querySelectorAll("sup.academic-footnote")].map((node) => {
      const rect = [...node.getClientRects()].find((r) => r.width || r.height);
      return { label: node.textContent.trim(), text: node.dataset.fnText, page: rect ? pageOf(rect.top) : -1 };
    });
    const areas = [...stack.querySelectorAll(".thesis-footnote-area:not([data-thesis-footnote-measure])")].map((area) => {
      const box = area.getBoundingClientRect();
      const sheetBottom = (pageOf(box.top) * stride) + stride - 28;
      return {
        page: pageOf(box.top), top: y(box.top), bottom: y(box.bottom), sheetBottom,
        labels: [...area.querySelectorAll(".thesis-footnote")].map((li) => li.querySelector(".thesis-footnote-label")?.textContent || "+"),
        texts: [...area.querySelectorAll(".thesis-footnote")].map((li) => li.textContent.replace(/^\d+\s/, "")),
        separator: Boolean(area.querySelector(".thesis-footnote-separator")),
        font: getComputedStyle(area).fontSize, family: getComputedStyle(area).fontFamily,
      };
    });
    // Lowest rendered body glyph per page.
    const bodyBottom = {};
    const walker = document.createTreeWalker(article.querySelector(".thesis-page-flow"), NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.data.trim()) continue;
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) {
        if (!rect.height) continue;
        const p = pageOf(rect.top);
        bodyBottom[p] = Math.max(bodyBottom[p] ?? -Infinity, y(rect.bottom));
      }
    }
    return { pages: Number(article.dataset.thesisPageCount), total: Number(document.querySelector("[data-thesis-total-pages]")?.dataset.thesisTotalPages), refs, areas, bodyBottom, stamps: article.querySelectorAll("[data-thesis-fn-stamp]").length, sectionEndLists: article.querySelectorAll(".academic-footnote-list").length };
  }, sectionId);
}

/** Every reference's note is on the reference's page, in order, and nothing overlaps a note area. */
export function assertConsistent(state, label = "") {
  const byPage = {};
  for (const ref of state.refs) (byPage[ref.page] ||= []).push(ref.label);
  for (const area of state.areas) {
    const own = area.labels.filter((item) => item !== "+");
    assert.deepEqual(own, byPage[area.page] || [], `${label} page ${area.page + 1}: notes ${own} vs refs ${byPage[area.page]}`);
    assert.ok(area.bottom <= area.sheetBottom + 1, `${label} page ${area.page + 1}: area below sheet`);
    const body = state.bodyBottom[area.page];
    assert.ok(body === undefined || body <= area.top + 1, `${label} page ${area.page + 1}: body ${body} overlaps notes at ${area.top}`);
  }
  for (const [page, labels] of Object.entries(byPage)) assert.ok(state.areas.some((area) => area.page === Number(page)), `${label} page ${Number(page) + 1}: refs ${labels} without a note area`);
  assert.equal(state.sectionEndLists, 0, `${label} legacy section-end list still rendered`);
}

export const briefState = (state) => JSON.stringify({ pages: state.pages, total: state.total, refs: state.refs.map((r) => `${r.label}@${r.page}`), areas: state.areas.map((a) => `${a.page}:${a.labels.join(",")}`) });

/**
 * Representative thesis (headings, table, list, several pages, four notes on at least
 * two physical pages) in the real editor: placement, reflow both ways, TOC, PDF and
 * DOCX. `exportFiles()` returns { pdf, docx } paths (browser download or packaged save).
 */
export async function task10a1Checks(page, pass, exportFiles) {
  const L = "Akademik paragraf metni uzun bir cümle olarak devam eder ve sayfayı doldurur.";
  const filler = (n, tag) => Array.from({ length: n }, (_, i) => para(`${tag}${i} ${L} ${L}`)).join("");
  await page.getByLabel("Yakınlaştır", { exact: true }).selectOption("100");
  await put(page, `<h1>Giriş</h1>${filler(3, "A")}<p>İlk referans${fn("s1", "Birinci temsilî dipnot.")} cümlesi.</p><h2>Tablo ve liste</h2><table><tbody><tr><td>Hücre${fn("s2", "Tablo hücresindeki dipnot.")}</td><td>B</td></tr><tr><td>C</td><td>D</td></tr></tbody></table><ol><li>Birinci madde</li><li>İkinci madde</li></ol>${filler(9, "B")}<h2>İkinci bölüm</h2><p>Sonraki sayfa${fn("s3", "Üçüncü temsilî dipnot.")} ve${fn("s4", "Dördüncü temsilî dipnot.")} burada.</p>${filler(6, "C")}`);
  let state = await footnoteState(page);
  assertConsistent(state, "representative");
  assert.equal(state.refs.length, 4);
  assert.ok(new Set(state.areas.map((a) => a.page)).size >= 2 && state.pages >= 2, briefState(state));
  const toc = await page.evaluate(() => [...document.querySelectorAll('[data-thesis-generated="toc"] li')].map((row) => [row.querySelector(".thesis-index-text")?.textContent || "", row.querySelector(".thesis-index-page")?.textContent || ""]));
  const headingLabel = await page.evaluate(() => { const h = [...document.querySelectorAll('[data-thesis-flow-section="main"] h2')].pop(); const stack = h.closest(".thesis-page-stack"); const scale = new DOMMatrixReadOnly(getComputedStyle(stack).transform).a || 1; const sheets = stack.querySelectorAll(".thesis-sheet"); const stride = sheets.length > 1 ? (sheets[1].getBoundingClientRect().top - sheets[0].getBoundingClientRect().top) / scale : 1150.5; return sheets[Math.floor(((h.getBoundingClientRect().top - stack.getBoundingClientRect().top) / scale + 0.5) / stride)].dataset.thesisPageLabel; });
  assert.equal(toc.find(([text]) => text.includes("İkinci bölüm"))?.[1], headingLabel);
  pass(`packaged notes: 4 references on ${new Set(state.areas.map((a) => a.page)).size} pages, each note under its reference's page (${state.areas.map((a) => `${a.page + 1}:${a.labels.join(",")}`).join(" ")}); TOC "İkinci bölüm" = ${headingLabel}`);
  const initial = briefState(state);

  await main(page).evaluate((root) => { root.focus(); document.getSelection().collapse(root.querySelector("p").firstChild, 0); });
  let typed = 0;
  const firstPage = state.refs[0].page;
  while ((await footnoteState(page)).refs[0].page === firstPage && typed < 25) { await page.keyboard.insertText(`EKLENEN${typed} ${L} ${L}`); await page.keyboard.press("Enter"); typed += 1; await settle(page); }
  state = await footnoteState(page);
  assertConsistent(state, "packaged forward");
  assert.equal(state.refs[0].page, firstPage + 1);
  await main(page).evaluate((root, typed) => { const range = document.createRange(); range.setStart(root.querySelectorAll("p")[0], 0); range.setEnd(root.querySelectorAll("p")[typed].firstChild, 0); document.getSelection().removeAllRanges(); document.getSelection().addRange(range); }, typed);
  await page.keyboard.press("Backspace"); await settle(page);
  state = await footnoteState(page);
  assertConsistent(state, "packaged backward");
  assert.equal(briefState(state), initial);
  pass(`packaged reflow: ${typed} typed paragraphs moved note 1 with its reference to the next page; deleting them restored the exact layout`);

  const files = await exportFiles();
  const { readFile } = await import("node:fs/promises");
  const { getDocument } = await import("../node_modules/pdfjs-dist/legacy/build/pdf.mjs");
  const pdf = await getDocument({ data: new Uint8Array(await readFile(files.pdf)), useSystemFonts: true, disableFontFace: true }).promise;
  assert.equal(pdf.numPages, state.total);
  const physical = await page.evaluate(() => [...document.querySelector('.thesis-paper[data-thesis-section="main"]').closest(".thesis-page-stack").querySelectorAll(".thesis-sheet")].map((s) => Number(s.dataset.thesisPage)));
  for (const ref of state.refs) {
    const items = (await (await pdf.getPage(physical[ref.page])).getTextContent()).items.filter((item) => item.str.trim());
    const note = items.filter((item) => item.transform[3] < 10.5 && item.str.trim().length > 2 && ref.text.includes(item.str.trim()));
    assert.ok(note.length, `PDF page ${physical[ref.page]} lacks note ${ref.label}`);
    const bodyY = Math.min(...items.filter((item) => item.transform[3] > 10.5 && !/^\d+$/.test(item.str.trim())).map((item) => item.transform[5]));
    assert.ok(Math.max(...note.map((item) => item.transform[5])) < bodyY, `PDF note ${ref.label} not below body`);
  }
  const { strFromU8, unzipSync } = await import("fflate");
  const docx = unzipSync(new Uint8Array(await readFile(files.docx)));
  assert.equal((strFromU8(docx["word/document.xml"]).match(/<w:footnoteReference /g) || []).length, 4);
  for (const text of ["Birinci temsilî dipnot.", "Tablo hücresindeki dipnot.", "Üçüncü temsilî dipnot.", "Dördüncü temsilî dipnot."]) assert.ok(strFromU8(docx["word/footnotes.xml"]).includes(text), text);
  pass(`packaged PDF ${pdf.numPages} pages = editor, every note on its reference's physical page below the body; DOCX keeps 4 real Word footnotes`);
  return { layout: initial, files };
}

export { main, put, frames };
