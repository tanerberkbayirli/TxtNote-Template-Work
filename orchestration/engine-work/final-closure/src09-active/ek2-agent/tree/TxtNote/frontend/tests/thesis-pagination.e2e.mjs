// Task 7 pagination regression. Run against Vite:
// PLAYWRIGHT_MODULE=<installed playwright path> node tests/thesis-pagination.e2e.mjs [baseUrl]
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
const base = process.argv[2] || "http://127.0.0.1:5173";
const key = "txtnote-thesis-regression";
const out = new URL("../../output/task7-pagination/", import.meta.url);
const shot = (name) => page.screenshot({ path: new URL(name, out).pathname.replace(/^\/(\w:)/, "$1") });
const results = [];
const pass = (message) => { results.push(message); console.log(`PASS ${message}`); };
const ZOOMS = ["50", "75", "100", "125", "150"];

// Layout probes. Page indices come from client rects divided by the display zoom, so
// they describe the unscaled A4 layout and must not change with zoom.
await page.addInitScript(() => {
  const STRIDE = 297 * 96 / 25.4 + 28;
  const art = (group = "main") => document.querySelector(`.thesis-paper[data-thesis-section="${group}"]`);
  const zoomOf = (a) => a.getBoundingClientRect().width / a.offsetWidth;
  const pageOfY = (group, y) => { const a = art(group); return Math.floor((y - a.getBoundingClientRect().top) / zoomOf(a) / STRIDE) + 1; };
  const editor = (id = "main") => document.querySelector(`[data-thesis-flow-section="${id}"] [contenteditable="true"]`);
  const texts = (root) => { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const list = []; for (let n = w.nextNode(); n; n = w.nextNode()) list.push(n); return list; };
  const find = (needle, root = editor()) => { for (const node of texts(root)) { const i = node.data.indexOf(needle); if (i >= 0) return { node, offset: i }; } return null; };
  const charRect = (node, offset) => { const r = document.createRange(); r.setStart(node, offset); r.setEnd(node, Math.min(node.length, offset + 1)); return r.getClientRects()[0] || r.getBoundingClientRect(); };
  window.pg = {
    STRIDE, art, editor, find,
    count: (group = "main") => Number(art(group).dataset.thesisPageCount),
    total: () => Number(document.querySelector("[data-thesis-total-pages]").dataset.thesisTotalPages),
    sheets: (group = "main") => art(group).parentElement.querySelectorAll(".thesis-sheet").length,
    pageOfText: (needle, id = "main", group = "main") => { const hit = find(needle, editor(id) || document.querySelector(`[data-thesis-flow-section="${id}"]`)); if (!hit) return -1; const r = charRect(hit.node, hit.offset); return pageOfY(group, (r.top + r.bottom) / 2); },
    pageOfEl: (el, group = "main") => { const rects = [...el.getClientRects()].filter((r) => r.height > 0); return { first: pageOfY(group, rects[0].top + 1), last: pageOfY(group, rects.at(-1).bottom - 1), fragments: rects.length }; },
    lineOnPage: (group, pageNo, which) => {
      // Text of the first/last line on a page: sample every text node's line rects.
      let best = null;
      for (const node of texts(art(group).querySelector(".thesis-page-flow"))) {
        const r = document.createRange(); r.selectNodeContents(node);
        for (const rect of r.getClientRects()) {
          if (rect.height <= 0 || pageOfY(group, (rect.top + rect.bottom) / 2) !== pageNo) continue;
          if (!best || (which === "first" ? rect.top < best.top : rect.top > best.top)) best = { top: rect.top, left: rect.left, node };
        }
      }
      if (!best) return "";
      // Pages stack vertically, so y grows with document order: binary-search the line's first character.
      const node = best.node; let lo = 0; let hi = node.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (charRect(node, mid).bottom <= best.top + 1) lo = mid + 1; else hi = mid; }
      return node.data.slice(lo, lo + 24);
    },
    fingerprint: (id = "main", step = 97) => {
      const pages = [];
      let seen = 0;
      for (const node of texts(editor(id))) {
        for (let i = 0; i < node.length; i += 1, seen += 1) {
          if (seen % step || !node.data[i].trim()) continue;
          const r = charRect(node, i); pages.push(pageOfY("main", (r.top + r.bottom) / 2));
        }
      }
      return pages.join(",");
    },
    frames: (n = 2) => new Promise((resolve) => { const step = () => (n-- <= 0 ? resolve(true) : requestAnimationFrame(step)); requestAnimationFrame(step); }),
  };
});

