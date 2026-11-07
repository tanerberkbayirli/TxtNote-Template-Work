import { AlignmentType, BorderStyle, ImageRun, HeightRule, LineRuleType, Paragraph, Table, TableAnchorType, TableCell, TableLayoutType, TableRow, TextDirection, TextRun, WidthType, VerticalAlign } from "./runtime.js";
import { PX_PER_MM } from "../pageLayout.js";
import { SPECIAL_PAGE_MARGIN_SUFFIX, specialPageRowWidths, specialPageSpacerMinMm, walkSpecialPage } from "../specialPages.js";
import { NO_BORDER, alignDocx, imageBytes, plainRuns, twip } from "./xml.js";
import { docxParagraph, spacerParagraph } from "./paragraphs.js";
import { positionedFlowTextBoxDocx, positionedLayoutDocx } from "../layoutDocx.js";

/** Only a measured page-filling elastic flow needs Word line-rounding room. */
export function specialPageWordSlackMm(section, context, allowanceMm) {
  if (section.verticalAlign || context.naturalSpecialPageFlow) return 0;
  const contentMm = context.elasticContentMm?.[section.id];
  const page = section.rules.page;
  const capacityMm = page.heightMm - page.margins.topMm - page.margins.bottomMm;
  return Number.isFinite(contentMm) && contentMm > capacityMm - allowanceMm ? allowanceMm : 0;
}

/** Height the editor's elastic flow gave this spacer (never above nominal, never below its minimum). */
export function measuredSpacerMm(node, context) {
  const measured = context?.elasticSpacers?.[`${context.sectionId}:${node.path}`];
  if (!Number.isFinite(measured)) return node.heightMm;
  return Math.max(specialPageSpacerMinMm(node), Math.min(node.heightMm, measured));
}

/**
 * The editor gives a special-page text block `min-height: heightMm` (specialPages.js), so the next block starts after that box even when the
 * text is shorter. (Group `minHeightMm` boxes are not applied here: the IYTE approval page's groups already overflow the bottom margin in the editor,
 * and Word would push the page onto a second sheet.) Word has no minimum height for paragraphs: a borderless one-cell row of at-least height is the same box.
 */
function atLeastBox(children, heightMm, widthMm) {
  const body = children.length ? children : [spacerParagraph(0.1)];
  // A Word cell always ends in a paragraph.
  const last = body.at(-1);
  if (!(last instanceof Paragraph)) body.push(spacerParagraph(0.1));
  return new Table({
    width: { size: twip(widthMm), type: WidthType.DXA }, layout: TableLayoutType.FIXED, columnWidths: [twip(widthMm)],
    borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
    rows: [new TableRow({ cantSplit: true, height: { value: twip(heightMm), rule: HeightRule.ATLEAST }, children: [new TableCell({
      width: { size: twip(widthMm), type: WidthType.DXA }, margins: { top: 0, bottom: 0, left: 0, right: 0 },
      borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER }, children: body,
    })] })],
  });
}

/**
 * Special page render tree (specialPages.js) → closest Word structures: text →
 * paragraph, spacer → exact-height paragraph, separator → bordered paragraph,
 * column group → stacked blocks, row group → borderless fixed table.
 */
