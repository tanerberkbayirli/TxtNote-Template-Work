/** Physical document metrics shared by the editor, PDF and Word exporters. */
import { flattenCodeBlocksForAcademic } from "./codeBlock.js";
import { withoutInlineStyleAttributes } from "./cspStyles.js";
export const PAGE = Object.freeze({ widthMm: 210, heightMm: 297, marginMm: 25, pxPerMm: 96 / 25.4 });
export const CONTENT_WIDTH = (PAGE.widthMm - 2 * PAGE.marginMm) * PAGE.pxPerMm;
export const CONTENT_HEIGHT = (PAGE.heightMm - 2 * PAGE.marginMm) * PAGE.pxPerMm;
export const PAGE_HEIGHT_PX = PAGE.heightMm * PAGE.pxPerMm;
export const PAGE_MARGIN_PX = PAGE.marginMm * PAGE.pxPerMm;
export const PAGE_GAP_PX = 24;
export const PAGE_GAP_ATTR = "data-academic-page-gap";

export function pageSpacerHeight() {
  return 2 * PAGE_MARGIN_PX + PAGE_GAP_PX;
}

export function academicPageCountFromContent(contentHeightPx) {
  const height = Math.max(0, Number(contentHeightPx) || 0);
  return Math.max(1, Math.ceil((height - 0.5) / CONTENT_HEIGHT));
}

export function stripAcademicPageGaps(root) {
  if (!root?.querySelectorAll) return;
  root.querySelectorAll(`[${PAGE_GAP_ATTR}]`).forEach((el) => el.remove());
}

export function htmlWithoutPageGaps(html) {
  const raw = withoutInlineStyleAttributes(html);
  // Runs on every keystroke: skip re-parsing the whole note (multi-MB with images) when there is no gap.
  if (!raw.includes(PAGE_GAP_ATTR)) return raw;
  if (typeof document === "undefined") {
    return raw.replace(/<div[^>]*data-academic-page-gap[^>]*>\s*<\/div>/gi, "");
  }
  const template = document.createElement("template");
  template.innerHTML = raw;
  stripAcademicPageGaps(template.content);
  return template.innerHTML;
}

/** Collapse consecutive blank lines down to a single break. */
export function tightenAcademicText(text) {
  return String(text ?? "").replace(/(?:\r?\n[ \t\u200B]*){2,}/g, "\n");
}

function isBlockLike(node) {
  if (!(node instanceof Element)) return false;
  if (node.hasAttribute?.(PAGE_GAP_ATTR)) return true;
  if (node.classList?.contains("code-block") || node.classList?.contains("academic-code")) return true;
  if (node.classList?.contains("math-formula") && node.getAttribute("data-display") !== "inline") return true;
  return /^(DIV|P|H[1-6]|UL|OL|TABLE|FIGURE|PRE|BLOCKQUOTE|SECTION|HR)$/.test(node.tagName);
}

/** Drop serialization newlines between blocks and extra blank lines in prose. */
export function tightenAcademicFlow(root) {
  if (!root?.childNodes) return;

  const visit = (el) => {
    if (!el?.childNodes) return;
    if (el !== root && el.matches?.(FLOW_SKIP)) return;
    for (const node of [...el.childNodes]) {
      if (node.nodeType === 1) {
        visit(node);
        continue;
      }
      if (node.nodeType !== 3) continue;
      const nextText = tightenAcademicText(node.textContent ?? "");
      const prev = node.previousSibling;
      const next = node.nextSibling;
      if (!nextText.replace(/[\s\u200B]/g, "") && (isBlockLike(prev) || isBlockLike(next))) {
        node.remove();
        continue;
      }
      if (nextText !== node.textContent) node.textContent = nextText;
    }
  };
  visit(root);

  const body = root.matches?.(".body, .academic-body") ? root : root.querySelector?.(".body, .academic-body");
  if (!body) return;
  while (body.lastChild) {
    const last = body.lastChild;
    if (last.nodeType === 3 && !String(last.textContent).replace(/[\s\u200B]/g, "")) {
      last.remove();
      continue;
    }
    if (last.nodeName === "BR") {
      last.remove();
      continue;
    }
    break;
  }
}

const LOCKED_FIELD = "input, textarea, button, label";
  const FLOW_SKIP = "pre, textarea, input, table, .academic-table-wrap, .code-block, .math-formula, .code-block__source, .code-block__editor";
