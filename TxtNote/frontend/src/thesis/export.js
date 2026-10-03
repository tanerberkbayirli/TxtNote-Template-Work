import { blockDescriptors, blockGapActive, describeBlock, gapBetween } from "./blockGap.js";
import { jsPDF } from "jspdf";
import {
  AlignmentType, Bookmark, BorderStyle, Document, ExternalHyperlink, Footer, FootnoteReferenceRun, Header, ImageRun,
  HeightRule, LevelFormat, LineRuleType, NumberFormat, Packer, PageBreak, PageNumber, PageOrientation, Paragraph,
  SectionType, SimpleField, Table, TableAnchorType, TableCell, TableLayoutType, TableRow, TextRun, WidthType, TabStopType, LeaderType, Tab, VerticalAlign,
  ImportedXmlComponent,
} from "docx";
import { ACADEMIC_FIGURE_MARGIN_PT, ACADEMIC_TABLE_CELL_PADDING_PT, parseAcademicHtml } from "../lib/academicDocument.js";
import { mathFromLatex } from "../lib/mathOmml.js";
import { academicPdfFontFace, collectAcademicPdfFontRequests, exactAcademicPdfFont, embedAcademicPdfFonts, normalizeAcademicPdfFamily, pdfFontStyle } from "../lib/academicFonts.js";
import { effectiveLineHeight, extractThesisHeadings, formatNumber, groupThesisSections, indentMm, resolveChromeText, resolvePageNumberStyle, transformThesisText } from "./engine.js";
import { PX_PER_MM, thesisGroupHasPageContent } from "./pageLayout.js";
import { indexRowStyle } from "./generatedIndex.js";
import { flattenSpecialPage, specialPageRowWidths } from "./specialPages.js";
import { continuationParts } from "./tableContinuation.js";
import { MM_PER_PT, mmToTwip, ptToTwip } from "./units.js";
import { positionedLayoutDocx, positionedPageNumberDocx, splitLayoutNodes } from "./layoutDocx.js";
import { wordBaselineProbe } from "./wordBaseline.js";
import { ENGINE_DEFAULT_HEADER_DISTANCE_MM } from "./engineDefaults.js";

