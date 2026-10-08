/**
 * Candidate fit rules for Word-style justified lines.
 *
 * This module is deliberately a pure model: it operates on measured natural
 * advances expressed in points and does not rewrite editor text or insert line
 * breaks. A caller must supply shaped advances for the active font and run
 * styles. The measured 0.04 decay is in points, so this API is point-only.
 */

/**
 * Maximum natural-width overflow Word will absorb for a justified line.
 * Widths must use the same unit (normally CSS px or points).
 */
export function wordJustifyFitBudget({ gapCount, lastWordWidth, spaceWidth, maxGapFraction = 0.25, lastWordFraction = 0.36, gapDecayPt = 0.04 }) {
  if (!(gapCount > 0) || !(lastWordWidth >= 0) || !(spaceWidth > 0)) return 0;
  const gapBudget = maxGapFraction * gapCount * spaceWidth;
  const lastWordBudget = Math.max(0, lastWordFraction * (lastWordWidth + spaceWidth) - gapDecayPt * Math.max(0, gapCount - 1));
  return Math.min(gapBudget, lastWordBudget);
}

/** Evaluate a candidate line using natural shaped advances. */
export function wordJustifyLineFits({ naturalWidth, availableWidth, gapCount, lastWordWidth, spaceWidth, tolerance = 0 }) {
  if (![naturalWidth, availableWidth].every(Number.isFinite) || naturalWidth < 0 || availableWidth < 0) return false;
  const overflow = Math.max(0, naturalWidth - availableWidth);
  return overflow <= wordJustifyFitBudget({ gapCount, lastWordWidth, spaceWidth }) + tolerance;
}

/**
 * Greedy line grouping at caller-supplied legal break opportunities.
 * `items` are measured tokens in source order; `breakBefore[i]` says a line may
 * start before item i. Non-breaking spaces should be represented inside one
 * token. A hard break ends the current group and is preserved as metadata.
 * Oversized tokens remain intact and are marked overflow rather than split.
 */
export function wordJustifyLines(items, { availableWidth, spaceWidth, breakBefore = [], hardBreakBefore = [] } = {}) {
  if (!Array.isArray(items) || !Number.isFinite(availableWidth) || !(spaceWidth > 0)) return [];
  const lines = [];
  let start = 0;
  while (start < items.length) {
    let bestEnd = start + 1;
    let naturalWidth = Number(items[start]?.width) || 0;
    const hardEnd = items.findIndex((_, index) => index > start && hardBreakBefore[index]);
    const limit = hardEnd < 0 ? items.length : hardEnd;
    let gaps = 0;
    for (let end = start + 1; end < limit; end += 1) {
      const itemWidth = Number(items[end]?.width) || 0;
      if (breakBefore[end]) {
        const candidateWidth = naturalWidth + spaceWidth + itemWidth;
        const gapCount = gaps + 1;
        if (!wordJustifyLineFits({ naturalWidth: candidateWidth, availableWidth, gapCount, lastWordWidth: itemWidth, spaceWidth })) break;
        naturalWidth = candidateWidth;
        gaps = gapCount;
        bestEnd = end + 1;
      } else {
        naturalWidth += itemWidth;
        bestEnd = end + 1;
      }
    }
    const measured = items.slice(start, bestEnd).reduce((sum, item, offset) => {
      const index = start + offset;
      return sum + (offset && breakBefore[index] ? spaceWidth : 0) + (Number(item?.width) || 0);
    }, 0);
    lines.push({ start, end: bestEnd, naturalWidth: measured, overflow: measured > availableWidth, hardBreakAfter: bestEnd === hardEnd });
    start = bestEnd;
    if (start === hardEnd) lines[lines.length - 1].hardBreakAfter = true;
  }
  return lines;
}
