import { groupThesisSections } from "./engine.js";
import { buildThesisPageModel, pageCountFromFlowHeight, pageMetrics, thesisGroupHasPageContent } from "./pageLayout.js";
import { resolveIndent } from "./typography.js";

/**
 * Swapping paragraph indents preserves line width. Move only glyphs in even-page
 * fragments; keep column flow, line wrapping and the editable source intact.
 */
export function measureMirroredIndentsCss(root, model) {
  if (!root || !model) return "";
  const groups = groupThesisSections(model.sections);
  const counts = {};
  for (const group of groups) {
    const article = root.querySelector(`.thesis-paper[data-thesis-section="${group.id}"]`);
    const flow = article?.querySelector(".thesis-page-flow");
    counts[group.id] = !thesisGroupHasPageContent(group) ? 0 : flow ? pageCountFromFlowHeight(flow.offsetHeight, pageMetrics(group.rules.page)) : 1;
  }
  const pages = buildThesisPageModel(groups, counts);
  const css = [];
  let ordinal = 0;
  for (const [groupIndex, group] of groups.entries()) {
    const article = root.querySelector(`.thesis-paper[data-thesis-section="${group.id}"]`);
    if (!article || !pages[groupIndex].pages.length) continue;
    const stack = article.parentElement;
    const zoom = new DOMMatrixReadOnly(getComputedStyle(stack).transform).a || 1;
    const origin = stack.getBoundingClientRect().top;
    const stride = pageMetrics(group.rules.page).stridePx;
    const firstPhysical = pages[groupIndex].pages[0].physicalIndex;
    const doc = root.ownerDocument;
    const pageAt = (rect) => firstPhysical + Math.max(0, Math.floor(((rect.top - origin) / zoom + 0.5) / stride));
    for (const section of group.sections || [group]) {
      const host = article.querySelector(`[data-thesis-flow-section="${section.id}"]`) || article;
      for (const paragraph of host.querySelectorAll(".thesis-body :is(p,h1,h2,h3,h4,h5,h6)")) {
        const heading = /^H([1-6])$/.exec(paragraph.tagName);
        const style = heading ? section.rules.headings[heading[1]] : { ...section.rules.body, ...section.rules.paragraphStyles?.[paragraph.dataset.thesisStyle] };
        const indent = resolveIndent(style);
        if (!indent.mirror) continue;
        const delta = resolveIndent(style, true).left - indent.left;
        const objectOffset = (element) => (pageAt(element.getBoundingClientRect()) + 1) % 2 === 0 ? delta : 0;
        for (const element of paragraph.querySelectorAll("[data-thesis-tab],.math-formula,img")) {
          const id = `mirror-object-${ordinal++}`;
          if (element.dataset.thesisMirrorObject !== id) element.dataset.thesisMirrorObject = id;
          css.push(`[data-thesis-mirror-object="${id}"]{position:relative;left:${objectOffset(element)}mm}`);
        }
        if (heading && paragraph.hasAttribute("data-thesis-number")) {
          const id = `mirror-heading-${ordinal++}`;
          if (paragraph.dataset.thesisMirrorHeading !== id) paragraph.dataset.thesisMirrorHeading = id;
          css.push(`[data-thesis-mirror-heading="${id}"]::before{position:relative;left:${objectOffset(paragraph)}mm}`);
        }
        const walker = doc.createTreeWalker(paragraph, 4), texts = [];
        while (walker.nextNode()) if (walker.currentNode.length && !walker.currentNode.parentElement.closest("[data-thesis-tab],.math-formula")) texts.push(walker.currentNode);
        for (const text of texts) {
          const range = doc.createRange();
          const at = (offset) => {
            range.setStart(text, offset); range.setEnd(text, Math.min(text.length, offset + 1));
            const rect = [...range.getClientRects()].find((r) => r.height) || paragraph.getBoundingClientRect();
            return pageAt(rect);
          };
          const runs = [];
          let start = 0;
          while (start < text.length) {
            const page = at(start);
            let low = start + 1, high = text.length;
            // Page indices of characters are monotonically increasing in flow.
            while (low < high) {
              const mid = Math.floor((low + high) / 2);
              if (at(mid) === page) low = mid + 1; else high = mid;
            }
            runs.push({ start, end: low, page }); start = low;
          }
          const existing = text.parentElement.matches("[data-thesis-mirror]") ? text.parentElement : null;
          if (existing && runs.length === 1 && existing.childNodes.length === 1) {
            const id = `mirror-${ordinal++}`;
            if (existing.dataset.thesisMirror !== id) existing.dataset.thesisMirror = id;
            const offset = (runs[0].page + 1) % 2 === 0 ? delta : 0;
            css.push(`[data-thesis-mirror="${id}"]{position:relative;left:${offset}mm}`);
            continue;
          }
          if (existing) existing.replaceWith(...existing.childNodes);
          let remaining = text;
          for (const run of runs) {
            const size = run.end - run.start;
            const tail = size < remaining.length ? remaining.splitText(size) : null;
            const span = doc.createElement("span"), id = `mirror-${ordinal++}`;
            span.dataset.thesisMirror = id;
            remaining.before(span); span.append(remaining);
            const offset = (run.page + 1) % 2 === 0 ? delta : 0;
            css.push(`[data-thesis-mirror="${id}"]{position:relative;left:${offset}mm}`);
            remaining = tail;
          }
        }
      }
    }
  }
  return css.join("\n");
}
