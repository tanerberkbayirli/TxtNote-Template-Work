import { pageMetrics } from "./pageLayout.js";

/** Preserve browser decisions that move a heading or indivisible figure/table to a new page.
 * This is export presentation data, never stored as document geometry.
 */
export function collectThesisBlockPageBreaks(root, groups) {
  const breaks = [];
  if (!root) return breaks;
  for (const group of groups) {
    const paper = [...root.querySelectorAll(".thesis-paper")].find(node => node.dataset.thesisSection === group.id);
    if (!paper) continue;
    const metrics = pageMetrics(group.rules.page);
    const frame = paper.getBoundingClientRect();
    const scale = frame.width / metrics.widthPx;
    const pageAt = y => Math.max(0, Math.floor((y - frame.top - metrics.topMarginPx * scale) / (metrics.stridePx * scale) + .001));
    for (const node of paper.querySelectorAll(".rich-text-body :is(figure,table,h1,h2,h3,h4,h5,h6)")) {
      const block = node.closest(".academic-table-wrap") || node;
      const previous = block.previousElementSibling;
      const identity = node.querySelector("caption,figcaption")?.dataset.thesisAnchor || node.dataset.thesisAnchor || node.dataset.academicId;
      if (!previous || !identity) continue;
      const previousRects = [...previous.getClientRects()];
      const currentRects = [...node.getClientRects()];
      if (!previousRects.length || !currentRects.length) continue;
      const lastBottom = Math.max(...previousRects.map(rect => rect.bottom));
      const firstTop = Math.min(...currentRects.map(rect => rect.top));
      if (pageAt(firstTop) > pageAt(lastBottom - scale)) breaks.push(identity);
    }
  }
  return breaks;
}
