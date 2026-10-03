// Run against Vite: PLAYWRIGHT_MODULE=<installed playwright path> node tests/thesis-a4.e2e.mjs [baseUrl]
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const base = process.argv[2] || "http://127.0.0.1:5173";
const key = "txtnote-thesis-regression";
const pxPerMm = 96 / 25.4;
const main = () => page.locator('[data-thesis-flow-section="main"] .rich-text-body[contenteditable="true"]');
const paper = () => page.locator('.thesis-paper[data-thesis-section="main"]');
const doc = () => page.evaluate(() => window.thesisTest.getDoc());
const near = (actual, expected, message, tolerance = 1) => assert.ok(Math.abs(actual - expected) < tolerance, `${message}: ${actual} vs ${expected}`);
const pass = (message) => console.log(`PASS ${message}`);
async function ready() { await page.waitForSelector('[data-thesis-flow-section="main"] .rich-text-body[contenteditable="true"]'); }
async function selectAll() {
  await main().scrollIntoViewIfNeeded();
  await main().click();
  await page.keyboard.press("Control+a");
}
async function focusEnd() {
  await main().scrollIntoViewIfNeeded();
  await main().click();
  await page.keyboard.press("Control+End");
}
async function layout() {
  return paper().evaluate((el) => {
    const s = getComputedStyle(el);
    const root = el.querySelector('[contenteditable="true"]');
    const t = getComputedStyle(root);
    return { width: parseFloat(s.width), minHeight: parseFloat(s.minHeight), height: parseFloat(s.height),
      margins: [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft].map(parseFloat),
      background: getComputedStyle(el.parentElement.querySelector(".thesis-sheet")).backgroundColor, paperBackground: s.backgroundColor, font: t.fontFamily, size: parseFloat(t.fontSize), line: parseFloat(t.lineHeight),
      caret: t.caretColor, overflow: s.overflow, rectWidth: el.getBoundingClientRect().width };
  });
}
try {
  await page.goto(`${base}/tests/thesis.html`);
  await page.evaluate(() => localStorage.removeItem("txtnote-thesis-regression"));
  await page.reload(); await ready();
  await page.getByLabel("Yakınlaştır", { exact: true }).selectOption("100");
  let l = await layout();
  near(l.width, 210 * pxPerMm, "A4 width"); near(l.minHeight, 297 * pxPerMm, "A4 minimum height");
  near(l.height, 297 * pxPerMm, "empty A4 height");
  assert.equal(l.background, "rgb(255, 255, 255)"); assert.equal(l.paperBackground, "rgba(0, 0, 0, 0)"); assert.equal(l.overflow, "visible");
  for (const [i, mm] of [25, 25, 25, 30].entries()) near(l.margins[i], mm * pxPerMm, "template margin");
  assert.match(l.font, /Times New Roman/); near(l.size, 16, "12pt font"); near(l.line, 24, "1.5 line height");
  assert.equal(await page.locator(".academic-page-gap").count(), 0);
  assert.equal(await page.locator(".thesis-sheet").count(), Number(await page.locator("[data-thesis-total-pages]").getAttribute("data-thesis-total-pages")));
  pass("A4 geometry, white sheets, template margins/typography, one sheet per measured page and no gap nodes in content");

  await main().fill("A4 kayıt testi");
  await selectAll(); await page.getByRole("button", { name: "Kalın", exact: true }).click();
  await page.getByRole("button", { name: "İtalik", exact: true }).click();
  assert.match((await doc()).content, /fmt-bold|<strong|<b>/); assert.match((await doc()).content, /fmt-italic|<em|<i>/);
  await page.getByLabel("Paragraf biçimi").selectOption("1");
  assert.match((await doc()).content, /<h1/);
  await page.getByLabel("Paragraf biçimi").selectOption("2"); assert.match((await doc()).content, /<h2/);
  await page.getByLabel("Paragraf biçimi").selectOption("3"); assert.match((await doc()).content, /<h3/);
  await page.getByLabel("Paragraf biçimi").selectOption("0");
  await focusEnd(); await page.keyboard.press("Enter"); await page.keyboard.type("Liste maddesi");
  await page.getByRole("button", { name: "Madde işaretli liste", exact: true }).click();
  assert.match((await doc()).content, /<ul/);
  await page.getByRole("button", { name: "Numaralı liste", exact: true }).click();
  assert.match((await doc()).content, /<ol/);
  await focusEnd(); await page.keyboard.press("Enter"); await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Tablo", exact: true }).click();
  assert.equal(await main().locator("table td, table th").count(), 4);
  await main().locator("table td").first().click(); await page.keyboard.type("Hücre testi");
  assert.match((await doc()).content, /Hücre testi/);
  pass("caret, selection, typing, bold/italic, headings 1/2/3, lists, editable table");

  await focusEnd();
  await page.getByRole("button", { name: "Atıf", exact: true }).click();
  await page.getByLabel("Atıf / dipnot metni").fill("Test kaynağı 2026");
  await page.getByRole("button", { name: "Ekle", exact: true }).click();
  assert.match((await doc()).content, /Test kaynağı 2026/);
  await page.getByRole("button", { name: "Kaynakça", exact: true }).click();
  await page.getByRole("button", { name: "+ Kaynak ekle", exact: true }).click();
  await page.getByLabel("Kaynakça maddesi 1").fill("Yazar, A. (2026). A4 test kaynağı.");
  await page.getByRole("button", { name: "Tez bilgilerini kapat", exact: true }).click();
  assert.match(await page.locator('[data-thesis-flow-section="bibliography"]').innerText(), /A4 test kaynağı/);
  const abstract = page.locator('[data-thesis-flow-section="abstract"] [contenteditable="true"]');
  await abstract.fill("Özet kayıt testi");
  pass("citation, bibliography and independently editable abstract");

  // Generate both images locally in the browser, then exercise the real file-input pipeline.
  for (const [width, height] of [[200, 100], [4000, 3000]]) {
    const buffer = await page.evaluate(([w, h]) => {
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      const ctx = c.getContext("2d"); ctx.fillStyle = "#075985"; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#fff"; ctx.font = "40px serif"; ctx.fillText("A4 image", 20, 60);
      return c.toDataURL("image/png").split(",")[1];
    }, [width, height]);
    await focusEnd();
    await page.locator('input[type="file"]').setInputFiles({ name: `image-${width}.png`, mimeType: "image/png", buffer: Buffer.from(buffer, "base64") });
    await page.waitForFunction((count) => document.querySelectorAll('[data-thesis-flow-section="main"] img').length === count, width === 200 ? 1 : 2);
    assert.equal(await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve(true)))), true);
  }
  const img = main().locator(".academic-figure img").first();
  await img.click();
  await page.getByLabel("Görsel genişliği (px)").fill("160");
  await page.getByRole("button", { name: "Uygula", exact: true }).click();
  assert.match(await img.getAttribute("style"), /width:\s*160px/);
  for (const level of [50, 75, 100, 125, 150]) {
    const before = JSON.stringify(await doc());
    const beforeLayout = await layout();
    await page.getByLabel("Yakınlaştır", { exact: true }).selectOption(String(level));
    near((await layout()).rectWidth, 210 * pxPerMm * level / 100, `zoom ${level}`);
    const afterLayout = await layout();
    assert.equal(afterLayout.width, beforeLayout.width); assert.equal(afterLayout.size, beforeLayout.size);
    assert.deepEqual(afterLayout.margins, beforeLayout.margins); assert.equal(JSON.stringify(await doc()), before);
    await img.scrollIntoViewIfNeeded();
    const ib = await img.boundingBox(); const cb = await page.locator(".academic-image-controls").boundingBox();
    near(cb.x, ib.x, "image controls x"); near(cb.y, ib.y, "image controls y"); near(cb.width, ib.width, "image controls width");
  }
  await page.getByLabel("Yakınlaştır", { exact: true }).selectOption("75");
  const handle = page.getByRole("button", { name: "Görseli boyutlandır sağ alt", exact: true });
  await handle.scrollIntoViewIfNeeded();
  const hb = await handle.boundingBox();
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
  await page.mouse.down(); await page.mouse.move(hb.x + hb.width / 2 + 30, hb.y + hb.height / 2, { steps: 5 }); await page.mouse.up();
  assert.equal(await img.getAttribute("width"), "200"); // 30 screen px / 0.75 zoom = 40 layout px.
  await page.keyboard.press("Escape");
  await page.getByLabel("Yakınlaştır", { exact: true }).selectOption("100");
  await page.getByRole("button", { name: "Uzaklaştır", exact: true }).click();
  assert.equal(await page.getByLabel("Yakınlaştır", { exact: true }).inputValue(), "75");
  await page.getByRole("button", { name: "Yakınlaştır artır", exact: true }).click();
  assert.equal(await page.getByLabel("Yakınlaştır", { exact: true }).inputValue(), "100");
  pass("small/large images, UI responsiveness, image selection and resize at zoom, all five zoom levels preserve document and layout");

  const saved = await doc();
  await page.click("#switch-note"); await page.waitForSelector("#other-note"); await page.click("#switch-note"); await ready();
  assert.deepEqual(await doc(), saved); assert.equal(await main().locator("img").count(), 2);
  await page.reload(); await ready();
  assert.deepEqual(await doc(), saved); assert.equal(await main().locator("img").count(), 2);
  assert.match(await abstract.innerText(), /Özet kayıt testi/);
  pass("switch away/back and reload preserve text, formatting, abstract, images, dimensions, citations, bibliography");

  await page.getByRole("button", { name: "Tez bilgileri", exact: true }).click();
  await page.getByLabel("Tez şablonu").selectOption("fixture-university-b-master-tr-v1");
  await page.waitForFunction(() => {
    const root = document.querySelector('[data-thesis-flow-section="main"] [contenteditable]');
    return root && getComputedStyle(root).fontFamily.includes("Arial");
  });
  l = await layout();
  for (const [i, mm] of [30, 20, 20, 35].entries()) near(l.margins[i], mm * pxPerMm, "template B margin");
  near(l.size, 11 * 96 / 72, "template B font size"); near(l.line, l.size * 1.4, "template B line height");
  await page.getByRole("button", { name: "Tez bilgilerini kapat", exact: true }).click();
  assert.equal((await doc()).content, saved.content);
  pass("changing template applies different margins and typography without changing content");

  await page.evaluate((storageKey) => {
    const d = window.thesisTest.getDoc();
    d.content = '<p>Uzun içerik başlangıcı</p>' + Array.from({ length: 150 }, (_, i) => `<p>${i + 1}: Uzun tez paragrafı. ` + "Metin korunmalı ve düzenlenebilmeli. ".repeat(8) + "</p>").join("") + '<p>Uzun içerik sonu</p>';
    localStorage.setItem(storageKey, JSON.stringify(d));
  }, key);
  await page.reload(); await ready();
  await page.getByLabel("Yakınlaştır", { exact: true }).selectOption("150");
  await page.waitForFunction(() => {
    const p = document.querySelector('.thesis-paper[data-thesis-section="main"]');
    return Math.abs(p.parentElement.parentElement.getBoundingClientRect().height - p.getBoundingClientRect().height) < 1;
  });
  l = await layout(); assert.ok(l.height > l.minHeight * 5);
  const mainPages = Number(await paper().getAttribute("data-thesis-page-count"));
  assert.ok(mainPages > 5); assert.equal(await paper().locator("xpath=..").locator(".thesis-sheet").count(), mainPages);
  assert.equal(await page.locator(".academic-page-gap").count(), 0);
  await focusEnd(); await page.keyboard.type(" SONDA YAZILABİLİR");
  assert.match((await doc()).content, /SONDA YAZILABİLİR/);
  assert.equal(await main().locator("p").count(), 152);
  await page.reload(); await ready(); assert.match(await main().innerText(), /SONDA YAZILABİLİR/);
  pass("150 long paragraphs paginate into real A4 sheets, remain editable to the end and persist without page data");

  await page.setViewportSize({ width: 600, height: 800 });
  await page.getByLabel("Yakınlaştır", { exact: true }).selectOption("150");
  const responsive = await paper().evaluate((el) => {
    const viewport = el.closest('.overflow-auto');
    viewport.scrollLeft = 0;
    return { left: el.getBoundingClientRect().left - viewport.getBoundingClientRect().left,
      scroll: viewport.scrollWidth, client: viewport.clientWidth, appWidth: document.documentElement.scrollWidth };
  });
  assert.ok(responsive.left >= 0); assert.ok(responsive.scroll > responsive.client); assert.equal(responsive.appWidth, 600);
  await page.getByLabel("Yakınlaştır", { exact: true }).selectOption("fit");
  assert.ok((await layout()).rectWidth < 600); near((await layout()).width, 210 * pxPerMm, "physical width remains A4");
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  assert.equal((await layout()).caret, "rgb(17, 17, 17)"); assert.equal((await layout()).background, "rgb(255, 255, 255)");
  pass("narrow viewport horizontal scroll, fit zoom and visible caret on white paper in dark theme");

  // Multi-line selection + Backspace/typing: Chromium's block merge used to add <span style>,
  // a style-src-attr violation under the production CSP. Report-only keeps the page styled.
  await page.route("**/tests/thesis.html", async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, headers: { ...response.headers(), "content-security-policy-report-only": "style-src-attr 'none'" } });
  });
  await page.addInitScript(() => { window.__cspViolations = []; document.addEventListener("securitypolicyviolation", (event) => window.__cspViolations.push(event.violatedDirective)); });
  const h2 = (text) => `<h2 class="academic-h academic-h2" data-academic-heading="2">${text}</h2>`;
  const seed = { ...(await doc()), content: `<p>Birinci paragraf metni.</p>${h2("Bulgular başlığı")}<p>Orta paragraf.</p><p>Son paragraf metni.</p>` };
  await page.evaluate(({ storageKey, value }) => localStorage.setItem(storageKey, JSON.stringify(value)), { storageKey: key, value: seed });
  await page.setViewportSize({ width: 1400, height: 1000 }); await page.reload(); await ready();
  const selectAcross = (from, fromDelta, to, toDelta) => main().evaluate((el, [from, fromDelta, to, toDelta]) => {
    const find = (needle) => { const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); for (let n = walker.nextNode(); n; n = walker.nextNode()) { const i = n.data.indexOf(needle); if (i >= 0) return [n, i]; } throw new Error(needle); };
    const [a, i] = find(from); const [b, j] = find(to); el.focus();
    const range = document.createRange(); range.setStart(a, i + fromDelta); range.setEnd(b, j + toDelta);
    getSelection().removeAllRanges(); getSelection().addRange(range);
  }, [from, fromDelta, to, toDelta]);
  await selectAcross("paragraf metni", 3, "başlığı", 2); await page.keyboard.press("Backspace"); await page.keyboard.type("X");
  await selectAcross("Orta", 2, "metni.", 1); await page.keyboard.type("Y");
  const merged = (await doc()).content;
  assert.equal(await main().evaluate((el) => el.innerText), "Birinci parXşlığı\n\nOrYetni.");
  assert.doesNotMatch(merged, /style=/); assert.deepEqual(await page.evaluate(() => window.__cspViolations), []);
  await page.reload(); await ready();
  assert.equal((await doc()).content, merged); assert.equal(await main().evaluate((el) => el.innerText), "Birinci parXşlığı\n\nOrYetni.");
  assert.deepEqual(await page.evaluate(() => window.__cspViolations), []);
  // Notes saved before the fix still hold the span; it is removed before parsing, so loading reports nothing.
  await page.evaluate(({ storageKey, value }) => localStorage.setItem(storageKey, JSON.stringify(value)), { storageKey: key, value: { ...seed, content: '<p>Eski <span style="font-size: 12pt; font-weight: 700;">birleşme</span></p>' } });
  await page.reload(); await ready();
  assert.equal(await main().evaluate((el) => el.innerHTML), "<p>Eski <span>birleşme</span></p>"); assert.deepEqual(await page.evaluate(() => window.__cspViolations), []);
  await page.unroute("**/tests/thesis.html");
  pass("multi-line selection + Backspace/typing joins blocks without inline styles or CSP reports, survives reload; legacy style spans load clean");

  // Paragraph model: Enter inside <p> stays a template paragraph (it used to become a forced-left div),
  // every line gets the template's first-line indent, and DOCX keeps one paragraph per editor line.
  await page.evaluate(({ storageKey, value }) => localStorage.setItem(storageKey, JSON.stringify(value)), { storageKey: key, value: { ...seed, content: "<p>Paragraf sonu</p>" } });
  await page.reload(); await ready();
  await main().evaluate((el) => { const text = el.querySelector("p").firstChild; el.focus(); getSelection().collapse(text, text.length); });
  await page.keyboard.press("Enter"); await page.keyboard.type("Yeni paragraf");
  // (A zero-width caret pad may trail the new paragraph; exports drop it.)
  assert.match((await doc()).content, /^<p>Paragraf sonu<\/p><p>Yeni paragraf​?<\/p>$/);
  // Typing lines from an empty body: Chromium puts the second line in a plain <div>; Enter in it
  // used to create div.fmt-align-left, so every later line lost the template's justification.
  await page.evaluate(({ storageKey, value }) => localStorage.setItem(storageKey, JSON.stringify(value)), { storageKey: key, value: { ...seed, content: "" } });
  await page.reload(); await ready();
  await main().click();
  for (const text of ["Birinci satır", "İkinci satır", "Üçüncü satır", "Dördüncü satır"]) { await page.keyboard.type(text); await page.keyboard.press("Enter"); }
  assert.doesNotMatch((await doc()).content, /fmt-align/);
  const aligns = await main().evaluate((el) => { const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); const out = []; for (let n = walker.nextNode(); n; n = walker.nextNode()) if (n.data.trim()) out.push(getComputedStyle(n.parentElement).textAlign); return out; });
  assert.deepEqual([...new Set(aligns)], ["justify"], JSON.stringify(aligns));
  const indents = await main().evaluate((el, content) => {
    el.innerHTML = content; const left = el.getBoundingClientRect().left; const out = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) for (const mark of ["KÖK", "İKİ", "PAR", "MADDE"]) { const i = node.data.indexOf(mark); if (i >= 0) { const r = document.createRange(); r.setStart(node, i); r.setEnd(node, i + 1); out.push([mark, Math.round((r.getBoundingClientRect().left - left) / zoomOf(el) * 25.4 / 96)]); } }
    function zoomOf(node) { const stack = node.closest(".thesis-page-stack"); return new DOMMatrixReadOnly(getComputedStyle(stack).transform).a; }
    return Object.fromEntries(out);
  }, "KÖK satır\nİKİ satır<p>PAR paragraf</p><ul><li>MADDE</li></ul>");
  // Every fixture template inherits the generic 10 mm first-line indent.
  assert.deepEqual([indents["KÖK"], indents["İKİ"], indents["PAR"]], [10, 10, 10]); assert.ok(indents.MADDE < 10, JSON.stringify(indents));
  const docxXml = await page.evaluate(async () => {
    const [{ compileThesisDocument }, { buildThesisDocx }, { fixtureA: template }] = await Promise.all([import("/src/thesis/engine.js"), import("/src/thesis/export.js"), import("/src/lib/thesisFixtures.js")]);
    const content = 'Satır <span class="fmt-bold">kalın</span> ve atıf<sup class="academic-footnote" contenteditable="false" data-fn-id="fn-1" data-fn-text="Yılmaz, 2024." data-fn-index="1">1</sup> sonu.\nİkinci satır<div class="fmt-align-left">Sola hizalı</div><p></p><p>Gerçek paragraf</p>';
    const blob = await buildThesisDocx(compileThesisDocument(template, {}, "T", content));
    return [...new Uint8Array(await blob.arrayBuffer())];
  });
  const { unzipSync, strFromU8 } = await import("fflate");
  const files = unzipSync(new Uint8Array(docxXml));
  const body = strFromU8(files["word/document.xml"]);
  const paragraphs = [...body.matchAll(/<w:p>([\s\S]*?)<\/w:p>/g)].map(([, p]) => ({ text: [...p.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join(""), jc: p.match(/<w:jc w:val="(\w+)"/)?.[1], after: p.match(/<w:spacing[^>]*w:after="(\d+)"/)?.[1], footnote: /footnoteReference/.test(p) }));
  const line = paragraphs.find((p) => p.text.startsWith("Satır"));
  assert.equal(line.text, "Satır kalın ve atıf sonu."); assert.equal(line.footnote, true); assert.equal(line.jc, "both"); assert.equal(line.after, "0");
  assert.ok(paragraphs.some((p) => p.text === "İkinci satır"), "one Word paragraph per editor line");
  assert.equal(paragraphs.find((p) => p.text === "Sola hizalı").jc, "left", "explicit left survives");
  assert.equal(paragraphs.find((p) => p.text === "Gerçek paragraf").after, "120", "<p> keeps template spacing");
  const left = paragraphs.findIndex((p) => p.text === "Sola hizalı");
  assert.equal(paragraphs[left + 1].text, "Gerçek paragraf", "an empty <p></p> draws nothing in the editor, so no Word paragraph");
  assert.match(strFromU8(files["word/footnotes.xml"]), /Yılmaz, 2024\./);
  pass("Enter in a paragraph keeps a template paragraph; template first-line indent on every line; DOCX: one paragraph per line with footnotes, inline formatting and explicit vs default alignment");

  // Exported screenshot documents the A4 UI after clearing only this test fixture.
  await page.evaluate((storageKey) => localStorage.removeItem(storageKey), key);
  await page.setViewportSize({ width: 1400, height: 1000 }); await page.reload(); await ready();
  await page.getByLabel("Yakınlaştır", { exact: true }).selectOption("75");
  await mkdir(new URL("../../output/task6-a4/", import.meta.url), { recursive: true });
  await page.screenshot({ path: new URL("../../output/task6-a4/editor.png", import.meta.url).pathname.replace(/^\/(\w:)/, "$1") });
  assert.deepEqual(errors, []);
  await writeFile(new URL("../../output/task6-a4/result.json", import.meta.url), JSON.stringify({ passed: true, consoleErrors: errors, date: new Date().toISOString() }, null, 2));
  pass("no browser errors");
} finally { await browser.close(); }
