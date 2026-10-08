import { BorderStyle, HeightRule, Table, TableCell, TableRow, WidthType, VerticalAlign, TableLayoutType } from "docx";
import { ACADEMIC_TABLE_CELL_PADDING_PT } from "../../lib/academicDocument.js";
import { effectiveLineHeight } from "../engine.js";
import { CELL_BORDER, NO_BORDER, plainRuns, pt, twip } from "./xml.js";
import { captionParagraph, continuationParagraph, docxParagraph } from "./paragraphs.js";

// The editor stylesheet wraps every table in `.academic-table-wrap` (index.css) whose 12 pt outer
// margins are the table's only outer spacing unless the template opts into the block-gap table
// (blockGap.js zeroes the wrap margin there and computes pair gaps instead). Word tables carry no
// margins, so the wrap margins ride on the adjacent paragraphs: the caption takes the wrap's near
// margin, and the far margin is handed to the next block (paragraphs.js) as space-before. Both
// sides collapse exactly like CSS (a paragraph gap is max(wrap, own spacing)), so the rendered gap
// is identical to the editor's.
const TABLE_WRAP_MARGIN_PT = 12;

export function tableDocx(block, section, context, before = null, { atPageTop = false } = {}) {
  const { body, tables } = section.rules;
  const cellStyle = tables.cellStyle || {};
  const out = [];
  // before !== null means the block-gap table computed this pair's gap already (the wrap margin is not part of it).
  const wrapMargin = before === null ? TABLE_WRAP_MARGIN_PT : 0;
  // A previous table's far wrap margin must land on this block's first paragraph (its caption), never on a cell.
  const pendingIn = context.pendingTableWrapMargin || 0;
  context.pendingTableWrapMargin = 0;
  // The browser truncates a wrap margin at a page start, so a caption that begins a page (pageBreakBefore) carries none.
  const startsPage = tables.position === "above" && (context.blockPageBreaks.has(block.captionAnchor) || context.blockPageBreaks.has(block.id));
  // Likewise for a table that opens a section Word starts on a new page (the section break, not pageBreakBefore, moves it).
  const atTop = startsPage || atPageTop;
  const wrapNear = atTop ? 0 : wrapMargin;
  const caption = block.caption ? captionParagraph(tables, block, context, { keepNext: tables.position === "above", keepLines: tables.position === "above", pageBreakBefore: startsPage }, before === null ? Math.max(wrapNear + (tables.spacingBeforePt ?? tables.style?.spaceBeforePt ?? 0), atTop ? 0 : pendingIn) : before) : null;
  if (caption && tables.position === "above") out.push(caption);
  const preset = tables.borders?.preset;
  const rule = { style: BorderStyle.SINGLE, size: Math.round((tables.borders?.widthPt || 0.5) * 8), color: "000000" };
  const sourceRows = (block.rows || []).filter((row) => row.length);
  // A caption below the table must stay with its last row (keep-with-next on the last row too).
  const captionBelow = Boolean(caption && tables.position !== "above");
  const lastHeader = sourceRows.reduce((last, row, index) => (row.every((cell) => cell.header) ? index : last), -1);
  const firstBodyRow = sourceRows.findIndex((row) => !row.every((cell) => cell.header));
  const headerCount = firstBodyRow < 0 ? 0 : firstBodyRow;
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
  // Keep-with-next model mirroring the paged layout's `table{break-inside:avoid}`. A table the
  // layout fits on one page chains EVERY row, so Word moves it whole like the PDF. A page-tall
  // table (spansPages: repeated-header clones mark its measured page starts) chains only caption +
  // header rows + first data row and the closing two rows: chaining every row is pathological there —
  // Word cannot satisfy the chain, moves the table to the next page and strands the caption alone on
  // the previous one (+1 physical page vs the layout PDF).
  const spansPages = Boolean(context.tableContinuations?.[block.captionAnchor]?.spansPages);
  const keepRowChain = (index) => index < sourceRows.length - 1
    && (!spansPages || index <= headerCount || index === sourceRows.length - 2);
  const makeRow = (row, rowIndex, keepRow = tables.cantSplit === false ? captionBelow && rowIndex === sourceRows.length - 1 : keepRowChain(rowIndex) || (captionBelow && rowIndex === sourceRows.length - 1)) => new TableRow({
    cantSplit: tables.cantSplit ?? true, tableHeader: tables.repeatHeader !== false && row.every((cell) => cell.header),
    // Word's row height (atLeast) is the CONTENT height only: cell top/bottom margins and the border are added on top (measured in Word: trHeight
    // 26.55 pt + tcMar 2 x 6 pt + 0.75 pt border = 39.3 pt rows, CSS rows = line box + padding + border = 26.55 pt). Word would otherwise use its glyph
    // box as the minimum, so the minimum is the resolved line box; margins and border then add up exactly as the editor's do.
    ...(tables.rowHeight ? tables.rowHeight.rule === "auto" ? {} : { height: { value: twip(tables.rowHeight.valueMm), rule: tables.rowHeight.rule === "exact" ? HeightRule.EXACT : HeightRule.ATLEAST } } : { height: { value: pt((cellStyle.fontSizePt || body.fontSizePt) * effectiveLineHeight(cellStyle.lineHeight || body.lineHeight, context.lineSpacing, { ...body, ...cellStyle })), rule: HeightRule.ATLEAST } }),
    children: row.map((cell, cellIndex) => new TableCell({
      ...(colTw ? { width: { size: colTw.slice(row.slice(0, cellIndex).reduce((n, c) => n + (c.colspan > 1 ? c.colspan : 1), 0), row.slice(0, cellIndex + 1).reduce((n, c) => n + (c.colspan > 1 ? c.colspan : 1), 0)).reduce((a, b) => a + b, 0), type: WidthType.DXA } } : {}),
      columnSpan: cell.colspan > 1 ? cell.colspan : undefined, rowSpan: cell.rowspan > 1 ? cell.rowspan : undefined,
      // Three-rule tables: the rule below the header row belongs to its cells.
      ...(preset === "threeRule" && rowIndex === lastHeader ? { borders: { bottom: rule } } : {}),
      ...(preset === "headerRules" && row.every((c) => c.header) ? { borders: { bottom: rule } } : {}),
      margins: cellMargins,
      ...(tables.verticalAlign ? { verticalAlign: { top: VerticalAlign.TOP, center: VerticalAlign.CENTER, bottom: VerticalAlign.BOTTOM }[tables.verticalAlign] } : {}),
      children: [docxParagraph(cell.runs?.length ? cell.runs : plainRuns(cell.text), { ...body, ...cellStyle, align: cell.align || cellStyle.align || "left", firstLineIndentMm: cellStyle.firstLineIndentMm ?? 0, spaceBeforePt: 0, spaceAfterPt: 0, keepWithNext: keepRow, fontWeight: cell.header ? 700 : cellStyle.fontWeight ?? body.fontWeight }, context)],
    })),
  });
  // Three-rule table: top and bottom of the table, and below the (repeated) header row.
  const borders = preset === "headerRules" ? { top: NO_BORDER, bottom: rule, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER }
    : preset === "threeRule" ? { top: rule, bottom: rule, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER }
    : preset === "none" ? { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER }
    : { top: CELL_BORDER, bottom: CELL_BORDER, left: CELL_BORDER, right: CELL_BORDER, insideHorizontal: CELL_BORDER, insideVertical: CELL_BORDER };
  for (const edge of ["top", "bottom", "left", "right", "insideHorizontal", "insideVertical"]) {
    const value = tables.borders?.[edge];
    if (value) borders[edge] = { style: { single: BorderStyle.SINGLE, double: BorderStyle.DOUBLE, none: BorderStyle.NONE, dashed: BorderStyle.DASHED, dotted: BorderStyle.DOTTED }[value.style || "single"], size: Math.round((value.widthPt ?? 0.5) * 8), color: (value.color || "000000").replace(/^#/, "") };
  }
  const tableOf = (rows) => new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE }, borders, ...(colTw ? { columnWidths: colTw, layout: TableLayoutType.FIXED } : {}) });
  // Continuation captions: the table is split at the rows the editor measured as page starts; each later
  // fragment gets its caption paragraph and the header row(s) again (Word cannot vary a repeated row's text).
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
    if (wrapMargin) context.pendingTableWrapMargin = wrapMargin;
    return out;
  }
  // Array.map passes its source array as a third argument; never let that
  // overwrite keepRow (always call with an explicit keepRow).
  const rows = sourceRows.map((row, index) => makeRow(row, index));
  if (rows.length) out.push(tableOf(rows));
  if (caption && tables.position !== "above") out.push(caption);
  // The wrap's far margin becomes the next block's space-before (a caption below the table already carries it).
  else if (wrapMargin) context.pendingTableWrapMargin = wrapMargin;
  return out;
}
