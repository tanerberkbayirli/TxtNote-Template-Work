import { formatNumber } from "./engine.js";
import { plainThesisText } from "./sourceHtml.js";
import { convertLength } from "./units.js";
import { ACADEMIC_TABLE_CELL_PADDING_PT } from "../../TxtNote/frontend/src/lib/academicDocument.js";

/** Empty editing scaffolds are not physical pages. Explicit breaks and media are. */
export function thesisGroupHasPageContent(group) {
  return (group.sections || [group]).some((section) => {
    if (section.specialPage || section.group === "cover" || section.mode === "generated" || section.html === undefined) return true;
    const html = section.html || "";
    return Boolean(plainThesisText(html).replace(/[\u200b\ufeff]/g, "").trim()
      || /<(?:img|table|figure|hr|svg|math|canvas|video|audio)\b|\bacademic-(?:page-break|footnote)\b|\bdata-academic-page-break\b/i.test(html));
  });
}

export const PX_PER_MM = convertLength(1, "mm", "px");

/**
 * The room a table cell keeps below its text, in mm: its bottom padding and the rule of its row. Word fits a table row on a page only
 * when the whole row fits (text, bottom padding and rule), while the terminal-leading guard below measures from the end of the cell's
 * text. Without this room a row whose text ends within the padding of the page bottom stays on the page in the editor and moves to the
 * next page in Word, and every following row then sits one row apart (measured: MCBÜ, last row of a table at 272.45 mm on a 272.0 mm
 * text area; the editor's own row boxes). The padding is the template's `tables.cellPadding` (a string shorthand is read too) or the
 * editor default; the rule is the default 1 px cell border, the width of a per-edge border, or 0 for the rule-only presets.
 */
export function tableCellBottomExtraMm(tables) {
  const toMm = (value, unit) => convertLength(value, unit === "px" ? "px" : unit === "pt" ? "pt" : "mm", "mm");
  const padding = tables?.cellPadding;
  let paddingMm = toMm(ACADEMIC_TABLE_CELL_PADDING_PT.vertical, "pt");
  if (padding && typeof padding === "object") paddingMm = Number(padding.bottomMm) || 0;
  else if (typeof padding === "string") {
    const parts = padding.trim().split(/\s+/);
    const token = /^(-?[\d.]+)(mm|pt|px)?$/.exec(parts[2] ?? parts[0] ?? "");
    if (token) paddingMm = toMm(Number(token[1]), token[2] || "px");
  }
  const edge = tables?.borders?.insideHorizontal ?? tables?.borders?.bottom;
  const ruleMm = edge && Number.isFinite(edge.widthPt) ? toMm(edge.widthPt, "pt")
    : ["threeRule", "headerRules", "none"].includes(tables?.borders?.preset) ? 0 : toMm(1, "px");
  return Math.max(0, Math.round((paddingMm + ruleMm) * 10000) / 10000);
}
export const THESIS_PAGE_GAP_PX = 28;
/** Fail-safe for pathological content: never render more physical sheets than this per group. */
export const THESIS_MAX_PAGES = 2000;
export function pageMetrics(page) {
  const margins = page.margins;
  const widthPx = page.widthMm * PX_PER_MM;
  const heightPx = page.heightMm * PX_PER_MM;
  const topMarginPx = margins.topMm * PX_PER_MM;
  const bottomMarginPx = margins.bottomMm * PX_PER_MM;
  // page.lastLineFit "word": the flow column is taller than the margin box by the terminal leading (resolved into
  // page.lastLineLeadingMm by the engine), so a page accepts a last line that fits without its extra leading, as Word does.
  // The row gap shrinks by the same amount: the page pitch (stridePx) never changes.
  const trailingLeadingPx = Math.max(0, Number(page.lastLineLeadingMm) || 0) * PX_PER_MM;
  return {
    widthPx, heightPx, topMarginPx, bottomMarginPx, trailingLeadingPx,
    contentWidthPx: (page.widthMm - margins.leftMm - margins.rightMm) * PX_PER_MM,
    contentHeightPx: heightPx - topMarginPx - bottomMarginPx + trailingLeadingPx,
    // Distance from one page's content box to the next: bottom margin, desk gap, top margin.
    rowGapPx: bottomMarginPx + THESIS_PAGE_GAP_PX + topMarginPx - trailingLeadingPx,
    stridePx: heightPx + THESIS_PAGE_GAP_PX,
  };
}

