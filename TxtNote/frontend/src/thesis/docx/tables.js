import { BorderStyle, HeightRule, Table, TableCell, TableRow, WidthType, VerticalAlign, TableLayoutType } from "docx";
import { ACADEMIC_TABLE_CELL_PADDING_PT } from "../../lib/academicDocument.js";
import { effectiveLineHeight } from "../engine.js";
import { CELL_BORDER, NO_BORDER, plainRuns, pt, twip } from "./xml.js";
import { captionParagraph, continuationParagraph, docxParagraph } from "./paragraphs.js";

export function tableDocx(block, section, context, before = null) {
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
  const makeRow = (row, rowIndex, keepRow = tables.cantSplit === false ? captionBelow && rowIndex === sourceRows.length - 1 : rowIndex < sourceRows.length - 1 || captionBelow) => new TableRow({
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
      children: [docxParagraph(cell.runs?.length ? cell.runs : plainRuns(cell.text), { ...body, ...cellStyle, align: cell.align || cellStyle.align || "left", firstLineIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0, keepWithNext: keepRow, fontWeight: cell.header ? 700 : cellStyle.fontWeight ?? body.fontWeight }, context)],
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
  // Array.map passes its source array as a third argument; never let that
  // overwrite keepRow for the new opt-in splitting model.
  const rows = tables.cantSplit === false ? sourceRows.map((row, index) => makeRow(row, index)) : sourceRows.map(makeRow);
  if (rows.length) out.push(tableOf(rows));
  if (caption && tables.position !== "above") out.push(caption);
  return out;
}