const CODE_FLOW = ".code-block, pre, .code-block__source, .code-block__render";
// Code listings split between pages on line boxes; keeping the whole <pre>
// unbreakable left a large empty band, then clipped the line at the sheet edge.
const PROTECTED_BLOCKS =
  "figure, img, tr, table, h1, h2, h3, figcaption, caption, .academic-figure, .academic-toc, .academic-page-break, .academic-bibliography__title, .fmt-size-heading, .fmt-size-subheading, .math-formula, .bibliography li, .academic-bibliography-list li, .academic-abstract, label.abstract";

export function isAcademicPageGap(node) {
  if (!node) return false;
  const el = node.nodeType === 1 ? node : node.parentElement;
  return Boolean(el?.closest?.(`[${PAGE_GAP_ATTR}]`));
}

function createPageGap(doc = document, height = pageSpacerHeight()) {
  const el = doc.createElement("div");
  el.setAttribute(PAGE_GAP_ATTR, "true");
  el.setAttribute("aria-hidden", "true");
  el.contentEditable = "false";
  el.className = "academic-page-gap";
  el.style.height = `${height}px`;
  return el;
}

function skipGapFilter(node) {
  if (node.parentElement?.closest(`[${PAGE_GAP_ATTR}]`)) return NodeFilter.FILTER_REJECT;
  if (node.parentElement?.closest(LOCKED_FIELD)) return NodeFilter.FILTER_REJECT;
  if (node.parentElement?.closest("[contenteditable='false']")) return NodeFilter.FILTER_REJECT;
  if (!node.textContent) return NodeFilter.FILTER_REJECT;
  return NodeFilter.FILTER_ACCEPT;
}

function textIndexFromPoint(root, node, offset) {
  if (!root || !node) return 0;
  const doc = root.ownerDocument;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: skipGapFilter });
  let index = 0;
  let current;
  while ((current = walker.nextNode())) {
    if (current === node) return index + Math.max(0, Math.min(offset, current.textContent.length));
    index += current.textContent.length;
  }
  if (node.nodeType === 1) {
    const probe = doc.createRange();
    try {
      probe.setStart(root, 0);
      probe.setEnd(node, Math.min(offset, node.childNodes.length));
    } catch {
      return index;
    }
    const walker2 = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: skipGapFilter });
    let counted = 0;
    let text;
    while ((text = walker2.nextNode())) {
      if (!probe.isPointInRange(text, 0) && !probe.isPointInRange(text, text.textContent.length)) {
        if (counted > 0) break;
        continue;
      }
      counted += text.textContent.length;
    }
    return counted;
  }
  return index;
}

function pointFromTextIndex(root, index) {
  const doc = root.ownerDocument;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: skipGapFilter });
  let remaining = Math.max(0, index);
  let current;
  let last = null;
  while ((current = walker.nextNode())) {
    last = current;
    const len = current.textContent.length;
    if (remaining <= len) return { node: current, offset: remaining };
    remaining -= len;
  }
  if (last) return { node: last, offset: last.textContent.length };
  return { node: root, offset: root.childNodes.length };
}

function saveTypingBookmark(article) {
  const doc = article.ownerDocument;
  const sel = doc.getSelection?.();
  if (!sel?.rangeCount) return null;
  const anchor = sel.anchorNode;
  if (!anchor || !article.contains(anchor)) return null;
  const anchorEl = anchor.nodeType === 1 ? anchor : anchor.parentElement;
  if (anchorEl?.closest(LOCKED_FIELD)) return null;
  if (!anchorEl?.closest("[contenteditable='true'], [contenteditable='']")) return null;
  return {
    anchor: textIndexFromPoint(article, sel.anchorNode, sel.anchorOffset),
    focus: textIndexFromPoint(article, sel.focusNode, sel.focusOffset),
    anchorNode: sel.anchorNode,
    anchorOffset: sel.anchorOffset,
    focusNode: sel.focusNode,
    focusOffset: sel.focusOffset,
  };
}

// The caret's own node is exact; a text index is ambiguous at a node boundary (the
// start of a list item would land at the end of the previous line). Text nodes are
// only reused while the caret offset still fits (a page gap may have split them).
function stableElementPoint(article, node, offset) {
  if (!node || !article.contains(node) || isAcademicPageGap(node)) return null;
  if (node.nodeType === 3) return offset <= node.length ? { node, offset: Math.max(0, offset) } : null;
  return { node, offset: Math.max(0, Math.min(offset, node.childNodes.length)) };
}