const mmPerPt = MM_PER_PT;
const strip = (html) => String(html ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").trim();
const alignDocx = (value) => ({ center: AlignmentType.CENTER, right: AlignmentType.RIGHT, justify: AlignmentType.JUSTIFIED }[value] || AlignmentType.LEFT);
const blockText = (block) => {
  const runs = block.runs || [];
  return runs.map((run) => run.type === "break" ? "\n" : run.type === "link" ? (run.children || []).map((child) => child.text || "").join("") : run.text || "").join("") || block.text || "";
};
const pageFormat = (value) => ({ "roman-lower": NumberFormat.LOWER_ROMAN, "roman-upper": NumberFormat.UPPER_ROMAN, "alpha-lower": NumberFormat.LOWER_LETTER, "alpha-upper": NumberFormat.UPPER_LETTER }[value] || NumberFormat.DECIMAL);
const stripSpecialLayoutMarkup = (source) => {
  const html = String(source ?? "");
  const tagPattern = /<!--[\s\S]*?-->|<![^>]*>|<[^>]+>/g;
  const voidTags = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
  let output = "";
  let cursor = 0;
  let skipped = [];
  for (const match of html.matchAll(tagPattern)) {
    const token = match[0];
    const start = match.index;
    const parsed = token.match(/^<\s*(\/?)\s*([A-Za-z][\w:-]*)/);
    if (skipped.length) {
      if (parsed) {
        const [, closing, rawName] = parsed;
        const name = rawName.toLowerCase();
        if (closing) {
          const index = skipped.lastIndexOf(name);
          if (index >= 0) skipped.splice(index);
        } else if (!voidTags.has(name) && !/\/\s*>$/.test(token)) skipped.push(name);
      }
      cursor = start + token.length;
      continue;
    }
    output += html.slice(cursor, start);
    if (/\bdata-thesis-block(?:\s|=|\/?>)/i.test(token) && parsed) {
      const [, closing, rawName] = parsed;
      const name = rawName.toLowerCase();
      if (!closing && !voidTags.has(name) && !/\/\s*>$/.test(token)) skipped = [name];
    } else output += token;
    cursor = start + token.length;
  }
  if (!skipped.length) output += html.slice(cursor);
  return output;
};
const asBlocks = (section) => {
  const cleanHtml = stripSpecialLayoutMarkup(section.html);
  const outline = (section.indexSources || extractThesisHeadings(cleanHtml, section.rules)).filter((entry) => !entry.kind || entry.kind === "toc");
  let headingIndex = 0;
  // Caption counters and heading labels are compiled once, across the document.
  const captions = (section.indexSources || []).filter((entry) => entry.kind !== "toc" && entry.kind !== "equations");
  const equations = (section.indexSources || []).filter((entry) => entry.kind === "equations");
  let equationIndex = 0;
  let captionIndex = 0;
  return parseAcademicHtml(cleanHtml, { lines: true }).map((block) => {
    if (block.type === "heading") { const entry = outline[headingIndex++]; return { ...block, thesisAnchor: entry?.anchor, unnumbered: Boolean(entry?.unnumbered), thesisNumber: entry?.label || "", thesisNumberLine: Boolean(entry?.labelLine) }; }
    if (block.type === "math" && block.numbered && section.rules.equations) return { ...block, equationLabel: equations[equationIndex++]?.label || "" };
    if ((block.type === "table" || block.type === "figure") && block.caption) { const entry = captions[captionIndex++]; return { ...block, captionNumber: entry?.number || "", captionLabel: entry?.label || "", captionAnchor: entry?.anchor, captionKind: entry?.captionKind || "", caption: entry?.title || block.caption }; }
    return block;
  });
};
const captionText = (label, block) => `${block.captionLabel || `${label} ${block.captionNumber}.`} ${block.caption}`;

function pdfFont(pdf, style, exactFamilies = new Set()) {
  const family = normalizeAcademicPdfFamily(style.fontFamily);
  if (exactFamilies.has(family || style.fontFamily)) {
    const faceStyle = pdfFontStyle({ bold: style.fontWeight >= 600, italic: style.italic });
    pdf.setFont(exactAcademicPdfFont(pdf, faceStyle, style.fontFamily), faceStyle);
  }
  else if (/arial|helvetica/i.test(style.fontFamily)) pdf.setFont("helvetica", `${style.fontWeight >= 600 ? "bold" : ""}${style.italic ? "italic" : ""}` || "normal");
  else {
    const faceStyle = pdfFontStyle({ bold: style.fontWeight >= 600, italic: style.italic });
    const face = academicPdfFontFace(pdf, faceStyle, style.fontFamily);
    pdf.setFont(face.name, face.style);
  }
  pdf.setFontSize(style.fontSizePt);
  pdf.setTextColor(17, 17, 17);
}

function pdfChrome(pdf, section, pageNumber, firstPage, values, exactFamilies = new Set()) {
  const { page, body } = section.rules;
  const contentWidth = page.widthMm - page.margins.leftMm - page.margins.rightMm;
  const header = page.header;
  const footer = page.footer;
  pdfFont(pdf, { ...body, fontSizePt: Math.min(10, body.fontSizePt) }, exactFamilies);
  if (header?.content && !(firstPage && header.firstPage === "omit")) pdf.text(resolveChromeText(header.content, values), page.margins.leftMm, header.distanceMm + header.heightMm / 2, { maxWidth: contentWidth });
  if (footer?.content && !(firstPage && footer.firstPage === "omit")) pdf.text(resolveChromeText(footer.content, values), page.margins.leftMm, page.heightMm - footer.distanceMm, { maxWidth: contentWidth });
  const rule = page.numbering;
  if (!rule.enabled) return;
  const label = formatNumber(pageNumber, rule.format);
  const explicitBaseline = Number.isFinite(rule.baselineFromTopMm);
  const numberingStyle = resolvePageNumberStyle(body, rule);
  pdfFont(pdf, numberingStyle, exactFamilies);
  const defaultX = rule.align === "left" ? page.margins.leftMm : rule.align === "right" ? page.widthMm - page.margins.rightMm : page.widthMm / 2;
  const x = Number.isFinite(rule.xMm) && Number.isFinite(rule.widthMm)
    ? rule.xMm + (rule.align === "left" ? 0 : rule.align === "right" ? rule.widthMm : rule.widthMm / 2)
    : defaultX;
  const y = explicitBaseline
    ? rule.baselineFromTopMm
    : rule.position === "top" ? Math.max(6, page.margins.topMm / 2) : page.heightMm - Math.max(6, page.margins.bottomMm / 2);
  pdf.text(label, x, y, { align: rule.align, ...(explicitBaseline ? { baseline: "alphabetic" } : {}) });
}

function positionedPdfNode(pdf, node, language, lineSpacing, baseStyle = {}, exactFamilies = new Set()) {
  if (!Number.isFinite(node.xMm) || !Number.isFinite(node.yMm)) throw new Error(`Pozisyonlu öğe ${node.id || "?"} için x/y ölçüleri geçersiz`);
  const { xMm, yMm } = node;
  if (node.type === "image") {
    if (!(Number.isFinite(node.widthMm) && node.widthMm > 0 && Number.isFinite(node.heightMm) && node.heightMm > 0 && /^data:image\/(png|jpe?g);base64,/i.test(node.source || ""))) throw new Error(`Pozisyonlu görsel ${node.id || "?"} için geometri veya kaynak geçersiz`);
    pdf.addImage(node.source, /png/i.test(node.source.slice(0, 24)) ? "PNG" : "JPEG", xMm, yMm, node.widthMm, node.heightMm);
    return;
  }
  if (node.type === "separator") {
    if (!(Number.isFinite(node.widthMm) && node.widthMm > 0)) throw new Error(`Pozisyonlu çizgi ${node.id || "?"} için genişlik geçersiz`);
    const hex = /^#[0-9a-f]{6}$/i.test(node.style?.color || "") ? node.style.color.slice(1) : "111111";
    pdf.setDrawColor(Number.parseInt(hex.slice(0, 2), 16), Number.parseInt(hex.slice(2, 4), 16), Number.parseInt(hex.slice(4, 6), 16));
    pdf.setLineWidth((Number(node.thicknessPt) > 0 ? node.thicknessPt : 0.75) * mmPerPt);
    pdf.line(xMm, yMm, xMm + node.widthMm, yMm);
    return;
  }
  if (node.type !== "text") return;
  if (!(Number.isFinite(node.widthMm) && node.widthMm > 0)) throw new Error(`Pozisyonlu metin ${node.id || "?"} için genişlik geçersiz`);
  const style = { ...baseStyle, ...(node.style || {}) };
  pdfFont(pdf, style, exactFamilies);
  const hex = /^#[0-9a-f]{6}$/i.test(style.color || "") ? style.color.slice(1) : "111111";
  pdf.setTextColor(Number.parseInt(hex.slice(0, 2), 16), Number.parseInt(hex.slice(2, 4), 16), Number.parseInt(hex.slice(4, 6), 16));
  const indent = Number(style.leftIndentMm) || 0;
  const firstLineIndent = Number(style.firstLineIndentMm) || 0;
  const width = Math.max(0.1, node.widthMm - indent - (Number(style.rightIndentMm) || 0));
  const align = style.align || "left";
  const text = transformThesisText(node.text, style, language);
  const pitch = style.fontSizePt * effectiveLineHeight(style.lineHeight, lineSpacing) * mmPerPt;
  let top = yMm + (Number(style.spaceBeforePt) || 0) * mmPerPt;
  for (const paragraph of text.split("\n")) {
    const lines = pdf.splitTextToSize(paragraph || " ", width);
    for (const [lineIndex, line] of lines.entries()) {
      if (Number.isFinite(node.heightMm) && node.heightMm > 0 && top > yMm + node.heightMm) break;
      const lineIndent = lineIndex === 0 ? firstLineIndent : 0;
      const lineWidth = Math.max(0.1, width - lineIndent);
      const drawX = xMm + indent + lineIndent + (align === "center" ? lineWidth / 2 : align === "right" ? lineWidth : 0);
      pdf.text(line || " ", drawX, top, { align: align === "justify" ? "left" : align, baseline: "top", maxWidth: width });
      top += pitch;
    }
    top += (Number(style.spaceAfterPt) || 0) * mmPerPt;
  }
}

/** Searchable PDF. Pages, margins, type sizes and numbering come from the compiled model. */
export async function buildThesisPdf(model) {
  const first = model.sections[0]?.rules.page;
  const fontRequests = collectAcademicPdfFontRequests(model.documentLayout, model.sections);
  const exactFamilies = new Set(fontRequests.map(value => normalizeAcademicPdfFamily(value) || value));
  const pdf = new jsPDF({ unit: "mm", format: [first?.widthMm || 210, first?.heightMm || 297], compress: true });
  pdf.setProperties({ title: model.title || "Tez", creator: "TxtNote" });
  await embedAcademicPdfFonts(pdf, { templateId: model.templateId, extraFontFamilies: fontRequests, systemFonts: model.systemFonts || [] });
  let started = false;
  let logicalPage = 0;
  for (const group of groupThesisSections(model.sections)) {
    const { page } = group.rules;
    const numbering = page.numbering;
    if (numbering.restart) logicalPage = (numbering.startAt ?? 1) - 1;
    if (!thesisGroupHasPageContent(group)) continue;
    let sectionPage = 0;
    let y = page.margins.topMm;
    const width = page.widthMm - page.margins.leftMm - page.margins.rightMm;
    const startPage = () => {
      if (started) pdf.addPage([page.widthMm, page.heightMm], page.orientation);
      started = true; sectionPage += 1; logicalPage += 1;
      y = page.margins.topMm;
      pdfChrome(pdf, group.sections[0], logicalPage, sectionPage === 1, model.values, exactFamilies);
    };
    startPage();
    const write = (value, style, align = style.align || "left") => {
      if (style.pageBreakBefore && y > page.margins.topMm + 0.5) startPage();
      const source = transformThesisText(value, style, model.language);
      if (!source.trim()) { y += style.fontSizePt * effectiveLineHeight(style.lineHeight, group.rules.lineSpacing) * mmPerPt; return; }
      pdfFont(pdf, style, exactFamilies);
      const indent = Math.max(0, style.leftIndentMm || 0);
      const available = Math.max(10, width - indent - Math.max(0, style.rightIndentMm || 0));
      const lineHeight = style.fontSizePt * effectiveLineHeight(style.lineHeight, group.rules.lineSpacing) * mmPerPt;
      y += (style.spaceBeforePt || 0) * mmPerPt;
      for (const paragraph of source.split("\n")) {
        const lines = pdf.splitTextToSize(paragraph || " ", available);
        for (const line of lines) {
          if (y + lineHeight > page.heightMm - page.margins.bottomMm) { startPage(); pdfFont(pdf, style, exactFamilies); }
          const x = page.margins.leftMm + indent + (align === "center" ? available / 2 : align === "right" ? available : 0);
          pdf.text(line || " ", x, y, { align: align === "justify" ? "left" : align, baseline: "top" });
          y += lineHeight;
        }
      }
      y += (style.spaceAfterPt || 0) * mmPerPt;
    };
    for (const section of group.sections) {
    const { body, headings } = section.rules;
    const layoutSplit = section.layout ? splitLayoutNodes(section.layout) : { flow: [], positioned: [] };
    const flowLayout = section.layout ? flattenSpecialPage(layoutSplit.flow) : section.layoutBlocks;
    if (flowLayout) for (const block of flowLayout) {
      if (block.type === "spacer") y += block.heightMm;
      else if (block.type === "image") {
        const indentL = block.leftIndentMm || 0; const indentR = block.rightIndentMm || 0;
        const x = page.margins.leftMm + (block.align === "left" ? indentL : block.align === "right" ? width - indentR - block.widthMm : indentL + (width - indentL - indentR - block.widthMm) / 2);
        pdf.addImage(block.source, /png/i.test(block.source.slice(0, 20)) ? "PNG" : "JPEG", x, y, block.widthMm, block.heightMm);
        y += block.heightMm;
      }
      else write(block.text, block.style, block.style.align);
    }
    for (const node of [...layoutSplit.positioned].sort((left, right) => (left.zIndex || 0) - (right.zIndex || 0))) positionedPdfNode(pdf, node, model.language || "tr", section.rules.lineSpacing, body, exactFamilies);
    for (const block of asBlocks(section)) {
      if (block.type === "heading") {
        const style = headings[block.level] || headings[1] || body;
        const headingStyle = block.indentMm ? { ...style, leftIndentMm: (style.leftIndentMm || 0) + block.indentMm } : style;
        write(`${block.thesisNumber ? `${block.thesisNumber}${block.thesisNumberLine ? "\n" : " "}` : ""}${block.text}`, block.unnumbered ? { ...headingStyle, pageBreakBefore: false } : headingStyle);
      } else if (block.type === "paragraph" || block.type === "quote") {
        const style = section.type === "bibliography" ? section.rules.bibliography.style : body;
        write(blockText(block), block.indentMm ? { ...style, leftIndentMm: (style.leftIndentMm || 0) + block.indentMm } : style, block.align || body.align);
      } else if (block.type === "list") {
        (block.items || []).forEach((item, index) => write(`${section.type === "tableOfContents" ? "" : block.ordered ? `${index + 1}. ` : "• "}${item.text || blockText(item)}`, body, "left"));
      } else if (block.type === "table") {
        if (block.caption) write(captionText(section.rules.tables.label, block), section.rules.tables.style, section.rules.tables.align);
        for (const row of block.rows || []) write(row.map((cell) => cell.text).join("     "), body, "left");
      } else if (block.type === "figure") {
        const src = block.src;
        const imgWidth = Math.min(width, (block.width || 400) * mmPerPt * 0.75);
        const imgHeight = imgWidth * ((block.height || 250) / (block.width || 400));
        if (y + imgHeight > page.heightMm - page.margins.bottomMm) startPage();
        if (/^data:image\/(png|jpe?g|webp);base64,/i.test(src)) {
          try { pdf.addImage(src, /png|webp/i.test(src.slice(0, 20)) ? "PNG" : "JPEG", page.margins.leftMm + (width - imgWidth) / 2, y, imgWidth, imgHeight); y += imgHeight + 2; }
          catch { write(block.alt || "[Görsel]", body); }
        }
        if (block.caption) write(captionText(section.rules.figures.label, block), section.rules.figures.style, section.rules.figures.align);
      } else if (block.type === "code" || block.type === "math") {
        write(block.text || "", body);
      }
    }
    }
  }
  return pdf.output("blob");
}

/* ---------------------------------------------------------------------------
 * DOCX: structural + typographic parity with the editor, using Word semantics
 * (styles, runs, numbering, tables, sections, header/footer PAGE fields).
 * Everything comes from the compiled model; nothing here knows a university.
 * ------------------------------------------------------------------------- */

// Rounded, not floored like docx's convertMillimetersToTwip: A4 is exactly Word's 11906 × 16838.
const twip = (mm) => mmToTwip(mm || 0);
const pt = (value) => ptToTwip(value || 0);
// Legacy footnote size, used only when a model carries no resolved footnote rule.
const FOOTNOTE_PT = 9;
const LIST_INDENT_PT = 24;
const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const CELL_BORDER = { style: BorderStyle.SINGLE, size: 6, color: "888888" };
const plainRuns = (text) => [{ type: "text", text: String(text ?? "") }];

const halfPointSize = (fontSizePt) => {
  const size = Number(fontSizePt) * 2;
  if (!Number.isFinite(size) || !Number.isInteger(size)) throw new Error(`DOCX metin boyutu ${fontSizePt} pt yarım punto biriminde tam olarak saklanamıyor`);
  return size;
};

function runProps(style, language) {
  return { font: style.fontFamily, size: halfPointSize(style.fontSizePt), bold: style.fontWeight >= 600, italics: Boolean(style.italic), ...(style.characterSpacingPt ? { characterSpacing: pt(style.characterSpacingPt) } : {}), ...(style.color ? { color: style.color.slice(1).toUpperCase() } : {}), language: { value: language } };
}

function textRun(text, style, context, inline = {}) {
  const inlineColor = { black: "171717", red: "E8A0A0", blue: "9BB8DE", green: "9CC9AE" }[inline.color];
  const highlightFill = { yellow: "FFF2A8", green: "C9F2D0", cyan: "BDEFFF", magenta: "F5C8EE" }[inline.highlight];
  return new TextRun({
    ...runProps(style, context.language), text: transformThesisText(text, style, context.language),
    ...(inline.fontSizePt ? { size: halfPointSize(inline.fontSizePt) } : {}),
    ...(inline.bold ? { bold: true } : {}), ...(inline.italic ? { italics: true } : {}),
    ...(inlineColor ? { color: inlineColor } : {}),
    ...(highlightFill ? { shading: { fill: highlightFill, type: "clear" } } : {}),
    underline: inline.underline || style.decoration === "underline" ? {} : undefined, strike: Boolean(inline.strike),
  });
}

/** Inline runs of the parsed block model: bold/italic/underline/strike, breaks, links and real footnotes. */
function docxRuns(runs, style, context) {
  const out = [];
  for (const item of runs || []) {
    if (item.type === "break") out.push(new TextRun({ break: 1 }));
    else if (item.type === "tab") out.push(new TextRun({ children: [new Tab()] }));
    else if (item.type === "math") {
      const formula = mathFromLatex(item.latex || item.text, style, { strictUnsupported: true });
      if (formula) out.push(formula);
      else out.push(textRun("[empty equation]", style, context));
    }
    // TOC/list page labels are real PAGEREF fields (cached result = the editor's label): Word/LibreOffice re-read the page of the bookmark.
    else if (item.type === "pageref") out.push(new SimpleField(`PAGEREF ${item.bookmark} \\h`, item.text || ""));
    else if (item.type === "link") {
      const children = docxRuns(item.children, style, context);
      let href = "";
      try {
        const parsed = new URL(item.href || "");
        if (parsed.protocol === "http:" || parsed.protocol === "https:") href = parsed.href;
      } catch { /* Invalid or relative destinations retain their text without an unsafe external relationship. */ }
      out.push(...(href && children.length ? [new ExternalHyperlink({ link: href, children })] : children));
    }
    else if (item.type === "footnote") {
      const id = context.nextFootnote++;
      // Word places the note on its page; typography comes from the same template rule as the editor's note area.
      const rule = context.footnoteStyle;
      const noteStyle = rule ? { ...rule, decoration: "none", textTransform: "none" } : { ...context.body, fontSizePt: FOOTNOTE_PT, align: "left", firstLineIndentMm: 0, textTransform: "none" };
      const props = rule ? paragraphProps(noteStyle, { keepNext: false, pageBreakBefore: false }, context.lineSpacing) : {};
      // The note number Word inserts in the note area inherits its size from the paragraph style, so each footnote size gets a
      // paragraph style carrying the note's own font and size (otherwise the mark falls back to the document default and the first line grows).
      const noteStyleId = `ThesisFootnote${halfPointSize(noteStyle.fontSizePt || FOOTNOTE_PT)}`;
      (context.footnoteParagraphStyles ||= new Map()).set(noteStyleId, { id: noteStyleId, name: `Thesis Footnote ${noteStyle.fontSizePt || FOOTNOTE_PT} pt`, basedOn: "Normal", quickFormat: false, run: { font: noteStyle.fontFamily || context.body.fontFamily, size: halfPointSize(noteStyle.fontSizePt || FOOTNOTE_PT) } });
      context.footnotes[id] = { children: [new Paragraph({ ...props, style: noteStyleId, children: [textRun(item.text || "", noteStyle, context)] })] };
      out.push(new FootnoteReferenceRun(id));
    } else {
      const text = item.text || item.latex || "";
      // A typed tab is a Word tab (aligned on the paragraph's tab stop), never a literal character.
      text.split("\t").forEach((part, index) => { if (index) out.push(new TextRun({ children: [new Tab()] })); if (part) out.push(textRun(part, style, context, item)); });
    }
  }
  return out;
}

// Word's own "n lines" (240 = single), the same pitch the editor draws for "word" line spacing.
const lineSpacingDocx = (style, lineSpacing) => lineSpacing?.mode === "word"
  ? { line: Math.round(240 * (style.lineHeight || 1.5)), lineRule: LineRuleType.AUTO }
  // atLeast = the CSS line box height; Word still grows a line for taller inline content.
  : { line: pt(style.fontSizePt * (style.lineHeight || 1.5)), lineRule: LineRuleType.AT_LEAST };

function paragraphProps(style, options = {}, lineSpacing = null) {
  // Word expresses a negative first line as a hanging indent.
  const indent = indentMm(style);
  return {
    alignment: alignDocx(style.align),
    spacing: { before: pt(style.spaceBeforePt), after: pt(style.spaceAfterPt), ...lineSpacingDocx(style, lineSpacing) },
    indent: { ...(indent.first < 0 ? { hanging: twip(-indent.first) } : { firstLine: twip(indent.first) }), left: twip(indent.left), right: twip(style.rightIndentMm || 0) },
    keepNext: Boolean(style.keepWithNext), pageBreakBefore: Boolean(style.pageBreakBefore),
    ...(style.tabStopMm > 0 ? { tabStops: [{ type: TabStopType.LEFT, position: twip(indent.left + style.tabStopMm) }] } : {}),
    ...options,
  };
}

/** Word bookmark name of an index anchor ("main-source-3" -> "_ref_main_source_3"). */
export const bookmarkName = (anchor) => `_ref_${String(anchor).replace(/[^A-Za-z0-9]/g, "_")}`.slice(0, 40);
const bookmarked = (anchor, children) => anchor ? [new Bookmark({ id: `${bookmarkName(anchor)}`, children })] : children;

function docxParagraph(runs, style, context, { anchor, ...options } = {}) {
  const children = docxRuns(runs, style, context);
  return new Paragraph({ ...paragraphProps(style, options, context.lineSpacing), children: bookmarked(anchor, children.length ? children : [textRun("", style, context)]) });
}

const thesisHeadingStyleId = (level, included, noPage = false) => `ThesisHeading${level}${included ? (noPage ? "NoPage" : "Index") : "Excluded"}`;
const fieldXmlText = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function complexFieldMarker(instruction, edge) {
  const xml = edge === "begin"
    ? `<w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/><w:instrText xml:space="preserve">${fieldXmlText(instruction)}</w:instrText><w:fldChar w:fldCharType="separate"/></w:r>`
    : `<w:r><w:fldChar w:fldCharType="end"/></w:r>`;
  // fromXmlString returns an unnamed document wrapper (serialized as <undefined>); unwrap to the real <w:r>.
  const parsed = ImportedXmlComponent.fromXmlString(xml);
  return parsed.root.find((child) => child instanceof ImportedXmlComponent) || parsed;
}
function wrapParagraphsInField(paragraphs, instruction) {
  if (!paragraphs.length) return paragraphs;
  const first = paragraphs[0];
  // Paragraph.root starts with paragraph properties. Keeping the field begin in
  // the first cached row avoids adding a blank line to university index pages.
  first.root.splice(1, 0, complexFieldMarker(instruction, "begin"));
  paragraphs[paragraphs.length - 1].root.push(complexFieldMarker(instruction, "end"));
  return paragraphs;
}
function emptyComplexFieldParagraph(instruction) {
  return new Paragraph({ spacing: { before: 0, after: 0 }, children: [complexFieldMarker(instruction, "begin"), complexFieldMarker(instruction, "end")] });
}
function indexFieldInstruction(rule, styleLevels, noPageLevels = []) {
  const parts = ["TOC", "\\h", '\\f "A"'];
  if (styleLevels.length) parts.push(`\\t "${styleLevels.map(({ id, level }) => `${id},${level}`).join(",")}"`);
  if (noPageLevels.length) {
    const ordered = [...new Set(noPageLevels)].sort((a, b) => a - b);
    if (ordered.some((level, index) => index && level !== ordered[index - 1] + 1)) throw new Error("This thesis TOC needs non-contiguous Word page-number exclusions, which the field format cannot represent safely.");
    parts.push(`\\n "${ordered[0]}-${ordered[ordered.length - 1]}"`);
  }
  return parts.join(" ");
}
function tocSpecialField(entry) {
  const title = String(entry.title || "").replace(/"/g, '\\"');
  const level = Number.isFinite(entry.wordTocLevel) ? entry.wordTocLevel : entry.level || 1;
  const noPage = entry.includePageNumber === false ? " \\n" : "";
  // Complex field runs (begin / instrText / end). A w:fldSimple TC made Word scramble section order and drop page numbers.
  const xml = `<w:p><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> ${fieldXmlText(`TC "${title}" \\f A \\l ${level}${noPage}`)} </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>`;
  const wrapper = ImportedXmlComponent.fromXmlString(xml);
  const holder = wrapper.root.find((child) => child instanceof ImportedXmlComponent) || wrapper;
  return holder.root.filter((child) => child instanceof ImportedXmlComponent);
}

/** Empty paragraph exactly `heightMm` tall (Word has no bare vertical box). */
function spacerParagraph(heightMm) {
  return new Paragraph({ spacing: { before: 0, after: 0, line: Math.max(1, twip(heightMm)), lineRule: LineRuleType.EXACT }, children: [new TextRun({ text: "", size: 2 })] });
}

function imageBytes(src) {
  const match = String(src || "").match(/^data:image\/(png|jpe?g);base64,(.+)$/i);
  if (!match) return null;
  const binary = typeof atob === "function" ? atob(match[2]) : Buffer.from(match[2], "base64").toString("binary");
  return { type: /png/i.test(match[1]) ? "png" : "jpg", data: Uint8Array.from(binary, (char) => char.charCodeAt(0)) };
}

/**
 * Special page render tree (specialPages.js) → closest Word structures: text →
 * paragraph, spacer → exact-height paragraph, separator → bordered paragraph,
 * column group → stacked blocks, row group → borderless fixed table.
 */
function specialPageDocx(nodes, context, widthMm) {
  const out = [];
  const gap = (heightMm) => { if (heightMm > 0) out.push(spacerParagraph(heightMm)); };
  for (const node of nodes || []) {
    if (node.type === "image") {
      gap(node.marginTopMm);
      const image = imageBytes(node.source);
      out.push(new Paragraph({ alignment: alignDocx(node.align), ...(node.leftIndentMm || node.rightIndentMm ? { indent: { left: twip(node.leftIndentMm || 0), right: twip(node.rightIndentMm || 0) } } : {}), spacing: { before: 0, after: 0, line: twip(node.heightMm), lineRule: LineRuleType.AT_LEAST }, children: [new ImageRun({ ...image, transformation: { width: node.widthMm * PX_PER_MM, height: node.heightMm * PX_PER_MM } })] }));
      gap(node.marginBottomMm);
    } else if (node.type === "text") {
      out.push(docxParagraph(node.runs ? node.runs.map((run) => ({ type: "text", text: run.text, bold: run.bold })) : plainRuns(node.text), node.style, context));
    } else if (node.type === "spacer") {
      gap(node.marginTopMm); gap(node.heightMm); gap(node.marginBottomMm);
    } else if (node.type === "separator") {
      const free = Math.max(0, widthMm - widthMm * Math.min(100, node.lengthPercent) / 100);
      const indent = node.align === "left" ? { left: 0, right: twip(free) } : node.align === "right" ? { left: twip(free), right: 0 } : { left: twip(free / 2), right: twip(free / 2) };
      out.push(new Paragraph({
        spacing: { before: twip(node.marginTopMm), after: twip(node.marginBottomMm), line: 20, lineRule: LineRuleType.EXACT }, indent,
        border: { bottom: { style: BorderStyle.SINGLE, size: Math.max(2, Math.round(node.thicknessPt * 8)), color: "000000", space: 0 } },
        children: [new TextRun({ text: "", size: 2 })],
      }));
    } else if (node.direction === "row" && node.blocks.length && node.blocks.every((child) => child.type === "group" && child.border?.collapse)) {
      // Opt-in table row (border.collapse): one real Word row whose cells own the rules, so neighbours share a single border;
      // minHeightMm is the row's "at least" height and verticalAlign the cell alignment.
      gap(node.marginTopMm);
      const widths = specialPageRowWidths(node, widthMm);
      const edge = (child) => ({ style: BorderStyle.SINGLE, size: Math.max(2, Math.round(child.border.outerPt * 8)), color: child.border.color.slice(1).toUpperCase() });
      const cells = node.blocks.map((child, index) => {
        const side = edge(child);
        const padX = child.border.paddingXMm ?? child.border.paddingMm;
        const padY = child.border.paddingYMm ?? child.border.paddingMm;
        const inner = { ...child, border: undefined, marginTopMm: 0, marginBottomMm: 0 };
        return new TableCell({
          width: { size: twip(widths[index]), type: WidthType.DXA },
          margins: { top: twip(padY), bottom: twip(padY), left: twip(padX), right: twip(padX) },
          borders: { top: side, bottom: side, left: side, right: side },
          ...(child.verticalAlign ? { verticalAlign: { top: VerticalAlign.TOP, center: VerticalAlign.CENTER, bottom: VerticalAlign.BOTTOM }[child.verticalAlign] } : {}),
          children: specialPageDocx([inner], context, widths[index] - 2 * padX),
        });
      });
      out.push(new Table({
        width: { size: twip(widthMm), type: WidthType.DXA }, layout: TableLayoutType.FIXED, columnWidths: widths.map((value) => twip(value)),
        rows: [new TableRow({ cantSplit: true, ...(node.minHeightMm ? { height: { value: twip(node.minHeightMm), rule: HeightRule.ATLEAST } } : {}), children: cells })],
      }));
      gap(node.marginBottomMm);
    } else if (node.direction === "row") {
      gap(node.marginTopMm);
      // Same widths as the editor's flex row; each gap is the right margin of the cell before it.
      const widths = specialPageRowWidths(node, widthMm);
      const cellWidths = widths.map((value, index) => value + (index < widths.length - 1 ? node.gapMm : 0));
      const cells = node.blocks.map((child, index) => {
        const children = specialPageDocx([child], context, widths[index]);
        return new TableCell({
          width: { size: twip(cellWidths[index]), type: WidthType.DXA },
          margins: { top: 0, bottom: 0, left: 0, right: index < node.blocks.length - 1 ? twip(node.gapMm) : 0 },
          borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
          children: children.length ? children : [spacerParagraph(0.1)],
        });
      });
      if (cells.length) {
        out.push(new Table({
          width: { size: twip(widthMm), type: WidthType.DXA }, layout: TableLayoutType.FIXED, columnWidths: cellWidths.map((value) => twip(value)),
          borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
          rows: [new TableRow({ cantSplit: true, children: cells })],
        }));
      }
      gap(node.marginBottomMm);
    } else if (node.border) {
      // A framed group is a one-cell table with the frame as its borders and the padding as cell margins.
      gap(node.marginTopMm);
      const { outerPt, innerPt, gapPt, paddingMm, color, docx } = node.border;
      // docx.style names the Word border; docx.sides { top, right, bottom, left } may name another style per side (thickThin / thinThick).
      const edgeOf = (side) => ({ style: BorderStyle[(docx?.sides?.[side] || docx?.style || (innerPt > 0 ? "double" : "single")).replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase()] || BorderStyle.SINGLE, size: Math.round((docx?.sizePt ?? outerPt + gapPt + innerPt) * 8), color: color.slice(1).toUpperCase() });
      const inner = { ...node, border: undefined, marginTopMm: 0, marginBottomMm: 0 };
      const cellWidth = widthMm;
      out.push(new Table({
        width: { size: twip(cellWidth), type: WidthType.DXA }, layout: TableLayoutType.FIXED, columnWidths: [twip(cellWidth)],
        borders: { top: edgeOf("top"), bottom: edgeOf("bottom"), left: edgeOf("left"), right: edgeOf("right"), insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
        rows: [new TableRow({ cantSplit: true, children: [new TableCell({ width: { size: twip(cellWidth), type: WidthType.DXA }, margins: { top: twip(paddingMm), bottom: twip(paddingMm), left: twip(paddingMm), right: twip(paddingMm) }, children: specialPageDocx([inner], context, cellWidth - 2 * paddingMm) })] })],
      }));
      gap(node.marginBottomMm);
    } else {
      gap(node.marginTopMm);
      node.blocks.forEach((child, index) => { if (index) gap(node.gapMm); out.push(...specialPageDocx([child], context, widthMm)); });
      gap(node.marginBottomMm);
    }
  }
  return out;
}

/** Position a special page's content independently of its Word section margins. */
function positionedSpecialPageDocx(nodes, context, frame) {
  const width = twip(frame.widthMm);
  const content = specialPageDocx(nodes, context, frame.widthMm);
  return new Table({
    width: { size: width, type: WidthType.DXA },
    columnWidths: [width], layout: TableLayoutType.FIXED,
    float: {
      horizontalAnchor: TableAnchorType.PAGE, verticalAnchor: TableAnchorType.PAGE,
      absoluteHorizontalPosition: twip(frame.xMm), absoluteVerticalPosition: twip(frame.yMm),
      topFromText: 0, bottomFromText: 0, leftFromText: 0, rightFromText: 0,
    },
    borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
    rows: [new TableRow({ children: [new TableCell({
      width: { size: width, type: WidthType.DXA },
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
      children: content,
    })] })],
  });
}

function listParagraphs(block, section, context, level = 0, before = null) {
  const { body } = section.rules;
  const out = [];
  const toc = section.type === "tableOfContents" || /\bthesis-toc\b/.test(block.className || "");
  const bibliography = /\bthesis-bibliography\b/.test(block.className || "");
  // One numbering instance per list: it restarts where the editor restarts and
  // continues across page breaks because Word lays it out as one list.
  const instance = context.nextList++;
  for (const [position, item] of (block.items || []).entries()) {
    const runs = item.runs?.length ? item.runs : plainRuns(item.text);
    if (bibliography) {
      // Editor: unmarked entries indented by the template's hanging indent.
      const style = section.rules.bibliography.style;
      out.push(docxParagraph(runs, { ...style, firstLineIndentMm: 0, leftIndentMm: (style.leftIndentMm || 0) + (section.rules.bibliography.hangingIndentMm || 0) }, context));
    } else if (toc) {
      out.push(docxParagraph(runs, { ...body, align: "left", firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 4 }, context));
    } else {
      out.push(docxParagraph(runs, { ...body, firstLineIndentMm: 0, spaceBeforePt: position === 0 && before !== null ? before : 0, spaceAfterPt: 0 }, context, {
        numbering: { reference: block.ordered ? "thesis-ordered" : "thesis-bullet", level: Math.min(level, 2), instance },
      }));
    }
    for (const nested of item.lists || []) out.push(...listParagraphs(nested, section, context, level + 1));
  }
  return out;
}

function tableDocx(block, section, context, before = null) {
  const { body, tables } = section.rules;
  const cellStyle = tables.cellStyle || {};
  const out = [];
  const caption = block.caption ? captionParagraph(tables, block, context, { keepNext: tables.position === "above", keepLines: tables.position === "above", pageBreakBefore: tables.position === "above" && (context.blockPageBreaks.has(block.captionAnchor) || context.blockPageBreaks.has(block.id)) }, before) : null;
  if (caption && tables.position === "above") out.push(caption);
  const preset = tables.borders?.preset;
  const rule = { style: BorderStyle.SINGLE, size: Math.round((tables.borders?.widthPt || 0.5) * 8), color: "000000" };
  const sourceRows = (block.rows || []).filter((row) => row.length);
  // A caption below the table must stay with its last row (keep-with-next on the last row too).
  const captionBelow = Boolean(caption && tables.position !== "above");
  const lastHeader = sourceRows.reduce((last, row, index) => (row.every((cell) => cell.header) ? index : last), -1);
  const cp = tables.cellPadding;
  const cellMargins = cp && typeof cp === "object"
    ? { top: twip(cp.topMm), bottom: twip(cp.bottomMm), left: twip(cp.leftMm), right: twip(cp.rightMm) }
    : preset ? { top: 0, bottom: 0, left: twip(1.9), right: twip(1.9) } : { top: pt(ACADEMIC_TABLE_CELL_PADDING_PT.vertical), bottom: pt(ACADEMIC_TABLE_CELL_PADDING_PT.vertical), left: pt(ACADEMIC_TABLE_CELL_PADDING_PT.horizontal), right: pt(ACADEMIC_TABLE_CELL_PADDING_PT.horizontal) };
  // Authored column widths (percent) -> tblGrid + tcW in twips of the text width; only when every row spans exactly the grid (no rowspans).
  const gridCols = block.colWidths?.length || 0;
  const rowSpanCount = (row) => row.reduce((n, c) => n + (c.colspan > 1 ? c.colspan : 1), 0);
  const useWidths = gridCols > 0 && sourceRows.every((row) => rowSpanCount(row) === gridCols && row.every((c) => !(c.rowspan > 1)));
  const textWidthTw = twip(section.rules.page.widthMm - section.rules.page.margins.leftMm - section.rules.page.margins.rightMm);
  const colTw = useWidths ? (() => { const total = block.colWidths.reduce((a, b) => a + b, 0); return block.colWidths.map((w) => Math.round(textWidthTw * w / total)); })() : null;
  const makeRow = (row, rowIndex, keepRow = rowIndex < sourceRows.length - 1 || captionBelow) => new TableRow({
    cantSplit: true, tableHeader: row.every((cell) => cell.header),
    // Word's row height (atLeast) is the CONTENT height only: cell top/bottom margins and the border are added on top (measured in Word: trHeight
    // 26.55 pt + tcMar 2 x 6 pt + 0.75 pt border = 39.3 pt rows, CSS rows = line box + padding + border = 26.55 pt). Word would otherwise use its glyph
    // box as the minimum, so the minimum is the resolved line box; margins and border then add up exactly as the editor's do.
    height: { value: pt((cellStyle.fontSizePt || body.fontSizePt) * effectiveLineHeight(cellStyle.lineHeight || body.lineHeight, context.lineSpacing)), rule: HeightRule.ATLEAST },
    children: row.map((cell, cellIndex) => new TableCell({
      ...(colTw ? { width: { size: colTw.slice(row.slice(0, cellIndex).reduce((n, c) => n + (c.colspan > 1 ? c.colspan : 1), 0), row.slice(0, cellIndex + 1).reduce((n, c) => n + (c.colspan > 1 ? c.colspan : 1), 0)).reduce((a, b) => a + b, 0), type: WidthType.DXA } } : {}),
      columnSpan: cell.colspan > 1 ? cell.colspan : undefined, rowSpan: cell.rowspan > 1 ? cell.rowspan : undefined,
      // Three-rule tables: the rule below the header row belongs to its cells.
      ...(preset === "threeRule" && rowIndex === lastHeader ? { borders: { bottom: rule } } : {}),
      ...(preset === "headerRules" && row.every((c) => c.header) ? { borders: { bottom: rule } } : {}),
      margins: cellMargins,
      children: [docxParagraph(cell.runs?.length ? cell.runs : plainRuns(cell.text), { ...body, ...cellStyle, align: cell.align || cellStyle.align || "left", firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0, keepWithNext: keepRow, fontWeight: cell.header ? 700 : cellStyle.fontWeight ?? body.fontWeight }, context)],
    })),
  });
  // Three-rule table: top and bottom of the table, and below the (repeated) header row.
  const borders = preset === "headerRules" ? { top: NO_BORDER, bottom: rule, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER }
    : preset === "threeRule" ? { top: rule, bottom: rule, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER }
    : preset === "none" ? { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER }
    : { top: CELL_BORDER, bottom: CELL_BORDER, left: CELL_BORDER, right: CELL_BORDER, insideHorizontal: CELL_BORDER, insideVertical: CELL_BORDER };
  const tableOf = (rows) => new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE }, borders, ...(colTw ? { columnWidths: colTw } : {}) });
  // Continuation captions: the table is split at the rows the editor measured as page starts; each later
  // fragment gets its caption paragraph and the header row(s) again (Word cannot vary a repeated row's text).
  const headerRows = sourceRows.findIndex((row) => !row.every((cell) => cell.header));
  const headerCount = headerRows < 0 ? 0 : headerRows;
  const continuation = tables.continuation && tables.position === "above" ? context.tableContinuations?.[block.captionAnchor] : null;
  const starts = (continuation?.rows || []).filter((index) => index > headerCount && index < sourceRows.length);
  if (starts.length) {
    const bounds = [0, ...starts, sourceRows.length];
    bounds.slice(0, -1).forEach((from, fragment) => {
      // A continued table: Word's pages differ slightly from the editor's, and a keep-with-next chain over a whole page-tall fragment is
      // broken arbitrarily (it stranded the "(Devam)" caption at a page bottom). Keep only caption + header rows + first data row +
      // the last two rows together, so a caption can never be separated from its table.
      const end = bounds[fragment + 1];
      const keep = (index) => index < end - 1 && (index - from <= headerCount || index === end - 2);
      const rows = sourceRows.slice(from, end).map((row, i) => makeRow(row, from + i, keep(from + i)));
      if (fragment) {
        out.push(continuationParagraph(tables, block, context, continuation.hang));
        rows.unshift(...sourceRows.slice(0, headerCount).map((row, i) => makeRow(row, i, true)));
      }
      out.push(tableOf(rows));
    });
    return out;
  }
  const rows = sourceRows.map(makeRow);
  if (rows.length) out.push(tableOf(rows));
  if (caption && tables.position !== "above") out.push(caption);
  return out;
}