export function specialPageDocx(nodes, context, widthMm) {
  // Word's lines are a fraction of a point taller than the editor's: a page-filling cover whose last line ends on the bottom margin spills
  // 1-3 words onto a new page. The largest top-level gap gives up `wordSlackMm` (top-anchored flow, so only the tail moves up).
  const slackMm = context?.wordSlackMm || 0;
  if (slackMm) context = { ...context, wordSlackMm: 0 };
  const slackIndex = slackMm ? (nodes || []).reduce((best, node, index) => (node.type === "spacer" && measuredSpacerMm(node, context) > (best < 0 ? slackMm + 2 : measuredSpacerMm(nodes[best], context)) ? index : best), -1) : -1;
  const out = [];
  const gap = (heightMm) => { if (heightMm > 0) out.push(spacerParagraph(heightMm)); };
  for (const [nodeIndex, node] of (nodes || []).entries()) {
    if (node.type === "image") {
      if (["absolute", "anchored"].includes(node.layoutMode)) {
        out.push(...positionedLayoutDocx([node], { pageMargins: context.pageMargins }));
        continue;
      }
      gap(node.marginTopMm);
      const image = imageBytes(node.source);
      out.push(new Paragraph({ alignment: alignDocx(node.align), ...(node.leftIndentMm || node.rightIndentMm ? { indent: { left: twip(node.leftIndentMm || 0), right: twip(node.rightIndentMm || 0) } } : {}), spacing: { before: 0, after: 0, line: twip(node.heightMm), lineRule: LineRuleType.AT_LEAST }, children: [new ImageRun({ ...image, transformation: { width: node.widthMm * PX_PER_MM, height: node.heightMm * PX_PER_MM } })] }));
      gap(node.marginBottomMm);
    } else if (node.type === "text") {
      const baseRuns = node.runs ? node.runs.map((run) => ({ type: "text", text: run.text, bold: run.bold, ...(run.italic ? { italic: true } : {}), ...(run.underline ? { underline: true } : {}), ...(run.strike ? { strike: true } : {}), ...(run.color ? { color: run.color } : {}), ...(run.highlight ? { highlight: run.highlight } : {}), ...(run.fontSizePt ? { fontSizePt: run.fontSizePt } : {}), ...(run.fontFamily ? { fontFamily: run.fontFamily } : {}) })) : plainRuns(node.text);
      // A "\n" in template or metadata text is a forced line break inside the same paragraph (the editor renders <br>):
      // every line keeps the paragraph's alignment. A raw newline in <w:t> would be read by Word as a space.
      const runs = baseRuns.flatMap((run) => (run.type === "text" && /\n/.test(run.text)
        ? run.text.split("\n").flatMap((part, index) => [...(index ? [{ type: "break" }] : []), ...(part ? [{ ...run, text: part }] : [])])
        : [run]));
      if (node.style?.highlight) for (const run of runs) if (run.type === "text") run.highlight = node.style.highlight;
      // Elastic page: the editor shrank this block's top gap (hidden spacer `<path>~m`); Word gets the same smaller space-before.
      const marginKey = `${context.sectionId}:${node.path}${SPECIAL_PAGE_MARGIN_SUFFIX}`;
      const marginShrinkMm = node.marginTopMm > 0 && Number.isFinite(context?.elasticSpacers?.[marginKey]) ? Math.max(0, node.marginTopMm - Math.max(specialPageSpacerMinMm({ heightMm: node.marginTopMm }), context.elasticSpacers[marginKey])) : 0;
      const style = marginShrinkMm > 0.01 ? { ...node.style, spaceBeforePt: Math.max(0, (node.style?.spaceBeforePt || 0) - marginShrinkMm * 72 / 25.4) } : node.style;
      if (Number.isFinite(node.heightMm) && node.heightMm > 0) {
        // The block's own space-before/after stay outside the box, as the editor's margins do.
        const before = (style?.spaceBeforePt || 0) * 25.4 / 72, after = (style?.spaceAfterPt || 0) * 25.4 / 72;
        gap(before);
        out.push(atLeastBox([docxParagraph(runs, { ...style, spaceBeforePt: 0, spaceAfterPt: 0 }, context)], node.heightMm, widthMm));
        gap(after);
      } else out.push(docxParagraph(runs, style, context));
    } else if (node.type === "spacer") {
      gap(node.marginTopMm); gap(measuredSpacerMm(node, context) - (nodeIndex === slackIndex ? slackMm : 0)); gap(node.marginBottomMm);
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
      // An aligned fixed-width frame keeps its own width in Word (the editor sizes the frame, not the column).
      const cellWidth = Number.isFinite(node.widthMm) && node.align ? Math.min(node.widthMm, widthMm) : widthMm;
      const alignment = Number.isFinite(node.widthMm) && node.align ? { alignment: { left: AlignmentType.LEFT, center: AlignmentType.CENTER, right: AlignmentType.RIGHT }[node.align] } : {};
      if (node.table) {
        // `table`: the frame is one Word table, each child group a row (minHeightMm = at-least height, verticalAlign = cell
        // alignment, vertical text = tbRl cell) with no rules between the rows; e.g. a thesis spine.
        out.push(new Table({
          width: { size: twip(cellWidth), type: WidthType.DXA }, layout: TableLayoutType.FIXED, columnWidths: [twip(cellWidth)], ...alignment,
          borders: { top: edgeOf("top"), bottom: edgeOf("bottom"), left: edgeOf("left"), right: edgeOf("right"), insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
          rows: node.blocks.map((child) => {
            const vertical = [...walkSpecialPage([child])].some((item) => item.type === "text" && item.style?.writingMode === "vertical-rl");
            return new TableRow({ cantSplit: true, ...(child.minHeightMm ? { height: { value: twip(child.minHeightMm), rule: HeightRule.ATLEAST } } : {}), children: [new TableCell({
              width: { size: twip(cellWidth), type: WidthType.DXA }, margins: { top: twip(paddingMm), bottom: twip(paddingMm), left: twip(paddingMm), right: twip(paddingMm) },
              ...(child.verticalAlign ? { verticalAlign: { top: VerticalAlign.TOP, center: VerticalAlign.CENTER, bottom: VerticalAlign.BOTTOM }[child.verticalAlign] } : {}),
              ...(vertical ? { textDirection: TextDirection.TOP_TO_BOTTOM_RIGHT_TO_LEFT } : {}),
              children: specialPageDocx([{ ...child, minHeightMm: undefined, verticalAlign: undefined, marginTopMm: 0, marginBottomMm: 0 }], context, cellWidth - 2 * paddingMm),
            })] });
          }),
        }));
        gap(node.marginBottomMm);
        continue;
      }
      out.push(new Table({ ...alignment,
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
const WORD_FRAME_SAFETY_MM = 1;
/** Position a special page's content independently of its Word section margins. */
export function positionedSpecialPageDocx(nodes, context, frame) {
  const width = twip(frame.widthMm);
  const content = specialPageDocx(nodes, context, frame.widthMm);
  if (frame.heightMm !== undefined) return positionedFlowTextBoxDocx(content, frame);
  // A page-top frame already belongs to normal flow. Floating a page-tall table
  // makes Word move its anchor to a blank page before splitting the content.
  // A signed table indent preserves the page-origin x coordinate and natural
  // splitting while keeping the source section margins intact.
  // Elastic page: a floating frame is anchored at a fixed y and cannot grow upward, so when the measured content
  // would end below the editor's bottom margin the frame moves up by the excess (Word then does not split it).
  const contentMm = context.elasticContentMm?.[context.sectionId];
  // Word cannot place table rows below the Word section's bottom margin (it splits the row onto the next page), so the
  // stricter of the editor and Word bottom margins limits the frame, less a small allowance for Word's line rounding.
  const limitMm = context.pageHeightMm - Math.max(context.editorBottomMm ?? 0, context.pageMargins?.bottomMm ?? 0) - WORD_FRAME_SAFETY_MM;
  if (frame.heightMm === undefined && Number.isFinite(contentMm) && Number.isFinite(limitMm) && frame.yMm + contentMm > limitMm) {
    frame = { ...frame, yMm: Math.max(context.pageMargins?.topMm || 0, limitMm - contentMm) };
  }
  const inFlow = Math.abs(frame.yMm - (context.pageMargins?.topMm || 0)) < 0.01;
  return new Table({
    width: { size: width, type: WidthType.DXA },
    columnWidths: [width], layout: TableLayoutType.FIXED,
    ...(inFlow ? { indent: { size: twip(frame.xMm - (context.pageMargins?.leftMm || 0)), type: WidthType.DXA } } : { float: {
      horizontalAnchor: TableAnchorType.PAGE, verticalAnchor: TableAnchorType.PAGE,
      absoluteHorizontalPosition: twip(frame.xMm), absoluteVerticalPosition: twip(frame.yMm),
      topFromText: 0, bottomFromText: 0, leftFromText: 0, rightFromText: 0,
    } }),
    borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
    rows: [new TableRow({ children: [new TableCell({
      width: { size: width, type: WidthType.DXA },
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
      children: content,
    })] })],
  });
}