/**
 * The paged flow is N content boxes separated by N-1 row gaps, so its unscaled
 * height maps back to exactly one page count. Rounding absorbs sub-pixel layout
 * noise; zoom is a transform and never reaches this number.
 */
export function pageCountFromFlowHeight(heightPx, metrics) {
  const count = Math.round((Number(heightPx) + metrics.rowGapPx) / (metrics.contentHeightPx + metrics.rowGapPx));
  return Number.isFinite(count) ? Math.min(THESIS_MAX_PAGES, Math.max(1, count)) : 1;
}

/**
 * Distance between two pages of the paged flow as the browser lays it out: column
 * height and row gap are each truncated to layout units (1/64 px), so after many
 * pages the flow drifts below one pixel from index × stridePx. Code that must hit
 * a line exactly (page-bottom notes) uses this pitch; sheets keep stridePx.
 */
export function flowPagePitchPx(metrics) {
  const unit = (value) => Math.floor(value * 64) / 64;
  return unit(metrics.contentHeightPx) + unit(metrics.rowGapPx);
}

export function pageStackHeightPx(count, metrics) {
  const pages = Math.max(1, count);
  return pages * metrics.heightPx + (pages - 1) * THESIS_PAGE_GAP_PX;
}

/**
 * Page indexes (within a rendered paged flow) on which a chapter opens: a level-1 heading that starts its own page
 * (computed break-before page/column) or the first content of the flow. Read from the rendered DOM, never estimated.
 */
export function chapterStartPageIndexes(flow, metrics) {
  const result = new Set();
  const box = flow.getBoundingClientRect();
  const scale = flow.offsetWidth ? box.width / flow.offsetWidth || 1 : 1;
  const pitch = flowPagePitchPx(metrics);
  let first = true;
  for (const heading of flow.querySelectorAll("h1")) {
    const range = flow.ownerDocument.createRange();
    range.setStart(flow, 0);
    range.setEndBefore(heading);
    const opensFlow = first && !range.toString().replace(/[​\s]/g, "");
    first = false;
    const breaks = ["column", "page"].includes(getComputedStyle(heading).breakBefore);
    if (!opensFlow && !breaks) continue;
    const rect = [...heading.getClientRects()].find((r) => r.width && r.height) || heading.getBoundingClientRect();
    result.add(Math.max(0, Math.floor((((rect.top - box.top) / scale) + 0.5) / pitch)));
  }
  return result;
}

/** The PDF writer uses the same restart/advance rule per physical page. */
export function numberThesisPages(sections, pageCounts = {}, chapterStarts = {}) {
  let logicalPage = 0;
  let physicalPages = 0;
  const duplex = sections.some(section => section.rules.page.header?.evenContent !== undefined || section.rules.page.footer?.evenContent !== undefined);
  return sections.map((section) => {
    const rule = section.rules.page.numbering;
    const hasContent = thesisGroupHasPageContent(section);
    if (!hasContent) {
      if (rule.restart) logicalPage = (rule.startAt ?? 1) - 1;
      return { sectionId: section.id, labels: [], indexLabels: [], countedLabels: [], blankPageIndexes: [] };
    }
    const parityStart = physicalPages > 0 && ["oddPage", "evenPage"].includes(section.pageBreakBefore);
    let startAt = rule.startAt ?? 1;
    // A numbered odd/even section rounds a conflicting restart upward to the
    // requested parity. Word does not insert an extra sheet for that conflict.
    if (parityStart && rule.restart && startAt % 2 !== (section.pageBreakBefore === "oddPage" ? 1 : 0)) startAt++;
    const preceding = section.rules.page.sectionParity === "logical" ? (rule.restart ? startAt - 1 : logicalPage) : physicalPages;
    const blankBefore = (physicalPages > 0 && section.pageBreakBefore === "oddPage" && preceding % 2 === 1)
      || (physicalPages > 0 && section.pageBreakBefore === "evenPage" && preceding % 2 === 0)
      // Word aligns restarted odd/even page numbers to sheet parity when the
      // document has separate even headers, including ordinary next-page breaks.
      || (!parityStart && physicalPages > 0 && duplex && rule.restart && (physicalPages + 1) % 2 !== startAt % 2);
    // The parity sheet belongs to the preceding numbering sequence. A restart on
    // this section is applied afterwards, to its first printed/content page.
    if (blankBefore) logicalPage += 1;
    if (rule.restart) logicalPage = startAt - 1;
    // Measured counts include the CSS-generated parity column. Before the first
    // measurement a missing/default count is one content page, so reserve both
    // the blank column and that page from the first render.
    const count = Math.max(blankBefore ? 2 : 1, Math.floor(pageCounts[section.id] || 1));
    const indexLabels = blankBefore ? [""] : [];
    const labels = blankBefore ? [""] : [];
    const countedLabels = blankBefore ? [""] : [];
    const blankPageIndexes = blankBefore ? [0] : [];
    for (let pageIndex = blankBefore ? 1 : 0; pageIndex < count; pageIndex += 1) {
      logicalPage += 1;
      const counted = formatNumber(logicalPage, rule.format);
      countedLabels.push(counted);
      // indexLabelWhenHidden: a counted page whose number is not printed still shows its number in contents/lists.
      indexLabels.push(rule.enabled || rule.indexLabelWhenHidden ? counted : "");
      // numbering.omitOnChapterStart: the page that opens a chapter is counted (and listed in contents) but prints no number.
      labels.push(rule.omitOnChapterStart && chapterStarts[section.id]?.has(pageIndex) ? "" : rule.enabled ? counted : "");
    }
    physicalPages += count;
    return { sectionId: section.id, labels, indexLabels, countedLabels, blankPageIndexes };
  });
}

