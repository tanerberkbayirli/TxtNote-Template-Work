/**
 * Natural word spacing on the last line of a Word-justified paragraph.
 *
 * `typography.justify: "word"` gives justified text a negative `word-spacing` (Word's maximum space compression) so lines break where Word breaks them.
 * Justification widens the spaces of every line again, but not those of the LAST line, which Word draws with natural spaces.
 * CSS has no way to style only the last line (`::last-line` is not implemented) and the editor DOM is contentEditable, so the correction is
 * a pure model: for the words of the last line it returns how far each word moves right (CSS px) so every inter-word gap is natural again.
 * The line breaks are measured first and never change; only the paint position of the last line's words does (exported PDF).
 */

/**
 * @param {{start:number,end:number,top:number,lastTop:number}[]} words words of one block in document order (`top` of the first glyph, `lastTop` of the last glyph).
 * @param {number} deltaPx magnitude of the negative word-spacing in CSS px (> 0)
 * @param {number} tolPx tolerance for "same line"
 * @returns {Map<number, number>} word index -> x shift in px (words not on the last line are absent)
 */
export function lastLineShifts(words, deltaPx, tolPx = 1) {
  const shifts = new Map();
  if (!words.length || !(deltaPx > 0)) return shifts;
  const last = words[words.length - 1];
  let first = words.length - 1;
  // The run of words whose glyphs all sit on the last line; a word that starts on an earlier line (wrapped inside the word) is not part of it.
  while (first > 0 && Math.abs(words[first - 1].top - last.lastTop) < tolPx && Math.abs(words[first - 1].lastTop - last.lastTop) < tolPx) first -= 1;
  // A single-word last line has no gaps.
  if (first === words.length - 1) return shifts;
  for (let i = first; i < words.length; i += 1) shifts.set(i, (i - first) * deltaPx);
  return shifts;
}
