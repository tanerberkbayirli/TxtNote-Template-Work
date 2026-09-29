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
import { academicPdfFont, academicPdfFontFace, embedAcademicPdfFonts, hasSystemPdfFont, pdfFontStyle } from "../lib/academicFonts.js";
import { canvasFontAscent } from "./wordBaseline.js";
import { PX_PER_MM, flowPagePitchPx, pageCountFromFlowHeight, pageMetrics, thesisGroupHasPageContent } from "./pageLayout.js";

const MM = 1 / PX_PER_MM;
// KaTeX keeps a visually hidden MathML copy next to the drawn formula; only the drawn one is exported.
const SKIP = "button,input,select,textarea,script,style,svg,math,.katex-mathml,.sr-only,[data-export-ignore],.academic-page-gap";
// jsPDF's built-in Helvetica/Courier only encode Latin-1; other words use the embedded academic face.
const LATIN1 = /^[\x20-\x7e\xa0-\xff]*$/;

let canvasContext = null;
function measureContext() {
  canvasContext ||= document.createElement("canvas").getContext("2d");
  return canvasContext;
}
const canvasFont = (style) => `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
/** Ascent in CSS px: the baseline of a text fragment is its rect top + ascent (shared with the Word baseline probes). */
const fontAscent = canvasFontAscent;
function textWidth(style, text) {
  const context = measureContext();
  context.font = canvasFont(style);
  return context.measureText(text).width;
}

/** Plain copy of the typography a text op needs (computed style objects are live). */
const textStyle = (style) => ({ fontStyle: style.fontStyle, fontWeight: style.fontWeight, fontSize: style.fontSize, fontFamily: style.fontFamily, color: style.color, letterSpacing: style.letterSpacing, textTransform: style.textTransform, textAlign: style.textAlign });
function pdfTextStyle(element, style, language) {
  const equation = element.closest?.(".math-formula--block");
  const equationFamily = equation && getComputedStyle(equation).getPropertyValue("--thesis-pdf-equation-font").trim();
  return { ...textStyle(style), ...(equationFamily ? { fontFamily: equationFamily, pdfMetricsFontFamily: style.fontFamily } : {}), lang: element.closest?.("[lang]")?.getAttribute("lang") || language };
}

function color(value) {
  const match = String(value || "").match(/rgba?\(([^)]+)\)/);
  if (!match) return null;
  const [r, g, b, a = 1] = match[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  return a === 0 ? null : [r, g, b];
}

/**
 * Math symbols the embedded Times New Roman lacks, replaced by their closest glyph it has (jsPDF drops a missing glyph silently:
 * "F = a ⋅ b" printed "F = a   b"). Only look-alikes; glyphs without one (∈ ⇒ ∀ …) need a math font, see failures/aku-fbe/equation-font.md.
 */
export const PDF_GLYPH_ALIASES = Object.freeze({ "\u22C5": "\u2219", "\u2215": "/", "\u2044": "/", "\u2010": "-", "\u2011": "-", "\u2223": "|", "\u2236": ":", "\u2032": "'", "\u00A0": " " });
/** Greek symbol variants (ϵ ϕ ϑ ϖ ϱ ϰ ϴ), math alphanumerics (𝑥, 𝐑, 𝔸 …) and letterlike symbols (ℝ ℓ …): Times New Roman has none of them; their compatibility decomposition (ε φ θ π ρ κ Θ, x R A, R ℓ) is the letter it does have. */
const COMPAT_LETTERS = /[\u03D0-\u03F9\u{1D400}-\u{1D7FF}\u2102-\u2124]/gu;
export const aliasGlyphs = (text) => String(text).replace(/[\u22C5\u2215\u2044\u2010\u2011\u2223\u2236\u2032\u00A0]/g, (char) => PDF_GLYPH_ALIASES[char]).replace(COMPAT_LETTERS, (char) => char.normalize("NFKD"));

const DOUBLE_STRUCK_SPECIALS = Object.freeze({ C: "ℂ", H: "ℍ", N: "ℕ", P: "ℙ", Q: "ℚ", R: "ℝ", Z: "ℤ", h: "ℎ" });
/** KaTeX represents `\mathbb{R}` as a regular text R styled with its own font. Preserve its semantic glyph for PDF fonts. */
export function doubleStruckMathText(text) {
  return [...String(text)].map((char) => {
    if (DOUBLE_STRUCK_SPECIALS[char]) return DOUBLE_STRUCK_SPECIALS[char];
    const point = char.codePointAt(0);
    if (point >= 65 && point <= 90) return String.fromCodePoint(0x1d538 + point - 65);
    if (point >= 97 && point <= 122) return String.fromCodePoint(0x1d552 + point - 97);
    if (point >= 48 && point <= 57) return String.fromCodePoint(0x1d7d8 + point - 48);
    return char;
  }).join("");
}

function pdfFace(pdf, style, text) {
  const family = String(style.fontFamily).split(",")[0].replace(/["']/g, "").trim().toLowerCase();
  const bold = Number(style.fontWeight) >= 600;
  const italic = style.fontStyle === "italic" || style.fontStyle.startsWith("oblique");
  // A genuine system family embedded for this template draws every word of that family.
  if (hasSystemPdfFont(pdf, family)) return academicPdfFontFace(pdf, pdfFontStyle({ bold, italic }), family);
  const builtin = /^(arial|helvetica|sans-serif|liberation sans|arimo)$/.test(family) ? "helvetica" : /^(courier|courier new|monospace|consolas)$/.test(family) ? "courier" : "";
  if (builtin && LATIN1.test(text)) return { name: builtin, style: `${bold ? "bold" : ""}${italic ? "italic" : ""}` || "normal" };
  const faceStyle = pdfFontStyle({ bold, italic });
  return { name: academicPdfFont(pdf, faceStyle), style: faceStyle };
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
    const metricsStyle = style.pdfMetricsFontFamily ? { ...style, fontFamily: style.pdfMetricsFontFamily } : style;
    ops.push({ type: "text", text, x: box.left, top: box.top, width: box.width, baseline: box.top + fontAscent(metricsStyle), style, color: fill, ...extra });
  };

  const words = (node, style, extra) => {
    const data = node.data;
    const mathText = (text) => node.parentElement?.classList.contains("mathbb") ? doubleStruckMathText(text) : text;
    // Keep each special-page line as one text run. The browser and embedded PDF
    // font can differ slightly in glyph widths; separately painted words then
    // swallow the visible space as well as losing it during text extraction.
    // Justified lines are the exception: their word gaps are stretched by the browser, so each word keeps its own position.
    if (node.parentElement.closest(".thesis-layout-text") && style.textAlign !== "justify") {
      let text = "", box = null;
      const flush = () => { if (text.trim() && box) pushText(transformText(mathText(text.trimEnd()), style.textTransform, style.lang), box, style, extra); };
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
        const leader = node.parentElement;
        // leaderFlow "inline": the dots run inside the title box and stop where the floated page number begins.
        const page = leader.parentElement?.matches(".thesis-index-title") ? leader.nextElementSibling : null;
        const clipRight = page ? page.getBoundingClientRect().left : leader.getBoundingClientRect().right;
        let visible = 0;
        for (let i = 0; i < word.length; i += 1) {
          range.setStart(node, start + i); range.setEnd(node, start + i + 1);
          const glyph = range.getBoundingClientRect();
          if (glyph.right > clipRight + 0.1) break;
          visible += 1;
        }
        if (visible) { range.setStart(node, start); range.setEnd(node, start + visible); pushText(word.slice(0, visible), range.getBoundingClientRect(), style, extra); }
        continue;
      }
      if (rects.length === 1) { pushText(transformText(mathText(word), style.textTransform, style.lang), rects[0], style, extra); continue; }
      // A word broken across lines or pages: split it where its glyphs change line.
      let current = ""; let currentRect = null;
      for (let index = 0; index < match[0].length; index += 1) {
        range.setStart(node, start + index); range.setEnd(node, start + index + 1);
        const rect = range.getClientRects()[0];
        const char = match[0][index].replace(/[​﻿]/g, "");
        if (!rect || !char) continue;
        if (currentRect && Math.abs(rect.top - currentRect.top) < 1) current += char;
        else { if (current) pushText(transformText(mathText(current), style.textTransform, style.lang), currentRect, style, extra); current = char; currentRect = rect; }
      }
      if (current) pushText(transformText(mathText(current), style.textTransform, style.lang), currentRect, style, extra);
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

  // KaTeX draws the radical (sign and bar) as one SVG path: export it as the real "√" glyph plus the bar as a rule.
  const radical = (svg) => {
    const tail = svg.parentElement, viewBox = String(svg.getAttribute("viewBox") || "").split(/\s+/).map(Number);
    if (!tail || viewBox.length !== 4 || !(viewBox[3] > 0)) return;
    const box = local(tail.getBoundingClientRect()), em = box.height / (viewBox[3] / 1000), style = getComputedStyle(tail), fill = color(style.color);
    if (!fill || !(box.width > 0)) return;
    const typography = { ...pdfTextStyle(tail, style, language), fontSize: `${em * 1.1}px`, fontStyle: "normal", fontWeight: "400" };
    ops.push({ type: "text", text: "\u221A", x: box.left, top: box.top, width: em * 0.6, baseline: box.top + em * 1.06, style: typography, color: fill, decoration: [] });
    const y = box.top + em * 0.105;
    ops.push({ type: "line", points: [box.left + em * 0.6, y, box.left + box.width, y], width: em * 0.05, color: fill, top: y, height: 0 });
  };

  const visit = (element) => {
    if (element.tagName?.toLowerCase() === "svg" && element.closest(".katex-html .sqrt")) { radical(element); return; }
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
    const typography = pdfTextStyle(element, style, language);
    const decoration = element.firstChild ? decorations(element) : [];
    for (const child of element.childNodes) {
      if (child.nodeType === 1) visit(child);
      else if (child.nodeType === 3 && child.data.trim()) words(child, typography, { decoration });
    }
    const firstText = ops.slice(first).find((op) => op.type === "text" && !op.label);
    // Generated content the editor shows: heading numbers (::before) and list markers (::marker).
    const number = element.getAttribute("data-thesis-number") || element.getAttribute("data-thesis-caption")?.trim();
    if (number && firstText) {
      // The label is drawn in its own (::before) typography, e.g. a bold "Şekil 2.1" before a regular caption.
      const pseudo = getComputedStyle(element, "::before");
      const labelStyle = { ...typography, fontWeight: pseudo.fontWeight, fontStyle: pseudo.fontStyle, fontSize: pseudo.fontSize, fontFamily: pseudo.fontFamily };
      const label = transformText(number, style.textTransform, typography.lang);
      if (pseudo.display === "block") {
        // numbering.placement "ownLine": the number is a line of its own above the title, aligned like the heading.
        const box = local(element.getBoundingClientRect());
        const left = box.left + (parseFloat(style.paddingLeft) || 0);
        const width = box.width - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0);
        const labelWidth = textWidth(labelStyle, label);
        const pitch = (parseFloat(pseudo.lineHeight) || parseFloat(style.lineHeight));
        pushLabel(label, style.textAlign === "center" ? left + (width - labelWidth) / 2 : style.textAlign === "right" ? left + width - labelWidth : left, { top: firstText.top - pitch, baseline: firstText.baseline - pitch }, labelStyle, firstText);
      } else {
        // A caption with a measured hang draws its label in an inline box of exactly that width (engine CSS): the text starts one hang after the line start.
        const hang = parseFloat(element.getAttribute("data-thesis-caption-hang"));
        pushLabel(label, Number.isFinite(hang) ? firstText.x - hang : firstText.x - textWidth(labelStyle, `${label} `), firstText, labelStyle, firstText);
      }
    }
    // Equation number (::after of a numbered display equation): flush right/left of the block, centred on the formula.
    const equation = element.getAttribute("data-thesis-eq");
    if (equation && firstText) {
      const pseudo = getComputedStyle(element, "::after");
      const eqStyle = { ...typography, fontWeight: pseudo.fontWeight, fontStyle: pseudo.fontStyle, fontSize: pseudo.fontSize, fontFamily: pseudo.fontFamily, color: pseudo.color, letterSpacing: "normal", textTransform: "none" };
      const box = local(element.getBoundingClientRect());
      const context = measureContext();
      context.font = canvasFont(eqStyle);
      const metrics = context.measureText(equation);
      // line-height:1 box centred on the block: its baseline sits (ascent - descent) / 2 below the centre.
      // Measured formula baseline (data-thesis-eq-base, unscaled px from the block top) when the template placed the block on the line grid.
      const measuredBase = parseFloat(element.getAttribute("data-thesis-eq-base"));
      const baseline = Number.isFinite(measuredBase) ? box.top + measuredBase : box.top + box.height / 2 + (metrics.fontBoundingBoxAscent - metrics.fontBoundingBoxDescent) / 2;
      const x = element.getAttribute("data-thesis-eq-side") === "left" ? box.left : box.left + box.width - metrics.width;
      const fill = color(eqStyle.color);
      if (fill) ops.push({ type: "text", text: equation, x, top: baseline - metrics.fontBoundingBoxAscent, width: metrics.width, baseline, style: eqStyle, color: fill, decoration: [] });
    }
    if (element.tagName === "LI" && style.display === "list-item" && style.listStyleType !== "none" && firstText) {
      const marker = markerText(element, style.listStyleType);
      const box = local(element.getClientRects()[0] || element.getBoundingClientRect());
      const contentLeft = box.left + (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.borderLeftWidth) || 0);
      const markerStyle = { ...typography, letterSpacing: "normal", textTransform: "none" };
      pushLabel(marker, style.listStylePosition === "inside" ? contentLeft : contentLeft - textWidth(markerStyle, `${marker} `), firstText, markerStyle, firstText);
    }
  };

  // A generated label (heading number, caption label, list marker) is emitted before the element's first text op, so the PDF's text layer
  // reads "1. GİRİŞ" and "a) item" in reading order (searchable), not the title followed by its number.
  const pushLabel = (text, x, anchor, style, before = null) => {
    const fill = color(style.color);
    if (!fill) return;
    const op = { type: "text", text, x, top: anchor.top, width: textWidth(style, text), baseline: anchor.baseline, style, color: fill, decoration: [], label: true };
    const at = before ? ops.indexOf(before) : -1;
    if (at >= 0) ops.splice(at, 0, op); else ops.push(op);
  };

  visit(stack);
  range.detach?.();
  // KaTeX builds "≠" as an overlay glyph (private use U+E020) in front of "=": print the one real character.
  for (let i = ops.length - 1; i >= 0; i -= 1) {
    if (ops[i].type !== "text" || ops[i].text !== "\uE020") continue;
    const next = ops.slice(i + 1, i + 4).find((op) => op.type === "text" && op.text.startsWith("=") && Math.abs(op.baseline - ops[i].baseline) < 1);
    if (next) next.text = `\u2260${next.text.slice(1)}`;
    ops.splice(i, 1);
  }
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
  const family = String(op.style.fontFamily).split(",")[0].replace(/["']/g, "").trim().toLowerCase();
  const text = family === "cambria math" && hasSystemPdfFont(pdf, "Cambria Math") ? op.text : aliasGlyphs(op.text);
  // The browser shapes a run with kerning; jsPDF advances glyph by glyph without it, so a long line would end past where the browser's
  // ended (a 151-character title: +1.6 mm over the right margin). The small difference is spread over the run's characters, so every run
  // ends exactly where the browser's ended.
  const glyphs = [...text].length, size = parseFloat(op.style.fontSize) * 0.75;
  // Only for a genuine embedded family (the browser draws the same font); a substitute face keeps its natural advances.
  const fit = op.width > 0 && glyphs > 1 && hasSystemPdfFont(pdf, String(op.style.fontFamily).split(",")[0].replace(/["']/g, "").trim()) ? (op.width * MM - pdf.getTextWidth(text)) / glyphs : NaN;
  const charSpace = Number.isFinite(fit) && Math.abs(fit) <= size * 0.352778 * 0.1 ? fit : spacing * MM;
  pdf.text(text, op.x * MM, y, { baseline: "alphabetic", ...(charSpace ? { charSpace } : {}) });
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

export async function buildThesisLayoutPdf({ root, groups, title = "", language = "tr", templateId, systemFonts = [] }) {
  await document.fonts?.ready;
  const stacks = thesisPageStacks(root, groups);
  let pdf = null;
  for (const { group, stack, metrics, pages } of stacks) {
    if (!pages) continue;
    const { widthMm, heightMm } = group.rules.page;
    const orientation = widthMm > heightMm ? "l" : "p";
    const byPage = Array.from({ length: pages }, () => []);
    for (const op of collectGroup(stack, language)) {
      const middle = op.top + (op.height ?? (op.baseline - op.top)) / 2;
      byPage[Math.min(pages - 1, Math.max(0, Math.floor(middle / flowPagePitchPx(metrics))))].push(op);
    }
    for (const [index, ops] of byPage.entries()) {
      if (!pdf) {
        pdf = new jsPDF({ unit: "mm", format: [widthMm, heightMm], orientation, compress: true });
        pdf.setProperties({ title: title || "Tez", creator: "TxtNote" });
        await embedAcademicPdfFonts(pdf, { templateId, systemFonts });
      } else pdf.addPage([widthMm, heightMm], orientation);
      // The browser lays the flow out with column height and row gap truncated to 1/64 px, so page N starts at N * flow pitch (a hair
      // below N * stride): using the real pitch keeps every page's text at the same offset, however long the document.
      const pageTop = index * flowPagePitchPx(metrics);
      // Lines and images under text, as in the editor.
      for (const op of ops) if (op.type !== "text") drawOp(pdf, op, pageTop);
      for (const op of ops) if (op.type === "text") drawOp(pdf, op, pageTop);
    }
  }
  if (!pdf) throw new Error("Dışa aktarılacak sayfa yok");
  return pdf.output("blob");
}
