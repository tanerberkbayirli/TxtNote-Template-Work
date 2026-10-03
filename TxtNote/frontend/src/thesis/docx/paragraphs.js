import { AlignmentType, Bookmark, ExternalHyperlink, FootnoteReferenceRun, LevelFormat, LineRuleType, Paragraph, SimpleField, TextRun, TabStopType, Tab } from "docx";
import { mathFromLatex } from "../../lib/mathOmml.js";
import { indentMm, transformThesisText } from "../engine.js";
import { PX_PER_MM } from "../pageLayout.js";
import { continuationParts } from "../tableContinuation.js";
import { alignDocx, halfPointSize, plainRuns, pt, twip } from "./xml.js";

// Legacy footnote size, used only when a model carries no resolved footnote rule.
const FOOTNOTE_PT = 9;
const LIST_INDENT_PT = 24;
export function runProps(style, language) {
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
export function paragraphProps(style, options = {}, lineSpacing = null) {
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
export function docxParagraph(runs, style, context, { anchor, ...options } = {}) {
  const children = docxRuns(runs, style, context);
  return new Paragraph({ ...paragraphProps(style, options, context.lineSpacing), children: bookmarked(anchor, children.length ? children : [textRun("", style, context)]) });
}
export const thesisHeadingStyleId = (level, included, noPage = false) => `ThesisHeading${level}${included ? (noPage ? "NoPage" : "Index") : "Excluded"}`;
/** Empty paragraph exactly `heightMm` tall (Word has no bare vertical box). */
export function spacerParagraph(heightMm) {
  return new Paragraph({ spacing: { before: 0, after: 0, line: Math.max(1, twip(heightMm)), lineRule: LineRuleType.EXACT }, children: [new TextRun({ text: "", size: 2 })] });
}
export function listParagraphs(block, section, context, level = 0, before = null) {
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
/** Caption paragraph: label run in the label style, then the caption text; optional hanging indent. */
export function captionParagraph(rule, block, context, options = {}, before = null) {
  const style = { ...captionStyle(rule, block, context), ...(before === null ? {} : { spaceBeforePt: before }) };
  const hangMm = rule.hangingIndent === "label" ? (context.captionHangs?.[block.captionAnchor] || 0) / PX_PER_MM : rule.hangingIndent > 0 ? rule.hangingIndent : 0;
  const paragraphStyle = hangMm > 0 ? { ...style, hangingIndentMm: hangMm } : style;
  const label = block.captionLabel || `${rule.label} ${block.captionNumber}.`;
  // One run as before unless the label has its own typography (e.g. bold "Şekil 2.1").
  const children = rule.labelStyle ? [textRun(`${label} `, { ...style, ...rule.labelStyle }, context), ...docxRuns(plainRuns(block.caption), style, context)] : docxRuns(plainRuns(`${label} ${block.caption}`), style, context);
  return new Paragraph({ ...paragraphProps(paragraphStyle, options, context.lineSpacing), children: bookmarked(block.captionAnchor, children) });
}
/** Caption paragraph above a continuation fragment ("Çizelge 3.1 (Devam) Başlık"): label text in the label style. */
export function continuationParagraph(rule, block, context, labelHangPx = 0) {
  const style = captionStyle(rule, block, context);
  const hangMm = rule.hangingIndent === "label" ? labelHangPx / PX_PER_MM : rule.hangingIndent > 0 ? rule.hangingIndent : 0;
  const children = continuationParts(rule, { number: block.captionNumber, title: block.caption }).flatMap((part) => rule.labelStyle && !part.title ? [textRun(part.text, { ...style, ...rule.labelStyle }, context)] : docxRuns(plainRuns(part.text), style, context));
  return new Paragraph({ ...paragraphProps(hangMm > 0 ? { ...style, hangingIndentMm: hangMm } : style, { keepNext: true }, context.lineSpacing), children });
}
export function captionStyle(rule, block, context) {
  // For auto, use the editor's measured alignment when available; otherwise keep the template's style.
  return { ...rule.style, align: context.captionAlignments?.[block.captionAnchor] || (rule.captionAlignment === "auto" ? rule.style.align : rule.captionAlignment) || rule.style.align, spaceBeforePt: rule.spacingBeforePt ?? rule.style.spaceBeforePt, spaceAfterPt: rule.spacingAfterPt ?? rule.style.spaceAfterPt };
}
export function headingStyle(style, language, level) {
  const run = runProps(style, language);
  return { run: { font: run.font, size: run.size, bold: run.bold, italics: run.italics }, paragraph: { outlineLevel: Number(level) - 1, spacing: { before: pt(style.spaceBeforePt), after: pt(style.spaceAfterPt) }, keepNext: Boolean(style.keepWithNext) } };
}
export function listLevels(ordered) {
  return [0, 1, 2].map((level) => ({
    level, format: ordered ? LevelFormat.DECIMAL : LevelFormat.BULLET, text: ordered ? `%${level + 1}.` : ["•", "◦", "▪"][level], alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: pt(LIST_INDENT_PT * (level + 1)), hanging: pt(LIST_INDENT_PT * 0.75) } } },
  }));
}
