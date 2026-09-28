/**
 * Helpers for the contentEditable note body.
 */

import { DEFAULT_FORMAT, formatClassName, mergeFormatClassName, parsePartialFormat } from "../config/format";
import { withoutInlineStyleAttributes } from "./cspStyles.js";
import {
  beginCodeEdit,
  codeMarkerAt,
  codeOpenAt,
  createAcademicCodeElement,
  createCodeElement,
  ensureCodeCaretPads,
  isCodeBlockEl,
  renderCodeElement,
} from "./codeBlock.js";
import {
  beginMathEdit,
  createMathElement,
  ensureMathCaretPads,
  formulaSource,
  isMathFormulaEl,
  mathMarkerAt,
  mathOpenAt,
  placeCaretAfterMath,
  renderMathElement,
} from "./mathFormula.js";
import { markerAt, parseTextMarkup, sentenceBreakAt } from "./textMarkup.js";

/** Entities count too: "a&nbsp;b" is saved editor output, not raw user text. */
const HTML_MARKUP = /<[a-z!/][\s\S]*>|&(?:[a-z]+|#\d+);/i;
const FORMAT_CLASS = /fmt-(size|color|pt)-|fmt-(bold|italic|strike|underline|overline)/;

/** True when the string already looks like HTML from the editor. */
export function isHtmlContent(content) {
  return Boolean(content && HTML_MARKUP.test(content));
}

/** Escape plain text for safe HTML insertion. */
export function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Plain-text notes (pre-formatting) become line breaks, not block divs. */
export function ensureHtml(content, options) {
  if (!content) return "";
  if (isHtmlContent(content)) return sanitizeHtml(content);
  return parseTextMarkup(content, options);
}

/**
 * Drop scripted tags and javascript: URLs before HTML hits contentEditable.
 * Editor-generated markup (fmt-* spans, br, div) is left intact.
 */
export function sanitizeHtml(html) {
  if (!html || typeof document === "undefined") return html ?? "";

  const template = document.createElement("template");
  template.innerHTML = withoutInlineStyleAttributes(html);

  const banned = new Set([
    "SCRIPT",
    "IFRAME",
    "OBJECT",
    "EMBED",
    "LINK",
    "META",
    "BASE",
    "FORM",
    "STYLE",
    "SVG",
    "MATH",
    "TEMPLATE",
    "APPLET",
  ]);
  const urlAttrs = new Set(["href", "src", "xlink:href", "action", "formaction", "poster", "background", "cite"]);
  const walk = (root) => {
    [...root.childNodes].forEach((child) => {
      if (!(child instanceof HTMLElement)) return;
      if (banned.has(child.tagName)) {
        child.remove();
        return;
      }
      if (child.tagName === "MARK") {
        walk(child);
        const parent = child.parentNode;
        if (parent) {
          while (child.firstChild) parent.insertBefore(child.firstChild, child);
          child.remove();
        }
        return;
      }
      [...child.attributes].forEach((attr) => {
        const name = attr.name.toLowerCase();
        const value = attr.value;
        const keepStyle =
          name === "style" &&
          (child.closest(".math-formula, .code-block") != null ||
            (typeof child.className === "string" &&
              (child.className.includes("katex") || child.className.includes("hljs"))));
        if (name.startsWith("on") || name === "srcdoc" || (name === "style" && !keepStyle)) {
          child.removeAttribute(attr.name);
          return;
        }
        if (
          urlAttrs.has(name) &&
          /^\s*(javascript|vbscript|data\s*:\s*(text\/html|image\/svg|application\/xhtml))/i.test(value)
        ) {
          child.removeAttribute(attr.name);
        }
      });
      walk(child);
    });
  };
  walk(template.content);
  return template.innerHTML;
}

/** Strip tags for word counts and emptiness checks. */
export function htmlToPlainText(html) {
  if (!html) return "";
  if (!isHtmlContent(html)) return String(html);
  if (typeof document === "undefined") {
    return String(html)
      .replace(/data-latex="([^"]*)"/gi, " ##math##$1##math## ")
      .replace(/data-code="([^"]*)"/gi, " $1 ")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/\u200B/g, "");
  }

  const template = document.createElement("template");
  template.innerHTML = withoutInlineStyleAttributes(html);
  const parts = [];
  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      parts.push(node.textContent ?? "");
      return;
    }
    if (!(node instanceof HTMLElement)) {
      node.childNodes.forEach(walk);
      return;
    }
    if (isMathFormulaEl(node)) {
      parts.push(formulaSource(node));
      return;
    }
    if (isCodeBlockEl(node)) {
      parts.push(node.getAttribute("data-code") ?? node.textContent ?? "");
      return;
    }
    node.childNodes.forEach(walk);
  };
  walk(template.content);
  return parts.join("").replace(/\u200B/g, "");
}

