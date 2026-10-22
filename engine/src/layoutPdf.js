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
import { isSymbolEncodedFamily, symbolFontText } from "../../TxtNote/frontend/src/lib/systemPdfFonts.js";
import { academicPdfFont, academicPdfFontFace, exactAcademicPdfFont, collectAcademicPdfFontRequests, embedAcademicPdfFonts, hasSystemPdfFont, normalizeAcademicPdfFamily, pdfFontStyle } from "../../TxtNote/frontend/src/lib/academicFonts.js";
import { canvasFontAscent } from "./wordBaseline.js";
import { lastLineShifts } from "./justifyLastLine.js";
import { renderedFontFamilies } from "./renderedFonts.js";
import { PX_PER_MM, flowPagePitchPx, pageCountFromFlowHeight, pageMetrics, thesisGroupHasPageContent } from "./pageLayout.js";
import { layoutLandmarkIndex, layoutPageBoxes, layoutPageReport } from "./layoutReport.js";
import { orientedTextGeometry, insetRotatedRect } from './pdfTextGeometry.js';

const MM = 1 / PX_PER_MM;
// KaTeX keeps a visually hidden MathML copy next to the drawn formula; only the drawn one is exported.
const SKIP = "button,input,select,textarea,script,style,svg,math,.katex-mathml,.sr-only,[data-export-ignore],[data-thesis-editor-only],.academic-page-gap";
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
const textStyle = (style) => ({ fontStyle: style.fontStyle, fontWeight: style.fontWeight, fontSize: style.fontSize, fontFamily: style.fontFamily, color: style.color, backgroundColor: style.backgroundColor, letterSpacing: style.letterSpacing, textTransform: style.textTransform, textAlign: style.textAlign, wordSpacing: style.wordSpacing, writingMode: style.writingMode });
function pdfTextStyle(element, style, language) {
  const equation = element.closest?.(".math-formula--block");
  const equationFamily = equation && getComputedStyle(equation).getPropertyValue("--thesis-pdf-equation-font").trim();
  const highlight = element.closest?.(".fmt-highlight-yellow,.fmt-highlight-green,.fmt-highlight-cyan,.fmt-highlight-magenta,[data-fmt-bg]");
  const backgroundColor = highlight ? getComputedStyle(highlight).backgroundColor : style.backgroundColor;
  return { ...textStyle(style), rotationDeg:cssRotation(element), backgroundColor, ...(equationFamily ? { fontFamily: equationFamily, pdfMetricsFontFamily: style.fontFamily } : {}), lang: element.closest?.("[lang]")?.getAttribute("lang") || language };
}
function cssRotation(element){
  let angle=0;
  for(let node=element;node&&!node.matches('.thesis-page-stack,.academic-stack,.academic-export-stack');node=node.parentElement){
    const transform=getComputedStyle(node).transform;
    if(transform&&transform!=='none'){const m=new DOMMatrixReadOnly(transform);angle+=Math.atan2(m.b,m.a)*180/Math.PI;}
  }
  return angle;
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

/**
 * Left edge (px) of a generated label (heading number, caption label) drawn before an element's first text op.
 * Normally the label ends one space before the text. In a justified line the browser stretches that space, so the text
 * starts further right than label + natural space: the label then goes to the line start (content box + text-indent).
 * A measured caption hang (`hang`, px) places the text exactly one hang after the line start.
 */
export function generatedLabelX({ textAlign, hang, firstTextX, labelWidth, boxLeft = 0, paddingLeft = 0, textIndent = 0 }) {
  if (Number.isFinite(hang)) return firstTextX - hang;
  if (textAlign === "justify") return boxLeft + (paddingLeft || 0) + (textIndent || 0);
  return firstTextX - labelWidth;
}

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

export function measuredPdfFontFace(pdf, style, text, exactFamily = false) {
  const family = String(style.fontFamily).split(",")[0].replace(/["']/g, "").trim().toLowerCase();
  const bold = Number(style.fontWeight) >= 600;
  const italic = style.fontStyle === "italic" || style.fontStyle.startsWith("oblique");
  const faceStyle = pdfFontStyle({ bold, italic });
  if (exactFamily) {
    const canonical = normalizeAcademicPdfFamily(family);
    if (!canonical) throw new Error(`Konumlandırılmış metin için PDF yazı tipi ${family || "(belirtilmemiş)"} izin verilen ailelerden biri değil`);
    // Validate the exact family first, then select a face it actually embeds.
    // Single-face fonts (Mincho, Symbol, Cambria Math) have no bold/italic
    // program: asking jsPDF for that nonexistent style silently substitutes it.
    exactAcademicPdfFont(pdf, faceStyle, canonical);
    return academicPdfFontFace(pdf, faceStyle, canonical);
  }
  // A genuine system family embedded for this template draws every word of that family.
  if (hasSystemPdfFont(pdf, family)) return academicPdfFontFace(pdf, faceStyle, family);
  const builtin = /^(arial|helvetica|sans-serif|liberation sans|arimo)$/.test(family) ? "helvetica" : /^(courier|courier new|monospace|consolas)$/.test(family) ? "courier" : "";
  if (builtin && LATIN1.test(text)) return { name: builtin, style: `${bold ? "bold" : ""}${italic ? "italic" : ""}` || "normal" };
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
function collectGroup(stack, language, exactFamilies = new Set(), landmarkIndex = null, graphics = new Map()) {
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
    // Last line of a Word-justified paragraph: natural word gaps (see justifyLastLine.js).
    if (extra?.dx) { box.left += extra.dx; const { dx, ...rest } = extra; extra = rest; }
    const fill = color(style.color);
    if (!text || !fill) return;
    const intersects = (clip) => box.top < clip.top + clip.height && box.top + box.height > clip.top && box.left < clip.left + clip.width && box.left + box.width > clip.left;
    let clip = extra?.clipRects ? extra.clipRects.find(intersects) : extra?.clip;
    if ((extra?.clipRects && !clip) || (clip && !intersects(clip))) return;
    for(const group of extra?.clipGroups || []){
      const next=group.find(intersects);if(!next)return;
      if(!clip)clip=next;
      else {const left=Math.max(clip.left,next.left),top=Math.max(clip.top,next.top),right=Math.min(clip.left+clip.width,next.left+next.width),bottom=Math.min(clip.top+clip.height,next.top+next.height);if(right<=left||bottom<=top)return;clip={left,top,width:right-left,height:bottom-top};}
    }
    const metricsStyle = style.pdfMetricsFontFamily ? { ...style, fontFamily: style.pdfMetricsFontFamily } : style;
    const ascent=fontAscent(metricsStyle);
    const vertical=/^(vertical|sideways)-/.test(style.writingMode || "");
    const upwards=style.writingMode === "sideways-lr";
    const angle=(style.rotationDeg||0)+(vertical ? upwards ? -90 : 90 : 0);
    const geometry=angle ? orientedTextGeometry(box,angle,ascent,textWidth(metricsStyle,text)) : {x:box.left,width:box.width,baseline:box.top+ascent};
    ops.push({ type: "text", text, ...geometry, top: box.top, style, color: fill, ...extra, ...(clip ? { clip } : {}) });
  };

  // Per block: x shift of every word on the last line of a justified paragraph drawn with Word's negative word-spacing.
  const blockCache = new WeakMap();
  const blockOf = (node) => { let el = node.parentElement; while (el && el !== stack && /^inline/.test(getComputedStyle(el).display)) el = el.parentElement; return el; };
  const lastLineShiftFor = (node, style, offset) => {
    if(node.parentElement.closest('[data-thesis-word-fit]'))return 0;
    const delta = -Number.parseFloat(style.wordSpacing);
    if (style.textAlign !== "justify" || !(delta > 0)) return 0;
    const block = blockOf(node);
    if (!block) return 0;
    let info = blockCache.get(block);
    if (!info) {
      const nodes = []; let text = "";
      const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (blockOf(n) !== block || n.parentElement.closest(SKIP)) continue;
        nodes.push({ node: n, base: text.length }); text += n.data;
      }
      const locate = (index) => { for (let i = nodes.length - 1; i >= 0; i -= 1) if (index >= nodes[i].base) return [nodes[i].node, index - nodes[i].base]; return null; };
      const topOf = (index) => { const at = locate(index); if (!at) return NaN; range.setStart(at[0], at[1]); range.setEnd(at[0], at[1] + 1); const rect = range.getClientRects()[0]; return rect ? rect.top : NaN; };
      const matches = [...text.matchAll(/\S+/g)];
      // Only the tail of the paragraph can be the last line: measure backwards until the line changes.
      const words = []; let lastTop = null;
      for (let i = matches.length - 1; i >= 0; i -= 1) {
        const start = matches[i].index, end = start + matches[i][0].length;
        const top = topOf(start), endTop = topOf(end - 1);
        if (Number.isNaN(top) || Number.isNaN(endTop)) continue;
        if (lastTop === null) lastTop = endTop;
        if (Math.abs(endTop - lastTop) >= 1) break;
        words.unshift({ start, end, top, lastTop: endTop });
        if (Math.abs(top - lastTop) >= 1) break;
      }
      const shifts = lastLineShifts(words, delta);
      info = { nodes, words, shifts };
      blockCache.set(block, info);
    }
    if (!info.shifts.size) return 0;
    const entry = info.nodes.find((item) => item.node === node);
    if (!entry) return 0;
    const index = entry.base + offset;
    const wi = info.words.findIndex((word) => index >= word.start && index < word.end);
    return wi < 0 ? 0 : (info.shifts.get(wi) || 0);
  };

  const words = (node, style, extra) => {
    const data = node.data;
    const highlight = color(style.backgroundColor);
    if (highlight) {
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) {
        if (rect.width > 0 && rect.height > 0) {
          const box = local(rect);
          ops.push({ type: "rect", x: box.left, top: box.top, width: box.width, height: box.height, color: highlight, zIndex: extra.zIndex || 0 });
        }
      }
    }
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
    const matches = [...data.matchAll(/\S+/g)];
    for (const [matchIndex, match] of matches.entries()) {
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
      if (rects.length === 1) {
        // A real space glyph after a word that is followed by another word on the same line, so extracted text keeps its word gaps
        // (every word is painted at its own position, which leaves no space character in the content stream).
        const next = matches[matchIndex + 1];
        let spaceAfter = false;
        if (next && /^\s+$/.test(data.slice(start + match[0].length, next.index))) {
          range.setStart(node, next.index); range.setEnd(node, next.index + 1);
          const nextRect = range.getClientRects()[0];
          spaceAfter = Boolean(nextRect) && Math.abs(nextRect.top - rects[0].top) < 1;
        }
        if (!next) {
          const sibling = node.nextSibling || node.parentElement?.nextSibling;
          spaceAfter = /\s$/.test(data) || (sibling?.nodeType === 3 && /^\s/.test(sibling.data));
        }
        const dx = lastLineShiftFor(node, style, start);
        pushText(transformText(mathText(word), style.textTransform, style.lang), rects[0], style, { ...extra, ...(spaceAfter ? { spaceAfter: true } : {}), ...(dx ? { dx } : {}) });
        continue;
      }
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

  const borders = (element, style, zIndex = 0) => {
    if (element.matches(".academic-page-break")) return;
    const sides = ["Top", "Right", "Bottom", "Left"].map((side) => ({
      side, width: parseFloat(style[`border${side}Width`]) || 0, color: color(style[`border${side}Color`]),
      visible: !/^(none|hidden)$/.test(style[`border${side}Style`]),
    }));
    if (!sides.some((entry) => entry.width > 0 && entry.visible && entry.color)) return;
    // Opt-in (border.collapse frames): browsers draw borders at least one device pixel wide, so the stroke uses the declared rule width, centred on the drawn border.
    const nominalRule = Number.parseFloat(element.getAttribute?.("data-thesis-rule-pt")) * 96 / 72 || 0;
    const rects = [...element.getClientRects()].map(local);
    const radius=parseFloat(style.borderTopLeftRadius)||0;
    if(radius>0 && rects.length===1 && sides.every(s=>s.visible&&s.width===sides[0].width&&String(s.color)===String(sides[0].color))){
      const box=rects[0],half=sides[0].width/2;
      const rx=String(style.borderTopLeftRadius).includes('%') ? box.width*radius/100 : radius;
      const ry=String(style.borderTopLeftRadius).includes('%') ? box.height*radius/100 : radius;
      ops.push({type:'roundedRect',x:box.left+half,top:box.top+half,width:box.width-2*half,height:box.height-2*half,rx,ry,color:sides[0].color,strokeWidth:sides[0].width,zIndex});return;
    }
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
        ops.push({ type: "line", points: line, width: nominalRule || entry.width, color: entry.color, top: Math.min(line[1], line[3]), height: Math.abs(line[3] - line[1]), zIndex });
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
    if (element.tagName?.toLowerCase() === "svg") {
      const native = element.closest('[data-docx-drawing]');
      // ChartEx's editable preview replaces its cached picture on screen. The
      // existing PDF writer uses that original picture at the preview's extent.
      // Native import keeps Choice/Fallback as direct sibling branches.
      if (native?.getAttribute('data-docx-drawing')?.includes('http://schemas.microsoft.com/office/drawing/2014/chartex')) {
        const fallback = native.parentElement?.parentElement?.querySelector(':scope > [hidden] img');
        const box = local(element.getBoundingClientRect());
        if (fallback && box.width > 0 && box.height > 0) ops.push({ type: "image", element: fallback, x: box.left, top: box.top, width: box.width, height: box.height, zIndex: 0 });
        // The cached picture remains the visible source rendering. Its known
        // native chart preview supplies an image text layer, as in a searchable
        // scanned PDF; never paint a second visible copy over the picture.
        for (const label of graphics.get(element)?.texts || []) {
          ops.push({type:'text',text:label.text,x:(label.x-origin.left)/zoom,baseline:(label.baseline-origin.top)/zoom,top:(label.top-origin.top)/zoom,height:label.height/zoom,width:label.width/zoom,angle:label.angle,style:{...label.style,fontSize:`${parseFloat(label.style.fontSize)*label.scale/zoom}px`},color:color(label.style.color),decoration:[],clip:local(label.clip),exactFont:true,spaceAfter:label.spaceAfter,imageText:true,zIndex:1});
        }
      } else if(graphics.has(element)) {
        const box=local(element.getBoundingClientRect());
        const graphic=graphics.get(element),zIndex=Number.parseInt(getComputedStyle(element).zIndex)||0;
        ops.push({type:'image',element:graphic.image || graphic,x:box.left,top:box.top,width:box.width,height:box.height,zIndex});
        for(const label of graphic.texts || []) {
          const fill=color(label.style.color);if(!fill)continue;
          ops.push({type:'text',text:label.text,x:(label.x-origin.left)/zoom,baseline:(label.baseline-origin.top)/zoom,top:(label.top-origin.top)/zoom,height:label.height/zoom,width:label.width/zoom,angle:label.angle,style:{...label.style,fontSize:`${parseFloat(label.style.fontSize)*label.scale/zoom}px`},color:fill,decoration:[],clip:local(label.clip),exactFont:true,spaceAfter:label.spaceAfter,zIndex:zIndex+1});
        }
      }
      return;
    }
    if (element.matches(SKIP)) return;
    const style = getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") return;
    let layoutAnchor = null;
    for (let current = element; current && current !== stack; current = current.parentElement) {
      if (!current.hasAttribute?.("data-layout-id")) continue;
      const candidateStyle = getComputedStyle(current);
      if (candidateStyle.position !== "static") { layoutAnchor = current; break; }
    }
    const layoutStyle = layoutAnchor ? getComputedStyle(layoutAnchor) : null;
    const zIndex = Number.parseInt(layoutStyle?.zIndex || "0", 10) || 0;
    const positioned = layoutStyle?.position === "absolute";
    const canonicalFamily = normalizeAcademicPdfFamily(style.fontFamily);
    const exactFont = positioned || (canonicalFamily && exactFamilies.has(canonicalFamily));
    borders(element, style, zIndex);
    if(graphics.has(element)){
      const box=local(element.getBoundingClientRect());
      ops.push({type:'image',element:graphics.get(element),x:box.left,top:box.top,width:box.width,height:box.height,zIndex:zIndex-1});
    }
    if (element.tagName === "IMG") {
      const box = local(element.getBoundingClientRect());
      if (box.width > 0 && box.height > 0) ops.push({ type: "image", element, x: box.left, top: box.top, width: box.width, height: box.height, zIndex });
      return;
    }
    const first = ops.length;
    const clipGroups=[];
    for(let ancestor=element;ancestor&&ancestor!==stack;ancestor=ancestor.parentElement){
      const cs=getComputedStyle(ancestor);
      if(!['hidden','clip'].includes(cs.overflow))continue;
      const contentBox=cs.overflowClipMargin?.includes('content-box');
      clipGroups.push([...ancestor.getClientRects()].map(local).map(box=>{
        if(!contentBox)return box;
        const left=parseFloat(cs.paddingLeft)||0,right=parseFloat(cs.paddingRight)||0,top=parseFloat(cs.paddingTop)||0,bottom=parseFloat(cs.paddingBottom)||0;
        return insetRotatedRect(box,cssRotation(ancestor),{left,top,right,bottom});
      }));
    }
    // text-transform follows the language the browser used for this element.
    const typography = pdfTextStyle(element, style, language);
    const decoration = element.firstChild ? decorations(element) : [];
    for (const child of element.childNodes) {
      if (child.nodeType === 1) visit(child);
      else if (child.nodeType === 3 && child.data.trim()) words(child, typography, { decoration, positioned, exactFont: Boolean(exactFont), zIndex, landmark: landmarkIndex?.forElement(element), ...(clipGroups.length ? { clipGroups } : {}) });
    }
    const firstText = ops.slice(first).find((op) => op.type === "text" && !op.label);
    // Generated content the editor shows: heading numbers (::before) and list markers (::marker).
    // An imported Word heading draws its automatic number as ::before text (docx/projection.js importedHeadingNumberRules).
    const importedNumber = () => {
      if (!/^H[1-6]$/.test(element.tagName) || !element.hasAttribute("data-docx-style") || element.parentElement?.tagName !== "LI") return "";
      const content = getComputedStyle(element, "::before").content;
      return /^"[\s\S]*"$/.test(content) ? content.slice(1, -1).replace(/\\(.)/g, "$1").trim() : "";
    };
    const number = element.getAttribute("data-thesis-number") || element.getAttribute("data-thesis-caption")?.trim() || importedNumber();
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
        const hang = pseudo.display === "inline-block" && !element.hasAttribute("data-thesis-number") ? parseFloat(pseudo.width) : parseFloat(element.getAttribute("data-thesis-caption-hang"));
        const lineBox = local(element.getBoundingClientRect());
        pushLabel(label, generatedLabelX({ textAlign: style.textAlign, hang, firstTextX: firstText.x, labelWidth: textWidth(labelStyle, `${label} `), boxLeft: lineBox.left, paddingLeft: parseFloat(style.paddingLeft), textIndent: parseFloat(style.textIndent) }), firstText, labelStyle, firstText);
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
    const op = { type: "text", text, x, top: anchor.top, width: textWidth(style, text), baseline: anchor.baseline, style, color: fill, decoration: [], label: true, spaceAfter: true, positioned: Boolean(anchor.positioned), exactFont: Boolean(anchor.exactFont), zIndex: anchor.zIndex || 0, landmark: anchor.landmark };
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

function assertPositionedFont(style, text, templateId) {
  const family = String(style.fontFamily || "").split(",")[0].replace(/[\"']/g, "").trim();
  if (!normalizeAcademicPdfFamily(family)) throw new Error(`Konumlandırılmış metin için PDF yazı tipi ${family || "(belirtilmemiş)"} izin verilen ailelerden biri değil`);
  void text;
  void templateId;
}

export function clipPageRect(rect, pageTop, pageHeight) {
  const top = Math.max(rect.top, pageTop);
  const bottom = Math.min(rect.top + rect.height, pageTop + pageHeight);
  return bottom > top ? { ...rect, top, height: bottom - top } : null;
}

function drawOp(pdf, op, pageTop, templateId, pageHeight) {
  if (!op.clip) return drawUnclippedOp(pdf, op, pageTop, templateId, pageHeight);
  pdf.saveGraphicsState();
  try {
    pdf.rect(op.clip.left * MM, (op.clip.top - pageTop) * MM, op.clip.width * MM, op.clip.height * MM, null);
    pdf.clip(); pdf.discardPath();
    return drawUnclippedOp(pdf, op, pageTop, templateId, pageHeight);
  } finally { pdf.restoreGraphicsState(); }
}

function drawUnclippedOp(pdf, op, pageTop, templateId, pageHeight) {
  if(op.type === 'roundedRect'){
    pdf.setDrawColor(...op.color);pdf.setLineWidth(op.strokeWidth*MM);
    pdf.roundedRect(op.x*MM,(op.top-pageTop)*MM,op.width*MM,op.height*MM,Math.min(op.rx,op.width/2)*MM,Math.min(op.ry,op.height/2)*MM,'S');return;
  }
  if (op.type === "line") {
    const [x1, y1, x2, y2] = op.points;
    pdf.setDrawColor(...op.color); pdf.setLineWidth(op.width * MM);
    pdf.line(x1 * MM, (y1 - pageTop) * MM, x2 * MM, (y2 - pageTop) * MM);
    return;
  }
  if (op.type === "rect") {
    const clipped = clipPageRect(op, pageTop, pageHeight);
    if (!clipped) return;
    pdf.setFillColor(...op.color);
    pdf.rect(clipped.x * MM, (clipped.top - pageTop) * MM, clipped.width * MM, clipped.height * MM, "F");
    return;
  }
  if (op.type === "image") {
    const image = imageData(op.element);
    if (image) pdf.addImage(image.data, image.format, op.x * MM, (op.top - pageTop) * MM, op.width * MM, op.height * MM, undefined, "FAST");
    return;
  }
  if (op.exactFont || op.positioned) assertPositionedFont(op.style, op.text, templateId);
  const face = measuredPdfFontFace(pdf, op.style, op.text, op.exactFont || op.positioned);
  pdf.setFont(face.name, face.style);
  pdf.setFontSize(parseFloat(op.style.fontSize) * 0.75);
  pdf.setTextColor(...op.color);
  const spacing = parseFloat(op.style.letterSpacing) || 0;
  const y = (op.baseline - pageTop) * MM;
  const family = String(op.style.fontFamily).split(",")[0].replace(/["']/g, "").trim().toLowerCase();
  const text = isSymbolEncodedFamily(family) && hasSystemPdfFont(pdf, family) ? symbolFontText(op.text) : family === "cambria math" && hasSystemPdfFont(pdf, "Cambria Math") ? op.text : aliasGlyphs(op.text);
  op.exportText = text;
  op.exportedFont = pdf.getFont().fontName;
  // The browser shapes a run with kerning; jsPDF advances glyph by glyph without it, so a long line would end past where the browser's
  // ended (a 151-character title: +1.6 mm over the right margin). The small difference is spread over the run's characters, so every run
  // ends exactly where the browser's ended.
  const glyphs = [...text].length, size = parseFloat(op.style.fontSize) * 0.75;
  // Only for a genuine embedded family (the browser draws the same font); a substitute face keeps its natural advances.
  const fit = op.width > 0 && glyphs > 1 && hasSystemPdfFont(pdf, String(op.style.fontFamily).split(",")[0].replace(/["']/g, "").trim()) ? (op.width * MM - pdf.getTextWidth(text)) / glyphs : NaN;
  const charSpace = Number.isFinite(fit) && Math.abs(fit) <= size * 0.352778 * 0.1 ? fit : spacing * MM;
  const rendering = op.imageText ? {renderingMode:'invisible'} : {};
  pdf.text(text, op.x * MM, y, { baseline: "alphabetic", ...rendering, ...(op.angle ? {angle:op.angle} : {}), ...(charSpace ? { charSpace } : {}) });
  if (op.spaceAfter) pdf.text(" ", (op.x + op.width) * MM, y, { baseline: "alphabetic", ...rendering });
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

/** Rasterize individual vector objects at print resolution; body text stays
 * searchable. Freeze computed SVG paint/typography, so CSS inheritance is not
 * lost when the object is decoded outside the live DOM. */
async function prepareLayoutGraphics(root) {
  const prepared=new Map();
  const decodeImage=async src=>{const image=new Image();image.src=src;await image.decode();return image;};
  await Promise.all([...root.querySelectorAll('img')].filter(img=>!img.complete).map(img=>img.decode()));
  for(const element of root.querySelectorAll('svg,[data-native-object="drawing"]')){
    if(element.closest('[hidden],.katex-mathml,[data-export-ignore]'))continue;
    const rect=element.getBoundingClientRect(),cs=getComputedStyle(element);
    if(!rect.width||!rect.height||cs.display==='none'||cs.visibility==='hidden')continue;
    let src=null, svgTexts=null;
    if(element.tagName.toLowerCase()==='svg'){
      if(element.closest('.katex-html .sqrt'))continue;
      if(element.closest('[data-docx-drawing]')?.getAttribute('data-docx-drawing')?.includes('drawing/2014/chartex')){
        const fallback=element.closest('[data-docx-drawing]').parentElement?.parentElement?.querySelector(':scope > [hidden] img');
        const texts=fallback && measuredSvgTexts(element,{imageText:true});
        if(texts)prepared.set(element,{texts});
        continue;
      }
      const clone=element.cloneNode(true),originals=[element,...element.querySelectorAll('*')],copies=[clone,...clone.querySelectorAll('*')];
      originals.forEach((node,i)=>{
        const computed=getComputedStyle(node);
        for(const prop of ['fill','fill-opacity','stroke','stroke-width','stroke-opacity','stroke-dasharray','stroke-linecap','stroke-linejoin','opacity','color','font-family','font-size','font-weight','font-style','letter-spacing','text-anchor','dominant-baseline','direction','writing-mode'])copies[i].style.setProperty(prop,computed.getPropertyValue(prop));
      });
      // Paint supported SVG text with the embedded font, rather than baking
      // visible chart labels into pixels. Keep complex SVG typography in the
      // raster fallback; removing text is atomic for the whole SVG.
      svgTexts=measuredSvgTexts(element);
      if(svgTexts)clone.querySelectorAll('text').forEach(node=>node.remove());
      clone.setAttribute('xmlns','http://www.w3.org/2000/svg');
      clone.setAttribute('width',String(parseFloat(cs.width)||rect.width));clone.setAttribute('height',String(parseFloat(cs.height)||rect.height));
      src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(clone));
    }else{
      const match=cs.backgroundImage.match(/^url\(["']?(data:image\/svg\+xml[^"']+)["']?\)$/);
      if(match)src=match[1];
    }
    if(!src)continue;
    const image=await decodeImage(src);
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.ceil((parseFloat(cs.width)||rect.width)*3));canvas.height=Math.max(1,Math.ceil((parseFloat(cs.height)||rect.height)*3));
    canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
    const renderedImage=await decodeImage(canvas.toDataURL('image/png'));
    prepared.set(element,svgTexts ? {image:renderedImage,texts:svgTexts} : renderedImage);
  }
  return prepared;
}

/** Flat SVG labels with a uniform transform have exact browser baseline and
 * advance APIs. Unsupported text remains in the rasterized SVG unchanged. */
export function measuredSvgTexts(svg, {imageText = false} = {}) {
  const result=[];
  for(const element of svg.querySelectorAll('text')){
    const raw=element.textContent || '',style=getComputedStyle(element),matrix=element.getScreenCTM();
    // SVG's addressable characters follow rendered white-space collapsing;
    // DOM text offsets can include duplicate or trailing source spaces.
    const count=element.getNumberOfChars();
    const text=count===raw.length ? raw : raw.replace(/[\t\r\n ]+/g,' ').trim();
    if(!text.trim() || style.display==='none' || style.visibility==='hidden' || style.fill==='none')continue;
    if(element.children.length || element.hasAttribute('rotate') || (!imageText && element.hasAttribute('textLength')) || style.writingMode!=='horizontal-tb' || !color(style.fill) || !matrix || !normalizeAcademicPdfFamily(style.fontFamily) || /[^\u0000-\uFFFF]/u.test(text) || count!==text.length)return null;
    for(let parent=element;parent;parent=parent.parentElement){
      const paint=getComputedStyle(parent);
      if(Number(paint.opacity)<1 || paint.clipPath!=='none' || paint.maskImage!=='none')return null;
      if(parent===svg)break;
    }
    const scale=Math.hypot(matrix.a,matrix.b),other=Math.hypot(matrix.c,matrix.d);
    if(!(scale>0) || Math.abs(scale-other)>scale*.0001 || Math.abs(matrix.a*matrix.c+matrix.b*matrix.d)>scale*scale*.0001 || Number(style.opacity)<1 || Number(style.fillOpacity)<1)return null;
    for(const match of text.matchAll(/\S+/g)){
      const start=element.getStartPositionOfChar(match.index),point=new DOMPoint(start.x,start.y).matrixTransform(matrix);
      const rect=element.getBoundingClientRect();
      result.push({text:match[0],x:point.x,baseline:point.y,top:rect.top,height:rect.height,width:element.getSubStringLength(match.index,match[0].length)*scale,scale,angle:-Math.atan2(matrix.b,matrix.a)*180/Math.PI,style:{...textStyle(style),color:style.fill},clip:svg.getBoundingClientRect().toJSON(),spaceAfter:match.index+match[0].length<text.length});
    }
  }
  return result;
}

/** Shared measured writer for the normal academic editor's frozen page stack. */
export async function buildMeasuredAcademicPdf({root,pages=1,pagePitchPx,widthMm=210,heightMm=297,title='',language='tr',drawPage}) {
  await document.fonts?.ready;
  const graphics=await prepareLayoutGraphics(root);
  const pdf=new jsPDF({unit:'mm',format:[widthMm,heightMm],orientation:'p',compress:true});
  pdf.setProperties({title,creator:'TxtNote'});
  const fonts=[...new Set([...renderedFontFamilies(root),...[...graphics.values()].flatMap(g=>(g.texts || []).map(t=>t.style.fontFamily))])];
  await embedAcademicPdfFonts(pdf,{extraFontFamilies:fonts,systemFonts:fonts});
  const ops=collectGroup(root,language,new Set(),null,graphics);
  const pitch=pagePitchPx || heightMm*PX_PER_MM;
  for(let page=0;page<pages;page++){
    if(page)pdf.addPage([widthMm,heightMm],'p');
    const selected=ops.filter(op=>Math.max(0,Math.floor((op.top+(op.height??(op.baseline-op.top))/2)/pitch))===page);
    selected.sort((a,b)=>(a.zIndex||0)-(b.zIndex||0)||Number(a.type==='text')-Number(b.type==='text'));
    for(const op of selected)drawOp(pdf,op,page*pitch,null,heightMm*PX_PER_MM);
    drawPage?.(pdf,page);
  }
  return pdf.output('blob');
}

export async function buildThesisLayoutPdf({ root, groups, title = "", language = "tr", templateId, documentLayout, systemFonts = [], onLayoutReport }) {
  await document.fonts?.ready;
  const graphics=await prepareLayoutGraphics(root);
  const stacks = thesisPageStacks(root, groups);
  const sections = groups.flatMap(group => group.sections || []);
  const fontRequests = [...new Set([...collectAcademicPdfFontRequests(documentLayout, sections),...renderedFontFamilies(root),...[...graphics.values()].flatMap(g=>(g.texts || []).map(t=>t.style.fontFamily))])];
  const exactFamilies = new Set(fontRequests.map(value => normalizeAcademicPdfFamily(value) || value));
  let pdf = null;
  const report = { version: 1, origin: 'top-left', units: { geometry: 'mm', fontSize: 'pt' }, pages: [] };
  for (const { group, stack, metrics, pages } of stacks) {
    if (!pages) continue;
    const { widthMm, heightMm } = group.rules.page;
    const orientation = widthMm > heightMm ? "l" : "p";
    const byPage = Array.from({ length: pages }, () => []);
    const landmarkIndex = layoutLandmarkIndex(stack, group.id);
    const origin = stack.getBoundingClientRect();
    const zoom = new DOMMatrixReadOnly(getComputedStyle(stack).transform).a || 1;
    const boxes = landmarkIndex.boxes((rect) => ({ left: (rect.left - origin.left) / zoom, top: (rect.top - origin.top) / zoom, width: rect.width / zoom, height: rect.height / zoom }));
    for (const op of collectGroup(stack, language, exactFamilies, landmarkIndex, graphics)) {
      const middle = op.top + (op.height ?? (op.baseline - op.top)) / 2;
      byPage[Math.min(pages - 1, Math.max(0, Math.floor(middle / flowPagePitchPx(metrics))))].push(op);
    }
    for (const [index, ops] of byPage.entries()) {
      if (!pdf) {
        pdf = new jsPDF({ unit: "mm", format: [widthMm, heightMm], orientation, compress: true });
        pdf.setProperties({ title: title || "Tez", creator: "TxtNote" });
        await embedAcademicPdfFonts(pdf, { templateId, extraFontFamilies: fontRequests, systemFonts });
      } else pdf.addPage([widthMm, heightMm], orientation);
      // The browser lays the flow out with column height and row gap truncated to 1/64 px, so page N starts at N * flow pitch (a hair
      // below N * stride): using the real pitch keeps every page's text at the same offset, however long the document.
      const pageTop = index * flowPagePitchPx(metrics);
      // Higher canonical z-indexes paint later; ties keep lines and images under text, as in the editor.
      const ordered = ops.map((op, order) => ({ op, order })).sort((left, right) =>
        (left.op.zIndex || 0) - (right.op.zIndex || 0)
        || Number(left.op.type === "text") - Number(right.op.type === "text")
        || left.order - right.order);
      for (const { op } of ordered) drawOp(pdf, op, pageTop, templateId, metrics.heightPx);
      const pageBoxes = layoutPageBoxes(boxes, pageTop, metrics.heightPx);
      const sheet = stack.querySelectorAll('.thesis-sheet')[index];
      report.pages.push(layoutPageReport({ ops, boxes: pageBoxes, pageTop, mmPerPx: MM, page: report.pages.length + 1,
        groupId: group.id, label: sheet?.getAttribute('data-thesis-page-label') || '', widthMm, heightMm }));
    }
  }
  if (!pdf) throw new Error("Dışa aktarılacak sayfa yok");
  onLayoutReport?.(report);
  return pdf.output("blob");
}
