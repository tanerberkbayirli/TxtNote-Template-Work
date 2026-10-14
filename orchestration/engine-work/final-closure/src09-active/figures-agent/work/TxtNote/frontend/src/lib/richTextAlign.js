/**
 * Paragraph alignment for the standard note body.
 *
 * Size/colour/style live on inline spans. Alignment is a block: a wrapping
 * div with fmt-align-left|center|right|justify, so text-align can take effect.
 */

import { FORMAT_ALIGNS, alignClass, parseAlign } from "../config/format.js";
import { isCodeBlockEl } from "./codeBlock.js";
import { isMathFormulaEl } from "./mathFormula.js";

const ALIGN_IDS = new Set(FORMAT_ALIGNS.map((item) => item.id));
const ALIGN_CLASSES = FORMAT_ALIGNS.map((item) => item.className);

function isAtomicBlock(node) {
  if (isCodeBlockEl(node)) return true;
  if (node instanceof HTMLElement && (node.tagName === "TABLE" || node.classList.contains("academic-table-wrap"))) return true;
  return Boolean(isMathFormulaEl(node) && node.getAttribute("data-display") !== "inline");
}

/** Paragraphs, individual cells and list items can carry text-align. */
export function isAlignHost(node, root) {
  return (
    node instanceof HTMLElement &&
    root.contains(node) && node !== root &&
    (node.parentNode === root || node.closest("td,th,li")) &&
    /^(DIV|P|H[1-6]|TD|TH|LI)$/.test(node.tagName) &&
    !node.classList.contains("math-formula") &&
    !node.classList.contains("code-block") &&
    !node.classList.contains("academic-table-wrap") &&
    !node.classList.contains("academic-figure") &&
    !node.querySelector(":scope > table")
  );
}

export function nearestAlignBlock(node, root) {
  let el = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node;
  while (el instanceof HTMLElement && el !== root) {
    if (isAlignHost(el, root)) return el;
    el = el.parentElement;
  }
  return null;
}

export function readAlignFromRange(range, root) {
  if (!range || !root) return "left";
  const start = nearestAlignBlock(range.startContainer, root);
  const end = nearestAlignBlock(range.endContainer, root);
  const a = start ? parseAlign(start.className) : "left";
  const b = end ? parseAlign(end.className) : "left";
  return a === b ? a : "left";
}

function setBlockAlign(block, align) {
  const kept = (block.className ?? "").split(/\s+/).filter(Boolean).filter((token) => !ALIGN_CLASSES.includes(token));
  kept.push(alignClass(align));
  block.className = kept.join(" ");
}

function topLevelOf(node, root) {
  if (!node || node === root) return null;
  if (!root.contains(node)) return null;
  let current = node;
  while (current && current.parentNode !== root) current = current.parentNode;
  return current ?? null;
}

function topLevelAtBoundary(root, container, offset) {
  if (container === root) {
    if (root.childNodes.length === 0) return null;
    const index = Math.min(Math.max(offset, 0), root.childNodes.length - 1);
    return root.childNodes[index] ?? root.firstChild;
  }
  return topLevelOf(container, root);
}

function splitParagraphBoundaries(textNode, offset) {
  if (textNode.nodeType !== Node.TEXT_NODE) return textNode;
  const text = textNode.textContent ?? "";
  const safeOffset = Math.max(0, Math.min(offset, text.length));
  let current = textNode;
  let local = safeOffset;

  const before = text.lastIndexOf("\n\n", Math.max(0, safeOffset - 1));
  if (before >= 0) {
    current = textNode.splitText(before + 2);
    local = safeOffset - (before + 2);
  }

  const after = (current.textContent ?? "").indexOf("\n\n", local);
  if (after >= 0) current.splitText(after);
  return current;
}

