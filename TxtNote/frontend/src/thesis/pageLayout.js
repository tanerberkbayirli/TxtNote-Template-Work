import { formatNumber } from "./engine.js";
import { plainThesisText } from "./sourceHtml.js";
import { convertLength } from "./units.js";

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
export const THESIS_PAGE_GAP_PX = 28;
/** Fail-safe for pathological content: never render more physical sheets than this per group. */
export const THESIS_MAX_PAGES = 2000;

export function pageMetrics(page) {
  const margins = page.margins;
  const widthPx = page.widthMm * PX_PER_MM;
  const heightPx = page.heightMm * PX_PER_MM;
  const topMarginPx = margins.topMm * PX_PER_MM;
  const bottomMarginPx = margins.bottomMm * PX_PER_MM;
  return {
    widthPx, heightPx, topMarginPx, bottomMarginPx,
    contentWidthPx: (page.widthMm - margins.leftMm - margins.rightMm) * PX_PER_MM,
    contentHeightPx: heightPx - topMarginPx - bottomMarginPx,
    // Distance from one page's content box to the next: bottom margin, desk gap, top margin.
    rowGapPx: bottomMarginPx + THESIS_PAGE_GAP_PX + topMarginPx,
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

/** The PDF writer uses the same restart/advance rule per physical page. */
export function numberThesisPages(sections, pageCounts = {}) {
  let logicalPage = 0;
  return sections.map((section) => {
    const rule = section.rules.page.numbering;
    if (rule.restart) logicalPage = (rule.startAt || 1) - 1;
    if (!thesisGroupHasPageContent(section)) return { sectionId: section.id, labels: [] };
    const count = Math.max(1, Math.floor(pageCounts[section.id] || 1));
    const labels = Array.from({ length: count }, () => {
      logicalPage += 1;
      return rule.enabled ? formatNumber(logicalPage, rule.format) : "";
    });
    return { sectionId: section.id, labels };
  });
}

/**
 * Physical page model: one entry per sheet, derived from page groups and measured
 * counts only. It is presentation state; nothing here is stored in the document.
 * The editor draws sheets from it; print/export can consume the same model.
 */
export function buildThesisPageModel(groups, pageCounts = {}) {
  const numbers = numberThesisPages(groups, pageCounts);
  let physicalIndex = 0;
  return groups.map((group, groupIndex) => {
    const { numbering, header, footer } = group.rules.page;
    const pages = numbers[groupIndex].labels.map((label, index) => ({
      groupId: group.id,
      index,
      physicalIndex: physicalIndex++,
      label,
      numberPosition: numbering.position === "top" ? "top" : "bottom",
      numberAlign: ["left", "center", "right"].includes(numbering.align) ? numbering.align : "center",
      showHeader: !(index === 0 && header?.firstPage === "omit"),
      showFooter: !(index === 0 && footer?.firstPage === "omit"),
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
    // Keep a small, usable editing slot without reserving an A4 sheet.
    `.thesis-paper[data-thesis-empty-flow="true"]{min-height:0 !important;padding-top:8px !important;padding-bottom:8px !important}`,
    `${FLOW}[data-thesis-empty-flow="true"]{column-height:auto !important}`,
    `${FLOW} :is(h1,h2,h3,h4,h5,h6){break-inside:avoid}`,
    `${FLOW} :is(figure,.academic-figure,tr,caption){break-inside:avoid}`,
    // A table that fits on a page moves as a whole; a longer one still splits by row.
    `${FLOW} table{break-inside:avoid}`,
    `${FLOW} thead{display:table-header-group}`,
    // Scroll containers are monolithic for fragmentation; keep wrappers/code splittable.
    `${FLOW} :is(.academic-table-wrap,pre,.academic-code){overflow:visible}`,
    `${FLOW} .academic-page-break{break-after:column}`,
    // Page-bottom notes (footnotes.js): a page that shows notes gets less body. The
    // splittable block crossing the reduced limit repeats its bottom padding on every
    // fragment, so its first fragment stops above the notes; the negative margin
    // cancels the padding after its last fragment. A monolithic block moves instead.
    `${FLOW} [data-thesis-fn-stamp="reserve"]{box-decoration-break:clone;padding-bottom:attr(data-thesis-fn-reserve px) !important;margin-bottom:attr(data-thesis-fn-margin px) !important}`,
    `${FLOW} [data-thesis-fn-stamp="break"]{break-before:column !important}`,
    // Continuation-only pages after the body (a note longer than the rest of the document).
    `${FLOW} .thesis-footnote-tail{display:block;height:1px;margin:0;break-before:column}`,
  ];
  for (const group of groups) {
    const { page } = group.rules;
    const { topMm, bottomMm } = page.margins;
    const scope = `.thesis-paper[data-thesis-layout="paged"][data-thesis-section=${cssString(group.id)}] > .thesis-page-flow`;
    rules.push(`${scope}{column-height:${page.heightMm - topMm - bottomMm}mm;row-gap:calc(${bottomMm}mm + ${THESIS_PAGE_GAP_PX}px + ${topMm}mm)}`);
    for (const section of group.sections) {
      const fragment = `${FLOW} .thesis-flow-section[data-thesis-flow-section=${cssString(section.id)}] .thesis-body`;
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
      }
    }
  }
  return rules.join("\n");
}
