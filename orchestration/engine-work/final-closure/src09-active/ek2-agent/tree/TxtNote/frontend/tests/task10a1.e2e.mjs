// Task 10A.1: page-bottom footnotes on the real thesis editor, PDF and DOCX.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { assertConsistent, fn, footnoteState, main, para, put, settle, task10a1Checks } from "./task10a1-checks.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "C:/Users/CASPER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
const errors = [], checks = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (e) => { if (/content security policy|refused to|uncaught/i.test(e.text())) errors.push(e.text()); });
const out = new URL("../../output/task10a1/", import.meta.url);
const file = (name) => new URL(name, out).pathname.replace(/^\/(\w:)/, "$1");
await mkdir(out, { recursive: true });
const pass = (message) => { checks.push(message); console.log(`PASS ${message}`); };
const L = "Akademik paragraf metni uzun bir cümle olarak devam eder ve sayfayı doldurur.";
const filler = (n, tag = "") => Array.from({ length: n }, (_, i) => para(`${tag}${i} ${L} ${L}`)).join("");
const unstable = () => page.getByRole("alert").filter({ hasText: "kararlı" }).count();
const brief = (state) => JSON.stringify({ pages: state.pages, total: state.total, refs: state.refs.map((r) => `${r.label}@${r.page}`), areas: state.areas.map((a) => `${a.page}:${a.labels.join(",")}`) });

