/**
 * `TextStyle.textTransformExceptions`: words that stay lower-case inside an uppercase/capitalize transform
 * ("MATERYAL ve METOT", "Materyal ve Metot"). CSS text-transform cannot skip words, so:
 * - generated text (TOC rows, Word runs, fallback PDF) goes through `transformThesisText` (engine.js);
 * - editor, print and the layout PDF show a heading's exception words inside `<span data-thesis-lower>`
 *   (CSS `text-transform: lowercase`); the layout PDF reads that computed style like any other text.
 * The spans are presentation only: `thesisSourceHtml` unwraps them, the note keeps the typed text, and the
 * editor's pass keeps the caret where it was (character offsets) and never runs during IME composition.
 */
export const LOWER_ATTR = "data-thesis-lower";
const TOKEN = /\S+/g;
const STEM = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

/** Lower-cased set of exception words for a style ("" entries dropped), or null. */
export function exceptionSet(style, language = "tr") {
  const words = (style?.textTransformExceptions || []).map((word) => String(word).trim().toLocaleLowerCase(language)).filter(Boolean);
  return words.length && (style.textTransform === "uppercase" || style.textTransform === "capitalize") ? new Set(words) : null;
}
export const isExceptionToken = (token, set, language = "tr") => set.has(token.replace(STEM, "").toLocaleLowerCase(language));

/** Print/static HTML: wrap the exception words of the text in `html` (tags are left alone). */
export function wrapExceptionWords(html, set, language = "tr") {
  return String(html || "").split(/(<[^>]*>)/).map((part) => part.startsWith("<") ? part : part.replace(TOKEN, (token) => isExceptionToken(token, set, language) ? `<span ${LOWER_ATTR}="true">${token}</span>` : token)).join("");
}

const textNodes = (root) => {
  const walker = root.ownerDocument.createTreeWalker(root, 4);
  const nodes = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) nodes.push(node);
  return nodes;
};

/** [{ node, start, end }] of the exception words, per text node. */
function exceptionRanges(heading, set, language) {
  const ranges = [];
  for (const node of textNodes(heading)) for (const match of node.data.matchAll(TOKEN)) if (isExceptionToken(match[0], set, language)) ranges.push({ node, start: match.index, end: match.index + match[0].length });
  return ranges;
}

const characterOffset = (heading, container, offset) => {
  const range = heading.ownerDocument.createRange();
  range.selectNodeContents(heading);
  range.setEnd(container, offset);
  return range.toString().length;
};
function positionAt(heading, offset) {
  let rest = offset;
  const nodes = textNodes(heading);
  for (const node of nodes) { if (rest <= node.data.length) return { node, offset: rest }; rest -= node.data.length; }
  const last = nodes.at(-1);
  return last ? { node: last, offset: last.data.length } : { node: heading, offset: 0 };
}

/** Bring one heading's spans in line with its text. Returns true when the DOM changed. */
export function syncExceptionSpans(heading, set, language = "tr") {
  const doc = heading.ownerDocument;
  const current = [...heading.querySelectorAll(`span[${LOWER_ATTR}]`)].map((span) => span.textContent);
  const wanted = exceptionRanges(heading, set, language).map(({ node, start, end }) => node.data.slice(start, end));
  if (current.length === wanted.length && current.every((word, i) => word === wanted[i])) return false;
  const selection = doc.getSelection();
  const inside = selection?.rangeCount && heading.contains(selection.anchorNode) && heading.contains(selection.focusNode);
  const saved = inside ? [characterOffset(heading, selection.anchorNode, selection.anchorOffset), characterOffset(heading, selection.focusNode, selection.focusOffset)] : null;
  for (const span of heading.querySelectorAll(`span[${LOWER_ATTR}]`)) span.replaceWith(...span.childNodes);
  heading.normalize();
  // Right to left, so earlier offsets in a text node stay valid while it is split.
  for (const { node, start, end } of exceptionRanges(heading, set, language).reverse()) {
    const word = node.splitText(start);
    word.splitText(end - start);
    const span = doc.createElement("span");
    span.setAttribute(LOWER_ATTR, "true");
    word.replaceWith(span);
    span.append(word);
  }
  if (saved) {
    const anchor = positionAt(heading, saved[0]);
    const focus = positionAt(heading, saved[1]);
    selection.setBaseAndExtent(anchor.node, anchor.offset, focus.node, focus.offset);
  }
  return true;
}

/** Editor pass: every heading whose level style lists exceptions. `root` holds the sections' `.thesis-body` elements. */
export function applyTransformExceptions(root, model) {
  if (root.__thesisComposing) return;
  for (const section of model.sections) {
    const host = section.editable ? root.querySelector(`[data-thesis-flow-section="${section.id}"] .thesis-body`) : null;
    if (!host) continue;
    for (const [level, style] of Object.entries(section.rules.headings)) {
      const set = exceptionSet(style, model.language);
      for (const heading of host.querySelectorAll(`h${level}`)) {
        if (set) syncExceptionSpans(heading, set, model.language);
        else if (heading.querySelector(`span[${LOWER_ATTR}]`)) syncExceptionSpans(heading, new Set(), model.language);
      }
    }
  }
}
