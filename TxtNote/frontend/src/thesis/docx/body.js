import { blockDescriptors, blockGapActive, describeBlock, gapBetween } from "../blockGap.js";
import { Bookmark, ImageRun, LineRuleType, PageBreak, Paragraph, TextRun, TabStopType, LeaderType } from "docx";
import { ACADEMIC_FIGURE_MARGIN_PT } from "../../lib/academicDocument.js";
import { PX_PER_MM } from "../pageLayout.js";
import { indexRowStyle } from "../generatedIndex.js";
import { positionedLayoutDocx, splitLayoutNodes } from "../layoutDocx.js";
import { alignDocx, asBlocks, halfPointSize, imageBytes, plainRuns, pt, twip } from "./xml.js";
import { bookmarkName, captionParagraph, captionStyle, docxParagraph, listParagraphs, thesisHeadingStyleId } from "./paragraphs.js";
import { emptyComplexFieldParagraph, tocSpecialField, wrapParagraphsInField } from "./fields.js";
import { tableDocx } from "./tables.js";
import { positionedSpecialPageDocx, specialPageDocx } from "./specialPages.js";

export function docxChildren(section, context) {
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
      // A numbered chapter TOC row is one Word paragraph with an explicit line break, matching the
      // editor/PDF row block so before/after spacing surrounds the block instead of its two lines.
      const lineLabel = row.labelLine && row.label && row.rowTitle !== undefined;
      const runs = lineLabel
        ? [{ type: "text", text: row.label, bold: bold || (levelStyle.fontWeight || 0) >= 600 }, { type: "break" }, ...plainRuns(row.rowTitle)]
        : row.label && row.rowTitle !== undefined && rule.labelStyle ? [{ type: "text", text: `${row.label} `, bold }, ...plainRuns(row.rowTitle)] : plainRuns(row.text);
      const withPage = rule.includePageNumbers && levelStyle.includePageNumber !== false;
      if (withPage) runs.push({ type: "tab" }, row.anchor ? { type: "pageref", bookmark: bookmarkName(row.anchor), text: String(row.page ?? "") } : plainRuns(row.page)[0] || { type: "text", text: "" });
      children.push(docxParagraph(runs, style, context, withPage ? { tabStops: [{ type: TabStopType[rule.pageNumberAlignment.toUpperCase()], position: twip(rule.pageColumnWidthMm > 0 && rule.pageNumberAlignment === "center" ? widthMm - rule.pageColumnWidthMm / 2 : widthMm), leader: rule.leader === "dots" ? LeaderType.DOT : LeaderType.NONE }] } : {}));
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
    if (frame) children.push(positionedSpecialPageDocx(split.flow, { ...context, pageMargins: page.margins }, frame));
    else children.push(...specialPageDocx(split.flow, context, widthMm));
    children.push(...positionedLayoutDocx(split.positioned, { language: context.language, lineSpacing: context.lineSpacing, pageMargins: page.margins }));
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
      // Inline character formatting (e.g. a coloured section title) travels as runs when they spell exactly the heading text; plain headings keep the single-run path.
      const inlineFormatted = block.runs?.length && block.runs.every((run) => run.type === "text") && block.runs.map((run) => run.text).join("") === block.text
        && block.runs.some((run) => run.bold || run.italic || run.underline || run.strike || run.color || run.highlight || run.fontSizePt);
      const runs = inlineFormatted
        ? (block.thesisNumber && block.thesisNumberLine ? [...plainRuns(block.thesisNumber), { type: "break" }, ...block.runs] : [...(block.thesisNumber ? plainRuns(`${block.thesisNumber} `) : []), ...block.runs])
        : block.thesisNumber && block.thesisNumberLine ? [...plainRuns(block.thesisNumber), { type: "break" }, ...plainRuns(block.text)] : plainRuns(`${block.thesisNumber ? `${block.thesisNumber} ` : ""}${block.text}`);
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
      const namedStyleId = named ? `ThesisParagraph_${section.id.replace(/[^A-Za-z0-9_]/g, "_")}_${block.thesisStyle.replace(/[^A-Za-z0-9_]/g, "_")}` : undefined;
      if (namedStyleId) (context.namedParagraphStyles ||= new Map()).set(namedStyleId, { id: namedStyleId, name: namedStyleId, basedOn: "Normal", quickFormat: false });
      children.push(docxParagraph(block.runs?.length ? block.runs : plainRuns(block.text), chain(withGap({ ...style, ...(block.indentMm ? { leftIndentMm: (style.leftIndentMm || 0) + block.indentMm } : {}), ...spacing, align: align || style.align })), context, namedStyleId ? { style: namedStyleId } : {}));
    } else if (block.type === "list") {
      children.push(...listParagraphs(block, section, context, 0, before));
    } else if (block.type === "table") {
      children.push(...tableDocx(block, section, context, before, { atPageTop: children.length === 0 && Boolean(context.sectionStartsPage) }));
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
