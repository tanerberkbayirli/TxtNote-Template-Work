import { AlignmentType, Bookmark, EndnoteReferenceRun, ExternalHyperlink, InternalHyperlink, FootnoteReferenceRun, LevelFormat, LineRuleType, Paragraph, TextRun, TabStopType, Tab, LeaderType, ImportedXmlComponent } from "./runtime.js";
import { imageRun } from "./imageRuns.js";
import { nativeDrawingRun } from "./nativeDrawings.js";
import { citationRuns, complexFieldMarker, complexFieldRuns, crossReferenceRuns, foldFieldRuns, importedBookmarkName, targetBookmarkName } from "./fields.js";
import { resolveLineSpacing, resolveTabStops } from "../typography.js";
import { equationRun } from "./equations.js";
import { indentMm, transformThesisText } from "../engine.js";
import { PX_PER_MM } from "../pageLayout.js";
import { continuationParts } from "../tableContinuation.js";
import { LIST_SPACE_AFTER_PT } from "../blockGap.js";
import { alignDocx, halfPointSize, plainRuns, pt, twip } from "./xml.js";
import { wordBaselineProbe } from '../wordBaseline.js';

// Legacy footnote size, used only when a model carries no resolved footnote rule.
const FOOTNOTE_PT = 9;
const LIST_INDENT_PT = 24;
export function runProps(style, language) {
  return { font: style.fontFamily, size: halfPointSize(style.fontSizePt), bold: style.fontWeight >= 600, italics: Boolean(style.italic), ...(style.characterSpacingPt ? { characterSpacing: pt(style.characterSpacingPt) } : {}), ...(style.color ? { color: style.color.slice(1).toUpperCase() } : {}), language: { value: language } };
}
// Same values as the editor CSS (.fmt-color-* / .fmt-highlight-* in engine.js), so Word shows exactly what the editor shows.
const PRESET_TEXT_COLORS = { black: "000000", red: "BE123C", blue: "0369A1", green: "047857" };
const PRESET_HIGHLIGHTS = { yellow: "FFF2A8", green: "C9F2D0", cyan: "BDEFFF", magenta: "F5C8EE" };
/** Preset id or custom "#rrggbb" (data-fmt-color / data-fmt-bg) -> upper-case RRGGBB, else undefined. */
const inlineHex = (value, presets) => presets[value] || (/^#[0-9a-f]{6}$/i.test(value || "") ? value.slice(1).toUpperCase() : undefined);
function textRun(text, style, context, inline = {}) {
  const inlineColor = inlineHex(inline.color, PRESET_TEXT_COLORS);
  const highlightFill = inlineHex(inline.highlight, PRESET_HIGHLIGHTS);
  return new TextRun({
    ...runProps(style, context.language), text: transformThesisText(text, style, context.language),
    ...(inline.fontSizePt ? { size: halfPointSize(inline.fontSizePt) } : {}),
    ...(inline.fontFamily ? { font: inline.fontFamily } : {}),
    ...(inline.valign === "superscript" ? { superScript: true } : inline.valign === "subscript" ? { subScript: true } : {}),
    ...(inline.bold ? { bold: true } : inline.bold === false ? { bold: false } : {}), ...(inline.italic ? { italics: true } : inline.italic === false ? { italics: false } : {}),
    ...(inlineColor ? { color: inlineColor } : {}),
    ...(highlightFill ? { shading: { fill: highlightFill, type: "clear" } } : {}),
    underline: inline.underline || style.decoration === "underline" ? {} : undefined, strike: Boolean(inline.strike),
  });
}
/** Inline runs of the parsed block model: bold/italic/underline/strike, breaks, links and real footnotes. */
function docxRuns(runs, style, context, nested = false) {
  const out = [], items = foldFieldRuns(runs, context) || [];
  for (const item of items) {
    if (item.type === "break") out.push(new TextRun({ break: 1 }));
    else if (item.type === "tab") out.push(new TextRun({ children: [new Tab()] }));
    else if (item.type === "drawing") out.push(nativeDrawingRun(item, context));
    else if (item.type === "image") {
      const picture = imageRun(item, { maxWidthPx: context.bodyWidthPx });
      if (picture) out.push(picture);
    }
    else if (item.type === "math") {
      const formula = equationRun(item, style, { soleContent: !nested && items.length === 1 });
      if (Array.isArray(formula)) out.push(...formula);
      else if (formula) out.push(formula);
      else out.push(textRun("[empty equation]", style, context));
    }
    // TOC/list page labels are real PAGEREF fields (cached result = the editor's label): Word/LibreOffice re-read the page of the bookmark.
    else if (item.type === "pageref") out.push(...complexFieldRuns(`PAGEREF ${item.bookmark} \\h`, item.text || "", runProps(item.style ? { ...style, ...item.style } : style, context.language)));
    else if (item.type === "numpages") out.push(...complexFieldRuns("NUMPAGES", context.totalPages || "", runProps(style, context.language)));
    else if (item.type === "page") out.push(...complexFieldRuns("PAGE", "", runProps(style, context.language)));
    else if (item.type === "fieldStart") out.push(complexFieldMarker(item.instruction, "begin", runProps(style, context.language)));
    else if (item.type === "fieldEnd") out.push(complexFieldMarker("", "end", runProps(style, context.language)));
    else if (item.type === "bookmark") {
      const name = importedBookmarkName(item.name, context);
      const children = docxRuns(item.children, style, context, true);
      out.push(...(name ? bookmarkRuns(name, children) : children));
    }
    // Reference runs are never flattened to text: a citation or a cross reference is a Word field, a leftover marker is dropped.
    else if (item.type === "xref") {
      if (/^(?:field|bookmark)-/.test(item.kind || "")) continue;
      out.push(...(item.kind === "cite" ? citationRuns(item, runProps(style, context.language)) : crossReferenceRuns(item, context, runProps(style, context.language))));
    }
    else if (item.type === "link") {
      const children = docxRuns(item.children, style, context, true);
      let href = "";
      try {
        const parsed = new URL(item.href || "");
        if (parsed.protocol === "http:" || parsed.protocol === "https:") href = parsed.href;
      } catch { /* Invalid or relative destinations retain their text without an unsafe external relationship. */ }
      // Internal links (w:hyperlink w:anchor) stay internal; a target the document lacks is harmless in Word.
      const anchor = /^#([A-Za-z_][A-Za-z0-9_]{0,39})$/.exec(item.href || "")?.[1];
      out.push(...(href && children.length ? [new ExternalHyperlink({ link: href, children })] : anchor && children.length ? [new InternalHyperlink({ anchor, children })] : children));
    }
    else if (item.type === "footnote" || item.type === "endnote") {
      // Endnotes are real Word endnotes (own stream and numbering); a context without an endnote stream keeps them as footnotes.
      const endnote = item.type === "endnote" && Boolean(context.endnotes);
      const id = endnote ? (context.nextEndnote = (context.nextEndnote || 1) + 1) - 1 : context.nextFootnote++;
      // Word places the note on its page; typography comes from the same template rule as the editor's note area.
      const rule = context.footnoteStyle;
      const noteStyle = rule ? { ...rule, decoration: "none", textTransform: "none" } : { ...context.body, fontSizePt: FOOTNOTE_PT, align: "left", firstLineIndentMm: 0, textTransform: "none" };
      const props = rule ? paragraphProps(noteStyle, { keepNext: false, pageBreakBefore: false }, context.lineSpacing) : {};
      // The note number Word inserts in the note area inherits its size from the paragraph style, so each footnote size gets a
      // paragraph style carrying the note's own font and size (otherwise the mark falls back to the document default and the first line grows).
      const noteStyleId = `ThesisFootnote${halfPointSize(noteStyle.fontSizePt || FOOTNOTE_PT)}`;
      (context.footnoteParagraphStyles ||= new Map()).set(noteStyleId, { id: noteStyleId, name: `Thesis Footnote ${noteStyle.fontSizePt || FOOTNOTE_PT} pt`, basedOn: "Normal", quickFormat: false, run: { font: noteStyle.fontFamily || context.body.fontFamily, size: halfPointSize(noteStyle.fontSizePt || FOOTNOTE_PT) } });
      // An imported multi-paragraph note stores its paragraphs joined by "\n": one Word paragraph each, all in the same note (the mark sits in the first).
      const noteParagraphs = String(item.text || "").split("\n");
      (endnote ? context.endnotes : context.footnotes)[id] = { children: noteParagraphs.map((part) => new Paragraph({ ...props, style: noteStyleId, children: [textRun(part, noteStyle, context)] })) };
      out.push(endnote ? new EndnoteReferenceRun(id) : new FootnoteReferenceRun(id));
    } else {
      const text = item.text || item.latex || "";
      // A typed tab is a Word tab (aligned on the paragraph's tab stop), never a literal character.
      text.split("\t").forEach((part, index) => { if (index) out.push(new TextRun({ children: [new Tab()] })); if (part) out.push(textRun(part, style, context, item)); });
    }
  }
  return out;
}
// Word's own "n lines" (240 = single), the same pitch the editor draws for "word" line spacing.
const lineSpacingDocx = (style, spacing) => {
  const resolved = resolveLineSpacing(style, spacing);
  return { line: resolved.lineTwips, lineRule: { auto: LineRuleType.AUTO, exact: LineRuleType.EXACT, atLeast: LineRuleType.AT_LEAST }[resolved.rule] };
};
export function paragraphProps(style, options = {}, lineSpacing = null) {
  // Word expresses a negative first line as a hanging indent.
  const indent = indentMm(style);
  return {
    alignment: alignDocx(style.align),
    spacing: { before: pt(style.spaceBeforePt), after: pt(style.spaceAfterPt), ...lineSpacingDocx(style, lineSpacing) },
    indent: { ...(indent.first < 0 ? { hanging: twip(-indent.first) } : { firstLine: twip(indent.first) }), left: twip(indent.left), right: twip(indent.right) },
    keepNext: Boolean(style.keepWithNext),
    ...(style.keepLines !== undefined ? { keepLines: style.keepLines } : {}),
    ...(style.widowControl !== undefined ? { widowControl: style.widowControl } : {}),
    ...((style.contextualSpacing ?? lineSpacing?.contextualSpacing) !== undefined ? { contextualSpacing: Boolean(style.contextualSpacing ?? lineSpacing?.contextualSpacing) } : {}), pageBreakBefore: Boolean(style.pageBreakBefore),
    ...(resolveTabStops(style).length ? { tabStops: resolveTabStops(style).map((stop) => ({ type: TabStopType[stop.align.toUpperCase()], position: twip(stop.positionMm), ...(stop.leader && stop.leader !== "none" ? { leader: { dots: LeaderType.DOT, hyphen: LeaderType.HYPHEN, underscore: LeaderType.UNDERSCORE, none: LeaderType.NONE }[stop.leader] } : {}) })) } : {}),
    ...options,
  };
}
/** Word bookmark name of an index anchor ("main-source-3" -> "_ref_main_source_3"). */
export const bookmarkName = targetBookmarkName;
/**
 * The editor's `.academic-table-wrap` margins (index.css) are the only outer spacing of a table when the
 * template has no block-gap table; Word tables carry no margins, so tables.js hands the wrap's far margin
 * to the block after the table. CSS collapses the wrap margin with the block's own spacing to max(), and
 * Word renders adjacent paragraph spacing as max(space-after, space-before) too, so max() is exact here.
 */
function consumeTableWrapGap(style, context) {
  const gap = context.pendingTableWrapMargin || 0;
  context.pendingTableWrapMargin = 0;
  return gap && (style.spaceBeforePt || 0) < gap ? { ...style, spaceBeforePt: gap } : style;
}
// One paragraph can be the target of several anchors (a heading that is also an appendix title): nested bookmarks.
function bookmarkRuns(name, children) {
  // docx Paragraph expands Bookmark wrappers only one level deep. Nesting wrappers
  // serializes their JS members (bookmarkUniqueNumericId) as invalid XML elements.
  const bookmark = new Bookmark({ id: name, children });
  return [bookmark.start, ...children, bookmark.end];
}
const bookmarked = (anchor, children) => [].concat(anchor || []).filter(Boolean).reduceRight((inner, name) => bookmarkRuns(bookmarkName(name), inner), children);
export function docxParagraph(runs, style, context, { anchor, presentationFrame, ...options } = {}) {
  if (presentationFrame) {
    const probe = wordBaselineProbe(style, { mode: 'word', baseline: 'word', ...context.lineSpacing }, style.lineHeight || 1.5);
    const yMm = Number.isFinite(presentationFrame.baselineMm) && probe
      ? presentationFrame.baselineMm - probe.targetPt * 25.4 / 72 : presentationFrame.yMm;
    if (![presentationFrame.xMm, yMm, presentationFrame.widthMm].every(Number.isFinite) || presentationFrame.widthMm <= 0) throw new Error('Word metin çerçevesi için görünür konum ölçümü gerekli.');
    style = { ...style, spaceBeforePt: 0, spaceAfterPt: 0, keepWithNext: false };
    options.frame = { type: 'absolute', position: { x: twip(presentationFrame.xMm), y: twip(yMm) },
      width: twip(presentationFrame.widthMm), height: twip(presentationFrame.heightMm || 1),
      anchor: { horizontal: 'page', vertical: 'page' }, wrap: 'none', rule: 'atLeast' };
  }
  style = consumeTableWrapGap(style, context);
  const children = docxRuns(runs, style, context);
  // Word sizes a paragraph without visible text (an empty table cell) from its paragraph mark, not from an empty run; without mark
  // properties it falls back to the document default (12 pt) and the row grows when the cell font is smaller.
  const blank = !(runs || []).some((item) => item.type !== "text" || item.text);
  const markProps = blank ? { run: { font: style.fontFamily, size: halfPointSize(style.fontSizePt), bold: style.fontWeight >= 600, italics: Boolean(style.italic) } } : {};
  const paragraph = new Paragraph({ ...paragraphProps(style, options, context.lineSpacing), ...markProps, children: bookmarked(anchor, children.length ? children : [textRun("", style, context)]) });
  if (indentMm(style).mirror) {
    const alignment = paragraph.properties.root.findIndex((item) => item?.rootKey === "w:jc");
    paragraph.properties.root.splice(alignment < 0 ? paragraph.properties.root.length : alignment, 0, new ImportedXmlComponent("w:mirrorIndents"));
  }
  return paragraph;
}
export const thesisHeadingStyleId = (level, included, noPage = false) => `ThesisHeading${level}${included ? (noPage ? "NoPage" : "Index") : "Excluded"}`;
/** Empty paragraph exactly `heightMm` tall (Word has no bare vertical box). */
export function spacerParagraph(heightMm) {
  return new Paragraph({ spacing: { before: 0, after: 0, line: Math.max(1, twip(heightMm)), lineRule: LineRuleType.EXACT }, children: [new TextRun({ text: "", size: 2 })] });
}
export function listParagraphs(block, section, context, level = 0, before = null, exitAfterPt = level === 0 && before === null ? LIST_SPACE_AFTER_PT : 0) {
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
      // The list's exit space sits on its very last paragraph (the last item, or the last item of its last nested list).
      const lastItem = position === block.items.length - 1;
      out.push(docxParagraph(runs, { ...body, firstLineIndentMm: 0, spaceBeforePt: position === 0 && before !== null ? before : 0, spaceAfterPt: lastItem && !item.lists?.length ? exitAfterPt : 0 }, context, {
        numbering: { reference: block.ordered ? "thesis-ordered" : "thesis-bullet", level: Math.min(level, 2), instance },
      }));
    }
    for (const [index, nested] of (item.lists || []).entries()) out.push(...listParagraphs(nested, section, context, level + 1, null, position === block.items.length - 1 && index === item.lists.length - 1 ? exitAfterPt : 0));
  }
  return out;
}
/** Caption paragraph: label run in the label style, then the caption text; optional hanging indent. */
export function captionParagraph(rule, block, context, options = {}, before = null) {
  const style = consumeTableWrapGap({ ...captionStyle(rule, block, context), ...(before === null ? {} : { spaceBeforePt: before }) }, context);
  const hangMm = rule.hangingIndent === "label" ? (context.captionHangs?.[block.captionAnchor] || 0) / PX_PER_MM : rule.hangingIndent > 0 ? rule.hangingIndent : 0;
  const paragraphStyle = hangMm > 0 ? { ...style, hangingIndentMm: hangMm } : style;
  const label = block.captionLabel || `${rule.label} ${block.captionNumber}.`;
  // One run as before unless the label has its own typography (e.g. bold "Şekil 2.1").
  let children = rule.labelStyle ? [textRun(`${label} `, { ...style, ...rule.labelStyle }, context), ...docxRuns(plainRuns(block.caption), style, context)] : docxRuns(plainRuns(`${label} ${block.caption}`), style, context);
  if (rule.numbering.liveField && block.captionNumber && label.includes(block.captionNumber)) {
    const labelStyle = { ...style, ...rule.labelStyle };
    const index = label.indexOf(block.captionNumber);
    const number = String(block.captionNumber), split = number.lastIndexOf(".");
    const prefix = split >= 0 ? number.slice(0, split + 1) : "";
    const cached = split >= 0 ? number.slice(split + 1) : number;
    const sequence = String(rule.label || "Caption").replace(/[^A-Za-z0-9_]/g, "_") || "Caption";
    children = [textRun(label.slice(0, index) + prefix, labelStyle, context), ...complexFieldRuns(`SEQ ${sequence}${rule.numbering.scope === "chapter" ? " \\s 1" : ""}${rule.numbering.sequence === "roman-upper" ? " \\* ROMAN" : rule.numbering.sequence === "roman-lower" ? " \\* roman" : ""}`, cached, runProps(labelStyle, context.language)), textRun(label.slice(index + number.length) + " ", labelStyle, context), ...docxRuns(plainRuns(block.caption), style, context)];
  }
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
