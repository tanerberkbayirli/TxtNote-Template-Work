/**
 * Plain-text shorthand for the note editor. Pure string helpers — the DOM side
 * lives in richText.js.
 *
 *   "  "     → ". "   (sentence end)
 *   **text** → bold
 *   *text*   → italic
 *   _text_   → italic
 *   ~~text~~ → strikethrough
 *   [TAB]    → tab indent
 *   ##math## + Enter → display math (see mathFormula.js)
 *   $$…$$  \[…\]  \(…\)  $…$  \begin{…}  \ce{…} → LaTeX (see mathFormula.js)
 *   ##code## + Enter → code block (see codeBlock.js)
 */

import { academicCodeHtml, codeBlockHtml, looksLikeSourceCode, splitCodeSegments } from "./codeBlock.js";
import { mathBlockHtml, splitMathSegments } from "./mathFormula.js";

const TAB_TOKEN = "[TAB]";

/** Markers recognised the moment their closing token is typed. Longer first. */
const LIVE_MARKER_RULES = [
  { pattern: /\*\*([^*]+)\*\*$/, patch: { bold: true } },
  { pattern: /~~([^~]+)~~$/, patch: { strike: true } },
  { pattern: /\*([^*]+)\*$/, patch: { italic: true } },
  { pattern: /_([^_]+)_$/, patch: { italic: true } },
];

const INLINE_RULES = [
  { pattern: /\*\*([^*]+)\*\*/g, className: "fmt-bold" },
  { pattern: /~~([^~]+)~~/g, className: "fmt-strike" },
  { pattern: /\*([^*]+)\*/g, className: "fmt-italic" },
  { pattern: /_([^_]+)_/g, className: "fmt-italic" },
];

/** contentEditable still produces these where a plain space would collapse. */
const SPACE = /[ \u00a0]/;

/** A second space only ends a sentence when real words come before it. */
const ALREADY_PUNCTUATED = /[.!?…:;,]/;

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Two consecutive spaces become a full stop plus one space. */
function applySentenceBreaks(text) {
  return text.replace(/([^\s.!?…:;,])[ \u00a0]{2}/g, "$1. ");
}

/**
 * A pair of spaces just landed immediately before `offset`. Returns the
 * rewritten text and caret, or null when the rule does not apply.
 */
export function sentenceBreakAt(text, offset) {
  if (offset < 3) return null;
  if (!SPACE.test(text[offset - 1] ?? "") || !SPACE.test(text[offset - 2] ?? "")) return null;

  const previous = text[offset - 3] ?? "";
  if (!previous || SPACE.test(previous) || ALREADY_PUNCTUATED.test(previous)) return null;

  return {
    text: `${text.slice(0, offset - 2)}. ${text.slice(offset)}`,
    caret: offset,
  };
}

/**
 * A marker that just closed immediately before `offset`.
 * Either a literal replacement (`text`) or a styled slice (`inner` + `patch`).
 */
export function markerAt(text, offset) {
  const head = text.slice(0, offset);

  if (head.endsWith(TAB_TOKEN)) {
    return { start: offset - TAB_TOKEN.length, end: offset, text: "\t" };
  }

  for (const { pattern, patch } of LIVE_MARKER_RULES) {
    const match = pattern.exec(head);
    if (match) {
      return { start: offset - match[0].length, end: offset, inner: match[1], patch };
    }
  }

  return null;
}

function parseLine(line) {
  const withTabs = line.split(TAB_TOKEN).join("\t");
  const escaped = escapeHtml(applySentenceBreaks(withTabs));

  return INLINE_RULES.reduce(
    (text, { pattern, className }) => text.replace(pattern, `<span class="${className}">$1</span>`),
    escaped,
  );
}

function parseTextRun(text) {
  if (!text) return "";
  return text.split("\n").map(parseLine).join("<br>");
}

/** Shorthand plain text → editor HTML. Used for pasted and imported text. */
export function parseTextMarkup(plainText, options = {}) {
  if (!plainText) return "";
  const normalized = plainText.replace(/\r\n/g, "\n");
  if (options.math === false) return parseTextRun(normalized);

  if (looksLikeSourceCode(normalized)) {
    return `${options.plainCode ? academicCodeHtml(normalized) : codeBlockHtml(normalized, "auto")}\u200B`;
  }

  const flat = [];
  for (const seg of splitCodeSegments(normalized)) {
    if (seg.type === "code") flat.push(seg);
    else flat.push(...splitMathSegments(seg.text));
  }

  const html = flat
    .map((seg) => {
      if (seg.type === "code") return options.plainCode ? academicCodeHtml(seg.code) : codeBlockHtml(seg.code, seg.language);
      if (seg.type === "math") return mathBlockHtml(seg.latex, seg.display);
      return parseTextRun(seg.text);
    })
    .join("");

  const last = flat[flat.length - 1];
  if (last?.type === "code" || (last?.type === "math" && last.display)) return `${html}\u200B`;
  return html;
}
