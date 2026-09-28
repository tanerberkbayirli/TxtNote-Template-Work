/**
 * lineSpacing.blockGap "paragraphPitch" (opt-in, needs mode "word" + baseline "word"): the block after a figure (caption below),
 * a table (caption above) or a table note is placed so that its first baseline lies one body paragraph pitch
 * (line + space after, e.g. 41.4 pt) below the last baseline of that block, exactly like after a body paragraph.
 * Word gets the same gap through the following paragraph's space-before (additive spacing).
 * Editor/PDF (CSS margin-top) and DOCX (w:spacing before) both read `blockGapPt`.
 */
export const WORD_ASCENT_EM = 0.9336;

export function blockGapActive(rules) {
  const spacing = rules?.lineSpacing;
  return spacing?.mode === "word" && spacing.baseline === "word" && spacing.blockGap === "paragraphPitch";
}

const lineBox = (style, spacing) => (style.lineHeight || 1.5) * spacing.singleLineEm * style.fontSizePt;

/** Margin (pt) between the line box bottom of the previous block's last line and the next block's first line box top. */
export function blockGapPt(rules, previousStyle, nextStyle) {
  const spacing = rules.lineSpacing;
  const body = rules.body;
  const pitch = lineBox(body, spacing) + (body.spaceAfterPt || 0);
  const bottomToBaseline = lineBox(previousStyle, spacing) - WORD_ASCENT_EM * previousStyle.fontSizePt + (previousStyle.borderBelowPt || 0);
  const gap = pitch - bottomToBaseline - WORD_ASCENT_EM * nextStyle.fontSizePt + (nextStyle.spaceBeforePt || 0);
  return Math.round(gap * 1000) / 1000;
}

/** Last-line style of the blocks that use the rule (null when that block does not end in a text line). */
export function blockGapPrevious(rules, kind, { captionKind = "" } = {}) {
  const body = rules.body;
  if (kind === "figure") {
    const rule = captionKind && rules.captionKinds?.[captionKind] || rules.figures;
    return rule.position === "below" ? { style: { ...body, ...rule.style }, after: rule.spacingAfterPt ?? rule.style.spaceAfterPt ?? 0 } : null;
  }
  // The last row's bottom rule takes room below its line: at least one CSS px (0.75 pt) in the browser.
  if (kind === "table") return rules.tables.position === "above" ? { style: { ...body, ...rules.tables.cellStyle, borderBelowPt: rules.tables.borders ? Math.max(0.75, rules.tables.borders.widthPt || 0.5) : 0 }, after: 0 } : null;
  if (kind === "tableNote" && rules.paragraphStyles?.tableNote) { const style = { ...body, ...rules.paragraphStyles.tableNote }; return { style, after: style.spaceAfterPt || 0 }; }
  return null;
}