/** Caption paragraph: label run in the label style, then the caption text; optional hanging indent. */
function captionParagraph(rule, block, context, options = {}, before = null) {
  const style = { ...captionStyle(rule, block, context), ...(before === null ? {} : { spaceBeforePt: before }) };
  const hangMm = rule.hangingIndent === "label" ? (context.captionHangs?.[block.captionAnchor] || 0) / PX_PER_MM : rule.hangingIndent > 0 ? rule.hangingIndent : 0;
  const paragraphStyle = hangMm > 0 ? { ...style, hangingIndentMm: hangMm } : style;
  const label = block.captionLabel || `${rule.label} ${block.captionNumber}.`;
  // One run as before unless the label has its own typography (e.g. bold "Şekil 2.1").
  const children = rule.labelStyle ? [textRun(`${label} `, { ...style, ...rule.labelStyle }, context), ...docxRuns(plainRuns(block.caption), style, context)] : docxRuns(plainRuns(`${label} ${block.caption}`), style, context);
  return new Paragraph({ ...paragraphProps(paragraphStyle, options, context.lineSpacing), children: bookmarked(block.captionAnchor, children) });
}

/** Caption paragraph above a continuation fragment ("Çizelge 3.1 (Devam) Başlık"): label text in the label style. */
function continuationParagraph(rule, block, context, labelHangPx = 0) {
  const style = captionStyle(rule, block, context);
  const hangMm = rule.hangingIndent === "label" ? labelHangPx / PX_PER_MM : rule.hangingIndent > 0 ? rule.hangingIndent : 0;
  const children = continuationParts(rule, { number: block.captionNumber, title: block.caption }).flatMap((part) => rule.labelStyle && !part.title ? [textRun(part.text, { ...style, ...rule.labelStyle }, context)] : docxRuns(plainRuns(part.text), style, context));
  return new Paragraph({ ...paragraphProps(hangMm > 0 ? { ...style, hangingIndentMm: hangMm } : style, { keepNext: true }, context.lineSpacing), children });
}

