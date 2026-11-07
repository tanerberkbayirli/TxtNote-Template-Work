/**
 * Where a citation goes in the sentence the caret is in (text offsets; the DOM mapping lives in RichTextBody).
 *
 *   before   parenthetical / numeric: "… metin (Yılmaz, 2026)."  — just before the sentence's full stop
 *   after    footnote:                 "… metin.¹"                — just after it
 *
 * The sentence is the one the caret is in: a caret right after a full stop belongs to the sentence that stop ends;
 * otherwise the next full stop after the caret ends it. A block without one ends at its last character.
 * "3.5" (a dot between digits) and the dots of an ellipsis run are handled as one mark.
 */
const TERMINATOR = /[.!?…]/;
// U+FFFC stands for a non-editable atom (an earlier citation or footnote mark): it sits after a stop like a closing quote.
const ATOM = "￼";
const CLOSER = /["”’»)\]￼]/;

function isTerminator(text, index) {
  const char = text[index];
  if (!char || !TERMINATOR.test(char)) return false;
  if (char === "." && /\d/.test(text[index - 1] || "") && /\d/.test(text[index + 1] || "")) return false;
  let next = index + 1;
  while (TERMINATOR.test(text[next] || "")) next += 1;
  while (CLOSER.test(text[next] || "")) next += 1;
  return next >= text.length || /\s/.test(text[next]);
}

/** First index of the terminator run that contains `index`, and the index after it. */
function terminatorRun(text, index) {
  let start = index, end = index + 1;
  while (start > 0 && TERMINATOR.test(text[start - 1])) start -= 1;
  while (TERMINATOR.test(text[end] || "")) end += 1;
  return { start, end };
}

/**
 * { offset, space, stop }: where to insert, whether a space must precede a parenthetical label, and whether the sentence
 * has no full stop yet — then a parenthetical label is followed by one: "… bulunur (Falanca, 2026, s. 42)."
 */
export function citationInsertionOffset(text, caret, placement = "before") {
  const value = String(text ?? "");
  const at = Math.max(0, Math.min(value.length, caret));
  let found = -1;
  let back = at - 1;
  while (back >= 0 && CLOSER.test(value[back])) back -= 1;
  if (back >= 0 && back < at && isTerminator(value, back)) found = back;
  else for (let index = at; index < value.length; index += 1) if (isTerminator(value, index)) { found = index; break; }
  let offset;
  if (found < 0) offset = value.replace(/\s+$/u, "").length;
  else {
    const run = terminatorRun(value, found);
    let end = run.end;
    while (CLOSER.test(value[end] || "")) end += 1;
    // Footnote marks follow the stop and any closing quote/earlier mark (Chicago); labels go before the stop.
    offset = placement === "after" ? end : run.start;
  }
  const before = value[offset - 1] || "";
  return { offset, space: placement !== "after" && Boolean(before) && !/\s/u.test(before), stop: placement !== "after" && found < 0 && Boolean(value.trim()) };
}

/** DOM position of a text offset inside `block`; an offset inside a non-editable atom (another citation, a formula) moves past it. */
export function citationTextPosition(block, offset) {
  const walker = block.ownerDocument.createTreeWalker(block, 4 /* NodeFilter.SHOW_TEXT */);
  let left = offset;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (left <= node.length) {
      const atom = node.parentElement?.closest('[contenteditable="false"]');
      if (atom && atom !== block && block.contains(atom)) {
        const index = [...atom.parentNode.childNodes].indexOf(atom);
        return { node: atom.parentNode, offset: left === 0 ? index : index + 1 };
      }
      return { node, offset: left };
    }
    left -= node.length;
  }
  return { node: block, offset: block.childNodes.length };
}

/** The block's text with every non-editable atom's text replaced by ATOM characters of the same length (offsets unchanged). */
export function citationAnalysisText(block) {
  const walker = block.ownerDocument.createTreeWalker(block, 4 /* NodeFilter.SHOW_TEXT */);
  let text = "";
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const atom = node.parentElement?.closest('[contenteditable="false"]');
    text += atom && atom !== block && block.contains(atom) ? ATOM.repeat(node.length) : node.data;
  }
  return text;
}