function restoreTypingBookmark(article, bookmark) {
  if (!bookmark) return;
  const doc = article.ownerDocument;
  const active = doc.activeElement;
  if (!active || !article.contains(active) || !active.isContentEditable) return;
  const sel = doc.getSelection?.();
  if (!sel) return;
  const start = stableElementPoint(article, bookmark.anchorNode, bookmark.anchorOffset) || pointFromTextIndex(article, bookmark.anchor);
  const end = stableElementPoint(article, bookmark.focusNode, bookmark.focusOffset) || pointFromTextIndex(article, bookmark.focus);
  // Anchor/focus order keeps a backward (Shift+Left) selection instead of collapsing it.
  try {
    sel.setBaseAndExtent(start.node, start.offset, end.node, end.offset);
  } catch {
    return;
  }
  snapSelectionOutOfLockedNodes(article.querySelector?.(".body, .academic-body") || article);
}

/** Line / figure boxes in the content area, same rules the PDF slicer uses. */
export function measureProtectedRanges(root, originTop, scale = 1) {
  const ranges = [];
  const boxes = [];
  if (!root || typeof originTop !== "number") return { ranges, boxes };

  const addRect = (rect, node, extra = {}) => {
    if (!rect || rect.height <= 0) return;
    const box = {
      top: Math.max(0, (rect.top - originTop - 1) / scale),
      bottom: (rect.bottom - originTop + 1) / scale,
      node,
      rect,
      ...extra,
    };
    ranges.push({ top: box.top, bottom: box.bottom });
    boxes.push(box);
  };

  root.querySelectorAll(PROTECTED_BLOCKS).forEach((el) => {
    if (el.closest(`[${PAGE_GAP_ATTR}]`)) return;
    addRect(el.getBoundingClientRect(), el, { kind: "block" });
  });

  const doc = root.ownerDocument;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: skipGapFilter });
  let text;
  while ((text = walker.nextNode())) {
    if (!text.textContent.trim()) continue;
    const range = doc.createRange();
    range.selectNodeContents(text);
    for (const rect of range.getClientRects()) addRect(rect, text, { kind: "line" });
  }
  boxes.sort((a, b) => a.top - b.top || a.bottom - b.bottom);
  return { ranges, boxes };
}

export function pageBreakYs(height, protectedRanges, capacity = CONTENT_HEIGHT) {
  const slices = pageSlices(height, protectedRanges, capacity);
  return slices.slice(0, -1).map((slice) => slice.start + slice.height);
}

export function boxBeforeBreak(boxes, breakY) {
  let best = null;
  const y = Number(breakY);
  for (const box of boxes) {
    if (box.bottom > y + 0.5) continue;
    if (!best || box.bottom > best.bottom || (box.bottom === best.bottom && box.top >= best.top)) {
      best = box;
    }
  }
  return best;
}

function lineEndOffset(textNode, lineRect) {
  const text = textNode.textContent ?? "";
  if (!text.length) return 0;
  const doc = textNode.ownerDocument;
  let lo = 0;
  let hi = text.length;
  const probe = doc.createRange();
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    probe.setStart(textNode, 0);
    probe.setEnd(textNode, mid);
    const rects = [...probe.getClientRects()];
    const last = rects[rects.length - 1];
    if (!last || last.top > lineRect.top + lineRect.height * 0.5) hi = mid - 1;
    else lo = mid;
  }
  return lo;
}