function captionStyle(rule, block, context) {
  // For auto, use the editor's measured alignment when available; otherwise keep the template's style.
  return { ...rule.style, align: context.captionAlignments?.[block.captionAnchor] || (rule.captionAlignment === "auto" ? rule.style.align : rule.captionAlignment) || rule.style.align, spaceBeforePt: rule.spacingBeforePt ?? rule.style.spaceBeforePt, spaceAfterPt: rule.spacingAfterPt ?? rule.style.spaceAfterPt };
}

function docxChildren(section, context) {
  const { page, body, headings } = section.rules;
  const widthMm = page.widthMm - page.margins.leftMm - page.margins.rightMm;
  const children = [];
  if (section.generatedIndex) {
    const rule = section.generatedIndex;
    children.push(docxParagraph(plainRuns(rule.title), { ...headings[1], pageBreakBefore: false }, context, { anchor: section.indexSources?.find((entry) => entry.tocTitle)?.anchor }));
    if (rule.includePageNumbers && rule.pageHeading) children.push(docxParagraph(plainRuns(rule.pageHeading), { ...rule.style, ...rule.pageHeadingStyle, align: "right", firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0 }, context));
    const indexParagraphStart = children.length;
    let previousRow = null;
    for (const row of section.indexRows) {
      const levelStyle = { ...(indexRowStyle(rule, row) || {}) };
      // generatedIndex.unnumberedAfterNumberedSpaceBeforePt: extra space above an unnumbered title row that follows a numbered row.
      if (rule.unnumberedAfterNumberedSpaceBeforePt > 0 && row.unnumbered && previousRow && !previousRow.unnumbered) levelStyle.spaceBeforePt = (levelStyle.spaceBeforePt ?? rule.style?.spaceBeforePt ?? 0) + rule.unnumberedAfterNumberedSpaceBeforePt;
      previousRow = row;
      const hangMm = rule.hanging === "label" ? (context.indexHangs?.[row.anchor] || 0) / PX_PER_MM : rule.hanging > 0 ? rule.hanging : 0;
      const style = { ...rule.style, ...levelStyle, leftIndentMm: Number.isFinite(levelStyle.leftIndentMm) ? levelStyle.leftIndentMm : (row.level - 1 || 0) * rule.indentMm, ...(hangMm > 0 ? { hangingIndentMm: hangMm } : {}) };
      const bold = (rule.labelStyle?.fontWeight || 0) >= 600;
      // A number on its own line (ownLine headings) is a label paragraph + a title paragraph
      // with no space between them (the PDF/editor show them as one block); keepNext holds them together.
      const lineLabel = row.labelLine && row.label && row.rowTitle !== undefined;
      if (lineLabel) children.push(docxParagraph([{ type: "text", text: row.label, bold: bold || (levelStyle.fontWeight || 0) >= 600 }], { ...style, hangingIndentMm: undefined, spaceAfterPt: 0 }, context, { keepNext: true }));
      const runs = lineLabel ? plainRuns(row.rowTitle) : row.label && row.rowTitle !== undefined && rule.labelStyle ? [{ type: "text", text: `${row.label} `, bold }, ...plainRuns(row.rowTitle)] : plainRuns(row.text);
      const withPage = rule.includePageNumbers && levelStyle.includePageNumber !== false;
      if (withPage) runs.push({ type: "tab" }, row.anchor ? { type: "pageref", bookmark: bookmarkName(row.anchor), text: String(row.page ?? "") } : plainRuns(row.page)[0] || { type: "text", text: "" });
      children.push(docxParagraph(runs, lineLabel ? { ...style, spaceBeforePt: 0 } : style, context, withPage ? { tabStops: [{ type: TabStopType[rule.pageNumberAlignment.toUpperCase()], position: twip(rule.pageColumnWidthMm > 0 && rule.pageNumberAlignment === "center" ? widthMm - rule.pageColumnWidthMm / 2 : widthMm), leader: rule.leader === "dots" ? LeaderType.DOT : LeaderType.NONE }] } : {}));
    }
    if (rule.kind === "toc") {
      const rows = children.splice(indexParagraphStart);
      if (context.nativeTocField) children.push(...(rows.length ? wrapParagraphsInField(rows, context.nativeTocField.instruction) : [emptyComplexFieldParagraph(context.nativeTocField.instruction)]));
      else children.push(...rows);
    }
    return children;
  }
  // A special page listed in the TOC by its title (ÖZET, ABSTRACT, …): an empty one-twip paragraph carries the bookmark its PAGEREF points to.
  const titleEntry = section.layout ? section.indexSources?.find((entry) => entry.tocTitle && entry.sectionId === section.id) : null;
  const titleAnchor = titleEntry?.anchor;
  if (titleAnchor) {
    const row = context.tocRowsByAnchor?.get(titleAnchor);
    const tc = row ? [...tocSpecialField({ ...titleEntry, wordTocLevel: row.includePageNumber === false ? 9 : row.level, includePageNumber: row.includePageNumber })] : [];
    children.push(new Paragraph({ spacing: { before: 0, after: 0, line: 1, lineRule: LineRuleType.EXACT }, children: [new Bookmark({ id: bookmarkName(titleAnchor), children: [new TextRun({ text: "", size: 2 })] }), ...tc] }));
  }
  if (section.layout) {
    const split = splitLayoutNodes(section.layout);
    const frame = page.docxContentFrame;
    if (frame) children.push(positionedSpecialPageDocx(split.flow, context, frame));
    else children.push(...specialPageDocx(split.flow, context, widthMm));
    children.push(...positionedLayoutDocx(split.positioned, { language: context.language, lineSpacing: context.lineSpacing }));
  }
  let afterHeading = false;
  // lineSpacing.blockGap: the gap between two blocks comes from the block-gap table (blockGap.js), the same one the editor CSS uses;
  // Word adds previous space-after and next space-before, so the next block's space-before is gap - previous space-after.
  const useGap = blockGapActive(section.rules);
  const descriptors = useGap ? blockDescriptors(section.rules, section.type === "bibliography" ? section.rules.bibliography.style : body, "figure") : [];
  let previous = null;
  let pendingAfter = null;
  for (const block of asBlocks(section)) {
    const previousHeading = afterHeading;
    afterHeading = block.type === "heading";
    const descriptor = useGap ? describeBlock(descriptors, block) : null;
    const gap = descriptor && previous ? gapBetween(section.rules, previous, descriptor) : null;
    // Word renders the gap between paragraph A (space-after) and B (space-before) as max(after, before), never the sum (measured, compat 12/14/15).
    // So the whole intended gap goes on the next block's space-before (previous space-after stays: max(after, gap) = gap whenever gap >= after).
    const before = gap === null ? null : Math.max(0, gap);
    previous = descriptor;
    // paragraphSpacing "additive" (no block-gap table): the editor sums after(prev) + before(next) for paragraph/heading pairs; same rule, carried on space-before.
    const additiveAfter = pendingAfter;
    pendingAfter = null;
    const additive = before === null && additiveAfter !== null && section.rules.lineSpacing?.paragraphSpacing === "additive";
    const withGap = (style) => {
      if (before !== null) return { ...style, spaceBeforePt: before };
      if (additive && !style.pageBreakBefore) return { ...style, spaceBeforePt: (style.spaceBeforePt || 0) + additiveAfter };
      return style;
    };
    const chain = (style) => { pendingAfter = style.spaceAfterPt || 0; return style; };
    if (block.type === "heading") {
      const style = headings[block.level] || headings[1] || body;
      // A number on its own line stays in the heading paragraph, after a line break (same style, one block as in the editor).
      const runs = block.thesisNumber && block.thesisNumberLine ? [...plainRuns(block.thesisNumber), { type: "break" }, ...plainRuns(block.text)] : plainRuns(`${block.thesisNumber ? `${block.thesisNumber} ` : ""}${block.text}`);
      const indent = block.indentMm ? { leftIndentMm: (style.leftIndentMm || 0) + block.indentMm } : {};
      const indexedRow = context.tocRowsByAnchor?.get(block.thesisAnchor);
      const noPage = indexedRow?.includePageNumber === false;
      const isMappedHeading = Boolean(indexedRow && !indexedRow.tocTitle);
      const level = Number(block.level);
      const nativeMappedLevel = context.nativeTocLevels?.has(level);
      // Keep ordinary, non-indexed outline levels on their normal Word heading
      // styles. A distinct style is needed only when Word's live TOC maps this
      // source level and must exclude one particular source paragraph.
      const sourceStyleId = isMappedHeading || nativeMappedLevel
        ? thesisHeadingStyleId(level, isMappedHeading, noPage)
        : `Heading${level}`;
      if (sourceStyleId !== `Heading${level}`) {
        const headingStyleDefinition = { id: sourceStyleId, name: sourceStyleId, basedOn: `Heading${level}`, quickFormat: false, run: { font: style.fontFamily, size: halfPointSize(style.fontSizePt), bold: style.fontWeight >= 600, italics: Boolean(style.italic) }, paragraph: { outlineLevel: Math.max(0, level - 1) } };
        (context.thesisHeadingStyles ||= new Map()).set(sourceStyleId, headingStyleDefinition);
      }
      const headingBreaks = !(block.unnumbered || (previousHeading && style.pageBreakUnlessAfterHeading));
      let headStyle = headingBreaks ? { ...style, ...indent } : { ...style, ...indent, pageBreakBefore: false };
      // numbering.omitOnChapterStart: a page-breaking level-1 heading opens a Word section of its own (next page, number-free first page).
      if (Number(block.level) === 1 && page.numbering?.omitOnChapterStart) {
        if (children.length === 0) children.startsWithChapter = true;
        else if (headingBreaks && style.pageBreakBefore) { (children.chapterSplits ||= []).push(children.length); headStyle = { ...headStyle, pageBreakBefore: false }; }
      }
      const paragraph = docxParagraph(runs, chain(withGap(headStyle)), context, { style: sourceStyleId, anchor: block.thesisAnchor });
      if (indexedRow?.tocTitle) paragraph.root.push(...tocSpecialField({ ...indexedRow, title: indexedRow.rowTitle || indexedRow.title, wordTocLevel: indexedRow.wordTocLevel }));
      children.push(paragraph);
    } else if (block.type === "paragraph" || block.type === "quote") {
      const named = block.thesisStyle && section.rules.paragraphStyles?.[block.thesisStyle];
      const style = named ? { ...body, ...named } : section.type === "bibliography" ? section.rules.bibliography.style : previousHeading && body.firstAfterHeading ? { ...body, ...body.firstAfterHeading } : body;
      // Only an alignment the user chose (explicit left included) overrides the template. Lines
      // ended by Enter have no paragraph spacing in the editor; <p> paragraphs do.
      // Line-flow blocks (browser) report no alignment for "template"; the regex fallback says "left".
      const align = typeof block.line === "boolean" ? block.align : block.align !== "left" ? block.align : undefined;
      const spacing = block.line ? { spaceBeforePt: 0, spaceAfterPt: 0 } : {};
      children.push(docxParagraph(block.runs?.length ? block.runs : plainRuns(block.text), chain(withGap({ ...style, ...(block.indentMm ? { leftIndentMm: (style.leftIndentMm || 0) + block.indentMm } : {}), ...spacing, align: align || style.align })), context));
    } else if (block.type === "list") {
      children.push(...listParagraphs(block, section, context, 0, before));
    } else if (block.type === "table") {
      children.push(...tableDocx(block, section, context, before));
    } else if (block.type === "figure") {
      // A figure of a template caption kind ("Resim") uses that kind's rule.
      const figures = block.captionKind && section.rules.captionKinds?.[block.captionKind] || section.rules.figures;
      // Without a template block-gap table the figure keeps the editor's own figure margin around image and caption.
      const figureMargin = before === null ? ACADEMIC_FIGURE_MARGIN_PT : 0;
      const figureCaptionStyle = captionStyle(figures, block, context);
      const caption = block.caption ? captionParagraph({ ...figures, spacingBeforePt: undefined, spacingAfterPt: undefined, style: { ...figureCaptionStyle,
        ...(figures.position === "above" ? { spaceBeforePt: (figureCaptionStyle.spaceBeforePt || 0) + figureMargin } : { spaceAfterPt: (figureCaptionStyle.spaceAfterPt || 0) + figureMargin }) } }, block, context, { keepNext: figures.position === "above" }) : null;
      if (caption && figures.position === "above") children.push(caption);
      const image = imageBytes(block.src);
      if (image) {
        const width = Math.min(block.width || 400, Math.round(widthMm * PX_PER_MM));
        const height = Math.max(1, Math.round(width * ((block.height || 250) / (block.width || 400))));
        const spacing = before === null
          ? { before: caption && figures.position === "above" ? 0 : pt(ACADEMIC_FIGURE_MARGIN_PT), after: caption && figures.position !== "above" ? 0 : pt(ACADEMIC_FIGURE_MARGIN_PT) }
          : { before: pt(before) };
        children.push(new Paragraph({ alignment: alignDocx(figures.box?.align || "center"), pageBreakBefore: context.blockPageBreaks.has(block.captionAnchor) || context.blockPageBreaks.has(block.id), keepNext: Boolean(caption && figures.position !== "above"), spacing, children: [new ImageRun({ ...image, transformation: { width, height } })] }));
      }
      if (caption && figures.position !== "above") children.push(caption);
    } else if (block.type === "pageBreak") {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    } else if (block.type === "math" && section.rules.equations) {
      // Centered formula with the number flush right (or left) at the text edge: a centre and a right tab stop.
      const equations = section.rules.equations;
      const style = withGap({ ...body, ...equations.style, firstLineIndentMm: 0, align: "left" });
      const left = equations.numberAlign === "left";
      const formula = { type: "math", latex: block.latex, text: block.text };
      const runs = left ? [...(block.equationLabel ? plainRuns(block.equationLabel) : []), { type: "tab" }, formula]
        : [{ type: "tab" }, formula, ...(block.equationLabel ? [{ type: "tab" }, ...plainRuns(block.equationLabel)] : [])];
      children.push(docxParagraph(runs, style, context, { tabStops: [{ type: TabStopType.CENTER, position: twip(widthMm / 2) }, ...(left ? [] : [{ type: TabStopType.RIGHT, position: twip(widthMm) }])] }));
    } else if (block.type === "code" || block.type === "math") {
      children.push(docxParagraph(plainRuns(block.text || ""), { ...body, firstLineIndentMm: 0 }, context));
    }
  }
  return children.length ? children : [docxParagraph([], body, context)];
}