/**
 * Physical page model: one entry per sheet, derived from page groups and measured
 * counts only. It is presentation state; nothing here is stored in the document.
 * The editor draws sheets from it; print/export can consume the same model.
 */
export function buildThesisPageModel(groups, pageCounts = {}, chapterStarts = {}) {
  const numbers = numberThesisPages(groups, pageCounts, chapterStarts);
  const totalPages = numbers.reduce((sum, group) => sum + group.labels.length, 0);
  let physicalIndex = 0;
  return groups.map((group, groupIndex) => {
    const { numbering, header, footer } = group.rules.page;
    const blankIndexes = new Set(numbers[groupIndex].blankPageIndexes || []);
    const firstContentIndex = blankIndexes.has(0) ? 1 : 0;
    const pages = numbers[groupIndex].labels.map((label, index) => ({
      groupId: group.id,
      index,
      physicalIndex: physicalIndex++,
      totalPages,
      blank: blankIndexes.has(index),
      label,
      countedLabel: numbers[groupIndex].countedLabels[index],
      indexLabel: numbers[groupIndex].indexLabels[index],
      numberPosition: numbering.position === "top" ? "top" : "bottom",
      numberAlign: ["left", "center", "right"].includes(numbering.align) ? numbering.align : "center",
      numberBaselineFromTopMm: numbering.baselineFromTopMm,
      numberXmm: numbering.xMm,
      numberWidthMm: numbering.widthMm,
      showHeader: !blankIndexes.has(index) && !(index === firstContentIndex && header?.firstPage === "omit"),
      showFooter: !blankIndexes.has(index) && !(index === firstContentIndex && footer?.firstPage === "omit"),
      headerContent: blankIndexes.has(index) ? undefined : index === firstContentIndex && header?.firstContent !== undefined ? header.firstContent : (physicalIndex % 2 === 0 && header?.evenContent !== undefined ? header.evenContent : header?.content),
      headerParagraphs: index === firstContentIndex && header?.firstContent !== undefined ? header.firstParagraphs : physicalIndex % 2 === 0 && header?.evenContent !== undefined ? header.evenParagraphs : header?.paragraphs,
      headerImages: index === firstContentIndex && header?.firstContent !== undefined ? header.firstImages : physicalIndex % 2 === 0 && header?.evenContent !== undefined ? header.evenImages : header?.images,
      footerImages: index === firstContentIndex && footer?.firstContent !== undefined ? footer.firstImages : physicalIndex % 2 === 0 && footer?.evenContent !== undefined ? footer.evenImages : footer?.images,
      footerParagraphs: index === firstContentIndex && footer?.firstContent !== undefined ? footer.firstParagraphs : physicalIndex % 2 === 0 && footer?.evenContent !== undefined ? footer.evenParagraphs : footer?.paragraphs,
      headerPosition: index === firstContentIndex && header?.firstContent !== undefined ? header.firstPosition : physicalIndex % 2 === 0 && header?.evenContent !== undefined ? header.evenPosition : header?.position,
      footerPosition: index === firstContentIndex && footer?.firstContent !== undefined ? footer.firstPosition : physicalIndex % 2 === 0 && footer?.evenContent !== undefined ? footer.evenPosition : footer?.position,
      headerStyle: index === firstContentIndex && header?.firstContent !== undefined ? header.firstStyle : physicalIndex % 2 === 0 && header?.evenContent !== undefined ? header.evenStyle : header?.style,
      footerStyle: index === firstContentIndex && footer?.firstContent !== undefined ? footer.firstStyle : physicalIndex % 2 === 0 && footer?.evenContent !== undefined ? footer.evenStyle : footer?.style,
      footerContent: blankIndexes.has(index) ? undefined : index === firstContentIndex && footer?.firstContent !== undefined ? footer.firstContent : (physicalIndex % 2 === 0 && footer?.evenContent !== undefined ? footer.evenContent : footer?.content),
    }));
    return { groupId: group.id, pages };
  });
}