function collectWrapNodes(root, range) {
  const startBlock = nearestAlignBlock(range.startContainer, root);
  const endBlock = nearestAlignBlock(range.endContainer, root);
  if (startBlock && startBlock === endBlock) return [startBlock];
  // Walk document order rather than siblings: a selection can cross table rows
  // or list items whose paragraphs have different parents.
  const intersected = [...root.querySelectorAll("div,p,h1,h2,h3,h4,h5,h6,td,th,li")]
    .filter((node) => isAlignHost(node, root) && range.intersectsNode(node));
  const paragraphs = intersected.filter((node) => !intersected.some((other) => other !== node && node.contains(other)));
  if (paragraphs.length && (startBlock?.closest("td,th,li") || endBlock?.closest("td,th,li") || paragraphs.some((node) => node.closest("td,th,li")))) return paragraphs;
  if (startBlock || endBlock) {
    const first = startBlock ?? topLevelOf(range.startContainer, root);
    const last = endBlock ?? topLevelOf(range.endContainer, root) ?? first;
    const blocks = [];
    for (let node = first; node; node = node.nextSibling) {
      if (isAlignHost(node, root)) blocks.push(node);
      if (node === last) break;
    }
    if (blocks.length > 0) return blocks;
  }

  if (range.startContainer.nodeType === Node.TEXT_NODE) {
    splitParagraphBoundaries(range.startContainer, range.startOffset);
  }
  if (range.endContainer.nodeType === Node.TEXT_NODE && range.endContainer !== range.startContainer) {
    splitParagraphBoundaries(range.endContainer, range.endOffset);
  }

  let from = topLevelAtBoundary(root, range.startContainer, range.startOffset);
  let to = topLevelAtBoundary(root, range.endContainer, range.endOffset) ?? from;
  if (!from) return [];

  while (from.previousSibling) {
    const prev = from.previousSibling;
    if (isAlignHost(prev, root) || isAtomicBlock(prev)) break;
    if (prev.nodeType === Node.TEXT_NODE) {
      const text = prev.textContent ?? "";
      const idx = text.lastIndexOf("\n\n");
      if (idx >= 0) {
        if (idx + 2 < text.length) from = prev.splitText(idx + 2);
        break;
      }
    }
    from = prev;
  }

  while (to.nextSibling) {
    const next = to.nextSibling;
    if (isAlignHost(next, root) || isAtomicBlock(next)) break;
    if (next.nodeType === Node.TEXT_NODE) {
      const idx = (next.textContent ?? "").indexOf("\n\n");
      if (idx >= 0) {
        if (idx > 0) {
          next.splitText(idx);
          to = next;
        }
        break;
      }
    }
    to = next;
  }

  const nodes = [];
  for (let node = from; node; node = node.nextSibling) {
    nodes.push(node);
    if (node === to) break;
  }
  return nodes;
}

function stripAdjacentNewlines(block) {
  const strip = (sibling, edge) => {
    if (sibling?.nodeType !== Node.TEXT_NODE) return;
    const nextText =
      edge === "before"
        ? (sibling.textContent ?? "").replace(/\n+$/, "")
        : (sibling.textContent ?? "").replace(/^\n+/, "");
    if (nextText) sibling.textContent = nextText;
    else sibling.remove();
  };
  strip(block.previousSibling, "before");
  strip(block.nextSibling, "after");
}

function wrapNodes(nodes, align, root) {
  if (nodes.length === 0) return null;

  if (nodes.every((node) => isAlignHost(node, root))) {
    nodes.forEach((node) => setBlockAlign(node, align));
    return nodes[0];
  }

  const hosts = nodes.filter((node) => isAlignHost(node, root));
  const loose = nodes.filter((node) => !isAlignHost(node, root));
  hosts.forEach((node) => setBlockAlign(node, align));

  if (loose.length === 0) return hosts[0] ?? null;

  const div = document.createElement("div");
  div.className = alignClass(align);
  loose[0].parentNode.insertBefore(div, loose[0]);
  loose.forEach((node) => div.appendChild(node));
  if (!div.hasChildNodes()) {
    div.remove();
    return hosts[0] ?? null;
  }
  stripAdjacentNewlines(div);
  return div;
}

function rootHasContent(root) {
  return [...root.childNodes].some((node) => {
    if (node.nodeType === Node.TEXT_NODE) return (node.textContent ?? "").replace(/\u200B/g, "").length > 0;
    return true;
  });
}

function placeCaretIn(node, atStart = true) {
  const sel = window.getSelection();
  if (!sel || !node) return;
  const range = document.createRange();
  range.selectNodeContents(node);
  range.collapse(atStart);
  sel.removeAllRanges();
  sel.addRange(range);
}