try {
  await page.goto(`${process.argv[2] || "http://127.0.0.1:5175"}/tests/thesis.html`);
  await page.evaluate(() => localStorage.clear()); await page.reload();
  await main(page).waitFor();
  await page.getByLabel("Yakınlaştır", { exact: true }).selectOption("100");

  // A) single note
  await put(page, filler(3) + `<p>Referans cümlesi${fn("fa", "Birinci dipnot metni.")} burada.</p>` + filler(2));
  let state = await footnoteState(page);
  assertConsistent(state, "A");
  assert.deepEqual(state.areas.map((a) => [a.page, a.labels]), [[0, ["1"]]]);
  assert.ok(state.areas[0].separator);
  assert.equal(state.areas[0].font, "12px"); // generic default 9 pt from the rule, not a university value
  const contentBottom = await page.evaluate(() => { const s = document.querySelector('.thesis-paper[data-thesis-section="main"]').closest(".thesis-page-stack"); const sheet = s.querySelector(".thesis-sheet"); return (297 - 25) * 96 / 25.4 + (sheet.getBoundingClientRect().top - s.getBoundingClientRect().top); });
  assert.ok(Math.abs(state.areas[0].bottom - contentBottom) < 1.5, `area bottom ${state.areas[0].bottom} vs content bottom ${contentBottom}`);
  pass("A single: reference on page 1, its note at the bottom of page 1 above the bottom margin, separator, template size");

  // B) multiple notes, several pages, order kept
  await put(page, Array.from({ length: 30 }, (_, i) => `<p>${L} ${L} ${i % 4 === 1 ? fn(`fb${i}`, `Dipnot ${i}. ${L}`) : ""} ${L}</p>`).join(""));
  state = await footnoteState(page);
  assertConsistent(state, "B");
  const byArea = state.areas.map((a) => a.labels);
  assert.ok(byArea.length >= 2 && byArea.some((labels) => labels.length >= 2), JSON.stringify(byArea));
  assert.deepEqual(byArea.flat(), state.refs.map((r) => r.label));
  assert.deepEqual(byArea.flat().map(Number), byArea.flat().map((_, i) => i + 1));
  pass(`B multiple: ${state.refs.length} notes on ${state.areas.length} pages (${byArea.map((l) => l.join(",")).join(" | ")}), document order`);

  // D) body capacity: the page with notes ends its body above them; pages are fuller without notes.
  for (const area of state.areas) assert.ok(state.bodyBottom[area.page] <= area.top + 1);
  const withoutNotes = await (async () => {
    await put(page, Array.from({ length: 30 }, (_, i) => `<p>${L} ${L} ${L}</p>`).join(""));
    return footnoteState(page);
  })();
  assert.ok(withoutNotes.bodyBottom[0] > state.bodyBottom[0] + 20, `${withoutNotes.bodyBottom[0]} vs ${state.bodyBottom[0]}`);
  pass(`D space: body ends at ${Math.round(state.bodyBottom[0])}px above notes at ${Math.round(state.areas[0].top)}px (without notes ${Math.round(withoutNotes.bodyBottom[0])}px); no overlap on any page`);

  // C) reflow by real typing: forward then backward
  await put(page, filler(9, "ORJ") + `<p>Taşınan referans${fn("fc", "Taşınan dipnot metni.")} cümlesi.</p>` + filler(6, "SON"));
  state = await footnoteState(page);
  assertConsistent(state, "C0");
  assert.equal(state.refs[0].page, 0);
  await main(page).evaluate((root) => { root.focus(); const text = root.querySelector("p").firstChild; document.getSelection().collapse(text, 0); });
  let typed = 0;
  while ((await footnoteState(page)).refs[0].page === 0 && typed < 20) {
    await page.keyboard.insertText(`EKLENEN${typed} ${L} ${L}`); await page.keyboard.press("Enter"); typed += 1;
    await settle(page);
  }
  state = await footnoteState(page);
  assertConsistent(state, "C forward");
  assert.equal(state.refs[0].page, 1);
  assert.deepEqual(state.areas.map((a) => a.page), [1]);
  const caret = await page.evaluate(() => { const s = document.getSelection(); const host = s.focusNode?.parentElement?.closest("p"); return { focused: document.activeElement?.getAttribute("contenteditable"), text: host?.textContent || "", inserted: (document.querySelector('[data-thesis-flow-section="main"] .rich-text-body').textContent.match(/EKLENEN\d+/g) || []).length }; });
  assert.equal(caret.focused, "true"); assert.match(caret.text, /^ORJ0/); assert.equal(caret.inserted, typed);
  await page.keyboard.insertText("X");
  assert.match(await main(page).locator("p").nth(typed).innerText(), /^XORJ0/);
  await page.keyboard.press("Backspace");
  pass(`C forward: ${typed} typed paragraphs moved the reference to page 2 and its note with it; caret/focus kept, no duplicated text`);
  await main(page).evaluate((root, typed) => {
    const range = document.createRange(); range.setStart(root.querySelector("p").firstChild, 0); range.setStart(root.querySelector("p"), 0);
    range.setEnd(root.querySelectorAll("p")[typed].firstChild, 0);
    document.getSelection().removeAllRanges(); document.getSelection().addRange(range);
  }, typed);
  await page.keyboard.press("Backspace");
  await settle(page);
  state = await footnoteState(page);
  assertConsistent(state, "C backward");
  assert.equal(state.refs[0].page, 0); assert.deepEqual(state.areas.map((a) => a.page), [0]);
  assert.doesNotMatch(await main(page).innerText(), /EKLENEN/);
  pass("C backward: deleting the text returns the reference and its note to page 1");

  // E) long note: split, continued, capped, deterministic
  const longText = Array.from({ length: 420 }, (_, i) => `uzun${i}`).join(" ");
  await put(page, filler(2) + `<p>Uzun dipnot${fn("fe", longText)} burada ve ikinci${fn("fe2", "Kısa ikinci dipnot.")}.</p>` + filler(14, "E"));
  state = await footnoteState(page);
  assert.equal(await unstable(), 0);
  const noteParts = state.areas.flatMap((a) => a.texts.map((text, i) => ({ page: a.page, label: a.labels[i], text })));
  const first = noteParts.filter((part) => part.label === "1" || (part.label === "+" && part.text.includes("uzun")));
  assert.ok(first.length >= 2, "long note split across pages");
  assert.equal(first.map((part) => part.text.trim()).join(" ").replace(/\s+/g, " "), longText);
  const cap = 0.5 * (297 - 25 - 25) * 96 / 25.4;
  for (const area of state.areas) assert.ok(area.bottom - area.top <= cap + 2, `area ${area.bottom - area.top} > ${cap}`);
  for (const area of state.areas) assert.ok(state.bodyBottom[area.page] === undefined || state.bodyBottom[area.page] <= area.top + 1);
  assert.equal(state.refs[0].page, state.areas.find((a) => a.labels.includes("1")).page);
  const again = await footnoteState(page); await settle(page);
  assert.equal(brief(await footnoteState(page)), brief(again));
  pass(`E long note: ${longText.length} chars split over ${first.length} pages (≤50% area each, continuation first on the next page), nothing lost/clipped/overlapping, stable`);

  // F) zoom independence
  await put(page, Array.from({ length: 30 }, (_, i) => `<p>${L} ${L} ${i % 3 === 1 ? fn(`ff${i}`, `Zoom dipnotu ${i}. ${L}`) : ""} ${L}</p>`).join(""));
  const zooms = {};
  for (const level of ["50", "150", "100"]) {
    await page.getByLabel("Yakınlaştır", { exact: true }).selectOption(level); await settle(page);
    const s = await footnoteState(page); assertConsistent(s, `zoom ${level}`); zooms[level] = brief(s);
  }
  assert.equal(zooms["50"], zooms["100"]); assert.equal(zooms["150"], zooms["100"]);
  pass(`F zoom 50/100/150: identical page count and note assignment ${zooms["100"].slice(0, 120)}…`);

  // G) TOC follows the pagination changed by notes
  const tocRows = () => page.evaluate(() => [...document.querySelectorAll('[data-thesis-generated="toc"] li')].map((row) => [row.querySelector(".thesis-index-text")?.textContent, row.querySelector(".thesis-index-page")?.textContent]));
  const headingPage = () => page.evaluate(() => { const h = [...document.querySelectorAll('[data-thesis-flow-section="main"] h2')].find((n) => n.textContent.includes("Hedef")); const stack = h.closest(".thesis-page-stack"); const scale = new DOMMatrixReadOnly(getComputedStyle(stack).transform).a || 1; const i = Math.floor(((h.getBoundingClientRect().top - stack.getBoundingClientRect().top) / scale + .5) / (297 * 96 / 25.4 + 28)); return stack.querySelectorAll(".thesis-sheet")[i].dataset.thesisPageLabel; });
  const tocDoc = (notes) => `<h1>Giriş</h1>` + Array.from({ length: 11 }, (_, i) => `<p>${L} ${L} ${notes ? fn(`fg${i}`, `TOC etkisi dipnotu ${i}. ${L} ${L}`) : ""}</p>`).join("") + `<h2>Hedef başlık</h2><p>${L}</p>`;
  let target = null;
  for (let extra = 0; extra < 12 && !target; extra += 1) {
    const plain = tocDoc(false).replace("<h2>", `${filler(extra, "G")}<h2>`), noted = tocDoc(true).replace("<h2>", `${filler(extra, "G")}<h2>`);
    await put(page, plain); const before = await headingPage();
    await put(page, noted); const after = await headingPage();
    if (before !== after) target = { before, after };
  }
  assert.ok(target, "notes moved the heading to a later page");
  assert.equal((await tocRows()).find(([text]) => text?.includes("Hedef"))?.[1], target.after);
  assertConsistent(await footnoteState(page), "G");
  assert.equal(await unstable(), 0);
  pass(`G TOC: notes moved "Hedef başlık" from page ${target.before} to ${target.after}; TOC row shows ${target.after}`);

  // H/I) PDF equals editor; DOCX keeps real Word footnotes
  await put(page, filler(2) + `<h2>Tablo ve liste</h2><table><tbody><tr><td>A${fn("fh1", "Tablo hücresi dipnotu.")}</td><td>B</td></tr><tr><td>C</td><td>D</td></tr></tbody></table><ol><li>Birinci madde${fn("fh2", "Liste dipnotu.")}</li><li>İkinci madde</li></ol>` + filler(10, "H") + `<p>Sonraki sayfa referansı${fn("fh3", "Üçüncü sayfa dipnotu PDF kontrolü.")}.</p>` + filler(8, "Z") + `<p>Son referans${fn("fh4", "Dördüncü dipnot.")}.</p>`);
  state = await footnoteState(page);
  assertConsistent(state, "H");
  assert.ok(new Set(state.areas.map((a) => a.page)).size >= 2);
  const physical = await page.evaluate(() => [...document.querySelector('.thesis-paper[data-thesis-section="main"]').closest(".thesis-page-stack").querySelectorAll(".thesis-sheet")].map((s) => Number(s.dataset.thesisPage)));
  const exports = {};
  for (const [button, extension] of [["PDF", "pdf"], ["Word", "docx"]]) {
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: button, exact: true }).click();
    await (await download).saveAs(file(`footnotes.${extension}`)); exports[extension] = file(`footnotes.${extension}`);
  }
  const { getDocument } = await import("../node_modules/pdfjs-dist/legacy/build/pdf.mjs");
  const pdf = await getDocument({ data: new Uint8Array(await readFile(exports.pdf)), useSystemFonts: true, disableFontFace: true }).promise;
  assert.equal(pdf.numPages, state.total);
  for (const ref of state.refs) {
    const pdfPage = await pdf.getPage(physical[ref.page]);
    const items = (await pdfPage.getTextContent()).items.filter((item) => item.str.trim());
    const note = items.filter((item) => item.transform[3] < 10.5 && item.str.trim().length > 2 && ref.text.includes(item.str.trim()));
    assert.ok(note.length, `PDF page ${physical[ref.page]} lacks note ${ref.label}`);
    const noteY = Math.max(...note.map((item) => item.transform[5]));
    const bodyY = Math.min(...items.filter((item) => item.transform[3] > 10.5 && !/^\d+$/.test(item.str.trim())).map((item) => item.transform[5]));
    assert.ok(noteY < bodyY, `PDF note ${ref.label} (y ${noteY}) is not below the body (y ${bodyY})`);
  }
  pass(`H PDF: ${pdf.numPages} pages = editor; every note on its reference's physical page (${state.refs.map((r) => `${r.label}→${physical[r.page]}`).join(", ")}) below the body`);
  const { strFromU8, unzipSync } = await import("fflate");
  const files = unzipSync(new Uint8Array(await readFile(exports.docx)));
  const documentXml = strFromU8(files["word/document.xml"]), notesXml = strFromU8(files["word/footnotes.xml"]);
  assert.equal((documentXml.match(/<w:footnoteReference /g) || []).length, 4);
  for (const text of ["Tablo hücresi dipnotu.", "Liste dipnotu.", "Üçüncü sayfa dipnotu PDF kontrolü.", "Dördüncü dipnot."]) assert.ok(notesXml.includes(text), text);
  assert.match(notesXml, /<w:sz w:val="18"\/>/);
  pass("I DOCX: 4 real Word footnote references + footnotes.xml texts, template footnote size (9 pt); Word lays them out");

  // J) persistence
  const source = await page.evaluate(() => window.thesisTest.getDoc());
  assert.doesNotMatch(JSON.stringify(source), /data-thesis-fn-|thesis-footnote-(?:area|layer|tail)|footnoteView/);
  assert.equal((source.content.match(/academic-footnote/g) || []).length, 4);
  const beforeReload = brief(state);
  await page.reload(); await main(page).waitFor();
  await page.getByLabel("Yakınlaştır", { exact: true }).selectOption("100"); await settle(page);
  assert.deepEqual(await page.evaluate(() => window.thesisTest.getDoc()), source);
  const reloaded = await footnoteState(page); assertConsistent(reloaded, "J");
  assert.equal(brief(reloaded), beforeReload);
  pass("J persistence: source footnotes identical after reload; no stamps/areas/page assignments persisted; same layout recomputed");

  // Representative document (shared with the packaged smoke).
  await task10a1Checks(page, pass, async () => {
    const files = {};
    for (const [button, extension] of [["PDF", "pdf"], ["Word", "docx"]]) {
      const download = page.waitForEvent("download");
      await page.getByRole("button", { name: button, exact: true }).click();
      await (await download).saveAs(file(`representative.${extension}`)); files[extension] = file(`representative.${extension}`);
    }
    return files;
  });
  assert.deepEqual(errors, []);
  await writeFile(new URL("browser.json", out), JSON.stringify({ status: "passed", checks, errors }, null, 2));
} catch (e) {
  await page.screenshot({ path: file("failure.png"), fullPage: true }).catch(() => {});
  await writeFile(new URL("failure.json", out), JSON.stringify({ error: String(e?.stack || e), checks, errors }, null, 2));
  throw e;
} finally { await browser.close(); }