function nextTextNode(from, root) {
  const walker = from.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (node.parentElement?.closest(`[${PAGE_GAP_ATTR}]`)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  walker.currentNode = from;
  return walker.nextNode();
}

function rectsOnLine(rects, lineTop, lineBottom) {
  return [...rects].filter((rect) => rect.height > 0 && rect.bottom > lineTop + 0.5 && rect.top < lineBottom - 0.5);
}

/** Highlight.js splits a line into many tokens; always break after the last one. */
function visualLineInsertion(box) {
  const node = box?.node;
  if (!node || node.nodeType !== 3) return null;
  const lineTop = box.rect?.top;
  const lineBottom = box.rect?.bottom;
  if (lineTop == null) return { node, offset: node.textContent.length };

  const host =
    node.parentElement?.closest(CODE_FLOW) ||
    node.parentElement?.closest(".body, .academic-body, article") ||
    node.parentNode;
  let endNode = node;
  let current = node;
  while (current) {
    const next = nextTextNode(current, host);
    if (!next) break;
    const range = next.ownerDocument.createRange();
    try {
      range.selectNodeContents(next);
    } catch {
      break;
    }
    const onLine = rectsOnLine(range.getClientRects(), lineTop, lineBottom);
    if (onLine.length === 0) {
      if (!(next.textContent ?? "").replace(/[\s\u200B]/g, "")) {
        current = next;
        continue;
      }
      break;
    }
    endNode = next;
    current = next;
  }

  const probe = endNode.ownerDocument.createRange();
  probe.selectNodeContents(endNode);
  const endRects = rectsOnLine(probe.getClientRects(), lineTop, lineBottom);
  const lineRect = endRects[endRects.length - 1] || box.rect;
  let offset = lineEndOffset(endNode, lineRect);
  const text = endNode.textContent ?? "";
  if (offset < text.length && text[offset] === "\n") offset += 1;
  return { node: endNode, offset };
}

function tableRootOf(node, article) {
  const el = node?.nodeType === 1 ? node : node?.parentElement;
  const table = el?.closest?.("table");
  if (!table || !article.contains(table)) return null;
  return table.closest(".academic-table-wrap") || table;
}

function insertPageGapAfterBox(article, box, height) {
  const spacer = createPageGap(article.ownerDocument, height);
  const node = box?.node;
  if (!node || !article.contains(node)) {
    article.appendChild(spacer);
    return;
  }

  const table = tableRootOf(node, article);
  if (table) {
    table.parentNode?.insertBefore(spacer, table.nextSibling);
    return;
  }

  const lockedFrom = node.nodeType === 1 ? node : node.parentElement;
  const locked = lockedFrom?.closest?.(LOCKED_FIELD);
  if (locked && article.contains(locked)) {
    locked.parentElement?.insertBefore(spacer, locked.nextSibling);
    return;
  }

  if (node.nodeType === 1) {
    node.parentNode?.insertBefore(spacer, node.nextSibling);
    return;
  }

  const point = visualLineInsertion(box) || {
    node,
    offset: box.rect ? lineEndOffset(node, box.rect) : node.textContent.length,
  };
  const target = point.node;
  const offset = point.offset;
  if (!target || !article.contains(target)) {
    article.appendChild(spacer);
    return;
  }
  if (offset <= 0) {
    target.parentNode?.insertBefore(spacer, target);
    return;
  }
  if (offset >= (target.nodeValue?.length ?? 0)) {
    target.parentNode?.insertBefore(spacer, target.nextSibling);
    return;
  }
  const tail = target.splitText(offset);
  tail.parentNode?.insertBefore(spacer, tail);
}

export function snapSelectionOutOfPageGaps(root) {
  if (!root) return;
  const sel = root.ownerDocument.getSelection?.();
  if (!sel?.rangeCount) return;
  const node = sel.focusNode;
  if (!isAcademicPageGap(node)) return;
  const el = node.nodeType === 1 ? node : node.parentElement;
  const gap = el?.closest(`[${PAGE_GAP_ATTR}]`);
  if (!gap || !root.contains(gap)) return;
  const range = root.ownerDocument.createRange();
  range.setStartAfter(gap);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

/** Nested contenteditable=false (caption labels) swallows typing in WebView. */
export function snapSelectionOutOfLockedNodes(root) {
  if (!root) return false;
  const sel = root.ownerDocument.getSelection?.();
  if (!sel?.rangeCount) return false;
  const node = sel.focusNode;
  const el = node?.nodeType === 1 ? node : node?.parentElement;
  if (el?.closest?.("[contenteditable]")?.getAttribute("contenteditable") === "true") return false;
  const locked = el?.closest?.("[contenteditable='false']");
  if (!locked || locked === root || !root.contains(locked)) return false;
  const wrap = locked.closest(".academic-table-wrap") || locked;
  let pad = wrap.nextSibling;
  if (!pad || pad.nodeType !== 3) {
    pad = root.ownerDocument.createTextNode("\u200B");
    wrap.parentNode?.insertBefore(pad, wrap.nextSibling);
  }
  const range = root.ownerDocument.createRange();
  range.setStart(pad, pad.textContent?.length ?? 0);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  return true;
}

function nearestSiblingGap(fromNode, root, backward) {
  let node = fromNode;
  while (node && node !== root) {
    let sib = backward ? node.previousSibling : node.nextSibling;
    while (sib && sib.nodeType === 3 && !String(sib.textContent).replace(/\u200B/g, "")) {
      sib = backward ? sib.previousSibling : sib.nextSibling;
    }
    if (sib?.nodeType === 1 && sib.hasAttribute?.(PAGE_GAP_ATTR)) return sib;
    if (sib) return null;
    node = node.parentNode;
  }
  return null;
}

export function moveCaretAcrossPageGap(root, backward) {
  const sel = root.ownerDocument.getSelection?.();
  if (!sel?.rangeCount || !sel.isCollapsed) return false;
  const range = sel.getRangeAt(0);
  const container = range.startContainer;
  const offset = range.startOffset;
  if (backward && container.nodeType === 3 && offset > 0) return false;
  if (!backward && container.nodeType === 3 && offset < (container.textContent?.length ?? 0)) return false;
  const start = container.nodeType === 3
    ? container
    : (backward ? container.childNodes[offset - 1] : container.childNodes[offset]) || container;
  const gap = nearestSiblingGap(start, root, backward);
  if (!gap) return false;
  const next = root.ownerDocument.createRange();
  if (backward) next.setStartBefore(gap);
  else next.setStartAfter(gap);
  next.collapse(true);
  sel.removeAllRanges();
  sel.addRange(next);
  return true;
}

function measuredContentHeight(article, origin, boxes, options = {}) {
  const scale = options.scale || 1;
  const topMarginPx = options.topMarginPx ?? PAGE_MARGIN_PX;
  const bottomMarginPx = options.bottomMarginPx ?? PAGE_MARGIN_PX;
  let bottom = boxes.reduce((max, box) => Math.max(max, box.bottom), 0);
  article.querySelectorAll(".code-block, .academic-code, .math-formula--block, .academic-figure, figure, table, img").forEach((el) => {
    if (el.closest(`[${PAGE_GAP_ATTR}]`)) return;
    const rect = el.getBoundingClientRect();
    if (rect.height <= 0) return;
    bottom = Math.max(bottom, (rect.bottom - origin) / scale);
  });
  const raw = Math.max(0, article.scrollHeight - topMarginPx - bottomMarginPx);
  if (bottom <= 0) return raw;
  return Math.min(raw, bottom + 2);
}

/** Insert desk gaps at PDF line boundaries so a sheet never cuts a glyph in half. */
export function layoutAcademicPages(article, options = {}) {
  if (!article) return 1;
  const pageHeightPx = options.pageHeightPx ?? PAGE_HEIGHT_PX;
  const topMarginPx = options.topMarginPx ?? PAGE_MARGIN_PX;
  const bottomMarginPx = options.bottomMarginPx ?? PAGE_MARGIN_PX;
  const gapPx = options.gapPx ?? PAGE_GAP_PX;
  const scale = options.scale || 1;
  const capacity = pageHeightPx - topMarginPx - bottomMarginPx;
  const bookmark = saveTypingBookmark(article);
  stripAcademicPageGaps(article);
  if (options.clean !== false) {
    const body = article.querySelector(".body, .academic-body") || article;
    flattenCodeBlocksForAcademic(body);
    tightenAcademicFlow(article);
  }

  const origin = article.getBoundingClientRect().top + topMarginPx * scale;
  const { ranges, boxes } = measureProtectedRanges(article, origin, scale);
  const contentHeight = measuredContentHeight(article, origin, boxes, { scale, topMarginPx, bottomMarginPx });
  const forcedBreaks = options.respectPageBreakBefore ? [...article.querySelectorAll("h1,h2,h3,h4,h5,h6,.academic-page-break")]
    .filter((node) => node.classList.contains("academic-page-break") || getComputedStyle(node).breakBefore === "page")
    .map((node) => (node.getBoundingClientRect().top - origin) / scale)
    .filter((point) => point > 1) : [];
  const slices = pageSlices(contentHeight, ranges, capacity, forcedBreaks);

  for (let i = slices.length - 2; i >= 0; i -= 1) {
    const end = slices[i].start + slices[i].height;
    const box = boxBeforeBreak(boxes, end);
    const height = options.variableGap
      ? Math.max(0, pageHeightPx + gapPx - ((box?.bottom ?? end) - slices[i].start))
      : pageSpacerHeight();
    insertPageGapAfterBox(article, box, height);
  }

  restoreTypingBookmark(article, bookmark);
  return Math.max(1, slices.length);
}

// Scoped deliberately: export must never restyle the surrounding application.
export const ACADEMIC_CSS = `
.academic-document { box-sizing:border-box; width:210mm; padding:25mm; margin:0; background:#fff; color:#111; font:12pt/1.75 "Times New Roman",Times,"Liberation Serif",serif; text-align:left; }
.academic-document * { box-sizing:border-box; }
.academic-document .document-title { font:700 16pt/1.35 "Times New Roman",Times,serif; text-align:center; margin:0 0 14pt; padding:0; }
.academic-document .authors,.academic-document .institution,.academic-document .keywords { display:block; width:100%; height:auto; padding:0; border:0; border-radius:0; margin:0 0 4pt; background:transparent; color:#111; font:inherit; text-align:center; }
.academic-document .institution { font-style:italic; margin-bottom:8pt; }
.academic-document .keywords { font-size:10.5pt; font-style:italic; margin-bottom:16pt; }
.academic-document .abstract { margin:0 0 18pt; font-size:11pt; text-align:justify; white-space:pre-wrap; }
.academic-document .abstract h2 { font:700 12pt/1.4 "Times New Roman",Times,serif; margin:0 0 8pt; text-align:center; }
.academic-document .abstract p { margin:0; }
.academic-document .abstract textarea { width:100%; display:block; min-height:1.6em; padding:0; border:0; resize:none; overflow:hidden; background:transparent; color:#111; font:inherit; line-height:inherit; text-align:inherit; }
.academic-document .bibliography { margin:22pt 0 0; font-size:12pt; text-align:left; white-space:normal; }
.academic-document .bibliography h2 { font:700 12pt/1.4 "Times New Roman",Times,serif; margin:0 0 12pt; text-align:left; text-transform:uppercase; letter-spacing:0.02em; }
.academic-document .bibliography ul { list-style:none; padding:0; margin:0; font:inherit; color:#111; }
.academic-document .bibliography li { position:relative; padding-left:18pt; margin:0 0 10pt; line-height:1.55; text-align:left; }
.academic-document .bibliography li::before { content:""; position:absolute; left:0; top:0.55em; width:5.5pt; height:5.5pt; border-radius:50%; background:#000; }
.academic-document .body { display:flow-root; padding:0; margin:0; color:#111; font:inherit; white-space:pre-wrap; overflow-wrap:break-word; word-break:normal; tab-size:4; min-height:0; }
.academic-document .body p,.academic-document .body > div:not(.academic-page-gap) { margin:0 0 8pt; }
.academic-document .academic-code,.academic-document pre.academic-code { display:block; max-width:100%; margin:10pt 0; padding:0; border:0; background:transparent; color:#111; font:10.5pt/1.55 Consolas,"Courier New",monospace; white-space:pre-wrap; overflow-wrap:anywhere; word-break:break-word; tab-size:4; text-align:left; overflow:hidden; }
.academic-document .code-block { display:block; max-width:100%; overflow:hidden; margin:10pt 0; padding:0; background:transparent; border:0; white-space:normal; }
.academic-document .code-block__toolbar,.academic-document .code-block__copy,.academic-document .code-block__lang { display:none !important; }
.academic-document .code-block__render { margin:0; padding:0; max-width:100%; overflow:hidden; background:transparent; }
.academic-document .code-block__source,.academic-document .code-block__editor { display:block; max-width:100%; box-sizing:border-box; font:10.5pt/1.55 Consolas,"Courier New",monospace; white-space:pre-wrap !important; overflow-wrap:anywhere; word-break:break-word; tab-size:4; color:#111; }
.academic-document .code-block__source *,.academic-document .code-block .hljs-keyword,.academic-document .code-block .hljs-selector-tag,.academic-document .code-block .hljs-literal,.academic-document .code-block .hljs-section,.academic-document .code-block .hljs-link,.academic-document .code-block .hljs-string,.academic-document .code-block .hljs-bullet,.academic-document .code-block .hljs-addition,.academic-document .code-block .hljs-comment,.academic-document .code-block .hljs-quote,.academic-document .code-block .hljs-deletion,.academic-document .code-block .hljs-number,.academic-document .code-block .hljs-attr,.academic-document .code-block .hljs-variable,.academic-document .code-block .hljs-template-variable,.academic-document .code-block .hljs-type,.academic-document .code-block .hljs-title,.academic-document .code-block .hljs-built_in,.academic-document .code-block .hljs-name,.academic-document .code-block .hljs-meta,.academic-document .code-block .hljs-doctag,.academic-document .code-block .hljs-symbol { color:#111 !important; white-space:inherit; overflow-wrap:inherit; word-break:inherit; font-weight:inherit; }
.academic-document h1,.academic-document h2,.academic-document .fmt-size-heading { font-size:14pt; font-weight:700; line-height:1.4; }
.academic-document h3,.academic-document .fmt-size-subheading { font-size:12.5pt; font-weight:700; line-height:1.45; }
.academic-document h1,.academic-document h2,.academic-document h3 { margin:10pt 0 8pt; break-after:avoid; }
.academic-document h1.academic-h[data-number]::before,.academic-document h2.academic-h[data-number]::before,.academic-document h3.academic-h[data-number]::before { content: attr(data-number) " "; }
.academic-document .academic-toc { margin:12pt 0 18pt; }
.academic-document .academic-toc__title { font:700 14pt/1.4 "Times New Roman",Times,serif; margin:0 0 8pt; }
.academic-document .academic-toc__list { list-style:none; padding:0; margin:0; }
.academic-document .academic-toc__item { margin:0 0 4pt; }
.academic-document .academic-toc__item--h2 { padding-left:12pt; }
.academic-document .academic-toc__item--h3 { padding-left:24pt; }
.academic-document .academic-page-break { display:block; height:0; margin:14pt 0; border:0; border-top:1px dashed #bbb; break-after:page; page-break-after:always; }
.academic-document .academic-footnote { font-size:0.7em; line-height:1; vertical-align:super; }
.academic-document .academic-xref { font-style:italic; }
.academic-document .academic-caption-label { font-style:italic; pointer-events:none; user-select:none; }
.academic-document table caption { caption-side:top; font:italic 10pt/1.5 "Times New Roman",Times,serif; text-align:center; margin:0 0 6pt; white-space:normal; }
.academic-document .academic-caption-text { font-style:italic; }
.academic-document .math-formula--block[data-eq-numbered="true"] { position:relative; padding-right:28pt; }
.academic-document .math-formula--block[data-eq-numbered="true"]::after { content:"(" attr(data-number) ")"; position:absolute; right:0; top:50%; transform:translateY(-50%); font:12pt/1 "Times New Roman",Times,serif; }
.academic-document .fmt-size-body { font-size:12pt; line-height:1.75; }
.academic-document .fmt-pt-8 { font-size:8pt; }
.academic-document .fmt-pt-9 { font-size:9pt; }
.academic-document .fmt-pt-10 { font-size:10pt; }
.academic-document .fmt-pt-11 { font-size:11pt; }
.academic-document .fmt-pt-12 { font-size:12pt; }
.academic-document .fmt-pt-14 { font-size:14pt; }
.academic-document .fmt-pt-16 { font-size:16pt; }
.academic-document .fmt-pt-18 { font-size:18pt; }
.academic-document .fmt-pt-20 { font-size:20pt; }
.academic-document .fmt-pt-22 { font-size:22pt; }
.academic-document .fmt-pt-24 { font-size:24pt; }
.academic-document .fmt-bold { font-weight:700; }
.academic-document .fmt-italic { font-style:italic; }
.academic-document .fmt-underline { text-decoration:underline; text-underline-offset:0.18em; }
.academic-document .fmt-overline { text-decoration:overline; }
.academic-document .fmt-strike { text-decoration:line-through; }
.academic-document .fmt-underline.fmt-overline { text-decoration:underline overline; text-underline-offset:0.18em; }
.academic-document .fmt-underline.fmt-strike { text-decoration:underline line-through; text-underline-offset:0.18em; }
.academic-document .fmt-overline.fmt-strike { text-decoration:overline line-through; }
.academic-document .fmt-underline.fmt-overline.fmt-strike { text-decoration:underline overline line-through; text-underline-offset:0.18em; }
.academic-document .fmt-color-black { color:#111; }
.academic-document .fmt-color-red { color:#be123c; }
.academic-document .fmt-color-blue { color:#0369a1; }
.academic-document .fmt-color-green { color:#047857; }
.academic-document .fmt-align-left { text-align:left; }
.academic-document .fmt-align-center { text-align:center; }
.academic-document .fmt-align-right { text-align:right; }
.academic-document .fmt-align-justify { text-align:justify; }
.academic-document [class*="fmt-align-"]:not(table):not(thead):not(tbody):not(tr):not(th):not(td) { display:block; width:100%; }
.academic-document .academic-cite { font:inherit; color:inherit; background:none; padding:0; white-space:normal; }
.academic-document .academic-link { color:#123; text-decoration:underline; }
.academic-document .academic-figure { position:relative; display:block; margin:14pt 0; max-width:100%; text-align:center; white-space:normal; break-inside:avoid; }
.academic-document img { display:inline-block; max-width:100%; max-height:160mm; height:auto; object-fit:contain; border-radius:0; vertical-align:middle; }
.academic-document .academic-figure figcaption { font:italic 10pt/1.5 "Times New Roman",Times,serif; color:#111; margin:6pt 0 0; }
.academic-document .academic-bibliography { margin:22pt 0 0; padding:0; border:0; font:inherit; white-space:normal; }
.academic-document .academic-bibliography__title { font-size:14pt; font-weight:700; color:#111; margin:0 0 8pt; }
.academic-document .academic-bibliography ol { list-style:none; padding:0; margin:0; font:inherit; color:#111; }
.academic-document .academic-bibliography li { padding-left:12mm; text-indent:-12mm; margin:0 0 6pt; }
.academic-document ul,.academic-document ol { padding-left:24pt; margin:0 0 10pt; white-space:normal; }
.academic-document ul { list-style:disc; }
.academic-document ol { list-style:decimal; }
.academic-document blockquote { border-left:2pt solid #999; margin:10pt 0; padding-left:12pt; }
.academic-document .academic-table-wrap { display:block; width:100%; max-width:100%; margin:12pt 0; overflow-x:auto; white-space:normal; }
.academic-document .academic-table-wrap table,.academic-document table { display:table; width:100%; table-layout:fixed; border-collapse:collapse; margin:0; white-space:normal; background:#fff; }
.academic-document thead { display:table-header-group; }
.academic-document tbody { display:table-row-group; }
.academic-document tr { display:table-row; break-inside:avoid; }
.academic-document th,.academic-document td { display:table-cell; border:1px solid #737373; padding:6pt 8pt; vertical-align:top; white-space:normal; color:#111; background:#fff; min-width:1.6em; }
.academic-document pre { max-width:100%; overflow:hidden; font:10pt/1.5 Consolas,"Courier New",monospace; white-space:pre-wrap; overflow-wrap:anywhere; word-break:break-word; }
`;

export function fitImageSize(width, height, maxWidth = CONTENT_WIDTH, maxHeight = 160 * PAGE.pxPerMm) {
  const w = Number(width) > 0 ? Number(width) : maxWidth;
  const h = Number(height) > 0 ? Number(height) : w * 0.625;
  const scale = Math.min(1, maxWidth / w, maxHeight / h);
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
}

/** Move a boundary before crossing lines, figures or table rows, unless oversized. */
export function pageSlices(height, protectedRanges, capacity = CONTENT_HEIGHT, forcedBreaks = []) {
  const pages = [];
  let start = 0;
  while (start < height - 0.5 && pages.length < 500) {
    let end = Math.min(height, start + capacity);
    const forced = forcedBreaks.find((point) => point > start + 1 && point < end);
    if (forced !== undefined) end = forced;
    let moved = true;
    while (moved) {
      moved = false;
      for (const { top, bottom } of protectedRanges) {
        if (top < end && bottom > end && top > start + 1 && bottom - top <= capacity) {
          end = top;
          moved = true;
        }
      }
    }
    if (end <= start + 0.5) end = Math.min(height, start + Math.max(1, capacity));
    pages.push({ start, height: end - start });
    start = end;
  }
  return pages.length ? pages : [{ start:0, height:1 }];
}