/**
 * Header/footer of one Word section, mirroring the editor's sheet chrome: text at
 * 10pt, the page number as a PAGE field at body size on its edge (nearest the paper
 * edge), and `firstPage: "omit"` hiding only the text on a group's first page. Every
 * section defines its own parts, so Word never carries a number into an unnumbered page.
 */
function chromeDocx(section, values, context, groupStart, omitNumberOnFirst = false) {
  const { page, body } = section.rules;
  const chromeStyle = { ...body, fontSizePt: 10, align: "left", firstLineIndentMm: 0, leftIndentMm: 0, rightIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0, lineHeight: 1.1, textTransform: "none", fontWeight: 400, italic: false };
  const number = page.numbering;
  const numberEdge = number.position === "top" ? "top" : "bottom";
  // Page numbers use the template's numbering style (e.g. 10 pt) when given, else the body type.
  const numberParagraph = () => {
    const style = resolvePageNumberStyle(body, number);
    if (Number.isFinite(number.baselineFromTopMm)) {
      const fontSizePt = number.style?.fontSizePt || body.fontSizePt;
      const xMm = Number.isFinite(number.xMm) ? number.xMm : page.margins.leftMm;
      const widthMm = Number.isFinite(number.widthMm) ? number.widthMm : page.widthMm - page.margins.leftMm - page.margins.rightMm;
      const baseline = wordBaselineProbe({ ...style, fontSizePt }, { mode: "word", baseline: "word", singleLineEm: 1 }, 1);
      if (!baseline) throw new Error("DOCX PAGE baseline measurement is unsupported for " + (style.fontFamily || "the configured font"));
      const baselineAscentMm = baseline.targetPt * mmPerPt;
      const heightMm = fontSizePt * 1.25 * mmPerPt;
      return positionedPageNumberDocx({ xMm, yMm: number.baselineFromTopMm - baselineAscentMm, widthMm, heightMm, fontFamily: style.fontFamily, fontSizePt, align: number.align }, context.language);
    }
    // centerOnPage: shift the centred text frame so its centre is the physical page centre (right indent = leftMargin - rightMargin).
    const pageShiftMm = number.centerOnPage && number.align === "center" ? page.margins.leftMm - page.margins.rightMm : 0;
    const shiftIndent = pageShiftMm > 0 ? { right: twip(pageShiftMm) } : pageShiftMm < 0 ? { left: twip(-pageShiftMm) } : null;
    return new Paragraph({ alignment: alignDocx(number.align), spacing: { before: 0, after: 0 }, ...(shiftIndent ? { indent: shiftIndent } : {}), children: [new TextRun({ ...runProps(style, context.language), children: [PageNumber.CURRENT] })] });
  };
  const part = (edge, text, withNumber = true) => {
    const children = [];
    if (withNumber && number.enabled && numberEdge === edge && edge === "top") children.push(numberParagraph());
    // Chrome text keeps the editor's fixed 1.1 line box in every template.
    if (text) children.push(docxParagraph(plainRuns(text), chromeStyle, { ...context, lineSpacing: null }));
    if (withNumber && number.enabled && numberEdge === edge && edge === "bottom") children.push(numberParagraph());
    return children.length ? children : [new Paragraph({ children: [] })];
  };
  const headerText = resolveChromeText(page.header?.content, values);
  const footerText = resolveChromeText(page.footer?.content, values);
  const headers = { default: new Header({ children: part("top", headerText) }) };
  const footers = { default: new Footer({ children: part("bottom", footerText) }) };
  const omitHeader = Boolean(groupStart && page.header?.firstPage === "omit" && headerText);
  const omitFooter = Boolean(groupStart && page.footer?.firstPage === "omit" && footerText);
  // numbering.omitOnChapterStart: the first page of the Word section (a chapter opening) is counted but prints no number.
  const omitNumber = Boolean(omitNumberOnFirst && number.enabled && number.omitOnChapterStart);
  if (omitHeader || omitFooter || omitNumber) {
    headers.first = new Header({ children: part("top", omitHeader ? "" : headerText, !omitNumber) });
    footers.first = new Footer({ children: part("bottom", omitFooter ? "" : footerText, !omitNumber) });
  }
  return { headers, footers, titlePage: omitHeader || omitFooter || omitNumber };
}

