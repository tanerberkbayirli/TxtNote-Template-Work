import { WORD_FONT_METRICS } from "./wordBaseline.js";

const round = (n) => Math.round(n * 10000) / 10000;
const family = (s) => String(s || "").split(",")[0].replace(/["']/g, "").trim().toLowerCase();

/** Canonical line model. Legacy modes deliberately retain their existing pitches. */
export function resolveLineSpacing(style = {}, spacing = null) {
  const own = style.lineSpacing;
  const canonical = own?.rule ? own : spacing?.rule ? spacing : null;
  const fontPt = style.fontSizePt || 12;
  if (canonical) {
    const metrics = WORD_FONT_METRICS[family(style.fontFamily)];
    const single = canonical.singleLineEm ?? spacing?.singleLineEm ?? (metrics ? metrics.ascent + metrics.descent + metrics.lineGap : null);
    if (canonical.rule !== "exact" && !(single > 0)) throw new Error(`UNKNOWN single-line metrics for ${style.fontFamily}; supply source-measured singleLineEm`);
    const value = canonical.value;
    const pitchPt = canonical.rule === "auto" ? value * single * fontPt : canonical.rule === "atLeast" ? Math.max(value, (single || 1) * fontPt) : value;
    return { rule: canonical.rule, value, pitchPt: round(pitchPt), em: round(pitchPt / fontPt), lineTwips: Math.round(canonical.rule === "auto" ? value * 240 : value * 20) };
  }
  const n = style.lineHeight || 1.5;
  const pitchPt = n * (spacing?.mode === "word" ? spacing.singleLineEm : 1) * fontPt;
  return { rule: spacing?.mode === "word" ? "auto" : "atLeast", value: spacing?.mode === "word" ? n : pitchPt, pitchPt: round(pitchPt), em: round(pitchPt / fontPt), lineTwips: Math.round(spacing?.mode === "word" ? n * 240 : pitchPt * 20) };
}

/** All indents resolve here; hanging keeps the legacy text-edge semantics. */
export function resolveIndent(style = {}, evenPage = false) {
  const input = style.indent || {};
  const hanging = input.hangingMm ?? style.hangingIndentMm ?? 0;
  const left = input.leftMm ?? style.leftIndentMm ?? 0;
  const right = input.rightMm ?? style.rightIndentMm ?? 0;
  const first = hanging > 0 ? -hanging : input.firstLineMm ?? style.firstLineIndentMm ?? 0;
  return { first, left: (input.mirror ?? style.mirrorIndents) && evenPage ? right : left + hanging, right: (input.mirror ?? style.mirrorIndents) && evenPage ? left + hanging : right, mirror: Boolean(input.mirror ?? style.mirrorIndents) };
}

export function paragraphGap(previous, next, spacing = {}, sameStyle = false) {
  if (sameStyle && (previous.contextualSpacing || next.contextualSpacing || spacing.contextualSpacing)) return 0;
  const after = previous.spaceAfterPt || 0, before = next.spaceBeforePt || 0;
  return spacing.paragraphSpacing === "additive" ? after + before : Math.max(after, before);
}

export function resolveTabStops(style = {}) {
  if (style.tabStops) return [...style.tabStops].sort((a, b) => a.positionMm - b.positionMm);
  return style.tabStopMm > 0 ? [{ positionMm: resolveIndent(style).left + style.tabStopMm, align: "left", leader: "none" }] : [];
}
