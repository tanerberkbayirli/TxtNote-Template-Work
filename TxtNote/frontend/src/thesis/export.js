import { jsPDF } from "jspdf";
import {
  AlignmentType, BorderStyle, Document, Footer, FootnoteReferenceRun, Header, HeadingLevel, ImageRun,
  LevelFormat, LineRuleType, NumberFormat, Packer, PageBreak, PageNumber, PageOrientation, Paragraph,
  SectionType, Table, TableCell, TableLayoutType, TableRow, TextRun, WidthType, TabStopType, LeaderType, Tab,
} from "docx";
import { parseAcademicHtml } from "../lib/academicDocument.js";
import { academicPdfFont, embedAcademicPdfFonts, pdfFontStyle } from "../lib/academicFonts.js";
import { effectiveLineHeight, extractThesisHeadings, formatNumber, groupThesisSections, resolveChromeText, transformThesisText } from "./engine.js";
import { PX_PER_MM, thesisGroupHasPageContent } from "./pageLayout.js";
import { specialPageRowWidths } from "./specialPages.js";
import { MM_PER_PT, mmToTwip, ptToTwip } from "./units.js";

const mmPerPt = MM_PER_PT;
const strip = (html) => String(html ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").trim();
const alignDocx = (value) => ({ center: AlignmentType.CENTER, right: AlignmentType.RIGHT, justify: AlignmentType.JUSTIFIED }[value] || AlignmentType.LEFT);
const blockText = (block) => {
  const runs = block.runs || [];
  return runs.map((run) => run.type === "break" ? "\n" : run.type === "link" ? (run.children || []).map((child) => child.text || "").join("") : run.text || "").join("") || block.text || "";
};
const pageFormat = (value) => ({ "roman-lower": NumberFormat.LOWER_ROMAN, "roman-upper": NumberFormat.UPPER_ROMAN, "alpha-lower": NumberFormat.LOWER_LETTER, "alpha-upper": NumberFormat.UPPER_LETTER }[value] || NumberFormat.DECIMAL);
const asBlocks = (section) => {
  if (section.layoutBlocks) return [];
  const outline = (section.indexSources || extractThesisHeadings(section.html, section.rules)).filter((entry) => !entry.kind || entry.kind === "toc");
  let headingIndex = 0;
  // Caption counters and heading labels are compiled once, across the document.
  const captions = (section.indexSources || []).filter((entry) => entry.kind === "figures" || entry.kind === "tables");
  let captionIndex = 0;
  return parseAcademicHtml(section.html, { lines: true }).map((block) => {
    if (block.type === "heading") { const entry = outline[headingIndex++]; return { ...block, unnumbered: Boolean(entry?.unnumbered), thesisNumber: entry?.label || "" }; }
    if ((block.type === "table" || block.type === "figure") && block.caption) { const entry = captions[captionIndex++]; return { ...block, captionNumber: entry?.number || "", captionAnchor: entry?.anchor, caption: entry?.title || block.caption }; }
    return block;
  });
};
const captionText = (label, block) => `${label} ${block.captionNumber}. ${block.caption}`;

function pdfFont(pdf, style) {
  if (/arial|helvetica/i.test(style.fontFamily)) pdf.setFont("helvetica", `${style.fontWeight >= 600 ? "bold" : ""}${style.italic ? "italic" : ""}` || "normal");
  else {
    const faceStyle = pdfFontStyle({ bold: style.fontWeight >= 600, italic: style.italic });
    pdf.setFont(academicPdfFont(pdf, faceStyle), faceStyle);
  }
  pdf.setFontSize(style.fontSizePt);
  pdf.setTextColor(17, 17, 17);
}

function pdfChrome(pdf, section, pageNumber, firstPage, values) {
  const { page, body } = section.rules;
  const contentWidth = page.widthMm - page.margins.leftMm - page.margins.rightMm;
  const header = page.header;
  const footer = page.footer;
  pdfFont(pdf, { ...body, fontSizePt: Math.min(10, body.fontSizePt) });
  if (header?.content && !(firstPage && header.firstPage === "omit")) pdf.text(resolveChromeText(header.content, values), page.margins.leftMm, header.distanceMm + header.heightMm / 2, { maxWidth: contentWidth });
  if (footer?.content && !(firstPage && footer.firstPage === "omit")) pdf.text(resolveChromeText(footer.content, values), page.margins.leftMm, page.heightMm - footer.distanceMm, { maxWidth: contentWidth });
  const rule = page.numbering;
  if (!rule.enabled) return;
  const label = formatNumber(pageNumber, rule.format);
  const x = rule.align === "left" ? page.margins.leftMm : rule.align === "right" ? page.widthMm - page.margins.rightMm : page.widthMm / 2;
  const y = rule.position === "top" ? Math.max(6, page.margins.topMm / 2) : page.heightMm - Math.max(6, page.margins.bottomMm / 2);
  pdf.text(label, x, y, { align: rule.align });
}

/** Searchable PDF. Pages, margins, type sizes and numbering come from the compiled model. */
export async function buildThesisPdf(model) {
  const first = model.sections[0]?.rules.page;
  const pdf = new jsPDF({ unit: "mm", format: [first?.widthMm || 210, first?.heightMm || 297], compress: true });
  pdf.setProperties({ title: model.title || "Tez", creator: "TxtNote" });
  await embedAcademicPdfFonts(pdf, { templateId: model.templateId, systemFonts: model.systemFonts || [] });
  let started = false;
  let logicalPage = 0;
  for (const group of groupThesisSections(model.sections)) {
    const { page } = group.rules;
    const numbering = page.numbering;
    if (numbering.restart) logicalPage = (numbering.startAt || 1) - 1;
    if (!thesisGroupHasPageContent(group)) continue;
    let sectionPage = 0;
    let y = page.margins.topMm;
    const width = page.widthMm - page.margins.leftMm - page.margins.rightMm;
    const startPage = () => {
      if (started) pdf.addPage([page.widthMm, page.heightMm], page.orientation);
      started = true; sectionPage += 1; logicalPage += 1;
      y = page.margins.topMm;
      pdfChrome(pdf, group.sections[0], logicalPage, sectionPage === 1, model.values);
    };
    startPage();
    const write = (value, style, align = style.align || "left") => {
      if (style.pageBreakBefore && y > page.margins.topMm + 0.5) startPage();
      const source = transformThesisText(value, style, model.language);
      if (!source.trim()) { y += style.fontSizePt * effectiveLineHeight(style.lineHeight, group.rules.lineSpacing) * mmPerPt; return; }
      pdfFont(pdf, style);
      const indent = Math.max(0, style.leftIndentMm || 0);
      const available = Math.max(10, width - indent - Math.max(0, style.rightIndentMm || 0));
      const lineHeight = style.fontSizePt * effectiveLineHeight(style.lineHeight, group.rules.lineSpacing) * mmPerPt;
      y += (style.spaceBeforePt || 0) * mmPerPt;
      for (const paragraph of source.split("\n")) {
        const lines = pdf.splitTextToSize(paragraph || " ", available);
        for (const line of lines) {
          if (y + lineHeight > page.heightMm - page.margins.bottomMm) { startPage(); pdfFont(pdf, style); }
          const x = page.margins.leftMm + indent + (align === "center" ? available / 2 : align === "right" ? available : 0);
          pdf.text(line || " ", x, y, { align: align === "justify" ? "left" : align, baseline: "top" });
          y += lineHeight;
        }
      }
      y += (style.spaceAfterPt || 0) * mmPerPt;
    };
    for (const section of group.sections) {
    const { body, headings } = section.rules;
    if (section.layoutBlocks) for (const block of section.layoutBlocks) {
      if (block.type === "spacer") y += block.heightMm;
      else if (block.type === "image") {
        const x = page.margins.leftMm + (block.align === "left" ? 0 : block.align === "right" ? width - block.widthMm : (width - block.widthMm) / 2);
        pdf.addImage(block.source, /png/i.test(block.source.slice(0, 20)) ? "PNG" : "JPEG", x, y, block.widthMm, block.heightMm);
        y += block.heightMm;
      }
      else write(block.text, block.style, block.style.align);
    }
    for (const block of asBlocks(section)) {
      if (block.type === "heading") {
        const style = headings[block.level] || headings[1] || body;
        write(`${block.thesisNumber ? `${block.thesisNumber} ` : ""}${block.text}`, block.unnumbered ? { ...style, pageBreakBefore: false } : style);
      } else if (block.type === "paragraph" || block.type === "quote") {
        write(blockText(block), section.type === "bibliography" ? section.rules.bibliography.style : body, block.align || body.align);
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

function runProps(style, language) {
  return { font: style.fontFamily, size: Math.round(style.fontSizePt * 2), bold: style.fontWeight >= 600, italics: Boolean(style.italic), ...(style.characterSpacingPt ? { characterSpacing: pt(style.characterSpacingPt) } : {}), language: { value: language } };
}

function textRun(text, style, context, inline = {}) {
  return new TextRun({
    ...runProps(style, context.language), text: transformThesisText(text, style, context.language),
    ...(inline.bold ? { bold: true } : {}), ...(inline.italic ? { italics: true } : {}),
    underline: inline.underline || style.decoration === "underline" ? {} : undefined, strike: Boolean(inline.strike),
  });
}

/** Inline runs of the parsed block model: bold/italic/underline/strike, breaks, links and real footnotes. */
function docxRuns(runs, style, context) {
  const out = [];
  for (const item of runs || []) {
    if (item.type === "break") out.push(new TextRun({ break: 1 }));
    else if (item.type === "tab") out.push(new TextRun({ children: [new Tab()] }));
    else if (item.type === "link") out.push(...docxRuns(item.children, style, context));
    else if (item.type === "footnote") {
      const id = context.nextFootnote++;
      // Word places the note on its page; typography comes from the same template rule as the editor's note area.
      const rule = context.footnoteStyle;
      const noteStyle = rule ? { ...rule, decoration: "none", textTransform: "none" } : { ...context.body, fontSizePt: FOOTNOTE_PT, align: "left", firstLineIndentMm: 0, textTransform: "none" };
      const props = rule ? paragraphProps(noteStyle, { keepNext: false, pageBreakBefore: false }, context.lineSpacing) : {};
      context.footnotes[id] = { children: [new Paragraph({ ...props, children: [textRun(item.text || "", noteStyle, context)] })] };
      out.push(new FootnoteReferenceRun(id));
    } else {
      const text = item.text || item.latex || "";
      if (text) out.push(textRun(text, style, context, item));
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
  return {
    alignment: alignDocx(style.align),
    spacing: { before: pt(style.spaceBeforePt), after: pt(style.spaceAfterPt), ...lineSpacingDocx(style, lineSpacing) },
    indent: { firstLine: twip(style.firstLineIndentMm || 0), left: twip(style.leftIndentMm || 0), right: twip(style.rightIndentMm || 0) },
    keepNext: Boolean(style.keepWithNext), pageBreakBefore: Boolean(style.pageBreakBefore),
    ...options,
  };
}

function docxParagraph(runs, style, context, options = {}) {
  const children = docxRuns(runs, style, context);
  return new Paragraph({ ...paragraphProps(style, options, context.lineSpacing), children: children.length ? children : [textRun("", style, context)] });
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
      out.push(new Paragraph({ alignment: alignDocx(node.align), spacing: { before: 0, after: 0, line: twip(node.heightMm), lineRule: LineRuleType.AT_LEAST }, children: [new ImageRun({ ...image, transformation: { width: node.widthMm * PX_PER_MM, height: node.heightMm * PX_PER_MM } })] }));
      gap(node.marginBottomMm);
    } else if (node.type === "text") {
      out.push(docxParagraph(plainRuns(node.text), node.style, context));
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
    } else {
      gap(node.marginTopMm);
      node.blocks.forEach((child, index) => { if (index) gap(node.gapMm); out.push(...specialPageDocx([child], context, widthMm)); });
      gap(node.marginBottomMm);
    }
  }
  return out;
}

function listParagraphs(block, section, context, level = 0) {
  const { body } = section.rules;
  const out = [];
  const toc = section.type === "tableOfContents" || /\bthesis-toc\b/.test(block.className || "");
  const bibliography = /\bthesis-bibliography\b/.test(block.className || "");
  // One numbering instance per list: it restarts where the editor restarts and
  // continues across page breaks because Word lays it out as one list.
  const instance = context.nextList++;
  for (const item of block.items || []) {
    const runs = item.runs?.length ? item.runs : plainRuns(item.text);
    if (bibliography) {
      // Editor: unmarked entries indented by the template's hanging indent.
      const style = section.rules.bibliography.style;
      out.push(docxParagraph(runs, { ...style, firstLineIndentMm: 0, leftIndentMm: (style.leftIndentMm || 0) + (section.rules.bibliography.hangingIndentMm || 0) }, context));
    } else if (toc) {
      out.push(docxParagraph(runs, { ...body, align: "left", firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 4 }, context));
    } else {
      out.push(docxParagraph(runs, { ...body, firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0 }, context, {
        numbering: { reference: block.ordered ? "thesis-ordered" : "thesis-bullet", level: Math.min(level, 2), instance },
      }));
    }
    for (const nested of item.lists || []) out.push(...listParagraphs(nested, section, context, level + 1));
  }
  return out;
}

function tableDocx(block, section, context) {
  const { body, tables } = section.rules;
  const cellStyle = tables.cellStyle || {};
  const out = [];
  const caption = block.caption ? docxParagraph(plainRuns(captionText(tables.label, block)), { ...captionStyle(tables, block, context), keepWithNext: tables.position === "above" }, context) : null;
  if (caption && tables.position === "above") out.push(caption);
  const rows = (block.rows || []).filter((row) => row.length).map((row) => new TableRow({
    cantSplit: true, tableHeader: row.every((cell) => cell.header),
    children: row.map((cell) => new TableCell({
      columnSpan: cell.colspan > 1 ? cell.colspan : undefined, rowSpan: cell.rowspan > 1 ? cell.rowspan : undefined,
      margins: { top: pt(4), bottom: pt(4), left: pt(4), right: pt(4) },
      children: [docxParagraph(cell.runs?.length ? cell.runs : plainRuns(cell.text), { ...body, ...cellStyle, align: cell.align || cellStyle.align || "left", firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0, fontWeight: cell.header ? 700 : cellStyle.fontWeight ?? body.fontWeight }, context)],
    })),
  }));
  if (rows.length) out.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: CELL_BORDER, bottom: CELL_BORDER, left: CELL_BORDER, right: CELL_BORDER, insideHorizontal: CELL_BORDER, insideVertical: CELL_BORDER } }));
  if (caption && tables.position !== "above") out.push(caption);
  return out;
}

function captionStyle(rule, block, context) {
  // For auto, use the editor's measured alignment when available; otherwise keep the template's style.
  return { ...rule.style, align: context.captionAlignments?.[block.captionAnchor] || (rule.captionAlignment === "auto" ? rule.style.align : rule.captionAlignment) || rule.style.align, spaceBeforePt: rule.spacingBeforePt ?? rule.style.spaceBeforePt, spaceAfterPt: rule.spacingAfterPt ?? rule.style.spaceAfterPt };
}

function docxChildren(section, context) {
  const { page, body, headings, figures } = section.rules;
  const widthMm = page.widthMm - page.margins.leftMm - page.margins.rightMm;
  const children = [];
  if (section.generatedIndex) {
    const rule = section.generatedIndex;
    children.push(docxParagraph(plainRuns(rule.title), { ...headings[1], pageBreakBefore: false }, context));
    if (rule.includePageNumbers && rule.pageHeading) children.push(docxParagraph(plainRuns(rule.pageHeading), { ...rule.style, ...rule.pageHeadingStyle, align: "right", firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0 }, context));
    for (const row of section.indexRows) {
      const style = { ...rule.style, leftIndentMm: (row.level - 1 || 0) * rule.indentMm };
      const runs = plainRuns(row.text);
      if (rule.includePageNumbers) runs.push({ type: "tab" }, ...plainRuns(row.page));
      children.push(docxParagraph(runs, style, context, { tabStops: [{ type: TabStopType[rule.pageNumberAlignment.toUpperCase()], position: twip(widthMm), leader: rule.leader === "dots" ? LeaderType.DOT : LeaderType.NONE }] }));
    }
    return children;
  }
  if (section.layout) children.push(...specialPageDocx(section.layout, context, widthMm));
  for (const block of asBlocks(section)) {
    if (block.type === "heading") {
      const style = headings[block.level] || headings[1] || body;
      const text = `${block.thesisNumber ? `${block.thesisNumber} ` : ""}${block.text}`;
      const level = HeadingLevel[`HEADING_${block.level}`] || HeadingLevel.HEADING_1;
      children.push(docxParagraph(plainRuns(text), block.unnumbered ? { ...style, pageBreakBefore: false } : style, context, { heading: level }));
    } else if (block.type === "paragraph" || block.type === "quote") {
      const style = section.type === "bibliography" ? section.rules.bibliography.style : body;
      // Only an alignment the user chose (explicit left included) overrides the template. Lines
      // ended by Enter have no paragraph spacing in the editor; <p> paragraphs do.
      // Line-flow blocks (browser) report no alignment for "template"; the regex fallback says "left".
      const align = typeof block.line === "boolean" ? block.align : block.align !== "left" ? block.align : undefined;
      const spacing = block.line ? { spaceBeforePt: 0, spaceAfterPt: 0 } : {};
      children.push(docxParagraph(block.runs?.length ? block.runs : plainRuns(block.text), { ...style, ...spacing, align: align || style.align }, context));
    } else if (block.type === "list") {
      children.push(...listParagraphs(block, section, context));
    } else if (block.type === "table") {
      children.push(...tableDocx(block, section, context));
    } else if (block.type === "figure") {
      const caption = block.caption ? docxParagraph(plainRuns(captionText(figures.label, block)), { ...captionStyle(figures, block, context), keepWithNext: figures.position === "above" }, context) : null;
      if (caption && figures.position === "above") children.push(caption);
      const image = imageBytes(block.src);
      if (image) {
        const width = Math.min(block.width || 400, Math.round(widthMm * PX_PER_MM));
        const height = Math.max(1, Math.round(width * ((block.height || 250) / (block.width || 400))));
        children.push(new Paragraph({ alignment: AlignmentType.CENTER, keepNext: Boolean(caption && figures.position !== "above"), children: [new ImageRun({ ...image, transformation: { width, height } })] }));
      }
      if (caption && figures.position !== "above") children.push(caption);
    } else if (block.type === "pageBreak") {
      children.push(new Paragraph({ children: [new PageBreak()] }));
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
function chromeDocx(section, values, context, groupStart) {
  const { page, body } = section.rules;
  const chromeStyle = { ...body, fontSizePt: 10, align: "left", firstLineIndentMm: 0, leftIndentMm: 0, rightIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0, lineHeight: 1.1, textTransform: "none", fontWeight: 400, italic: false };
  const number = page.numbering;
  const numberEdge = number.position === "top" ? "top" : "bottom";
  const numberParagraph = () => new Paragraph({ alignment: alignDocx(number.align), children: [new TextRun({ ...runProps({ ...body, fontWeight: 400, italic: false }, context.language), children: [PageNumber.CURRENT] })] });
  const part = (edge, text) => {
    const children = [];
    if (number.enabled && numberEdge === edge && edge === "top") children.push(numberParagraph());
    // Chrome text keeps the editor's fixed 1.1 line box in every template.
    if (text) children.push(docxParagraph(plainRuns(text), chromeStyle, { ...context, lineSpacing: null }));
    if (number.enabled && numberEdge === edge && edge === "bottom") children.push(numberParagraph());
    return children.length ? children : [new Paragraph({ children: [] })];
  };
  const headerText = resolveChromeText(page.header?.content, values);
  const footerText = resolveChromeText(page.footer?.content, values);
  const headers = { default: new Header({ children: part("top", headerText) }) };
  const footers = { default: new Footer({ children: part("bottom", footerText) }) };
  const omitHeader = Boolean(groupStart && page.header?.firstPage === "omit" && headerText);
  const omitFooter = Boolean(groupStart && page.footer?.firstPage === "omit" && footerText);
  if (omitHeader || omitFooter) {
    headers.first = new Header({ children: part("top", omitHeader ? "" : headerText) });
    footers.first = new Footer({ children: part("bottom", omitFooter ? "" : footerText) });
  }
  return { headers, footers, titlePage: omitHeader || omitFooter };
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
export async function buildThesisDocx(model, { captionAlignments = {} } = {}) {
  const main = model.sections.find((section) => section.type === "mainContent") || model.sections[0];
  const base = main?.rules;
  const context = { language: model.language || "tr", body: base?.body || {}, footnotes: {}, nextFootnote: 1, nextList: 1, captionAlignments };
  const pageStarts = new Set(groupThesisSections(model.sections).filter(thesisGroupHasPageContent).map((group) => group.id));
  const sections = model.sections.map((section, index) => {
    const page = section.rules.page;
    const groupStart = pageStarts.has(section.id);
    const chrome = chromeDocx(section, model.values, context, groupStart);
    context.body = section.rules.body;
    context.lineSpacing = section.rules.lineSpacing || null;
    context.footnoteStyle = section.rules.footnotes?.style || null;
    return {
      children: docxChildren(section, context),
      headers: chrome.headers, footers: chrome.footers,
      properties: {
        type: index === 0 ? undefined : groupStart ? SectionType.NEXT_PAGE : SectionType.CONTINUOUS,
        titlePage: chrome.titlePage,
        page: {
          size: { width: twip(page.widthMm), height: twip(page.heightMm), orientation: page.orientation === "landscape" ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT },
          margin: { top: twip(page.margins.topMm), bottom: twip(page.margins.bottomMm), left: twip(page.margins.leftMm), right: twip(page.margins.rightMm), header: twip(page.header?.distanceMm || 10), footer: twip(page.footer?.distanceMm || 10) },
          pageNumbers: { start: page.numbering.restart ? (page.numbering.startAt || 1) : undefined, formatType: pageFormat(page.numbering.format) },
        },
      },
    };
  });
  const styles = base ? {
    default: {
      document: { run: { font: base.body.fontFamily, size: Math.round(base.body.fontSizePt * 2) } },
      ...Object.fromEntries(Object.keys(base.headings).filter((level) => Number(level) <= 6).map((level) => [`heading${level}`, headingStyle(base.headings[level], context.language, level)])),
    },
  } : undefined;
  return Packer.toBlob(new Document({
    title: model.title || "Tez", creator: "TxtNote", features: { updateFields: true }, styles,
    numbering: { config: [{ reference: "thesis-ordered", levels: listLevels(true) }, { reference: "thesis-bullet", levels: listLevels(false) }] },
    footnotes: context.footnotes, sections,
  }));
}
