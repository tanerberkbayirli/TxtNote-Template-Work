/**
 * Word's widow/orphan control keeps a paragraph of three lines whole: a 2+1 split leaves a widow, a 1+2 split an orphan. With
 * `orphans: 2; widows: 2` a browser cannot satisfy both for three lines (2 + 2 > 3), drops the rule and splits 2+1. This marks exactly
 * those paragraphs with `data-thesis-keep-lines` (CSS: `break-inside: avoid`). The line count depends only on text and width, never on
 * the page position, so one pass settles without cascading reflows. The mark is presentation state and is stripped from saved HTML.
 */
export const KEEP_LINES_ATTRIBUTE = "data-thesis-keep-lines";
const MIN_LINES = 2;
const MAX_LINES = 3;

/** Counts text lines from client rectangles: rectangles sharing a vertical band are one line (fragments of a split block stack apart). */
export function countLines(rects) {
  const sorted = rects.filter((rect) => rect.width > 0 && rect.height > 0).sort((a, b) => a.top - b.top || a.left - b.left);
  let lines = 0, bottom = -Infinity;
  for (const rect of sorted) {
    if (rect.top >= bottom - 1) { lines += 1; bottom = rect.bottom; }
    else bottom = Math.max(bottom, rect.bottom);
  }
  return lines;
}

/** Visual lines of `element` from its text nodes only (a Range over the element would also report the boxes of block children). */
export function visualLineCount(element, doc = element.ownerDocument) {
  const walker = doc.createTreeWalker(element, 4 /* NodeFilter.SHOW_TEXT */);
  const range = doc.createRange();
  const rects = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.nodeValue || !node.nodeValue.trim()) continue;
    range.selectNodeContents(node);
    rects.push(...range.getClientRects());
  }
  return countLines(rects);
}

/**
 * Stamps flow paragraphs and list items of two or three lines that have widow/orphan control (computed orphans and widows >= 2).
 * Returns a signature of the stamped set so a changed set triggers one more measurement pass.
 */
export function layoutShortParagraphKeeps(root, lineCount = visualLineCount) {
  // A list item that wraps block children is not a line box owner: its paragraphs are the candidates.
  const candidates = [...root.querySelectorAll(".thesis-page-flow .thesis-body :is(p, li)")]
    .filter((node) => !node.closest("table, figure, [data-thesis-generated]") && !node.querySelector("p, ul, ol, div, blockquote, h1, h2, h3, h4, h5, h6"));
  const view = root.ownerDocument.defaultView;
  const decisions = candidates.map((node) => {
    const style = view.getComputedStyle(node);
    const controlled = Number.parseInt(style.orphans, 10) >= 2 && Number.parseInt(style.widows, 10) >= 2;
    if (!controlled) return false;
    const lines = lineCount(node);
    return lines >= MIN_LINES && lines <= MAX_LINES;
  });
  let count = 0;
  candidates.forEach((node, index) => {
    const mark = decisions[index];
    if (mark) count += 1;
    if (mark !== node.hasAttribute(KEEP_LINES_ATTRIBUTE)) {
      if (mark) node.setAttribute(KEEP_LINES_ATTRIBUTE, ""); else node.removeAttribute(KEEP_LINES_ATTRIBUTE);
    }
  });
  return String(count);
}
