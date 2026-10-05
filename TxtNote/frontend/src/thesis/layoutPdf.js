/**
 * Editor-parity PDF. The thesis editor already lays the document out on A4
 * sheets with the browser's fragmentation engine (pageLayout.js). This writer
 * does not paginate again: it reads the positions the editor laid out — every
 * word, list marker, heading number, border, image and sheet chrome — and
 * draws them at the same millimetre on the same sheet as searchable text.
 * Zoom is a transform on the page stack, so all measurements are divided by
 * it and the output is identical at every zoom level.
 */
import { jsPDF } from "jspdf";
import { academicPdfFont, embedAcademicPdfFonts, pdfFontStyle, primaryFontFamily } from "../lib/academicFonts.js";
import { PX_PER_MM, pageCountFromFlowHeight, pageMetrics, thesisGroupHasPageContent } from "./pageLayout.js";

const MM = 1 / PX_PER_MM;
// KaTeX keeps a visually hidden MathML copy next to the drawn formula; only the drawn one is exported.
const SKIP = "button,input,select,textarea,script,style,svg,math,.katex-mathml,.sr-only,[data-export-ignore],.academic-page-gap";
// jsPDF's built-in Helvetica/Courier only encode Latin-1; other words use the embedded academic face.
const LATIN1 = /^[\x20-\x7e\xa0-\xff]*$/;

