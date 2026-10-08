/**
 * Experimental, opt-in Word-style line fitting. Widths and advances are points.
 * This module only computes a break plan; presentation wrappers are maintained
 * by the editor and stripped before source HTML is saved.
 */

export function wordLineCompressionBudget({ gapCount, spaceAdvancePt, lastWordAdvancePt, decayPt = 0 }) {
  if (!(gapCount > 0) || !(spaceAdvancePt > 0) || !(lastWordAdvancePt >= 0)) return 0;
  return Math.max(0, Math.min(
    0.25 * gapCount * spaceAdvancePt,
    0.36 * (lastWordAdvancePt + spaceAdvancePt) - decayPt * Math.max(0, gapCount - 1),
  ));
}

/**
 * Greedy legal-break fitter. Items are words in source order with measured
 * advancePt, followingSpacePt, and legalBreakAfter. `measurePt` is the live
 * paragraph text measure; the final line is never justified.
 */
export function planWordJustifiedLines(items, measurePt, { spaceAdvancePt, decayPt = 0 } = {}) {
  if (!Array.isArray(items) || !items.length || !(measurePt > 0) || !(spaceAdvancePt > 0)) return [];
  const lines = [];
  let start = 0;
  while (start < items.length) {
    let best = start;
    let width = 0;
    for (let end = start; end < items.length; end += 1) {
      width += Math.max(0, Number(items[end].advancePt) || 0);
      if (end > start) width += Math.max(0, Number(items[end - 1].followingSpacePt) || 0);
      const gaps = end - start;
      const cap = wordLineCompressionBudget({
        gapCount: gaps,
        spaceAdvancePt,
        lastWordAdvancePt: Math.max(0, Number(items[end].advancePt) || 0),
        decayPt,
      });
      if (width - measurePt <= cap + 1e-6 && (items[end].legalBreakAfter !== false)) best = end;
      if (width - measurePt > cap + 1e-6) break;
    }
    // Keep a legal unbreakable group intact even when it exceeds the measure.
    if (best === start && items[start].legalBreakAfter === false) {
      let end = start;
      while (end + 1 < items.length && items[end].legalBreakAfter === false) end += 1;
      best = end;
    }
    let naturalWidthPt = 0;
    for (let i = start; i <= best; i += 1) {
      naturalWidthPt += Math.max(0, Number(items[i].advancePt) || 0);
      if (i < best) naturalWidthPt += Math.max(0, Number(items[i].followingSpacePt) || 0);
    }
    const gaps = best - start;
    const compressionPt = gaps ? Math.max(0, naturalWidthPt - measurePt) : 0;
    lines.push({ start, end: best, naturalWidthPt, compressionPt, gapCount: gaps, last: best === items.length - 1 });
    start = best + 1;
  }
  return lines;
}
