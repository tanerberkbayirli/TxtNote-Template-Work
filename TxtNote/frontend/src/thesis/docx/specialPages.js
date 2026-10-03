import { BorderStyle, ImageRun, HeightRule, LineRuleType, Paragraph, Table, TableAnchorType, TableCell, TableLayoutType, TableRow, TextRun, WidthType, VerticalAlign } from "docx";
import { PX_PER_MM } from "../pageLayout.js";
import { specialPageRowWidths } from "../specialPages.js";
import { NO_BORDER, alignDocx, imageBytes, plainRuns, twip } from "./xml.js";
import { docxParagraph, spacerParagraph } from "./paragraphs.js";

/**
 * Special page render tree (specialPages.js) → closest Word structures: text →
 * paragraph, spacer → exact-height paragraph, separator → bordered paragraph,
 * column group → stacked blocks, row group → borderless fixed table.
 */
export function specialPageDocx(nodes, context, widthMm) {
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
export function positionedSpecialPageDocx(nodes, context, frame) {
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
