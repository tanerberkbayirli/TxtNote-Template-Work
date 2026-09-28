import assert from "node:assert/strict";
import { test } from "node:test";
import { ACADEMIC_CSS, fitImageSize, pageSlices, pageBreakYs, boxBeforeBreak, CONTENT_WIDTH, academicPageCountFromContent, CONTENT_HEIGHT, pageSpacerHeight, PAGE_MARGIN_PX, htmlWithoutPageGaps, tightenAcademicText } from "./academicLayout.js";
import { mergeFormatClassName, parsePartialFormat, formatClassName } from "../config/format.js";

test("academic CSS keeps code as a wrapping monospace listing", () => {
  assert.match(ACADEMIC_CSS, /academic-code/);
  assert.match(ACADEMIC_CSS, /overflow-wrap:anywhere/);
  assert.match(ACADEMIC_CSS, /academic-table-wrap/);
});

test("wide and tall images fit the printable page without distortion", () => {
  const wide = fitImageSize(2400, 1200);
  assert.ok(wide.width <= Math.ceil(CONTENT_WIDTH));
  assert.ok(Math.abs(wide.width / wide.height - 2) < .01);
  const tall = fitImageSize(200, 2400);
  assert.ok(tall.height <= 605);
  assert.deepEqual(fitImageSize(320,160), {width:320,height:160});
});
test("page boundaries preserve complete figures and line boxes", () => {
  const pages = pageSlices(2500, [{top:850,bottom:1150},{top:1790,bottom:1810}], 900);
  assert.equal(pages[0].height,850);
  assert.equal(pages.reduce((sum,page)=>sum+page.height,0),2500);
  assert.ok(pages.every(page=>page.height>0 && page.height<=900));
  for (let i=1;i<pages.length;i++) assert.equal(pages[i].start,pages[i-1].start+pages[i-1].height);
});
test("oversized blocks never stall pagination", () => {
  assert.equal(pageSlices(3000,[{top:0,bottom:3000}],900).length,4);
});
test("editor page breaks match A4 PDF content height", () => {
  assert.equal(academicPageCountFromContent(CONTENT_HEIGHT), 1);
  assert.equal(academicPageCountFromContent(CONTENT_HEIGHT + 1), 2);
  assert.equal(pageSpacerHeight(), 2 * PAGE_MARGIN_PX + 24);
});
test("page breaks never cut through a complete line box", () => {
  const lines = Array.from({ length: 40 }, (_, i) => ({ top: i * 48, bottom: i * 48 + 36 }));
  const pages = pageSlices(1920, lines, 400);
  assert.ok(pages.length >= 5);
  for (const line of lines) {
    if (line.bottom - line.top > 400) continue;
    for (const page of pages) {
      const end = page.start + page.height;
      assert.equal(line.top < end && line.bottom > end, false);
    }
  }
});

test("later pages use the same A4 content height as the first page", () => {
  const lines = Array.from({ length: 80 }, (_, i) => ({ top: i * 24, bottom: i * 24 + 20 }));
  const ys = pageBreakYs(1920, lines, CONTENT_HEIGHT);
  const pages = pageSlices(1920, lines, CONTENT_HEIGHT);
  assert.ok(pages.length >= 2);
  assert.equal(ys.length, pages.length - 1);
  for (let i = 0; i < pages.length - 1; i++) {
    assert.ok(pages[i].height <= CONTENT_HEIGHT + 0.01);
    assert.equal(ys[i], pages[i].start + pages[i].height);
  }
});

test("boxBeforeBreak picks the last complete line, not the straddling one", () => {
  const boxes = [
    { top: 800, bottom: 830, id: "a" },
    { top: 840, bottom: 870, id: "b" },
    { top: 880, bottom: 920, id: "c" },
  ];
  assert.equal(boxBeforeBreak(boxes, 880).id, "b");
  assert.equal(boxBeforeBreak(boxes, 870).id, "b");
});

test("saved html drops page-gap spacers", () => {
  const html = `<p>Bir</p><div data-academic-page-gap="true" class="academic-page-gap" style="height:212px"></div><p>İki</p>`;
  assert.equal(htmlWithoutPageGaps(html).includes("data-academic-page-gap"), false);
  assert.match(htmlWithoutPageGaps(html), /Bir/);
  assert.match(htmlWithoutPageGaps(html), /İki/);
});

test("tightenAcademicText collapses blank lines without touching code-like content", () => {
  assert.equal(tightenAcademicText("Bir\n\n\nİki"), "Bir\nİki");
  assert.equal(tightenAcademicText("Bir\nİki"), "Bir\nİki");
  assert.equal(tightenAcademicText("satır  \n \n\t\nson"), "satır  \nson");
});

test("underline and strike toggle independently of size and bold", () => {
  const before=formatClassName({size:"heading",bold:true,underline:true,strike:true});
  const after=mergeFormatClassName(before,{underline:false});
  assert.deepEqual(parsePartialFormat(after),{size:"heading",color:"black",bold:true,strike:true});
});

test("overline and strike can be turned off without dropping bold", () => {
  const on = formatClassName({ size: "body", bold: true, overline: true, strike: true });
  const noOver = mergeFormatClassName(on, { overline: false });
  assert.deepEqual(parsePartialFormat(noOver), { size: "body", color: "black", bold: true, strike: true });
  const noStrike = mergeFormatClassName(noOver, { strike: false });
  assert.deepEqual(parsePartialFormat(noStrike), { size: "body", color: "black", bold: true });
});