function headingStyle(style, language, level) {
  const run = runProps(style, language);
  return { run: { font: run.font, size: run.size, bold: run.bold, italics: run.italics }, paragraph: { outlineLevel: Number(level) - 1, spacing: { before: pt(style.spaceBeforePt), after: pt(style.spaceAfterPt) }, keepNext: Boolean(style.keepWithNext) } };
}

function listLevels(ordered) {
  return [0, 1, 2].map((level) => ({
    level, format: ordered ? LevelFormat.DECIMAL : LevelFormat.BULLET, text: ordered ? `%${level + 1}.` : ["•", "◦", "▪"][level], alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: pt(LIST_INDENT_PT * (level + 1)), hanging: pt(LIST_INDENT_PT * 0.75) } } },
  }));
}

/**
 * Word document from the compiled model. One Word section per thesis section: a
 * new page group starts with a next-page section break, sections sharing a page
 * flow use continuous breaks. Number format and restarts are Word section
 * properties (pgNumType), so cover → roman → arabic restarts are real Word numbering.
 */
export async function buildThesisDocx(model, { captionAlignments = {}, captionHangs = {}, indexHangs = {}, tableContinuations = {}, blockPageBreaks = [] } = {}) {
  const main = model.sections.find((section) => section.type === "mainContent") || model.sections[0];
  const base = main?.rules;
  const nativeToc = model.sections.find((section) => section.generatedIndex?.kind === "toc");
  const tocRowsByAnchor = new Map();
  const tocStyleLevels = [];
  const tocNoPageLevels = new Set();
  if (nativeToc) {
    const rule = nativeToc.generatedIndex;
    const sourceProfiles = (nativeToc.indexRows || []).filter((row) => row.kind === "toc" && !row.tocTitle).map((row) => ({
      row,
      includePageNumber: Boolean(rule.includePageNumbers) && indexRowStyle(rule, row)?.includePageNumber !== false,
    }));
    const noPageProfiles = [...new Map(sourceProfiles.filter((profile) => !profile.includePageNumber).map((profile) => [Number(profile.row.level || 1), profile])).values()];
    if (noPageProfiles.length > 3) throw new Error("This thesis TOC has more than three distinct no-page heading levels; Word's remaining TOC levels cannot represent them faithfully.");
    const outputLevelByProfile = new Map();
    for (const profile of sourceProfiles.filter((profile) => profile.includePageNumber)) {
      const sourceLevel = Number(profile.row.level || 1);
      outputLevelByProfile.set(`${sourceLevel}:page`, sourceLevel);
    }
    noPageProfiles.forEach((profile, index) => outputLevelByProfile.set(`${Number(profile.row.level || 1)}:noPage`, 9 - index));
    for (const row of nativeToc.indexRows || []) {
      if (!row.anchor) continue;
      const includePageNumber = Boolean(rule.includePageNumbers) && indexRowStyle(rule, row)?.includePageNumber !== false;
      const wordTocLevel = row.tocTitle ? (includePageNumber ? Number(row.level || 1) : 9) : outputLevelByProfile.get(`${Number(row.level || 1)}:${includePageNumber ? "page" : "noPage"}`) || Number(row.level || 1);
      tocRowsByAnchor.set(row.anchor, { ...row, includePageNumber, wordTocLevel });
      if (!row.tocTitle && row.kind === "toc") {
        const id = thesisHeadingStyleId(row.level || 1, true, !includePageNumber);
        if (!tocStyleLevels.some((entry) => entry.id === id && entry.level === wordTocLevel)) tocStyleLevels.push({ id, level: wordTocLevel });
      }
      if (!includePageNumber) tocNoPageLevels.add(wordTocLevel);
    }
    // Word users who add a normal built-in heading after export still get a live entry,
    // with the only page-number behavior established for that source heading level.
    const sourceLevels = [...new Set(sourceProfiles.map(({ row }) => Number(row.level || 1)))];
    for (const level of sourceLevels) {
      const profiles = new Set(sourceProfiles.filter(({ row }) => Number(row.level || 1) === level).map(({ includePageNumber }) => includePageNumber));
      if (profiles.size === 1) {
        const includePageNumber = profiles.has(true);
        const outputLevel = outputLevelByProfile.get(`${level}:${includePageNumber ? "page" : "noPage"}`) || level;
        tocStyleLevels.push({ id: `Heading ${level}`, level: outputLevel });
        if (!includePageNumber) tocNoPageLevels.add(outputLevel);
      }
    }
  }
  const context = {
    language: model.language || "tr", body: base?.body || {}, footnotes: {}, nextFootnote: 1, nextList: 1,
    captionAlignments, captionHangs, indexHangs, tableContinuations, blockPageBreaks: new Set(blockPageBreaks),
    tocRowsByAnchor,
    nativeTocField: nativeToc ? { instruction: indexFieldInstruction(nativeToc.generatedIndex, tocStyleLevels, [...tocNoPageLevels]) } : null,
    nativeTocLevels: new Set((nativeToc?.indexRows || []).filter((row) => row.kind === "toc" && !row.tocTitle).map((row) => Number(row.level || 1))),
    thesisHeadingStyles: new Map(),
    tocParagraphStyles: new Map(),
  };
  const pageStarts = new Set(groupThesisSections(model.sections).filter(thesisGroupHasPageContent).map((group) => group.id));
  const sections = model.sections.flatMap((section, index) => {
    const page = section.rules.page;
    const wordMargins = page.docxMargins || page.margins;
    const groupStart = pageStarts.has(section.id);
    context.body = section.rules.body;
    context.lineSpacing = section.rules.lineSpacing || null;
    context.footnoteStyle = section.rules.footnotes?.style || null;
    const content = docxChildren(section, context);
    const properties = (type, titlePage, continued = false) => ({
      type,
      titlePage,
      ...(section.verticalAlign === "bottom" ? { verticalAlign: VerticalAlign.BOTTOM } : {}),
      page: {
        size: { width: twip(page.widthMm), height: twip(page.heightMm), orientation: page.orientation === "landscape" ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT },
        margin: { top: twip(wordMargins.topMm), bottom: twip(wordMargins.bottomMm), left: twip(wordMargins.leftMm), right: twip(wordMargins.rightMm), header: twip(page.header?.distanceMm ?? ENGINE_DEFAULT_HEADER_DISTANCE_MM), footer: twip(page.footer?.distanceMm ?? ENGINE_DEFAULT_HEADER_DISTANCE_MM) },
        pageNumbers: { start: continued ? undefined : page.numbering.restart ? (page.numbering.startAt ?? 1) : undefined, formatType: pageFormat(page.numbering.format) },
      },
    });
    const firstChrome = chromeDocx(section, model.values, context, groupStart, groupStart && Boolean(content.startsWithChapter));
    // numbering.omitOnChapterStart: every later chapter opening is a Word section of its own (numbering continues, first page prints no number).
    const splits = content.chapterSplits || [];
    const bounds = [0, ...splits, content.length];
    const result = [{
      children: content.slice(0, bounds[1]),
      headers: firstChrome.headers, footers: firstChrome.footers,
      properties: properties(index === 0 ? undefined : groupStart ? SectionType.NEXT_PAGE : SectionType.CONTINUOUS, firstChrome.titlePage),
    }];
    for (let part = 1; part < bounds.length - 1; part += 1) {
      const chrome = chromeDocx(section, model.values, context, false, true);
      result.push({ children: content.slice(bounds[part], bounds[part + 1]), headers: chrome.headers, footers: chrome.footers, properties: properties(SectionType.NEXT_PAGE, chrome.titlePage, true) });
    }
    return result;
  });
  if (nativeToc) {
    const rule = nativeToc.generatedIndex;
    for (const row of nativeToc.indexRows || []) {
      const fieldRow = tocRowsByAnchor.get(row.anchor);
      if (!fieldRow) continue;
      const outputLevel = fieldRow.wordTocLevel;
      const levelStyle = indexRowStyle(rule, row) || {};
      const style = { ...rule.style, ...levelStyle, leftIndentMm: Number.isFinite(levelStyle.leftIndentMm) ? levelStyle.leftIndentMm : (row.level - 1 || 0) * rule.indentMm };
      const id = `TOC${outputLevel}`;
      if (!context.tocParagraphStyles.has(id)) {
        const widthMm = nativeToc.rules.page.widthMm - nativeToc.rules.page.margins.leftMm - nativeToc.rules.page.margins.rightMm;
        const tabPosition = rule.pageColumnWidthMm > 0 && rule.pageNumberAlignment === "center" ? widthMm - rule.pageColumnWidthMm / 2 : widthMm;
        const tabStops = fieldRow.includePageNumber ? [{ type: TabStopType[rule.pageNumberAlignment.toUpperCase()] || TabStopType.RIGHT, position: twip(tabPosition), leader: rule.leader === "dots" ? LeaderType.DOT : LeaderType.NONE }] : [];
        context.tocParagraphStyles.set(id, { id, name: `TOC ${outputLevel}`, basedOn: "Normal", quickFormat: false, run: runProps(style, context.language), paragraph: paragraphProps(style, { tabStops }, nativeToc.rules.lineSpacing) });
      }
    }
  }
  const styles = base ? {
    default: {
      document: { run: { font: base.body.fontFamily, size: halfPointSize(base.body.fontSizePt) } },
      ...Object.fromEntries(Object.keys(base.headings).filter((level) => Number(level) <= 6).map((level) => [`heading${level}`, headingStyle(base.headings[level], context.language, level)])),
    },
    ...((context.footnoteParagraphStyles?.size || context.thesisHeadingStyles.size || context.tocParagraphStyles.size) ? { paragraphStyles: [...(context.footnoteParagraphStyles?.values() || []), ...context.thesisHeadingStyles.values(), ...context.tocParagraphStyles.values()] } : {}),
  } : undefined;
  return Packer.toBlob(new Document({
    title: model.title || "Tez", creator: "TxtNote", features: { updateFields: true }, styles,
    numbering: { config: [{ reference: "thesis-ordered", levels: listLevels(true) }, { reference: "thesis-bullet", levels: listLevels(false) }] },
    footnotes: context.footnotes, sections,
  }));
}
