import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { strFromU8, unzipSync } from "fflate";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const MM_PER_PT = 25.4 / 72;
const EMU_PER_MM = 914400 / 25.4;
const TWIPS_PER_MM = 1440 / 25.4;
const cleanXml = value => String(value ?? "").replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(Number.parseInt(n, 16)));
const normalize = value => cleanXml(value).replace(/\s+/g, " ").trim().toLocaleLowerCase("tr");
const near = (actual, expected, tolerance, label) => assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance, label + ": expected " + expected + " ± " + tolerance + " mm, actual " + actual);

async function bytesOf(value) {
  if (typeof value === "string") return new Uint8Array(await readFile(value));
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  if (value && typeof value.arrayBuffer === "function") return new Uint8Array(await value.arrayBuffer());
  throw new TypeError("Export input must be a path, Blob, ArrayBuffer, or Uint8Array");
}

const attr = (fragment, name) => fragment.match(new RegExp("\\b" + name + "=\"([^\"]*)\""))?.[1] ?? null;
const anchors = xml => [...xml.matchAll(/<wp:anchor\b[\s\S]*?<\/wp:anchor>/g)].map(match => match[0]);

function checkDocxElement(xml, element, tolerance) {
  if (element.type === "separator") {
    const frame = [...xml.matchAll(/<w:framePr\b[^>]*\/>/g)].map(match => match[0]).find(value =>
      Math.abs(Number(attr(value, "w:x")) / TWIPS_PER_MM - element.xMm) <= tolerance &&
      Math.abs(Number(attr(value, "w:y")) / TWIPS_PER_MM - element.yMm) <= tolerance);
    assert.ok(frame, "DOCX has the expected positioned separator");
    near(Number(attr(frame, "w:x")) / TWIPS_PER_MM, element.xMm, tolerance, "DOCX line x");
    near(Number(attr(frame, "w:y")) / TWIPS_PER_MM, element.yMm, tolerance, "DOCX line y");
    if (Number.isFinite(element.widthMm)) near(Number(attr(frame, "w:w")) / TWIPS_PER_MM, element.widthMm, tolerance, "DOCX line width");
    return { type: element.type, xMm: Number(attr(frame, "w:x")) / TWIPS_PER_MM, yMm: Number(attr(frame, "w:y")) / TWIPS_PER_MM };
  }
  const available = anchors(xml);
  const text = normalize(element.text);
  const anchor = element.type === "text"
    ? available.find(value => value.includes("<wps:txbx>") && normalize(value).includes(text))
    : available.find(value => /<pic:pic\b/.test(value) && (!element.id || value.includes("title=\"" + element.id + "\"") || value.includes("name=\"" + element.id + "\"")));
  assert.ok(anchor, "DOCX contains positioned " + element.type + " " + (element.id || element.text || ""));
  const x = Number(anchor.match(/<wp:positionH\b[^>]*>\s*<wp:posOffset>(-?\d+)<\/wp:posOffset>/)?.[1]);
  const y = Number(anchor.match(/<wp:positionV\b[^>]*>\s*<wp:posOffset>(-?\d+)<\/wp:posOffset>/)?.[1]);
  const size = anchor.match(/<wp:extent\b[^>]*cx="(\d+)"[^>]*cy="(\d+)"/);
  near(x / EMU_PER_MM, element.xMm, tolerance, "DOCX " + element.type + " x");
  near(y / EMU_PER_MM, element.yMm, tolerance, "DOCX " + element.type + " y");
  if (Number.isFinite(element.widthMm)) near(Number(size?.[1]) / EMU_PER_MM, element.widthMm, tolerance, "DOCX " + element.type + " width");
  if (Number.isFinite(element.heightMm)) near(Number(size?.[2]) / EMU_PER_MM, element.heightMm, tolerance, "DOCX " + element.type + " height");
  const result = { type: element.type, xMm: x / EMU_PER_MM, yMm: y / EMU_PER_MM, widthMm: Number(size?.[1]) / EMU_PER_MM, heightMm: Number(size?.[2]) / EMU_PER_MM };
  if (element.type === "text") {
    assert.match(anchor, /<wps:cNvSpPr txBox="1"\s*\/>/, "text box stays editable");
    if (element.fontFamily) assert.ok(anchor.includes("w:ascii=\"" + element.fontFamily + "\""), "DOCX uses " + element.fontFamily);
    if (Number.isFinite(element.fontSizePt)) assert.ok(anchor.includes("<w:sz w:val=\"" + Math.round(element.fontSizePt * 2) + "\""), "DOCX uses " + element.fontSizePt + " pt");
    if (element.bold) assert.match(anchor, /<w:b\s*\/>/);
    if (element.italic) assert.match(anchor, /<w:i\s*\/>/);
    if (element.underline) assert.match(anchor, /<w:u w:val="single"\s*\/>/);
    if (element.color) assert.ok(anchor.includes("<w:color w:val=\"" + element.color.replace(/^#/, "").toUpperCase() + "\""));
  }
  return result;
}

async function checkPdf(file, elements, tolerance, label) {
  const task = await getDocument({ data: await bytesOf(file), useSystemFonts: true }).promise;
  try {
    const pages = [];
    for (let index = 1; index <= task.numPages; index += 1) {
      const page = await task.getPage(index);
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();
      pages.push({
        index,
        items: content.items.filter(item => typeof item.str === "string" && item.str.trim()).map(item => ({
          text: item.str,
          xMm: item.transform[4] * MM_PER_PT,
          baselineYmm: (viewport.height - item.transform[5]) * MM_PER_PT,
          fontSizePt: Math.hypot(item.transform[0], item.transform[1]),
          fontName: content.styles?.[item.fontName]?.fontFamily || item.fontName,
        })),
      });
    }
    const result = [];
    for (const element of elements.filter(entry => entry.type === "text" && entry.text)) {
      const key = normalize(element.text);
      const page = pages.find(candidate => candidate.items.some(item => normalize(item.text).includes(key)));
      assert.ok(page, label + " contains searchable positioned text " + element.text);
      const item = page.items.find(candidate => normalize(candidate.text).includes(key));
      if (Number.isFinite(element.pdfTextXmm)) near(item.xMm, element.pdfTextXmm, tolerance, label + " text x");
      if (Number.isFinite(element.pdfBaselineYmm)) near(item.baselineYmm, element.pdfBaselineYmm, tolerance, label + " text baseline y");
      if (Number.isFinite(element.fontSizePt)) near(item.fontSizePt, element.fontSizePt, 0.25, label + " font size");
      result.push({ page: page.index, ...item });
    }
    return { pageCount: task.numPages, text: result };
  } finally {
    await task.cleanup?.();
  }
}

/**
 * Compare the live editor with real exported files.
 * files = { pdf, docx, wordPdf? }; each value may be a path, Blob, ArrayBuffer,
 * or Uint8Array. expected.elements entries accept {id,type,text,xMm,yMm,
 * widthMm,heightMm,fontFamily,fontSizePt}. Throws on a mismatch and returns
 * measured editor, PDF, DOCX and optional Word-rendered PDF data.
 */
export async function layoutExportChecks(page, files, expected = {}) {
  assert.ok(files?.pdf && files?.docx, "real PDF and DOCX artifacts are required");
  const tolerance = Number.isFinite(expected.toleranceMm) ? expected.toleranceMm : 0.5;
  const elements = expected.elements || [];
  const editor = await page.evaluate(specs => specs.map(spec => {
    const selector = spec.selector || (spec.id ? "[data-layout-id=\"" + CSS.escape(spec.id) + "\"]" : null);
    const node = selector ? document.querySelector(selector) : null;
    if (!node) return { id: spec.id, missing: true };
    const paper = node.closest(".thesis-paper");
    if (!paper) return { id: spec.id, missingPaper: true };
    const box = paper.getBoundingClientRect();
    const paperStyle = getComputedStyle(paper);
    const cssWidth = Number.parseFloat(paperStyle.width);
    const scale = cssWidth > 0 ? box.width / cssWidth : 1;
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    const result = {
      id: spec.id,
      xMm: (rect.left - box.left) / scale * 25.4 / 96,
      yMm: (rect.top - box.top) / scale * 25.4 / 96,
      widthMm: rect.width / scale * 25.4 / 96,
      heightMm: rect.height / scale * 25.4 / 96,
      fontFamily: style.fontFamily,
      fontSizePt: Number.parseFloat(style.fontSize) * 72 / 96,
    };
    if (spec.type === "text") {
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        if (!walker.currentNode.data.trim()) continue;
        const range = document.createRange();
        range.setStart(walker.currentNode, 0);
        range.setEnd(walker.currentNode, walker.currentNode.data.length);
        const glyph = range.getClientRects()[0];
        if (!glyph) continue;
        const context = document.createElement("canvas").getContext("2d");
        context.font = style.fontStyle + " " + style.fontWeight + " " + style.fontSize + " " + style.fontFamily;
        const metrics = context.measureText("Hg");
        const ascent = metrics.fontBoundingBoxAscent || Number.parseFloat(style.fontSize) * 0.891;
        result.textXmm = (glyph.left - box.left) / scale * 25.4 / 96;
        result.textBaselineYmm = ((glyph.top - box.top) / scale + ascent) * 25.4 / 96;
        break;
      }
    }
    return result;
  }), elements);
  for (let index = 0; index < elements.length; index += 1) {
    const spec = elements[index], actual = editor[index];
    assert.ok(!actual.missing && !actual.missingPaper, "editor contains " + (spec.id || spec.selector));
    for (const key of ["xMm", "yMm", "widthMm", "heightMm"]) if (Number.isFinite(spec[key])) near(actual[key], spec[key], tolerance, "editor " + spec.id + " " + key);
  }
  const filesInDocx = unzipSync(await bytesOf(files.docx));
  const xml = strFromU8(filesInDocx["word/document.xml"]);
  const docx = elements.map(element => checkDocxElement(xml, element, tolerance));
  const pdf = await checkPdf(files.pdf, elements, tolerance, "PDF");
  const wordPdf = files.wordPdf ? await checkPdf(files.wordPdf, elements, tolerance, "Word PDF") : null;
  for (let index = 0; index < elements.length; index += 1) {
    const spec = elements[index], actual = editor[index];
    if (spec.type !== "text" || !Number.isFinite(actual.textXmm)) continue;
    const pdfText = pdf.text.find(item => normalize(item.text).includes(normalize(spec.text)));
    if (pdfText) {
      near(pdfText.xMm, actual.textXmm, tolerance, "PDF " + spec.id + " text origin");
      near(pdfText.baselineYmm, actual.textBaselineYmm, tolerance, "PDF " + spec.id + " text baseline");
    }
    const wordText = wordPdf?.text.find(item => normalize(item.text).includes(normalize(spec.text)));
    if (wordText) {
      near(wordText.xMm, actual.textXmm, tolerance, "Word PDF " + spec.id + " text origin");
      near(wordText.baselineYmm, actual.textBaselineYmm, tolerance, "Word PDF " + spec.id + " text baseline");
    }
  }
  if (Number.isFinite(expected.pageCount)) {
    assert.equal(pdf.pageCount, expected.pageCount, "PDF page count");
    if (wordPdf) assert.equal(wordPdf.pageCount, expected.pageCount, "Word PDF page count");
  }
  return { status: "PASS", toleranceMm: tolerance, editor, pdf, docx, wordPdf };
}