/** Apply alignment to the paragraph(s) that intersect `range`. */
export function applyAlignToRange(root, range, align) {
  if (!root || !ALIGN_IDS.has(align)) return null;

  if (!rootHasContent(root)) {
    root.innerHTML = "";
    const div = document.createElement("div");
    div.className = alignClass(align);
    const pad = document.createTextNode("\u200B");
    div.appendChild(pad);
    root.appendChild(div);
    const caret = document.createRange();
    caret.setStart(pad, 1);
    caret.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(caret);
    return div;
  }

  let liveRange = range;
  if (!liveRange || !root.contains(liveRange.commonAncestorContainer)) {
    const sel = window.getSelection();
    liveRange = sel?.rangeCount ? sel.getRangeAt(0) : null;
  }
  if (!liveRange || !root.contains(liveRange.commonAncestorContainer)) {
    liveRange = document.createRange();
    liveRange.selectNodeContents(root);
  }

  const wrapped = wrapNodes(collectWrapNodes(root, liveRange), align, root);
  if (wrapped) return wrapped;
  if (!rootHasContent(root)) return null;
  return wrapNodes([...root.childNodes], align, root);
}

export function isCaretAtAlignBlockStart(root) {
  const sel = window.getSelection();
  if (!sel?.rangeCount || !sel.isCollapsed) return false;
  const range = sel.getRangeAt(0);
  const block = nearestAlignBlock(range.startContainer, root);
  if (!block) return false;

  // Structural cells/items keep their native boundary behavior.
  if (/^(TD|TH|LI)$/.test(block.tagName)) return false;
  const probe = document.createRange();
  probe.selectNodeContents(block);
  probe.setEnd(range.startContainer, range.startOffset);
  return probe.toString().replace(/\u200B/g, "").length === 0;
}

/** Enter inside an aligned paragraph: keep the alignment on the new block. */
export function splitAlignBlockAtCaret(root) {
  const sel = window.getSelection();
  if (!sel?.rangeCount || !sel.isCollapsed) return false;
  const range = sel.getRangeAt(0);
  if (!root.contains(range.startContainer)) return false;

  const block = nearestAlignBlock(range.startContainer, root);
  if (!block) return false;
  if (/^(TD|TH|LI)$/.test(block.tagName)) return false;

  const after = document.createRange();
  after.setStart(range.startContainer, range.startOffset);
  after.setEnd(block, block.childNodes.length);
  const fragment = after.extractContents();

  // The new line keeps the block's tag and classes. Forcing "left" on an unaligned line
  // (every Enter after the first) overrode the thesis template's alignment; with no
  // class the note editor still reads "left" (parseAlign default).
  const next = document.createElement(block.tagName === "P" ? "p" : "div");
  if (block.className) next.className = block.className;
  if (fragment.childNodes.length === 0) {
    next.appendChild(document.createTextNode("\u200B"));
  } else {
    next.appendChild(fragment);
    if (!(next.textContent ?? "").replace(/\u200B/g, "")) {
      next.appendChild(document.createTextNode("\u200B"));
    }
  }

  if (!(block.textContent ?? "").replace(/\u200B/g, "") && !block.firstChild) {
    block.appendChild(document.createTextNode("\u200B"));
  }

  block.parentNode.insertBefore(next, block.nextSibling);
  placeCaretIn(next, true);
  return true;
}

function previousAlignHost(block, root) {
  let sibling = block.previousSibling;
  while (sibling) {
    if (isAlignHost(sibling, root)) return sibling;
    if (sibling.nodeType === Node.TEXT_NODE && !/^\s*$/.test(sibling.textContent ?? "")) return null;
    if (sibling.nodeType === Node.ELEMENT_NODE) return null;
    sibling = sibling.previousSibling;
  }
  return null;
}

/** Backspace at the start of an aligned paragraph joins it with the previous one. */
export function mergeAlignBlockWithPrevious(root) {
  const sel = window.getSelection();
  if (!sel?.rangeCount || !sel.isCollapsed) return false;
  const range = sel.getRangeAt(0);
  const block = nearestAlignBlock(range.startContainer, root);
  if (!block) return false;
  if (/^(TD|TH|LI)$/.test(block.tagName)) return false;

  const prev = previousAlignHost(block, root);
  if (!prev) return false;

  const joinAt = prev.childNodes.length;
  while (block.firstChild) prev.appendChild(block.firstChild);
  block.remove();

  const join = document.createRange();
  if (prev.childNodes[joinAt]) join.setStart(prev, joinAt);
  else {
    join.selectNodeContents(prev);
    join.collapse(false);
  }
  join.collapse(true);
  sel.removeAllRanges();
  sel.addRange(join);
  return true;
}