const cssString = (value) => JSON.stringify(String(value));
const FLOW = ".thesis-paper[data-thesis-layout=\"paged\"] .thesis-page-flow";

/** Path of the final visible special-page block, only when that block is text. */
function terminalTextBlockPath(nodes) {
  const last = nodes?.at(-1);
  if (last?.type === "group") return terminalTextBlockPath(last.blocks);
  return last?.type === "text" ? last.path : null;
}

/**
 * Pagination is delegated to the browser's fragmentation engine: each group's
 * flow is a single-column multicol whose columns are the pages' content boxes
 * (template margins decide height and gaps) and wrap downward. Text breaks by
 * line, lists keep their numbering, tables split by row, and oversized
 * monolithic content overflows instead of looping.
 */
export function thesisPagedCss(groups) {
  const rules = [
    `.thesis-paper[data-thesis-layout="paged"]{background:transparent !important;box-shadow:none !important}`,
    // balance would relayout the whole document on every keystroke; auto fills pages in order.
    `${FLOW}{display:block;column-count:1;column-gap:0;column-fill:auto;column-wrap:wrap;orphans:2;widows:2}`,
    // An empty section keeps the normal paper box (margins as padding) so its writing area sits on the editor-only placeholder sheet.
    `${FLOW}[data-thesis-empty-flow="true"]{column-height:auto !important}`,
    `${FLOW} :is(h1,h2,h3,h4,h5,h6){break-inside:avoid}`,
    `${FLOW} :is(figure,.academic-figure,tr,caption){break-inside:avoid}`,
    // A table that fits on a page moves as a whole; a longer one still splits by row.
    `${FLOW} table{break-inside:avoid}`,
    // A table that spans pages (tableContinuation.js marks it) starts where it is reached and splits by row, as Word does; moving it whole would leave a gap.
    `${FLOW} table[data-thesis-tall]{break-inside:auto}`,
    // Word keeps a three-line paragraph whole under widow/orphan control (shortParagraphs.js marks them).
    `${FLOW} [data-thesis-keep-lines]{break-inside:avoid !important}`,
    `${FLOW} txt-table-flow{display:block;box-decoration-break:clone;padding-bottom:var(--thesis-col-lead,0mm);margin-bottom:calc(-1 * var(--thesis-col-lead,0mm))}`,
    `${FLOW} txt-table-flow :is(td,th,.academic-table-wrap)::after{display:none}`,
    `${FLOW} thead{display:table-header-group}`,
    // Word never leaves a header row alone at the bottom of a page: it moves with the first body row (measured: MCBÜ Tıp, caption and header
    // row at the bottom of a page in the editor, caption, header and first rows on the next page in Word).
    `${FLOW} :is(thead,thead>tr){break-after:avoid}`,
    // Scroll containers are monolithic for fragmentation; keep wrappers/code splittable.
    `${FLOW} :is(.academic-table-wrap,pre,.academic-code){overflow:visible}`,
    `${FLOW} .academic-page-break{break-after:column}`,
    // Page-bottom notes (footnotes.js): a page that shows notes gets less body. The
    // splittable block crossing the reduced limit repeats its bottom padding on every
    // fragment, so its first fragment stops above the notes; the negative margin
    // cancels the padding after its last fragment. A monolithic block moves instead.
    `${FLOW} [data-thesis-fn-stamp="reserve"]{box-decoration-break:clone;padding-bottom:attr(data-thesis-fn-reserve px) !important;margin-bottom:attr(data-thesis-fn-margin px) !important}`,
    // A block that continues past a further page instead gets a transient float spacer at the first line leaving the note page
    // (footnotes.js placeSpacer), so only its first fragment is shortened.
    `${FLOW} [data-thesis-fn-spacer]{display:block;float:left !important;clear:none;width:100% !important;height:attr(data-thesis-fn-spacer px) !important;margin:0 !important;padding:0 !important;border:0 !important;pointer-events:none}`,
    // A note-capacity cut is a natural Word page break: discard the incoming
    // paragraph gap even though the allocator represents it as a forced column cut.
    `${FLOW} [data-thesis-fn-stamp="break"]{break-before:column !important;margin-top:0 !important}`,
    // A block already at the top of a page that a full-page note area leaves no line for starts a page later: a page of top padding.
    `${FLOW} [data-thesis-fn-push]{padding-top:attr(data-thesis-fn-push px) !important}`,
    // Continuation-only pages after the body (a note longer than the rest of the document).
    `${FLOW} .thesis-footnote-tail{display:block;height:1px;margin:0;break-before:column}`,
  ];
  for (const group of groups) {
    const { page } = group.rules;
    const { topMm, bottomMm } = page.margins;
    const scope = `.thesis-paper[data-thesis-layout="paged"][data-thesis-section=${cssString(group.id)}] > .thesis-page-flow`;
    const lead = Math.max(0, Number(page.lastLineLeadingMm) || 0);
    rules.push(lead > 0
      ? `${scope}{--thesis-col-lead:${lead}mm;column-height:calc(${page.heightMm - topMm - bottomMm}mm + ${lead}mm);row-gap:calc(${bottomMm}mm + ${THESIS_PAGE_GAP_PX}px + ${topMm}mm - ${lead}mm)}`
      : `${scope}{column-height:${page.heightMm - topMm - bottomMm}mm;row-gap:calc(${bottomMm}mm + ${THESIS_PAGE_GAP_PX}px + ${topMm}mm)}`);
    rules.push(`${scope} > [data-thesis-odd-page-spacer]{display:block;width:0;height:calc(${page.heightMm - topMm - bottomMm}mm + ${lead}mm);margin:0;padding:0;break-after:column;break-inside:avoid;pointer-events:none}`);
    // Guard: only running text may use the terminal leading. Headings, figures, table wrappers and table cells get a trailing
    // L-high block cancelled by a negative margin: it takes part in the fit test (the block needs L more room) but not in the height.
    if (lead > 0) {
      const guarded = (suffix) => [":is(h1,h2,h3,h4,h5,h6,figure,.academic-table-wrap)", ":is(td,th)"].map((part) => `${FLOW} ${part}${suffix}`);
      rules.push(`${FLOW} :is(h1,h2,h3,h4,h5,h6,figure,.academic-table-wrap){display:flow-root}`,
        `${guarded("::after").join(",")}{content:"";display:block;height:${lead}mm;margin:0 0 -${lead}mm;break-before:avoid;break-inside:avoid}`);
    }
    for (const section of group.sections) {
      const fragment = `${FLOW} .thesis-flow-section[data-thesis-flow-section=${cssString(section.id)}] .thesis-body`;
      // The terminal-leading guard (above) models a heading that must stay with the text after it. A heading without keepWithNext is an
      // ordinary paragraph for Word: its line may use the leading below the last line like running text, so it gets no extra room requirement.
      if (lead > 0) for (const [level, style] of Object.entries(section.rules.headings)) if (!style.keepWithNext) rules.push(`${fragment} h${level}::after{display:none !important}`);
      // A caption above its table is "keep with next" in Word: it stays with the table's header and first rows.
      if (section.rules.tables?.position === "above") rules.push(`${fragment} table>caption{break-after:avoid}`);
      // A table row needs its whole height (padding and rule included) above the page bottom, not only its text: the cell's guard block
      // is that much taller (see tableCellBottomExtraMm).
      if (lead > 0) {
        const room = `${lead}mm + ${tableCellBottomExtraMm(section.rules.tables)}mm`;
        rules.push(`${fragment} :is(td,th)::after{height:calc(${room});margin:0 0 calc(-1 * (${room}))}`);
      }
      const flags = (style) => `${style.keepLines === undefined ? "" : `break-inside:${style.keepLines ? "avoid" : "auto"};`}${style.widowControl === undefined ? "" : `orphans:${style.widowControl ? 2 : 1};widows:${style.widowControl ? 2 : 1};`}${style.keepWithNext === undefined ? "" : `break-after:${style.keepWithNext ? "avoid" : "auto"};`}${style.pageBreakBefore ? "break-before:column;" : ""}`;
      rules.push(`${fragment} p{${flags(section.rules.body)}}`);
      // Per-style terminal leading (engine.js wordLastLineLeadings, MEASURED vs Word): the column carries the largest allowance; a paragraph
      // style whose own extra leading is smaller pads EVERY fragment's bottom (clone) by the difference, so each of its lines (not only the
      // last) stops that much earlier. A cancelling negative-margin ::after keeps the paragraph's total height unchanged. Not applied to
      // blocks with a reserve stamp: the note allocator captures and reapplies this padding itself. Break stamps only move the block and
      // must retain its native guard padding as well as the cancelling margin.
      const leadings = section.rules.lastLineLeadings;
      if (lead > 0 && leadings) {
        const nested = ":not(:is(td,th,figure,li,.academic-footnote-list) p)";
        const guard = (selector, own) => {
          const gap = Math.round((lead - own) * 1000) / 1000;
          if (gap > 0) rules.push(`${fragment} ${selector}${nested}:not([data-thesis-fn-stamp="reserve"]){box-decoration-break:clone;padding-bottom:${gap}mm}`, `${fragment} ${selector}${nested}::after{content:"";display:block;height:0;margin:0 0 -${gap}mm}`);
        };
        guard("p:not([data-thesis-style])", leadings.body);
        for (const [id, own] of Object.entries(leadings.styles || {})) guard(`p[data-thesis-style=${cssString(id)}]`, own);
      }
      for (const [id, style] of Object.entries(section.rules.paragraphStyles || {})) rules.push(`${fragment} p[data-thesis-style=${cssString(id)}]{${flags({ ...section.rules.body, ...style })}}`);
      for (const [level, style] of Object.entries(section.rules.headings)) rules.push(`${fragment} h${level}{${flags(style)}}`);
      if (section.rules.tables.cantSplit !== undefined) rules.push(`${fragment} tr{break-inside:${section.rules.tables.cantSplit ? "avoid" : "auto"}}`);
      if (section.rules.tables.repeatHeader === false) rules.push(`${fragment} thead{display:table-row-group}`);
      const terminalTextPath = section.specialPage && section.rules.page.trimTerminalTextLeading === true
        ? terminalTextBlockPath(section.layout)
        : null;
      if (terminalTextPath) {
        // An opted-in special page may trim unused leading after its terminal text block, without changing line-height or baseline.
        // Browsers without text-box-trim keep their normal visible extra-page behavior; no spacing fallback is applied.
        rules.push(`@supports (text-box-trim:trim-end){${fragment} [data-thesis-block=${cssString(terminalTextPath)}].thesis-layout-text{text-box-trim:trim-end}}`);
      }
      for (const [level, style] of Object.entries(section.rules.headings)) {
        if (!style.pageBreakBefore) continue;
        rules.push(`${fragment} h${level}{break-before:column}`, `${fragment} h${level}[data-unnumbered]{break-before:auto}`);
        if (style.pageBreakUnlessAfterHeading) rules.push(`${fragment} :is(h1,h2,h3,h4,h5,h6) + h${level}{break-before:auto}`,
          // The section title is fixed prefix content in its own wrapper, so `h + h` above never reaches the first heading of the
          // editable body (AKÜ Sağlık "7. EKLER" → "7.1."): Word (DOCX) keeps them on one page.
          `${fragment}>div[data-thesis-static-root]:has(>:is(h1,h2,h3,h4,h5,h6):last-child)+div>.rich-text-body>h${level}:first-child{break-before:auto}`);
      }
    }
  }
  return rules.join("\n");
}