const docBase = (templateId = "fixture-university-a-master-tr-v1") => {
  const entries = {
    "fixture-university-a-master-tr-v1": { universityId: "fixture-university-a", instituteId: "graduate", degreeType: "master", language: "tr" },
    "fixture-university-c-phd-en-v1": { universityId: "fixture-university-c", instituteId: "research", degreeType: "phd", language: "en" },
  };
  return { title: "Pagination tezi", content: "", researchData: { thesis: { templateId, templateVersion: "1.0.0", selection: entries[templateId], values: { YEAR: "2026", STUDENT_NAME: "Test Öğrenci" }, sectionContent: { abstract: "Özet metni." }, enabledSections: [] } } };
};
// Every word is unique, so any line-start sample identifies exactly one place in the document.
const para = (i, words = 70) => `P${i}: ` + Array.from({ length: words }, (_, k) => `${["tez", "metin", "sayfa", "akış"][k % 4]}${i}.${k}`).join(" ") + ".";
const doc = () => page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey)), key);
const settle = () => page.evaluate(async () => { await document.fonts.ready; await window.pg.frames(3); });
async function load(content, templateId, patch = {}) {
  await page.evaluate(({ storageKey, value }) => localStorage.setItem(storageKey, JSON.stringify(value)), { storageKey: key, value: { ...docBase(templateId), content, ...patch } });
  await page.reload();
  await page.waitForSelector('[data-thesis-flow-section="main"] .rich-text-body[contenteditable="true"]');
  await page.getByLabel("Yakınlaştır", { exact: true }).selectOption("100");
  await settle();
}
const pg = (fn, arg) => page.evaluate(fn, arg);
async function placeCaret(needle, after = true) {
  await pg(({ needle, after }) => {
    const hit = window.pg.find(needle); const el = window.pg.editor();
    el.focus({ preventScroll: true });
    document.getSelection().collapse(hit.node, hit.offset + (after ? needle.length : 0));
  }, { needle, after });
}
const timed = async (fn) => { const t0 = Date.now(); await fn(); return Date.now() - t0; };