/** Plain text with line breaks kept, so paragraphs can be counted. */
export function htmlToCountableText(html) {
  if (!html) return "";
  if (!isHtmlContent(html)) return String(html).replace(/\u00a0/g, " ");
  if (typeof document === "undefined") {
    return String(html)
      .replace(/data-latex="([^"]*)"/gi, " ##math##$1##math## ")
      .replace(/data-code="([^"]*)"/gi, " $1 ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(?:div|p|h[1-6]|li|blockquote)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\u00a0/g, " ");
  }

  const root = document.createElement("template");
  root.innerHTML = withoutInlineStyleAttributes(html);
  const parts = [];
  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      parts.push((node.textContent ?? "").replace(/\u200B/g, ""));
      return;
    }
    if (!(node instanceof HTMLElement)) {
      node.childNodes.forEach(walk);
      return;
    }
    if (isMathFormulaEl(node)) {
      parts.push(formulaSource(node));
      if (node.getAttribute("data-display") !== "inline") parts.push("\n");
      return;
    }
    if (isCodeBlockEl(node)) {
      parts.push(node.getAttribute("data-code") ?? node.textContent ?? "");
      parts.push("\n");
      return;
    }
    if (node.tagName === "BR") {
      parts.push("\n");
      return;
    }
    const isBlock = /^(DIV|P|H[1-6]|LI|BLOCKQUOTE|TR|FIGURE|FIGCAPTION)$/.test(node.tagName);
    if (node.tagName === "IMG") return;
    node.childNodes.forEach(walk);
    if (isBlock) parts.push("\n");
  };
  walk(root.content);
  return parts.join("").replace(/\u00a0/g, " ");
}

/** Word, paragraph and letter counts for the note body. Digits count as letters. */
export function noteBodyStats(html) {
  const text = htmlToCountableText(html);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const paragraphs = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean).length;
  const letters = (text.match(/\p{L}|\p{N}/gu) ?? []).length;
  return { words, paragraphs, letters };
}

function isFormatSpan(node) {
  return node instanceof HTMLSpanElement && FORMAT_CLASS.test(node.className);
}

/** Walk from the node up, so nested size/colour/style spans combine. */
export function readFormatFromNode(node) {
  const chain = [];
  let el = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node;
  while (el instanceof HTMLElement) {
    if (isFormatSpan(el)) chain.unshift(el);
    if (el.getAttribute("contenteditable") === "true") break;
    el = el.parentElement;
  }

  let format = { ...DEFAULT_FORMAT };
  for (const span of chain) {
    format = { ...format, ...parsePartialFormat(span.className) };
  }
  return format;
}

/** Format of the selection — mixed size/colour fall back to Normal + black. */
export function readFormatFromRange(range) {
  if (!range) return { ...DEFAULT_FORMAT };

  const nodes = range.collapsed ? [] : getTextNodesInRange(range);
  const samples =
    nodes.length > 0 ? nodes : [sampleNodeForFormat(range) ?? range.startContainer];
  const formats = samples.map((node) => readFormatFromNode(node));
  if (formats.length === 0) return { ...DEFAULT_FORMAT };

  const [first, ...rest] = formats;
  const same = (key) => rest.every((row) => row[key] === first[key]);

  return {
    size: same("size") ? first.size : DEFAULT_FORMAT.size,
    color: same("color") ? first.color : DEFAULT_FORMAT.color,
    bold: formats.every((row) => row.bold),
    italic: formats.every((row) => row.italic),
    strike: formats.every((row) => row.strike),
    underline: formats.every((row) => row.underline),
    overline: formats.every((row) => row.overline),
  };
}

/** Whether `range` still points inside `root`. Stale ranges survive DOM edits. */
export function isRangeInRoot(range, root) {
  if (!range || !root) return false;
  try {
    return root.contains(range.commonAncestorContainer);
  } catch {
    return false;
  }
}

function deepestTextNode(node, fromEnd = false) {
  if (!node) return null;
  if (node.nodeType === Node.TEXT_NODE) return node;
  if (node instanceof HTMLElement) {
    const { childNodes } = node;
    if (childNodes.length === 0) return null;
    return deepestTextNode(fromEnd ? childNodes[childNodes.length - 1] : childNodes[0], fromEnd);
  }
  return null;
}

/** Collapsed carets often sit on the editable root between spans — sample nearby text. */
function sampleNodeForFormat(range) {
  if (!range?.collapsed) return null;

  const { startContainer, startOffset } = range;
  if (startContainer.nodeType === Node.TEXT_NODE) return startContainer;

  if (startContainer instanceof HTMLElement) {
    if (startOffset > 0) {
      const prev = deepestTextNode(startContainer.childNodes[startOffset - 1], true);
      if (prev) return prev;
    }
    if (startOffset < startContainer.childNodes.length) {
      const next = deepestTextNode(startContainer.childNodes[startOffset], false);
      if (next) return next;
    }
  }

  return startContainer;
}

