import { groupThesisSections } from "./engine.js";
import { buildThesisPageModel, flowPagePitchPx, pageCountFromFlowHeight, pageMetrics, thesisGroupHasPageContent } from "./pageLayout.js";
import { FOOTNOTE_REF_SELECTOR } from "./footnotes.js";
import { resolveIndent } from "./typography.js";

const NARROW = "data-thesis-mirror-narrow";
const UNSAFE_INSIDE = `${FOOTNOTE_REF_SELECTOR},.katex,[data-thesis-tab],[contenteditable="false"]`;

/**
 * Word quirk (MEASURED, engine-word-structure MIRF rows): with mirrorIndents and a POSITIVE first-line indent F the right limit of an
 * even-page line is `left + F`, so Word wraps even pages narrower by F than the glyph shift (right - left) alone gives. A transient
 * float of width F at the first line of every even-page fragment narrows exactly that page's lines; pages are handled in flow order, so
 * each later fragment start is read from the layout that already contains the earlier floats. `pageEnd(page)` is the flow offset of the
 * page's column end.
 */
function narrowEvenPages(paragraph, firstMm, pageAt, pageEnd, flowTop, zoom) {
  const doc = paragraph.ownerDocument;
  const stale = [...paragraph.querySelectorAll(`[${NARROW}]`)];
  for (const node of stale) { const parent = node.parentNode; node.remove(); parent?.normalize?.(); }
  if (!(firstMm > 0)) return;
  const collect = () => {
    const nodes = []; let total = 0;
    const walker = doc.createTreeWalker(paragraph, 4);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.length && !node.parentElement.closest("[data-thesis-tab],.math-formula")) { nodes.push({ node, start: total }); total += node.length; }
    }
    return { nodes, total };
  };
  const range = doc.createRange();
  const locate = (nodes, index) => {
    let low = 0, high = nodes.length - 1;
    while (low < high) { const mid = (low + high + 1) >> 1; if (nodes[mid].start <= index) low = mid; else high = mid - 1; }
    return { node: nodes[low].node, offset: index - nodes[low].start };
  };
  const rectAt = (nodes, total, index) => {
    for (let i = index; i < Math.min(total, index + 64); i += 1) {
      const { node, offset } = locate(nodes, i);
      range.setStart(node, offset); range.setEnd(node, Math.min(node.length, offset + 1));
      const rect = [...range.getClientRects()].find((item) => item.width > 0 || item.height > 0);
      if (rect) return rect;
    }
    return null;
  };
  const firstPage = () => { const { nodes, total } = collect(); const rect = total ? rectAt(nodes, total, 0) : null; return rect ? pageAt(rect) : null; };
  const lastPage = () => { const { nodes, total } = collect(); const rect = total ? rectAt(nodes, total, Math.max(0, total - 1)) : null; return rect ? pageAt(rect) : null; };
  const start = firstPage();
  if (start === null) return;
  for (let page = start, guard = 0; guard < 400; page += 1, guard += 1) {
    const end = lastPage();
    if (end === null || page > end) break;
    if ((page + 1) % 2 !== 0) continue; // odd (1-based) pages use the plain indents
    const { nodes, total } = collect();
    if (!total) break;
    // First character on `page` (character pages are monotonic in flow order); none: the page holds no part of this paragraph.
    let low = 0, high = total;
    while (low < high) { const mid = (low + high) >> 1; const rect = rectAt(nodes, total, mid); if (rect && pageAt(rect) >= page) high = mid; else low = mid + 1; }
    const first = low < total ? rectAt(nodes, total, low) : null;
    if (!first || pageAt(first) !== page) continue;
    const at = locate(nodes, low);
    // Before the spaces that end the previous line (a space between that line and the float would count into the line's width).
    while (at.offset > 0 && /\s/.test(at.node.data[at.offset - 1])) at.offset -= 1;
    range.setStart(at.node, at.offset); range.collapse(true);
    let outer = null;
    for (let node = at.node.parentElement; node && node !== paragraph; node = node.parentElement) if (node.matches(UNSAFE_INSIDE)) outer = node;
    if (outer) { range.setStartBefore(outer); range.collapse(true); }
    const float = doc.createElement("span");
    float.setAttribute(NARROW, String(firstMm)); float.setAttribute("contenteditable", "false");
    const style = (height) => `float:right;clear:none;width:${firstMm}mm;height:${height}px;margin:0;padding:0;border:0;pointer-events:none`;
    float.setAttribute("style", style(0));
    range.insertNode(float);
    // A zero-height float sits at the top of the line it opens; extend it to the page's column end without spilling into the next page.
    const top = (float.getBoundingClientRect().top - flowTop) / zoom;
    let height = pageEnd(page) - top - 0.5;
    for (let attempt = 0; attempt < 4 && height > 0; attempt += 1) {
      float.setAttribute("style", style(Math.round(height * 100) / 100));
      const rects = float.getClientRects();
      const spill = rects.length > 1 ? rects[1].height / zoom : 0;
      if (spill <= 0.01) break;
      height -= spill + 0.25;
    }
    if (!(height > 0) || float.getClientRects().length > 1) { const parent = float.parentNode; float.remove(); parent?.normalize?.(); }
  }
}

/**
 * Swapping paragraph indents preserves line width. Move only glyphs in even-page
 * fragments; keep column flow, line wrapping and the editable source intact.
 */
const mirrorProbe = new WeakMap();
function sectionMayMirror(section) {
  const rules = section?.rules;
  if (!rules) return true;
  if (!mirrorProbe.has(rules)) {
    const styles = [rules.body, ...Object.values(rules.paragraphStyles || {}), ...Object.values(rules.headings || {})];
    mirrorProbe.set(rules, styles.some((style) => resolveIndent(style || {}).mirror));
  }
  return mirrorProbe.get(rules);
}

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
    const metrics = pageMetrics(group.rules.page);
    const flow = article.querySelector(".thesis-page-flow");
    const flowTop = flow ? flow.getBoundingClientRect().top : 0;
    const flowPitch = flowPagePitchPx(metrics);
    const contentHeight = Math.floor(metrics.contentHeightPx * 64) / 64;
    const doc = root.ownerDocument;
    const pageAt = (rect) => firstPhysical + Math.max(0, Math.floor(((rect.top - origin) / zoom + 0.5) / stride));
    for (const section of group.sections || [group]) {
      // No paragraph of a section whose styles never mirror can contribute: skip the document scan.
      if (!sectionMayMirror(section)) continue;
      const host = article.querySelector(`[data-thesis-flow-section="${section.id}"]`) || article;
      for (const paragraph of host.querySelectorAll(".thesis-body :is(p,h1,h2,h3,h4,h5,h6)")) {
        const heading = /^H([1-6])$/.exec(paragraph.tagName);
        const style = heading ? section.rules.headings[heading[1]] : { ...section.rules.body, ...section.rules.paragraphStyles?.[paragraph.dataset.thesisStyle] };
        const indent = resolveIndent(style);
        if (!indent.mirror) continue;
        const delta = resolveIndent(style, true).left - indent.left;
        // Positive first-line indent: even pages wrap narrower by it (Word); see narrowEvenPages.
        narrowEvenPages(paragraph, indent.first, pageAt, (page) => (page - firstPhysical) * flowPitch + contentHeight, flowTop, zoom);
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