try {
  await mkdir(out, { recursive: true });
  await page.goto(`${base}/tests/thesis.html`);
  await page.waitForSelector('[data-thesis-flow-section="main"] .rich-text-body[contenteditable="true"]');

  // 1. One short paragraph → exactly one A4.
  await load("Tek kısa paragraf.");
  assert.equal(await pg(() => window.pg.count()), 1);
  assert.equal(await pg(() => window.pg.sheets()), 1);
  const sheet = await page.locator('.thesis-paper[data-thesis-section="main"]').evaluate((a) => { const s = a.parentElement.querySelector(".thesis-sheet"); const cs = getComputedStyle(s); return { w: s.offsetWidth, h: s.offsetHeight, bg: cs.backgroundColor, paper: getComputedStyle(a).backgroundColor, flow: getComputedStyle(a.querySelector(".thesis-page-flow")).columnHeight }; });
  assert.ok(Math.abs(sheet.w - 210 * 96 / 25.4) < 1 && Math.abs(sheet.h - 297 * 96 / 25.4) < 1, JSON.stringify(sheet));
  assert.equal(sheet.bg, "rgb(255, 255, 255)"); assert.equal(sheet.paper, "rgba(0, 0, 0, 0)");
  assert.ok(Math.abs(parseFloat(sheet.flow) - 247 * 96 / 25.4) < 1, "content box = 297mm - template top/bottom margins");
  pass("1 short paragraph renders one fixed 210×297mm sheet; usable height comes from template margins");

  // 2-4. Filling a page creates the next one; deleting flows text back and removes the empty page.
  await placeCaret("paragraf.");
  for (let i = 1; i <= 12; i += 1) { await page.keyboard.press("Enter"); await page.keyboard.insertText(para(i)); }
  await settle();
  const filled = await pg(() => ({ count: window.pg.count(), sheets: window.pg.sheets(), last: window.pg.pageOfText("P12:") }));
  assert.ok(filled.count >= 2 && filled.sheets === filled.count && filled.last === filled.count, JSON.stringify(filled));
  await pg(() => { const hit = window.pg.find("paragraf."); const el = window.pg.editor(); const r = document.createRange(); r.setStart(hit.node, hit.offset + 9); r.setEnd(el, el.childNodes.length); document.getSelection().removeAllRanges(); document.getSelection().addRange(r); });
  await page.keyboard.press("Backspace"); await settle();
  assert.equal(await pg(() => window.pg.count()), 1); assert.equal(await pg(() => window.pg.sheets()), 1);
  assert.equal((await doc()).content.replace(/<[^>]+>/g, "").trim(), "Tek kısa paragraf.");
  pass("2-4 overflow creates the next A4, deleting reflows backward and the empty page is removed");

  // 5-8. Live reflow while typing in the middle of page 1: caret, focus, scroll and editor identity survive.
  const body = Array.from({ length: 40 }, (_, i) => para(i + 1)).join("\n");
  await load(body);
  const pagesBefore = await pg(() => window.pg.count());
  assert.ok(pagesBefore >= 3, `3+ A4 pages: ${pagesBefore}`);
  const lastOfPage1 = await pg(() => window.pg.lineOnPage("main", 1, "last"));
  const firstOfPage2 = await pg(() => window.pg.lineOnPage("main", 2, "first"));
  const fpBefore = await pg(() => window.pg.fingerprint());
  await placeCaret("P4:", false);
  await page.locator('.thesis-paper[data-thesis-section="main"]').evaluate((a) => { const vp = a.closest(".overflow-auto"); vp.scrollTop += a.getBoundingClientRect().top - vp.getBoundingClientRect().top + 300; });
  const scrollBefore = await page.locator(".overflow-auto").first().evaluate((vp) => vp.scrollTop);
  await pg(() => { window.__mainEditor = window.pg.editor(); window.__blurs = 0; window.__mainEditor.addEventListener("focusout", () => { window.__blurs += 1; }); });
  const inserted = ["Yeni paragraf A eklendi.", "Yeni paragraf B eklendi.", "Yeni paragraf C eklendi."];
  for (const line of inserted) { await page.keyboard.type(line, { delay: 0 }); await page.keyboard.press("Enter"); }
  await settle();
  const caret = await pg(() => {
    const sel = document.getSelection(); const r = sel.getRangeAt(0); const before = document.createRange();
    before.setStart(window.pg.editor(), 0); before.setEnd(r.startContainer, r.startOffset);
    // A caret right after <br> has no client rect; the character it precedes marks the same spot.
    const next = window.pg.find("P4:"); const probe = document.createRange(); probe.setStart(next.node, next.offset); probe.setEnd(next.node, next.offset + 1);
    const rect = r.getClientRects()[0] || probe.getClientRects()[0];
    const vp = document.querySelector(".overflow-auto").getBoundingClientRect();
    const after = document.createRange(); after.setStart(r.startContainer, r.startOffset); after.setEnd(window.pg.editor(), window.pg.editor().childNodes.length);
    // Chromium renders adjacent contenteditable paragraphs with two innerText newlines;
    // assert the actual paragraph sequence instead of depending on that display separator.
    const paragraphs = [...window.pg.editor().querySelectorAll("p")].map((node) => node.innerText.trim()).filter(Boolean);
    const start = paragraphs.indexOf("Yeni paragraf A eklendi.");
    const paragraphSequence = start < 0 ? [] : paragraphs.slice(start, start + 4).map((text, index) => index === 3 ? text.slice(0, 3) : text);
    return { same: window.pg.editor() === window.__mainEditor, active: document.activeElement === window.__mainEditor, blurs: window.__blurs, collapsed: sel.isCollapsed,
      before: before.toString().slice(-40), next: after.toString().slice(0, 3), paragraphSequence, visible: rect.top >= vp.top && rect.bottom <= vp.bottom, page: Math.floor((rect.top - window.pg.art().getBoundingClientRect().top) / window.pg.STRIDE) + 1 };
  });
  assert.equal(caret.same, true, "RichTextBody was not remounted"); assert.equal(caret.active, true); assert.equal(caret.blurs, 0);
  assert.equal(caret.collapsed, true); assert.match(caret.before, /C eklendi\.\n?$/); assert.deepEqual(caret.paragraphSequence, ["Yeni paragraf A eklendi.", "Yeni paragraf B eklendi.", "Yeni paragraf C eklendi.", "P4:"]); assert.equal(caret.next, "P4:"); assert.equal(caret.visible, true); assert.equal(caret.page, 1);
  const scrollAfter = await page.locator(".overflow-auto").first().evaluate((vp) => vp.scrollTop);
  assert.ok(Math.abs(scrollAfter - scrollBefore) < 2, `scroll ${scrollBefore} → ${scrollAfter}`);
  const moved = await pg(({ lastOfPage1, firstOfPage2 }) => ({ last: window.pg.pageOfText(lastOfPage1), first: window.pg.pageOfText(firstOfPage2), topOf2: window.pg.lineOnPage("main", 2, "first"), count: window.pg.count() }), { lastOfPage1, firstOfPage2 });
  assert.equal(moved.last, 2, "the last line of page 1 overflowed onto page 2"); assert.notEqual(moved.topOf2, firstOfPage2); assert.ok(moved.count >= pagesBefore);
  assert.notEqual(await pg(() => window.pg.fingerprint()), fpBefore);
  await shot("reflow-after-insert.png");
  pass(`5-8 inserting 3 paragraphs mid page 1 reflows all following pages (${pagesBefore}→${moved.count}); caret stays after the typed text on page 1, focus kept (0 blur), no remount, scroll unchanged`);

  // Backward: delete the three paragraphs with a real Backspace; layout returns exactly.
  await pg(() => { const a = window.pg.find("Yeni paragraf A"); const b = window.pg.find("P4:"); const r = document.createRange(); r.setStart(a.node, a.offset); r.setEnd(b.node, b.offset); document.getSelection().removeAllRanges(); document.getSelection().addRange(r); });
  await page.keyboard.press("Backspace"); await settle();
  assert.equal(await pg(() => window.pg.count()), pagesBefore);
  assert.equal(await pg(({ lastOfPage1 }) => window.pg.pageOfText(lastOfPage1), { lastOfPage1 }), 1);
  assert.equal(await pg(() => window.pg.fingerprint()), fpBefore);
  assert.equal(await pg(() => document.activeElement === window.__mainEditor), true);
  pass("3 deleting the inserted paragraphs flows text back to page 1 and restores the identical page breaks");

  // 21-22. Zoom never changes page count or page breaks.
  const byZoom = {};
  for (const level of ZOOMS) {
    await page.getByLabel("Yakınlaştır", { exact: true }).selectOption(level); await settle();
    byZoom[level] = await pg(() => ({ count: window.pg.count(), total: window.pg.total(), fp: window.pg.fingerprint(), width: window.pg.art().getBoundingClientRect().width }));
  }
  for (const level of ZOOMS) {
    assert.equal(byZoom[level].count, byZoom["100"].count); assert.equal(byZoom[level].total, byZoom["100"].total); assert.equal(byZoom[level].fp, byZoom["100"].fp, `breaks at ${level}%`);
    assert.ok(Math.abs(byZoom[level].width - 210 * 96 / 25.4 * Number(level) / 100) < 1);
  }
  await page.getByLabel("Yakınlaştır", { exact: true }).selectOption("50"); await settle(); await shot("zoom-50.png");
  await page.getByLabel("Yakınlaştır", { exact: true }).selectOption("100");
  pass(`21-22 zoom 50/75/100/125/150 keep ${byZoom["100"].count} main pages (${byZoom["100"].total} total) and identical page breaks`);

  // 9-12. Headings keep with next, formatting, ordered/unordered lists across pages.
  const probe = await pg(async () => {
    // Find a filler length that leaves room for the heading alone at the bottom of page 1.
    const el = window.pg.editor(); const saved = el.innerHTML; let found = null;
    for (let k = 30; k <= 44 && !found; k += 1) {
      el.innerHTML = Array.from({ length: k }, (_, i) => `Satır ${i + 1}`).join("\n") + "<h2>Veri Analizi</h2>Analiz paragrafı birinci satır.\nAnaliz ikinci satır.\nAnaliz üçüncü.";
      await window.pg.frames(1);
      const h = el.querySelector("h2"); const hb = h.getBoundingClientRect(); const a = window.pg.art(); const zoom = a.getBoundingClientRect().width / a.offsetWidth;
      const lastFill = window.pg.pageOfText(`Satır ${k}`);
      const fillRect = (() => { const hit = window.pg.find(`Satır ${k}`); const r = document.createRange(); r.selectNodeContents(hit.node); return [...r.getClientRects()].at(-1); })();
      const pageBottom = a.getBoundingClientRect().top + (25 * 96 / 25.4 + 247 * 96 / 25.4) * zoom;
      const headingBlock = hb.height + parseFloat(getComputedStyle(h).marginTop) * zoom;
      if (lastFill === 1 && pageBottom - fillRect.bottom > headingBlock + 1 && pageBottom - fillRect.bottom < headingBlock + 30) found = k;
    }
    el.innerHTML = saved;
    return found;
  });
  assert.ok(probe, "found a heading-at-page-bottom arrangement");
  await load(Array.from({ length: probe }, (_, i) => `Satır ${i + 1}`).join("\n") + "<h2>Veri Analizi</h2>Analiz paragrafı birinci satır.\nAnaliz ikinci satır.\nAnaliz üçüncü.");
  const heading = await pg((k) => ({ fill: window.pg.pageOfText(`Satır ${k}`), h2: window.pg.pageOfEl(window.pg.editor().querySelector("h2")).first, next: window.pg.pageOfText("Analiz paragrafı") }), probe);
  assert.deepEqual(heading, { fill: 1, h2: 2, next: 2 });
  pass("9 a heading that would sit alone at the page bottom moves to the next page with its paragraph");

  const listDoc = "<h1>Birinci</h1>" + Array.from({ length: 6 }, (_, i) => para(i + 1)).join("\n") + "\n<b>Kalın başlangıç " + para(90, 420) + " kalın son</b>\n<i>İtalik " + para(91, 60) + "</i>"
    + "<h2>İkinci</h2><ol>" + Array.from({ length: 70 }, (_, i) => `<li>Numaralı madde ${i + 1}</li>`).join("") + "</ol><h3>Üçüncü</h3><ul>" + Array.from({ length: 60 }, (_, i) => `<li>Madde işaretli ${i + 1}</li>`).join("") + "</ul>Son.";
  await load(listDoc);
  const lists = await pg(() => {
    const el = window.pg.editor(); const ol = el.querySelector("ol"); const ul = el.querySelector("ul"); const items = [...ol.children];
    const pageOf = (li) => window.pg.pageOfEl(li).first; const firstNext = items.findIndex((li) => pageOf(li) > pageOf(items[0]));
    const bold = window.pg.find("kalın son"); const italic = window.pg.find("İtalik");
    return { ols: el.querySelectorAll("ol").length, uls: el.querySelectorAll("ul").length, olPages: window.pg.pageOfEl(ol), ulPages: window.pg.pageOfEl(ul), firstNext, firstNextText: items[firstNext]?.textContent,
      itemSplit: items.some((li) => { const p = window.pg.pageOfEl(li); return p.first !== p.last; }), boldPage: window.pg.pageOfEl(el.querySelector("b")),
      boldWeight: getComputedStyle(bold.node.parentElement).fontWeight, italic: getComputedStyle(italic.node.parentElement).fontStyle,
      headings: ["h1", "h2", "h3"].map((tag) => window.pg.pageOfEl(el.querySelector(tag)).first), count: window.pg.count(), start: ol.getAttribute("start") };
  });
  assert.equal(lists.ols, 1); assert.equal(lists.uls, 1); assert.equal(lists.start, null);
  assert.ok(lists.olPages.last > lists.olPages.first && lists.firstNext > 0 && lists.firstNextText === `Numaralı madde ${lists.firstNext + 1}`, JSON.stringify(lists));
  assert.ok(lists.ulPages.last >= lists.ulPages.first); assert.equal(lists.itemSplit, false);
  assert.ok(lists.boldPage.last > lists.boldPage.first, "bold run spans a page break"); assert.equal(lists.boldWeight, "700"); assert.equal(lists.italic, "italic");
  assert.deepEqual([...lists.headings].sort((a, b) => a - b), lists.headings);
  const savedList = (await doc()).content; assert.match(savedList, /<b>Kalın başlangıç/); assert.doesNotMatch(savedList, /thesis-sheet|page-gap|data-thesis-page|column/);
  await page.locator('[data-thesis-flow-section="main"] ol > li').nth(lists.firstNext).scrollIntoViewIfNeeded();
  await shot("ordered-list-continues.png");
  pass(`9-12 H1/H2/H3 order, bold/italic across a break, one <ol> continuing at item ${lists.firstNext + 1} on the next page, one <ul> across pages (${lists.count} pages)`);

  // 13, 28. Small table moves whole; huge table splits by row without hanging.
  const rows = (n, label) => Array.from({ length: n }, (_, i) => `<tr><td>${label} ${i + 1}</td><td>Değer ${i + 1}</td></tr>`).join("");
  const tableDoc = (k) => Array.from({ length: k }, (_, i) => `Satır ${i + 1}`).join("\n") + `<div class="academic-table-wrap" data-academic-table="true"><table class="academic-table"><thead><tr><th>A</th><th>B</th></tr></thead><tbody>${rows(6, "Küçük")}</tbody></table></div>Tablo sonrası.`;
  await load(tableDoc(33));
  const small = await pg(() => { const t = window.pg.editor().querySelector("table"); return { ...window.pg.pageOfEl(t), before: window.pg.pageOfText("Satır 33") }; });
  assert.ok(small.before === 1 && small.first === 2 && small.last === 2 && small.fragments === 1, JSON.stringify(small));
  pass("13 a small table that does not fit the remaining space moves to the next page as a whole");
  let hugeTime = await timed(async () => { await load(`Önce.<div class="academic-table-wrap" data-academic-table="true"><table class="academic-table"><thead><tr><th>A</th><th>B</th></tr></thead><tbody>${rows(400, "Büyük")}</tbody></table></div>Sonra.`); });
  const huge = await pg(() => { const t = window.pg.editor().querySelector("table"); const trs = [...t.querySelectorAll("tbody tr:not([data-thesis-cont])")]; return { ...window.pg.pageOfEl(t), rows: trs.length, splitRows: trs.filter((tr) => { const p = window.pg.pageOfEl(tr); return p.first !== p.last; }).length, lastRow: window.pg.pageOfEl(trs.at(-1)).first, after: window.pg.pageOfText("Sonra."), count: window.pg.count() }; });
  assert.equal(huge.rows, 400); assert.equal(huge.splitRows, 0); assert.ok(huge.count >= 8 && huge.last === huge.count && huge.after === huge.count, JSON.stringify(huge));
  const savedHuge = (await doc()).content;
  assert.equal((savedHuge.match(/Büyük \d+/g) || []).length, 400, "saving preserves exactly the authored rows");
  assert.doesNotMatch(savedHuge, /data-thesis-cont/, "repeated presentation headers never enter saved content");
  assert.ok(hugeTime < 15000, `huge table load ${hugeTime}ms`);
  await page.locator('[data-thesis-flow-section="main"] tbody tr').nth(60).scrollIntoViewIfNeeded(); await shot("long-table.png");
  pass(`13/28 a 400-row table spans ${huge.count} pages split by whole rows, all rows kept, no loop (${hugeTime}ms load)`);

  // 26. One enormous paragraph (no newline) splits across pages and stays editable.
  const longPara = "Başlangıç " + Array.from({ length: 9000 }, (_, i) => ["uzun", "tek", "paragraf", "bölünür"][i % 4]).join(" ") + " BİTİŞ";
  const longTime = await timed(() => load(longPara));
  const long = await pg(() => ({ count: window.pg.count(), end: window.pg.pageOfText("BİTİŞ"), start: window.pg.pageOfText("Başlangıç") }));
  assert.ok(long.count >= 10 && long.start === 1 && long.end === long.count, JSON.stringify(long));
  // Keystroke cost on a long document: edit + React + serialization + native pagination.
  const latency = await pg(async () => {
    const el = window.pg.editor(); const hit = window.pg.find("Başlangıç"); el.focus({ preventScroll: true }); document.getSelection().collapse(hit.node, 5);
    const times = [];
    for (let i = 0; i < 15; i += 1) { const t0 = performance.now(); document.execCommand("insertText", false, "x"); void window.pg.art().offsetHeight; times.push(performance.now() - t0); await window.pg.frames(1); }
    times.sort((a, b) => a - b); return { median: Math.round(times[7] * 10) / 10, max: Math.round(times.at(-1) * 10) / 10 };
  });
  assert.ok(latency.median < 120, `keystroke ${JSON.stringify(latency)}`);
  pass(`26 a 9000-word single paragraph splits over ${long.count} pages without hanging (${longTime}ms load); keystroke median ${latency.median}ms, max ${latency.max}ms`);

  // 27. Oversized existing image: clamped, moved as a figure, no loop. (No image insertion pipeline involved.)
  const tall = await pg(() => { const c = document.createElement("canvas"); c.width = 300; c.height = 2400; const x = c.getContext("2d"); x.fillStyle = "#0f766e"; x.fillRect(0, 0, 300, 2400); return c.toDataURL("image/png"); });
  const figure = (src, w, h) => `<figure class="academic-figure" data-academic-id="fig-e2e" data-kind="figure" contenteditable="false"><img width="${w}" height="${h}" src="${src}" alt="Uzun görsel"><figcaption><span class="academic-caption-label" contenteditable="false">Şekil 1. </span>Uzun görsel</figcaption></figure>​`;
  const imageTime = await timed(() => load(Array.from({ length: 20 }, (_, i) => `Satır ${i + 1}`).join("\n") + figure(tall, 300, 2400) + "Görsel sonrası metin." + figure(tall, 300, 2400) + "Son."));
  await page.waitForFunction(() => [...document.querySelectorAll('[data-thesis-flow-section="main"] img')].every((img) => img.complete)); await settle();
  const img = await pg(() => { const imgs = [...window.pg.editor().querySelectorAll("img")]; const a = window.pg.art(); const zoom = a.getBoundingClientRect().width / a.offsetWidth; return { heights: imgs.map((i) => Math.round(i.getBoundingClientRect().height / zoom)), pages: imgs.map((i) => window.pg.pageOfEl(i)), text: window.pg.pageOfText("Satır 20"), after: window.pg.pageOfText("Görsel sonrası"), count: window.pg.count() }; });
  assert.ok(img.heights.every((h) => h <= Math.ceil(247 * 96 / 25.4)), JSON.stringify(img));
  assert.ok(img.pages.every((p) => p.first === p.last && p.fragments === 1) && img.pages[0].first === 2 && img.text === 1 && img.count <= 6, JSON.stringify(img));
  await page.locator('[data-thesis-flow-section="main"] img').nth(1).scrollIntoViewIfNeeded(); await page.locator('[data-thesis-flow-section="main"] img').nth(1).click();
  const ib = await page.locator('[data-thesis-flow-section="main"] img').nth(1).boundingBox(); const cb = await page.locator(".academic-image-controls").boundingBox();
  for (const k of ["x", "y", "width", "height"]) assert.ok(Math.abs(ib[k] - cb[k]) < 2, `image overlay ${k} on page ${img.pages[1].first}: ${ib[k]} vs ${cb[k]}`);
  await shot("image-on-later-page-selected.png"); await page.keyboard.press("Escape");
  pass(`27 oversized existing images are clamped to the content height, move whole to the next page (${img.count} pages, ${imageTime}ms), and the selection overlay stays on the image on page ${img.pages[1].first}`);

  // 14-20. Sections, cover and numbering (fixture A: cover none / roman front / arabic main restarting at 1).
  await load(Array.from({ length: 40 }, (_, i) => para(i + 1)).join("\n"));
  const sections = await pg(() => ({
    order: [...document.querySelectorAll(".thesis-flow-section")].map((s) => s.dataset.thesisFlowSection),
    groups: [...document.querySelectorAll(".thesis-paper")].map((a) => [a.dataset.thesisSection, [...a.querySelectorAll(".thesis-flow-section")].map((s) => s.dataset.thesisFlowSection)]),
    labels: [...document.querySelectorAll(".thesis-sheet")].map((s) => s.querySelector(".thesis-page-number")?.textContent || ""),
    coverPages: window.pg.count("cover"), mainCount: window.pg.count(),
  }));
  assert.deepEqual(sections.order, ["cover", "abstract", "toc", "main", "bibliography"]);
  assert.deepEqual(sections.groups.map(([id, members]) => [id, members.length]), [["cover", 1], ["abstract", 1], ["toc", 1], ["main", 1], ["bibliography", 1]]);
  assert.equal(sections.coverPages, 1);
  const arabic = Array.from({ length: sections.mainCount }, (_, i) => String(i + 1));
  assert.deepEqual(sections.labels, ["", "i", "ii", ...arabic, String(sections.mainCount + 1)]);
  const numberStyle = await page.locator('.thesis-paper[data-thesis-section="main"]').evaluate((a) => { const n = a.parentElement.querySelector(".thesis-page-number"); const s = n.closest(".thesis-sheet").getBoundingClientRect(); const r = n.getBoundingClientRect(); return { align: getComputedStyle(n).textAlign, bottomHalf: r.top > s.top + s.height / 2 }; });
  assert.deepEqual(numberStyle, { align: "center", bottomHalf: true });
  await page.locator('.thesis-paper[data-thesis-section="abstract"]').scrollIntoViewIfNeeded(); await shot("front-matter-roman.png");
  pass(`14-20 sections keep template order, cover is its own unnumbered page, front matter i/ii, main restarts at 1…${sections.mainCount}, bibliography continues at ${sections.mainCount + 1}, bottom-center numbers`);

  // Fixture C abstract has pageBreakBefore:false, but the declaration is a special page (Task 8), so it
  // never shares its sheet; grouping of ordinary sections is covered by thesisEngine.test.js.
  // Roman-upper top-right; H1 page breaks.
  await load("<h1>Introduction</h1>" + para(1) + "<h1>Method</h1>" + para(2), "fixture-university-c-phd-en-v1");
  const c = await pg(() => ({
    groups: [...document.querySelectorAll(".thesis-paper")].map((a) => [a.dataset.thesisSection, [...a.querySelectorAll(".thesis-flow-section")].map((s) => s.dataset.thesisFlowSection)]),
    abstractPage: window.pg.pageOfText("Özet metni", "abstract", "abstract"), declarationCount: window.pg.count("declaration"),
    labels: [...document.querySelectorAll(".thesis-sheet")].map((s) => s.querySelector(".thesis-page-number")?.textContent || ""),
    method: window.pg.pageOfEl([...window.pg.editor().querySelectorAll("h1")][1]).first, intro: window.pg.pageOfEl(window.pg.editor().querySelector("h1")).first,
    top: (() => { const n = document.querySelector('.thesis-paper[data-thesis-section="declaration"]').parentElement.querySelector(".thesis-page-number"); const s = n.closest(".thesis-sheet").getBoundingClientRect(); return { align: getComputedStyle(n).textAlign, topHalf: n.getBoundingClientRect().bottom < s.top + s.height / 2 }; })(),
  }));
  assert.deepEqual(c.groups, [["cover", ["cover"]], ["declaration", ["declaration"]], ["abstract", ["abstract"]], ["toc", ["toc"]], ["main", ["main"]], ["appendices", ["appendices"]], ["bibliography", ["bibliography"]]]);
  assert.equal(c.abstractPage, 1); assert.equal(c.declarationCount, 1);
  assert.deepEqual(c.labels, ["", "I", "II", "III", "1", "2", "3", "4"]);
  assert.deepEqual([c.intro, c.method], [1, 2], "template H1 pageBreakBefore starts a new page without an empty first page");
  assert.deepEqual(c.top, { align: "right", topHalf: true });
  await page.locator('.thesis-paper[data-thesis-section="declaration"]').scrollIntoViewIfNeeded(); await shot("fixture-c-top-right-roman.png");
  pass("14 special declaration page stays isolated, other sections start new pages; roman-upper top-right; template H1 page breaks");

  // 23-25. Persistence: switch away/back and reload keep content and recompute the same pages.
  await load(listDoc);
  await placeCaret("Son.", true); await page.keyboard.type(" Kalıcı düzenleme."); await page.waitForTimeout(100);
  const saved = await doc(); const layoutBefore = await pg(() => ({ count: window.pg.count(), total: window.pg.total(), fp: window.pg.fingerprint() }));
  assert.match(saved.content, /Kalıcı düzenleme/); assert.doesNotMatch(JSON.stringify(saved), /thesis-sheet|pageCount|data-thesis-page|page-gap/);
  await page.click("#switch-note"); await page.waitForSelector("#other-note"); await page.click("#switch-note");
  await page.waitForSelector('[data-thesis-flow-section="main"] .rich-text-body[contenteditable="true"]'); await page.getByLabel("Yakınlaştır", { exact: true }).selectOption("100"); await settle();
  assert.deepEqual(await doc(), saved); assert.deepEqual(await pg(() => ({ count: window.pg.count(), total: window.pg.total(), fp: window.pg.fingerprint() })), layoutBefore);
  await page.reload(); await page.waitForSelector('[data-thesis-flow-section="main"] .rich-text-body[contenteditable="true"]'); await page.getByLabel("Yakınlaştır", { exact: true }).selectOption("100"); await settle();
  assert.deepEqual(await doc(), saved); assert.deepEqual(await pg(() => ({ count: window.pg.count(), total: window.pg.total(), fp: window.pg.fingerprint() })), layoutBefore);
  pass(`23-25 switch/reload keep identical stored content (no page data) and recompute the same ${layoutBefore.total} pages and breaks`);

  // Margin click on page 2 puts the caret on that page instead of the document start.
  await load(body);
  const target = await page.locator('.thesis-paper[data-thesis-section="main"]').evaluate((a) => {
    const vp = a.closest(".overflow-auto"); const y = 297 * 96 / 25.4 + 28 + 400;
    vp.scrollTop += a.getBoundingClientRect().top - vp.getBoundingClientRect().top + y - 300;
    const r = a.getBoundingClientRect(); return { x: r.left + 20, y: r.top + y };
  });
  await page.mouse.click(target.x, target.y);
  const marginCaret = await pg(() => { const r = document.getSelection().getRangeAt(0).getClientRects()[0]; return { active: document.activeElement === window.pg.editor(), page: Math.floor((r.top - window.pg.art().getBoundingClientRect().top) / window.pg.STRIDE) + 1 }; });
  assert.deepEqual(marginCaret, { active: true, page: 2 });
  pass("clicking the left margin of page 2 focuses the editor on page 2 without jumping");

  const consistency = await pg(() => [...document.querySelectorAll(".thesis-paper")].every((a) => window.pg.sheets(a.dataset.thesisSection) === window.pg.count(a.dataset.thesisSection)));
  assert.equal(consistency, true);
  assert.deepEqual(errors, []);
  pass("no page errors, console errors or ResizeObserver loop warnings; sheets always match measured pages");
  await writeFile(new URL("result.json", out), JSON.stringify({ passed: true, results, latency, consoleErrors: errors, date: new Date().toISOString() }, null, 2));
} finally { await browser.close(); }