let canvasContext = null;
const metricCache = new Map();
function measureContext() {
  canvasContext ||= document.createElement("canvas").getContext("2d");
  return canvasContext;
}
const canvasFont = (style) => `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
/** Ascent in CSS px: the baseline of a text fragment is its rect top + ascent. */
function fontAscent(style) {
  const key = canvasFont(style);
  if (!metricCache.has(key)) {
    const context = measureContext();
    context.font = key;
    const metrics = context.measureText("Hg");
    metricCache.set(key, metrics.fontBoundingBoxAscent || parseFloat(style.fontSize) * 0.891);
  }
  return metricCache.get(key);
}
function textWidth(style, text) {
  const context = measureContext();
  context.font = canvasFont(style);
  return context.measureText(text).width;
}

/** Plain copy of the typography a text op needs (computed style objects are live). */
const textStyle = (style) => ({ fontStyle: style.fontStyle, fontWeight: style.fontWeight, fontSize: style.fontSize, fontFamily: style.fontFamily, color: style.color, letterSpacing: style.letterSpacing, textTransform: style.textTransform });

function color(value) {
  const match = String(value || "").match(/rgba?\(([^)]+)\)/);
  if (!match) return null;
  const [r, g, b, a = 1] = match[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  return a === 0 ? null : [r, g, b];
}

function pdfFace(pdf, style, text) {
  const family = primaryFontFamily(style.fontFamily).toLowerCase();
  const bold = Number(style.fontWeight) >= 600;
  const italic = style.fontStyle === "italic" || style.fontStyle.startsWith("oblique");
  // Monospace keeps jsPDF's Courier for Latin-1 runs; serif and sans text use the faces embedded for the document
  // (system font or its bundled metric twin), so one line never mixes a built-in face with an embedded one.
  const builtin = /^(courier|courier new|monospace|consolas)$/.test(family) ? "courier" : "";
  if (builtin && LATIN1.test(text)) return { name: builtin, style: `${bold ? "bold" : ""}${italic ? "italic" : ""}` || "normal" };
  const faceStyle = pdfFontStyle({ bold, italic });
  return { name: academicPdfFont(pdf, faceStyle, style.fontFamily), style: faceStyle };
}

function transformText(text, transform, language) {
  if (transform === "uppercase") return text.toLocaleUpperCase(language);
  if (transform === "lowercase") return text.toLocaleLowerCase(language);
  if (transform === "capitalize") return text.replace(/^\S/, (letter) => letter.toLocaleUpperCase(language));
  return text;
}

function markerText(li, type) {
  if (/^(disc|circle|square)$/.test(type)) return { disc: "•", circle: "◦", square: "▪" }[type];
  const list = li.parentElement;
  let value = list?.tagName === "OL" && list.hasAttribute("start") ? Number(list.getAttribute("start")) || 1 : 1;
  for (const item of list ? list.children : []) {
    if (item.tagName !== "LI") continue;
    if (item.hasAttribute("value")) value = Number(item.getAttribute("value")) || value;
    if (item === li) break;
    value += 1;
  }
  if (type === "lower-roman" || type === "upper-roman") {
    const numerals = [[1000, "m"], [900, "cm"], [500, "d"], [400, "cd"], [100, "c"], [90, "xc"], [50, "l"], [40, "xl"], [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"]];
    let rest = value; let result = "";
    for (const [n, symbol] of numerals) while (rest >= n) { result += symbol; rest -= n; }
    return `${type === "upper-roman" ? result.toUpperCase() : result}.`;
  }
  if (type === "lower-alpha" || type === "upper-alpha" || type === "lower-latin" || type === "upper-latin") {
    const letter = String.fromCharCode(96 + ((value - 1) % 26) + 1);
    return `${type.startsWith("upper") ? letter.toUpperCase() : letter}.`;
  }
  return `${value}.`;
}

/** Draw operations of one page group, in CSS px relative to its unscaled page stack. */
function collectGroup(stack, language) {
  const origin = stack.getBoundingClientRect();
  // The exact display scale; offsetWidth is rounded to whole pixels (793.7 → 794 for A4),
  // which would stretch every position by ~0.04%.
  const zoom = new DOMMatrixReadOnly(getComputedStyle(stack).transform).a || 1;
  const local = (rect) => ({ left: (rect.left - origin.left) / zoom, top: (rect.top - origin.top) / zoom, width: rect.width / zoom, height: rect.height / zoom });
  const ops = [];
  const range = document.createRange();

  const decorations = (element) => {
    const lines = new Set();
    for (let node = element; node && node !== stack; node = node.parentElement) {
      const style = getComputedStyle(node);
      for (const line of String(style.textDecorationLine || "").split(/\s+/)) if (line === "underline" || line === "line-through") lines.add(line);
      if (!/^inline/.test(style.display)) break;
    }
    return [...lines];
  };

  const pushText = (text, rect, style, extra) => {
    const box = local(rect);
    const fill = color(style.color);
    if (!text || !fill) return;
    ops.push({ type: "text", text, x: box.left, top: box.top, width: box.width, baseline: box.top + fontAscent(style), style, color: fill, ...extra });
  };

  const words = (node, style, extra) => {
    const data = node.data;
    // Keep each special-page line as one text run. The browser and embedded PDF
    // font can differ slightly in glyph widths; separately painted words then
    // swallow the visible space as well as losing it during text extraction.
    if (node.parentElement.closest(".thesis-layout-text")) {
      let text = "", box = null;
      const flush = () => { if (text.trim() && box) pushText(transformText(text.trimEnd(), style.textTransform, style.lang), box, style, extra); };
      for (let i = 0; i < data.length; i += 1) {
        range.setStart(node, i); range.setEnd(node, i + 1);
        const rect = range.getClientRects()[0];
        if (!rect || !rect.width || !rect.height) continue;
        if (box && Math.abs(rect.top - box.top) >= 1) { flush(); text = ""; box = null; }
        text += data[i];
        box = box ? { ...box, right: rect.right, width: rect.right - box.left } : { left: rect.left, top: rect.top, right: rect.right, width: rect.width, height: rect.height, bottom: rect.bottom };
      }
      flush();
      return;
    }
    for (const match of data.matchAll(/\S+/g)) {
      const start = match.index;
      range.setStart(node, start); range.setEnd(node, start + match[0].length);
      const rects = [...range.getClientRects()].filter((rect) => rect.width > 0 || rect.height > 0);
      if (!rects.length) continue;
      const word = match[0].replace(/[​﻿]/g, "");
      // Read the actual clipping box of a dotted index leader. Its hidden tail must
      // not paint over the right-aligned page label in the DOM-based PDF.
      if (node.parentElement.matches(".thesis-index-leader")) {
        const clip = node.parentElement.getBoundingClientRect();
        let visible = 0;
        for (let i = 0; i < word.length; i += 1) {
          range.setStart(node, start + i); range.setEnd(node, start + i + 1);
          const glyph = range.getBoundingClientRect();
          if (glyph.right > clip.right + 0.1) break;
          visible += 1;
        }
        if (visible) { range.setStart(node, start); range.setEnd(node, start + visible); pushText(word.slice(0, visible), range.getBoundingClientRect(), style, extra); }
        continue;
      }
      if (rects.length === 1) { pushText(transformText(word, style.textTransform, style.lang), rects[0], style, extra); continue; }
      // A word broken across lines or pages: split it where its glyphs change line.
      let current = ""; let currentRect = null;
      for (let index = 0; index < match[0].length; index += 1) {
        range.setStart(node, start + index); range.setEnd(node, start + index + 1);
        const rect = range.getClientRects()[0];
        const char = match[0][index].replace(/[​﻿]/g, "");
        if (!rect || !char) continue;
        if (currentRect && Math.abs(rect.top - currentRect.top) < 1) current += char;
        else { if (current) pushText(transformText(current, style.textTransform, style.lang), currentRect, style, extra); current = char; currentRect = rect; }
      }
      if (current) pushText(transformText(current, style.textTransform, style.lang), currentRect, style, extra);
    }
  };

  const borders = (element, style) => {
    if (element.matches(".academic-page-break")) return;
    const sides = ["Top", "Right", "Bottom", "Left"].map((side) => ({
      side, width: parseFloat(style[`border${side}Width`]) || 0, color: color(style[`border${side}Color`]),
      visible: !/^(none|hidden)$/.test(style[`border${side}Style`]),
    }));
    if (!sides.some((entry) => entry.width > 0 && entry.visible && entry.color)) return;
    const rects = [...element.getClientRects()].map(local);
    rects.forEach((box, index) => {
      for (const entry of sides) {
        if (!(entry.width > 0 && entry.visible && entry.color)) continue;
        // A fragmented box (table split across pages) is sliced: top border on the first piece, bottom on the last.
        if (entry.side === "Top" && index > 0) continue;
        if (entry.side === "Bottom" && index < rects.length - 1) continue;
        const half = entry.width / 2;
        const line = {
          Top: [box.left, box.top + half, box.left + box.width, box.top + half],
          Bottom: [box.left, box.top + box.height - half, box.left + box.width, box.top + box.height - half],
          Left: [box.left + half, box.top, box.left + half, box.top + box.height],
          Right: [box.left + box.width - half, box.top, box.left + box.width - half, box.top + box.height],
        }[entry.side];
        ops.push({ type: "line", points: line, width: entry.width, color: entry.color, top: Math.min(line[1], line[3]), height: Math.abs(line[3] - line[1]) });
      }
    });
  };

  const visit = (element) => {
    if (element.matches(SKIP)) return;
    const style = getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") return;
    borders(element, style);
    if (element.tagName === "IMG") {
      const box = local(element.getBoundingClientRect());
      if (box.width > 0 && box.height > 0) ops.push({ type: "image", element, x: box.left, top: box.top, width: box.width, height: box.height });
      return;
    }
    const first = ops.length;
    // text-transform follows the language the browser used for this element.
    const typography = { ...textStyle(style), lang: element.closest("[lang]")?.getAttribute("lang") || language };
    const decoration = element.firstChild ? decorations(element) : [];
    for (const child of element.childNodes) {
      if (child.nodeType === 1) visit(child);
      else if (child.nodeType === 3 && child.data.trim()) words(child, typography, { decoration });
    }
    const firstText = ops.slice(first).find((op) => op.type === "text");
    // Generated content the editor shows: heading numbers (::before) and list markers (::marker).
    const number = element.getAttribute("data-thesis-number") || element.getAttribute("data-thesis-caption")?.trim();
    if (number && firstText) {
      const label = transformText(number, style.textTransform, typography.lang);
      pushLabel(label, firstText.x - textWidth(typography, `${label} `), firstText, typography);
    }
    if (element.tagName === "LI" && style.display === "list-item" && style.listStyleType !== "none" && firstText) {
      const marker = markerText(element, style.listStyleType);
      const box = local(element.getClientRects()[0] || element.getBoundingClientRect());
      const contentLeft = box.left + (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.borderLeftWidth) || 0);
      const markerStyle = { ...typography, letterSpacing: "normal", textTransform: "none" };
      pushLabel(marker, style.listStylePosition === "inside" ? contentLeft : contentLeft - textWidth(markerStyle, `${marker} `), firstText, markerStyle);
    }
  };

  const pushLabel = (text, x, anchor, style) => {
    const fill = color(style.color);
    if (fill) ops.push({ type: "text", text, x, top: anchor.top, width: textWidth(style, text), baseline: anchor.baseline, style, color: fill, decoration: [] });
  };

  visit(stack);
  range.detach?.();
  return ops;
}

function imageData(element) {
  const src = element.currentSrc || element.src || "";
  const match = src.match(/^data:image\/(png|jpe?g);base64,/i);
  if (match) return { data: src, format: /png/i.test(match[1]) ? "PNG" : "JPEG" };
  // Other formats (webp, gif, blob:) are re-encoded from the already decoded image.
  try {
    const canvas = document.createElement("canvas");
    canvas.width = element.naturalWidth; canvas.height = element.naturalHeight;
    if (!canvas.width || !canvas.height) return null;
    canvas.getContext("2d").drawImage(element, 0, 0);
    return { data: canvas.toDataURL("image/png"), format: "PNG" };
  } catch { return null; }
}

function drawOp(pdf, op, pageTop) {
  if (op.type === "line") {
    const [x1, y1, x2, y2] = op.points;
    pdf.setDrawColor(...op.color); pdf.setLineWidth(op.width * MM);
    pdf.line(x1 * MM, (y1 - pageTop) * MM, x2 * MM, (y2 - pageTop) * MM);
    return;
  }
  if (op.type === "image") {
    const image = imageData(op.element);
    if (image) pdf.addImage(image.data, image.format, op.x * MM, (op.top - pageTop) * MM, op.width * MM, op.height * MM, undefined, "FAST");
    return;
  }
  const face = pdfFace(pdf, op.style, op.text);
  pdf.setFont(face.name, face.style);
  pdf.setFontSize(parseFloat(op.style.fontSize) * 0.75);
  pdf.setTextColor(...op.color);
  const spacing = parseFloat(op.style.letterSpacing) || 0;
  const y = (op.baseline - pageTop) * MM;
  pdf.text(op.text, op.x * MM, y, { baseline: "alphabetic", ...(spacing ? { charSpace: spacing * MM } : {}) });
  for (const line of op.decoration || []) {
    const size = parseFloat(op.style.fontSize);
    const offset = line === "underline" ? size * 0.12 : -size * 0.28;
    pdf.setDrawColor(...op.color); pdf.setLineWidth(Math.max(0.5, size / 18) * MM);
    pdf.line(op.x * MM, y + offset * MM, (op.x + op.width) * MM, y + offset * MM);
  }
}

/**
 * Stacks of the editor, in page-group order. Each stack holds the sheets (chrome)
 * and the paged flow (content) of one group, exactly as the editor renders it.
 */
export function thesisPageStacks(root, groups) {
  return groups.map((group) => {
    const paper = [...root.querySelectorAll(".thesis-paper[data-thesis-section]")].find((node) => node.getAttribute("data-thesis-section") === group.id);
    const stack = paper?.closest(".thesis-page-stack");
    if (!stack || paper.getAttribute("data-thesis-layout") !== "paged") throw new Error("Sayfa düzeni hazır değil");
    const flow = paper.querySelector(".thesis-page-flow");
    const metrics = pageMetrics(group.rules.page);
    return { group, stack, metrics, pages: thesisGroupHasPageContent(group) ? pageCountFromFlowHeight(flow.offsetHeight, metrics) : 0 };
  });
}

/** Physical page structure the writer will produce: one entry per sheet, same as the editor. */
export function thesisLayoutPages(root, groups) {
  return thesisPageStacks(root, groups).flatMap(({ group, pages }) => Array.from({ length: pages }, (_, index) => ({ groupId: group.id, index })));
}

export async function buildThesisLayoutPdf({ root, groups, title = "", language = "tr", templateId }) {
  await document.fonts?.ready;
  const stacks = thesisPageStacks(root, groups).filter(({ pages }) => pages > 0).map((stack) => ({ ...stack, ops: collectGroup(stack.stack, language) }));
  // Faces are embedded once, before drawing: the body family first (the document's default), then every other
  // family the laid-out text uses, so a sans heading in a serif thesis gets its own embedded face.
  const families = [...new Set([...groups.map((group) => group.rules.body?.fontFamily), ...stacks.flatMap(({ ops }) => ops.filter((op) => op.type === "text").map((op) => op.style.fontFamily))].map(primaryFontFamily).filter(Boolean))];
  let pdf = null;
  for (const { group, metrics, pages, ops: groupOps } of stacks) {
    const { widthMm, heightMm } = group.rules.page;
    const orientation = widthMm > heightMm ? "l" : "p";
    const byPage = Array.from({ length: pages }, () => []);
    for (const op of groupOps) {
      const middle = op.top + (op.height ?? (op.baseline - op.top)) / 2;
      byPage[Math.min(pages - 1, Math.max(0, Math.floor(middle / metrics.stridePx)))].push(op);
    }
    for (const [index, ops] of byPage.entries()) {
      if (!pdf) {
        pdf = new jsPDF({ unit: "mm", format: [widthMm, heightMm], orientation, compress: true });
        pdf.setProperties({ title: title || "Tez", creator: "TxtNote" });
        await embedAcademicPdfFonts(pdf, { templateId, families });
      } else pdf.addPage([widthMm, heightMm], orientation);
      const pageTop = index * metrics.stridePx;
      // Lines and images under text, as in the editor.
      for (const op of ops) if (op.type !== "text") drawOp(pdf, op, pageTop);
      for (const op of ops) if (op.type === "text") drawOp(pdf, op, pageTop);
    }
  }
  if (!pdf) throw new Error("Dışa aktarılacak sayfa yok");
  return pdf.output("blob");
}