function elementOwnsStyle(el, style) {
  if (!(el instanceof HTMLElement)) return false;
  if (isFormatSpan(el) && parsePartialFormat(el.className)[style]) return true;
  if (style === "strike" && /^(S|STRIKE|DEL)$/.test(el.tagName)) return true;
  if (style === "underline" && el.tagName === "U") return true;
  if (style === "overline" && /overline/i.test(el.style?.textDecorationLine || el.style?.textDecoration || "")) return true;
  if (style === "bold" && /^(B|STRONG)$/.test(el.tagName)) return true;
  if (style === "italic" && /^(I|EM)$/.test(el.tagName)) return true;
  return false;
}

/** The element itself is an editing host — not merely nested inside one. */
function isEditingHost(el) {
  if (!(el instanceof HTMLElement)) return false;
  const value = el.getAttribute("contenteditable");
  return value === "true" || value === "";
}

/**
 * When the caret sits inside (or just after) styled text, expand to that run
 * so a second click / Ctrl+B can turn the style off without a manual select.
 *
 * Do not use `el.isContentEditable`: it is true for every node inside the
 * body, so the walk would never reach the format span and strike/overline
 * could not be removed from existing text.
 */
export function expandRangeForStyleToggle(range, root, style) {
  if (!range || !root) return range?.cloneRange?.() ?? null;
  if (!range.collapsed) return range.cloneRange();

  const sample = sampleNodeForFormat(range);
  let el = sample?.nodeType === Node.TEXT_NODE ? sample.parentElement : sample;
  let match = null;
  while (el instanceof HTMLElement && root.contains(el) && el !== root) {
    if (isEditingHost(el)) break;
    if (elementOwnsStyle(el, style)) match = el;
    el = el.parentElement;
  }
  if (!match) return range.cloneRange();
  const expanded = document.createRange();
  expanded.selectNodeContents(match);
  return expanded;
}

/** Text nodes whose characters intersect the range, in document order. */
function getTextNodesInRange(range) {
  if (range.collapsed) return [];

  const root = range.commonAncestorContainer;
  const walkerRoot = root.nodeType === Node.TEXT_NODE ? root.parentNode : root;
  if (!walkerRoot) return [];

  const nodes = [];
  const walker = document.createTreeWalker(walkerRoot, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (node.parentElement?.closest(".math-formula, .code-block")) return NodeFilter.FILTER_REJECT;

      const nodeRange = document.createRange();
      nodeRange.selectNodeContents(node);

      if (
        range.compareBoundaryPoints(Range.END_TO_START, nodeRange) >= 0 ||
        range.compareBoundaryPoints(Range.START_TO_END, nodeRange) <= 0
      ) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let node;
  while ((node = walker.nextNode())) {
    nodes.push(node);
  }
  return nodes;
}

function sliceBounds(textNode, range) {
  const length = textNode.textContent?.length ?? 0;
  let start = 0;
  let end = length;

  if (range.startContainer === textNode) start = range.startOffset;
  if (range.endContainer === textNode) end = range.endOffset;

  return { start: Math.max(0, start), end: Math.min(length, Math.max(start, end)) };
}

function isLiftableHost(node) {
  return (
    isFormatSpan(node) ||
    (node instanceof HTMLElement && /^(S|STRIKE|DEL|U|B|STRONG|I|EM)$/.test(node.tagName))
  );
}

/** Lift a formatted run out of inherited style spans, keeping both untouched sides. */
function isolateFormatRun(node) {
  while (isLiftableHost(node.parentNode)) {
    const parent = node.parentNode;
    const before = parent.cloneNode(false);
    const after = parent.cloneNode(false);
    while (parent.firstChild !== node) before.appendChild(parent.firstChild);
    while (node.nextSibling) after.appendChild(node.nextSibling);
    const fragment = document.createDocumentFragment();
    if (before.childNodes.length) fragment.appendChild(before);
    fragment.appendChild(node);
    if (after.childNodes.length) fragment.appendChild(after);
    parent.replaceWith(fragment);
  }
  return node;
}

/** Split a text node and wrap the selected slice; only `patch` is written. */
function wrapTextSlice(textNode, range, patch) {
  const { start, end } = sliceBounds(textNode, range);
  if (start >= end) return null;

  const text = textNode.textContent ?? "";
  const before = text.slice(0, start);
  const middle = text.slice(start, end);
  const after = text.slice(end);

  if (!middle.replace(/\u200B/g, "")) return null;

  const parent = textNode.parentNode;
  if (!parent) return null;

  const patchedClass = formatClassName({ ...readFormatFromNode(textNode), ...patch });

  // Format span with only this text: split into sibling spans so turning a
  // style off (bold → not bold) does not inherit it from a wrapping parent.
  if (isFormatSpan(parent) && parent.childNodes.length === 1 && parent.firstChild === textNode) {
    if (!before && !after) {
      if (!patchedClass.trim()) {
        const grand = parent.parentNode;
        if (grand) {
          const plain = document.createTextNode(middle);
          grand.replaceChild(plain, parent);
          return plain;
        }
      }
      parent.className = patchedClass;
      return isolateFormatRun(parent);
    }

    const grand = parent.parentNode;
    const next = parent.nextSibling;
    const keepClass = parent.className;
    grand.removeChild(parent);

    const insert = (piece, className) => {
      if (!piece) return null;
      const span = document.createElement("span");
      span.className = className;
      span.textContent = piece;
      grand.insertBefore(span, next);
      return span;
    };

    insert(before, keepClass);
    const mid = insert(middle, patchedClass);
    insert(after, keepClass);
    return isolateFormatRun(mid);
  }

  const anchor = textNode.nextSibling;
  parent.removeChild(textNode);

  if (before) parent.insertBefore(document.createTextNode(before), anchor);

  const span = document.createElement("span");
  span.className = patchedClass;
  span.textContent = middle;
  parent.insertBefore(span, anchor);

  if (after) parent.insertBefore(document.createTextNode(after), anchor);

  return isolateFormatRun(span);
}

/** Move the caret to just after a formatted run so typing continues unstyled. */
function collapseCaretAfter(node) {
  const sel = window.getSelection();
  if (!sel || !node) return;

  const range = document.createRange();
  if (node.nodeType === Node.TEXT_NODE) {
    range.setStart(node, node.textContent?.length ?? 0);
  } else if (node instanceof HTMLElement) {
    range.selectNodeContents(node);
    range.collapse(false);
  } else {
    return;
  }
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

/** Apply one pick (size, colour, or a style toggle) to every character in the range. */
export function applyFormatToRange(range, patch, preserveSelection = false) {
  const textNodes = getTextNodesInRange(range);

  if (textNodes.length === 0) {
    return applyFormatAtCursor(range, patch);
  }

  const wrapped = [];
  for (let i = textNodes.length - 1; i >= 0; i -= 1) {
    const span = wrapTextSlice(textNodes[i], range, patch);
    if (span) wrapped.unshift(span);
  }

  if (wrapped.length > 0) {
    if (preserveSelection) {
      const selected = document.createRange();
      selected.setStartBefore(wrapped[0]);
      selected.setEndAfter(wrapped[wrapped.length - 1]);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(selected);
    } else collapseCaretAfter(wrapped[wrapped.length - 1]);
    return wrapped[0];
  }

  return applyFormatAtCursor(range, patch);
}

/** Place the caret inside a styled span so the next keystrokes inherit this pick. */
export function applyFormatAtCursor(range, patch) {
  const inherited = readFormatFromNode(range.startContainer);
  const span = document.createElement("span");
  span.className = formatClassName({ ...inherited, ...patch });

  const anchor = document.createTextNode("\u200B");
  span.appendChild(anchor);
  range.insertNode(span);
  isolateFormatRun(span);

  range.setStart(anchor, 1);
  range.collapse(true);

  const sel = window.getSelection();
  if (sel) {
    sel.removeAllRanges();
    sel.addRange(range);
  }

  return span;
}

/** Clone the current selection when it lives inside `root`. */
export function captureSelection(root) {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return { range: null, hadSelection: false };

  const range = sel.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) {
    return { range: null, hadSelection: false };
  }

  return {
    range: range.cloneRange(),
    hadSelection: !sel.isCollapsed,
  };
}

/** Whether the caret sits at the very start of the editable root. */
export function isCaretAtBodyStart(root) {
  const sel = window.getSelection();
  if (!sel?.rangeCount || !sel.isCollapsed) return false;

  const range = sel.getRangeAt(0);
  if (!root.contains(range.startContainer)) return false;

  const probe = document.createRange();
  probe.selectNodeContents(root);
  probe.setEnd(range.startContainer, range.startOffset);

  return probe.toString().replace(/\u200B/g, "").length === 0;
}

/** Move the caret to the start of a contentEditable root. */
export function focusEditableStart(root) {
  root.focus();
  const range = document.createRange();
  range.selectNodeContents(root);
  range.collapse(true);
  const sel = window.getSelection();
  if (sel) {
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

/** Move the caret to the end of a contentEditable root. */
export function focusEditableEnd(root) {
  root.focus();
  const range = document.createRange();
  range.selectNodeContents(root);
  range.collapse(false);
  const sel = window.getSelection();
  if (sel) {
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

/* -- shorthand markup, applied while typing -------------------------------- */

/** The collapsed caret inside `root`, only when it sits in a text node. */
function caretInText(root) {
  const sel = window.getSelection();
  if (!sel?.rangeCount || !sel.isCollapsed) return null;

  const range = sel.getRangeAt(0);
  const node = range.startContainer;
  if (node.nodeType === Node.TEXT_NODE && root.contains(node)) {
    return { sel, node, offset: range.startOffset };
  }
  if (node.nodeType === Node.ELEMENT_NODE && root.contains(node) && range.startOffset > 0) {
    const prev = node.childNodes[range.startOffset - 1];
    if (prev?.nodeType === Node.TEXT_NODE) {
      return { sel, node: prev, offset: prev.textContent.length };
    }
  }
  return null;
}

function placeCaret(sel, node, offset) {
  const range = document.createRange();
  range.setStart(node, Math.min(offset, node.textContent?.length ?? 0));
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

/** Two spaces in a row collapse into ". " once the second one is typed. */
export function applySentenceBreakAtCaret(root) {
  const caret = caretInText(root);
  if (!caret) return false;

  const result = sentenceBreakAt(caret.node.textContent ?? "", caret.offset);
  if (!result) return false;

  caret.node.textContent = result.text;
  placeCaret(caret.sel, caret.node, result.caret);
  return true;
}

function hostForBlock(node) {
  let parent = node.parentNode;
  let anchor = node.nextSibling;
  while (
    parent instanceof HTMLElement &&
    !parent.isContentEditable &&
    parent.tagName === "SPAN" &&
    !parent.classList.contains("math-formula") &&
    !parent.classList.contains("code-block")
  ) {
    anchor = parent.nextSibling;
    parent = parent.parentNode;
  }
  return { parent, anchor };
}

/**
 * Turn a just-closed `##math##…##math##` at the caret into a formula block.
 * Returns true when the document changed.
 */
export function applyMathAtCaret(root) {
  const caret = caretInText(root);
  if (!caret) return false;

  const text = caret.node.textContent ?? "";
  const math = mathMarkerAt(text, caret.offset);
  if (!math) return false;

  const parent = caret.node.parentNode;
  if (!parent) return false;

  const before = text.slice(0, math.start);
  const after = text.slice(math.end);
  const host = math.display ? hostForBlock(caret.node) : { parent, anchor: caret.node.nextSibling };
  if (!host.parent) return false;

  const el = createMathElement(math.latex, math.display);
  caret.node.textContent = before;

  if (math.display) {
    host.parent.insertBefore(el, host.anchor);
    const tail = document.createTextNode(after || "\u200B");
    host.parent.insertBefore(tail, el.nextSibling);
    placeCaret(caret.sel, tail, after ? 0 : 1);
  } else {
    parent.insertBefore(el, caret.node.nextSibling);
    const tail = document.createTextNode(after || "\u200B");
    parent.insertBefore(tail, el.nextSibling);
    placeCaret(caret.sel, tail, after ? 0 : 1);
  }

  renderMathElement(el);
  ensureMathCaretPads(root);
  return true;
}

/**
 * `##math##` + Enter: open an empty formula block and start editing.
 */
export function applyMathOpenAtCaret(root) {
  const caret = caretInText(root);
  if (!caret) return false;

  const text = caret.node.textContent ?? "";
  const open = mathOpenAt(text, caret.offset);
  if (!open) return false;

  const host = hostForBlock(caret.node);
  if (!host.parent) return false;

  const before = text.slice(0, open.start);
  const after = text.slice(open.end);
  const el = createMathElement("", true);
  caret.node.textContent = before;
  host.parent.insertBefore(el, host.anchor);
  const tail = document.createTextNode(after || "\u200B");
  host.parent.insertBefore(tail, el.nextSibling);
  ensureMathCaretPads(root);
  beginMathEdit(el);
  return true;
}

/**
 * Turn a just-closed `##code##` pair at the caret into a code listing.
 */
export function applyCodeAtCaret(root, { plain = false } = {}) {
  const caret = caretInText(root);
  if (!caret) return false;

  const text = caret.node.textContent ?? "";
  const code = codeMarkerAt(text, caret.offset);
  if (!code) return false;

  const parent = caret.node.parentNode;
  if (!parent) return false;

  const before = text.slice(0, code.start);
  const after = text.slice(code.end);
  const host = hostForBlock(caret.node);
  if (!host.parent) return false;

  const el = plain ? createAcademicCodeElement(code.code) : createCodeElement(code.code, code.language);
  caret.node.textContent = before;
  host.parent.insertBefore(el, host.anchor);
  const tail = document.createTextNode(after || "\u200B");
  host.parent.insertBefore(tail, el.nextSibling);
  placeCaret(caret.sel, tail, after ? 0 : 1);
  if (!plain) renderCodeElement(el);
  ensureCodeCaretPads(root);
  return true;
}

/**
 * `##code##` + Enter: open an empty code listing and start editing.
 */
export function applyCodeOpenAtCaret(root, { plain = false } = {}) {
  const caret = caretInText(root);
  if (!caret) return false;

  const text = caret.node.textContent ?? "";
  const open = codeOpenAt(text, caret.offset);
  if (!open) return false;

  const host = hostForBlock(caret.node);
  if (!host.parent) return false;

  const before = text.slice(0, open.start);
  const after = text.slice(open.end);
  caret.node.textContent = before;
  if (plain) {
    const el = createAcademicCodeElement("");
    host.parent.insertBefore(el, host.anchor);
    const pad = document.createTextNode(after || "\u200B");
    host.parent.insertBefore(pad, el.nextSibling);
    ensureCodeCaretPads(root);
    const inner = el.firstChild || el.appendChild(document.createTextNode(""));
    placeCaret(caret.sel, inner, 0);
    return true;
  }

  const el = createCodeElement("", "auto");
  host.parent.insertBefore(el, host.anchor);
  const tail = document.createTextNode(after || "\u200B");
  host.parent.insertBefore(tail, el.nextSibling);
  ensureCodeCaretPads(root);
  beginCodeEdit(el);
  return true;
}

/**
 * Turn a marker that just closed at the caret (**, _, ~~ or [TAB]) into real
 * formatting. Returns true when the document changed.
 */
export function applyMarkupAtCaret(root) {
  const caret = caretInText(root);
  if (!caret) return false;

  const text = caret.node.textContent ?? "";
  const marker = markerAt(text, caret.offset);
  if (!marker) return false;

  const before = text.slice(0, marker.start);
  const after = text.slice(marker.end);

  if (marker.text) {
    caret.node.textContent = before + marker.text + after;
    placeCaret(caret.sel, caret.node, marker.start + marker.text.length);
    return true;
  }

  const parent = caret.node.parentNode;
  if (!parent) return false;

  const span = document.createElement("span");
  span.className = formatClassName({ ...readFormatFromNode(caret.node), ...marker.patch });
  span.textContent = marker.inner;

  // A zero-width space keeps the caret outside the span, so what comes next is
  // typed unformatted. htmlToPlainText strips it back out.
  const tail = document.createTextNode(after || "\u200B");

  caret.node.textContent = before;
  parent.insertBefore(span, caret.node.nextSibling);
  parent.insertBefore(tail, span.nextSibling);

  placeCaret(caret.sel, tail, after ? 0 : 1);
  return true;
}

/** Insert shorthand plain text (a paste) as formatted HTML at the caret. */
export function insertMarkupAtSelection(plainText, options) {
  const sel = window.getSelection();
  const root = options?.root;
  const range = root ? rangeInRootOrEnd(sel, root) : sel?.rangeCount ? sel.getRangeAt(0) : null;
  if (!range || !sel) return;

  range.deleteContents();

  const fragment = range.createContextualFragment(parseTextMarkup(plainText, options));
  const lastNode = fragment.lastChild;
  range.insertNode(fragment);

  const atomic =
    lastNode instanceof HTMLElement && (isMathFormulaEl(lastNode) || isCodeBlockEl(lastNode))
      ? lastNode
      : lastNode?.previousSibling instanceof HTMLElement &&
          (isMathFormulaEl(lastNode.previousSibling) || isCodeBlockEl(lastNode.previousSibling))
        ? lastNode.previousSibling
        : null;

  if (atomic) {
    if (isMathFormulaEl(atomic)) ensureMathCaretPads(atomic.parentElement);
    else ensureCodeCaretPads(atomic.parentElement);
    placeCaretAfterMath(atomic);
    return;
  }

  if (lastNode) range.setStartAfter(lastNode);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

function rangeInRootOrEnd(sel, root) {
  let range = sel?.rangeCount ? sel.getRangeAt(0) : null;
  if (range && (!root || root.contains(range.commonAncestorContainer))) return range;
  if (!root || !sel) return null;
  range = document.createRange();
  range.selectNodeContents(root);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
  return range;
}

const BLOCK_HTML = /^\s*<(table|figure|h[1-6]|nav|div|pre|ul|ol|blockquote|section)\b/i;
const SPLIT_FOR_BLOCK = /^(P|H[1-6]|LI|SPAN|A|STRONG|EM|B|I|U|S|STRIKE|DEL|LABEL|SUP|SUB|BUTTON|CAPTION|FIGCAPTION)$/;

function isVisuallyEmptyEl(el) {
  if (!(el instanceof HTMLElement)) return true;
  if (el.querySelector("img, table, figure, video, .math-formula, .code-block, .academic-code, .academic-figure")) {
    return false;
  }
  return !String(el.textContent || "").replace(/[\s\u200B]/g, "");
}

function nearestSplitHost(node, root) {
  let el = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node;
  while (el instanceof HTMLElement && el !== root) {
    if (SPLIT_FOR_BLOCK.test(el.tagName) || isFormatSpan(el)) return el;
    el = el.parentElement;
  }
  return null;
}

function nodesFromHtml(html) {
  const template = document.createElement("template");
  template.innerHTML = sanitizeHtml(html);
  const nodes = [...template.content.childNodes];
  const block =
    nodes.find((node) => node.nodeType === 1 && /^(TABLE|FIGURE|H[1-6]|NAV|DIV|PRE)$/.test(node.tagName)) ||
    nodes.find((node) => node.nodeType === 1) ||
    nodes[0] ||
    null;
  return { fragment: template.content, nodes, block };
}

function placeRangeAfter(nodes, sel) {
  const last = nodes[nodes.length - 1];
  if (!last || !sel) return;
  const range = last.ownerDocument.createRange();
  range.setStartAfter(last);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

/**
 * Insert a block (table, figure, heading) as a sibling of the host paragraph,
 * never nested inside <p>/<h*> or another table.
 */
export function insertBlockHtmlAtSelection(html, root) {
  const sel = window.getSelection();
  const range = rangeInRootOrEnd(sel, root);
  if (!range || !sel) return null;

  range.deleteContents();

  const startEl = range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentElement;
  const hostTable = startEl?.closest?.("table");
  if (hostTable && root.contains(hostTable) && hostTable !== root) {
    const inserted = nodesFromHtml(html);
    const anchor = hostTable.closest(".academic-table-wrap") || hostTable;
    anchor.parentNode?.insertBefore(inserted.fragment, anchor.nextSibling);
    placeRangeAfter(inserted.nodes, sel);
    return inserted.block;
  }
  const hostList = startEl?.closest?.("ul, ol");
  if (hostList && root.contains(hostList) && hostList !== root) {
    const inserted = nodesFromHtml(html);
    hostList.parentNode?.insertBefore(inserted.fragment, hostList.nextSibling);
    placeRangeAfter(inserted.nodes, sel);
    return inserted.block;
  }

  for (let i = 0; i < 24; i += 1) {
    const host = nearestSplitHost(range.startContainer, root);
    if (!host || host === root) break;
    const tailRange = host.ownerDocument.createRange();
    tailRange.setStart(range.startContainer, range.startOffset);
    tailRange.setEnd(host, host.childNodes.length);
    const tail = tailRange.extractContents();
    const after = host.cloneNode(false);
    after.appendChild(tail);
    host.parentNode?.insertBefore(after, host.nextSibling);
    const leftEmpty = isVisuallyEmptyEl(host);
    const rightEmpty = isVisuallyEmptyEl(after);
    if (leftEmpty && rightEmpty) {
      const parent = host.parentNode;
      const index = parent ? [...parent.childNodes].indexOf(host) : 0;
      after.remove();
      host.remove();
      if (parent) {
        range.setStart(parent, Math.min(index, parent.childNodes.length));
        range.collapse(true);
      }
    } else if (leftEmpty) {
      range.setStartBefore(after);
      range.collapse(true);
      host.remove();
    } else {
      range.setStartAfter(host);
      range.collapse(true);
      if (rightEmpty) after.remove();
    }
  }

  const inserted = nodesFromHtml(html);
  range.insertNode(inserted.fragment);
  placeRangeAfter(inserted.nodes, sel);
  return inserted.block;
}

/** Insert already-sanitized HTML (figures, citations, links) at the caret. */
export function insertHtmlAtSelection(html, root) {
  if (BLOCK_HTML.test(String(html ?? ""))) {
    return Boolean(insertBlockHtmlAtSelection(html, root));
  }

  const sel = window.getSelection();
  const range = rangeInRootOrEnd(sel, root);
  if (!range || !sel) return false;

  range.deleteContents();
  const fragment = range.createContextualFragment(sanitizeHtml(html));
  const lastNode = fragment.lastChild;
  range.insertNode(fragment);

  if (lastNode) {
    range.setStartAfter(lastNode);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }
  return true;
}

/** Insert a live math or code widget at the caret. */
export function insertNodeAtSelection(node, root) {
  const sel = window.getSelection();
  const range = rangeInRootOrEnd(sel, root);
  if (!range || !sel || !node) return null;

  range.deleteContents();
  range.insertNode(node);

  if (isMathFormulaEl(node)) ensureMathCaretPads(node.parentElement);
  if (isCodeBlockEl(node)) ensureCodeCaretPads(node.parentElement);

  placeCaretAfterMath(node);
  return node;
}

function normalizeHref(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^(https?:\/\/|mailto:)/i.test(raw)) return raw;
  if (/^\/\//.test(raw)) return `https:${raw}`;
  return `https://${raw}`;
}

/** Wrap the current selection in a link, or insert the URL as the link text. */
export function wrapSelectionWithLink(href, text, root) {
  const url = normalizeHref(href);
  if (!url) return false;

  const sel = window.getSelection();
  const range = rangeInRootOrEnd(sel, root);
  if (!range || !sel) return false;

  const label = String(text ?? "").trim() || range.toString() || url;
  range.deleteContents();
  const link = document.createElement("a");
  link.className = "academic-link";
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.title = "Ctrl+tıklayarak aç";
  link.textContent = label;
  range.insertNode(link);
  range.setStartAfter(link);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  return true;
}

/** Insert a newline (Shift+Enter) or a blank line / new paragraph (Enter). */
export function insertPlainAtCaret(text) {
  if (!text) return false;
  if (typeof document.execCommand === "function") {
    const ok = document.execCommand("insertText", false, text);
    if (ok) return true;
  }

  const sel = window.getSelection();
  if (!sel?.rangeCount) return false;
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const node = document.createTextNode(text);
  range.insertNode(node);
  range.setStart(node, text.length);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  return true;
}

/** Blocks a multi-line deletion joins. */
const JOIN_BLOCKS = "p,h1,h2,h3,h4,h5,h6,li,blockquote,div,pre";
/** A selection that starts or ends in one of these keeps the browser's own editing. */
const NATIVE_EDIT = "table,.math-formula,.code-block,.academic-code,[contenteditable='false']";
const LINE_END = `br,${JOIN_BLOCKS},ul,ol,table,figure,hr`;

const isBlankBlock = (el) => !el.textContent.replace(/[\s​]/g, "") && !el.querySelector("img,table,figure,hr,.math-formula,.code-block");

/** Remove `el`, then any ancestor below `root` it leaves empty (an emptied list). */
function removeWithEmptyParents(el, root) {
  let node = el;
  while (node.parentNode && node.parentNode !== root && node.parentNode.childNodes.length === 1) node = node.parentNode;
  node.remove();
}

/** True when nothing but a line break or block edge precedes the caret in `container`. */
function atLineStart(container, node, offset) {
  if (node.nodeType === 3 && offset > 0) return node.data[offset - 1] === "\n";
  let before = node.nodeType === 3 ? node.previousSibling : node.childNodes[offset - 1];
  for (let host = node; !before && host !== container; host = host.parentNode) before = host.previousSibling;
  if (!before) return true;
  if (before.nodeType === 3) return !before.data || before.data.endsWith("\n");
  return before.matches?.(LINE_END) ?? false;
}

/**
 * Delete a selection spanning more than one block and join what is left, like a
 * word processor: the rest of the last block continues the first one in its style,
 * and a first block selected from its start is dropped so the last keeps its own.
 * Chromium's deletion instead keeps the moved text's old look with `<span style>`,
 * which the production CSP (no style-src 'unsafe-inline') reports and which would be
 * saved into the note. Returns false, changing nothing, when the browser does it
 * cleanly: collapsed or single-block selections, tables and atomic widgets.
 */
export function deleteSelectionAcrossBlocks(root) {
  const doc = root?.ownerDocument;
  const sel = doc?.getSelection();
  if (!sel?.rangeCount) return false;
  const range = sel.getRangeAt(0);
  if (range.collapsed || !root.contains(range.startContainer) || !root.contains(range.endContainer)) return false;
  const inside = (node, selector) => {
    const found = (node.nodeType === 1 ? node : node.parentElement)?.closest(selector);
    return found && found !== root && root.contains(found) ? found : null;
  };
  if (inside(range.startContainer, NATIVE_EDIT) || inside(range.endContainer, NATIVE_EDIT)) return false;
  const start = inside(range.startContainer, JOIN_BLOCKS) || root;
  const end = inside(range.endContainer, JOIN_BLOCKS) || root;
  if (start === end || (start !== root && end !== root && (start.contains(end) || end.contains(start)))) return false;

  // deleteContents collapses a cross-block range onto their common parent; this live
  // copy stays where the selection started (the end of the first block's remaining text).
  const caret = range.cloneRange();
  caret.collapse(true);
  range.deleteContents();
  const dropStart = start === root ? atLineStart(root, caret.startContainer, caret.startOffset) : isBlankBlock(start);
  if (end !== root) {
    if (dropStart) {
      if (start !== root) removeWithEmptyParents(start, root);
      caret.selectNodeContents(end);
    } else {
      const tail = doc.createDocumentFragment();
      while (end.firstChild) tail.append(end.firstChild);
      removeWithEmptyParents(end, root);
      if (!isBlankBlock(tail)) {
        const last = tail.lastChild;
        // Everything after the caret in the first block was deleted, so the tail goes
        // after the caret's inline ancestors instead of inheriting their formatting.
        let anchor = caret.startContainer;
        while (anchor !== start && anchor.parentNode !== start) anchor = anchor.parentNode;
        if (anchor === start || anchor.nodeType === 3) caret.insertNode(tail);
        else anchor.after(tail);
        // A joined top-level line still ends where the removed block ended.
        const after = start === root ? last.nextSibling : null;
        if (after && !(after.nodeType === 1 && after.matches(LINE_END)) && !(after.nodeType === 3 && after.data.startsWith("\n"))) last.after(doc.createTextNode("\n"));
      }
    }
  } else {
    // The selection ended in top-level text: its line continues the first block.
    let top = start;
    while (top.parentNode !== root) top = top.parentNode;
    if (dropStart) {
      caret.setStartAfter(top);
      removeWithEmptyParents(start, root);
    } else {
      const line = doc.createDocumentFragment();
      for (let node = top.nextSibling; node;) {
        const next = node.nextSibling;
        if (node.nodeType === 1 && node.matches(LINE_END)) {
          if (node.nodeName === "BR") node.remove();
          break;
        }
        const newline = node.nodeType === 3 ? node.data.indexOf("\n") : -1;
        if (newline >= 0) {
          const rest = node.splitText(newline);
          rest.deleteData(0, 1);
          if (!rest.data) rest.remove();
          line.append(node);
          break;
        }
        line.append(node);
        node = next;
      }
      start.append(line);
    }
  }
  caret.collapse(true);
  sel.removeAllRanges();
  sel.addRange(caret);
  return true;
}
