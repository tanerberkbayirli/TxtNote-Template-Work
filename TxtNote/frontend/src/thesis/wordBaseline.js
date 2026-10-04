/**
 * Word line placement (opt-in: `typography.lineSpacing = { mode: "word", singleLineEm, baseline: "word" }`).
 *
 * Word draws every line of a paragraph at `line top + (lineGap + ascent)` of its font and puts
 * the extra space of "1.5 lines"/"double" BELOW the text; CSS centres the extra space (half
 * leading above and below). Line boxes, pitches and therefore pagination are identical in both
 * models, only the glyphs sit at a different height inside each line box. The engine gives every
 * text-bearing element a paint-only offset (`position: relative; top: -shift`) whose value is a
 * CSS custom property per text style; the editor measures the browser's real baseline of each
 * style (the same way the layout PDF reads it) and sets the property so the baseline lands where
 * Word puts it. Without a measurement the theoretical offset from the font metrics is used.
 *
 * Nothing here knows a university; metrics are those of the font programs themselves.
 */

/** Vertical metrics (em) of the font programs Word uses (hhea = win metrics for these fonts). */
export const WORD_FONT_METRICS = Object.freeze({
  "times new roman": { ascent: 1825 / 2048, descent: 443 / 2048, lineGap: 87 / 2048 },
  arial: { ascent: 1854 / 2048, descent: 434 / 2048, lineGap: 67 / 2048 },
  calibri: { ascent: 1536 / 2048, descent: 512 / 2048, lineGap: 452 / 2048 },
});

/** Advance width of U+0020 (em) in the same font programs. */
export const WORD_SPACE_EM = Object.freeze({ "times new roman": 512 / 2048, arial: 569 / 2048, calibri: 463 / 2048 });
/**
 * Measured (engine-word-justify, real Word render vs exported PDF): Word keeps a justified line whose natural width exceeds the measure by shrinking
 * its inter-word spaces, up to this fraction of the space width. Per font program; fonts not listed are UNKNOWN (no compression).
 * Arial's window is narrower and noisier (Word kept 0.226, rejected 0.208 of a space), 0.22 is the best fit of the matrix.
 */
export const WORD_JUSTIFY_COMPRESSION = Object.freeze({ "times new roman": 0.25, calibri: 0.25, arial: 0.22 });

const familyName = (value) => String(value || "").split(",")[0].replace(/["']/g, "").trim();
const hash = (text) => { let h = 5381; for (let i = 0; i < text.length; i += 1) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0; return h.toString(36); };
const round = (value) => Math.round(value * 10000) / 10000;

export const wordBaselineEnabled = (spacing) => (spacing?.mode === "word" || spacing?.rule) && spacing.baseline === "word";

/**
 * Probe of one text style: its custom property id, the Word baseline offset from the line top
 * (targetPt) and the theoretical CSS-minus-Word offset (fallbackPt). Null when not applicable.
 * `lineHeightEm` is the drawn line height (effectiveLineHeight) in em.
 */
export function wordBaselineProbe(style, spacing, lineHeightEm) {
  spacing = style?.lineSpacing ? { ...spacing, ...style.lineSpacing } : spacing;
  if (!wordBaselineEnabled(spacing) || !(style?.fontSizePt > 0) || !(lineHeightEm > 0)) return null;
  const fontFamily = familyName(style.fontFamily);
  const metrics = WORD_FONT_METRICS[fontFamily.toLowerCase()];
  if (!metrics) return null;
  const fontWeight = (style.fontWeight || 400) >= 600 ? 700 : 400;
  const italic = Boolean(style.italic);
  const key = `${fontFamily}|${style.fontSizePt}|${fontWeight}|${italic ? 1 : 0}|${round(lineHeightEm)}`;
  return {
    id: hash(key), key, fontFamily, fontSizePt: style.fontSizePt, fontWeight, italic, lineHeightEm: round(lineHeightEm),
    targetPt: round((metrics.lineGap + metrics.ascent) * style.fontSizePt),
    fallbackPt: round(((lineHeightEm - metrics.ascent - metrics.descent) / 2 - metrics.lineGap) * style.fontSizePt),
  };
}

/** Paint-only offset declaration for an element drawn with `style` ("" when not applicable). */
export function wordBaselineCss(probe) {
  return probe ? `position:relative;top:calc(-1 * var(--thesis-wb-${probe.id}, ${probe.fallbackPt}pt));` : "";
}

/** Ascent (CSS px) the layout PDF adds to a text rect top to get its baseline. Shared with layoutPdf.js. */
const ascentCache = new Map();
let ascentContext = null;
export function canvasFontAscent(style) {
  const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  if (!ascentCache.has(font)) {
    ascentContext ||= document.createElement("canvas").getContext("2d");
    ascentContext.font = font;
    const metrics = ascentContext.measureText("Hg");
    ascentCache.set(font, metrics.fontBoundingBoxAscent || parseFloat(style.fontSize) * 0.891);
  }
  return ascentCache.get(font);
}

const cssLineBaselineCache = new Map();
const cssFontSetListeners = new WeakSet();
/** CSS-pixel baseline offset inside a one-line CSS line box for the actual installed font. */
export function cssLineBaselineOffset(style, doc = document) {
  if (!doc?.body || !style?.fontFamily || !style?.fontSize) return null;
  if (doc.fonts && !cssFontSetListeners.has(doc.fonts)) {
    doc.fonts.addEventListener("loadingdone", () => cssLineBaselineCache.clear());
    doc.fonts.addEventListener("loadingerror", () => cssLineBaselineCache.clear());
    cssFontSetListeners.add(doc.fonts);
  }
  const key = `${style.fontFamily}|${style.fontSize}|${style.fontWeight || 400}|${style.fontStyle || "normal"}|${style.lineHeight || 1}`;
  if (cssLineBaselineCache.has(key)) return cssLineBaselineCache.get(key);
  const host = doc.createElement("div");
  Object.assign(host.style, { position: "absolute", left: "-20000px", top: "0", visibility: "hidden", pointerEvents: "none" });
  const node = doc.createElement("div");
  Object.assign(node.style, { margin: "0", padding: "0", border: "0", whiteSpace: "nowrap", display: "block", fontFamily: style.fontFamily, fontSize: style.fontSize, fontWeight: String(style.fontWeight || 400), fontStyle: style.fontStyle || "normal", lineHeight: String(style.lineHeight || 1) });
  node.textContent = "HgŞİ";
  host.append(node);
  doc.body.append(host);
  let baseline = null;
  try {
    const top = node.getBoundingClientRect().top;
    const range = doc.createRange();
    range.selectNodeContents(node);
    const rect = [...range.getClientRects()].find((item) => item.height);
    if (rect) baseline = rect.top - top + canvasFontAscent(getComputedStyle(node));
  } finally { host.remove(); }
  if (Number.isFinite(baseline)) cssLineBaselineCache.set(key, baseline);
  return baseline;
}

/**
 * Measure every probe in this browser: baseline = first text rect top + canvas ascent, exactly
 * as the layout PDF computes it, relative to the line top. Returns `:root{--thesis-wb-*: …}` so
 * that baseline equals Word's (line top + lineGap + ascent). Needs a DOM; never stored.
 */
export function measureWordBaselineCss(probes, doc = document) {
  const unique = [...new Map((probes || []).filter(Boolean).map((probe) => [probe.id, probe])).values()];
  if (!unique.length || !doc?.body) return "";
  const host = doc.createElement("div");
  host.setAttribute("aria-hidden", "true");
  Object.assign(host.style, { position: "absolute", left: "-20000px", top: "0", visibility: "hidden", pointerEvents: "none" });
  const rows = unique.map((probe) => {
    const node = doc.createElement("div");
    Object.assign(node.style, { margin: "0", padding: "0", border: "0", whiteSpace: "nowrap", fontFamily: JSON.stringify(probe.fontFamily), fontSize: `${probe.fontSizePt}pt`, fontWeight: String(probe.fontWeight), fontStyle: probe.italic ? "italic" : "normal", lineHeight: String(probe.lineHeightEm) });
    node.textContent = "HgŞİ";
    host.append(node);
    return [probe, node];
  });
  doc.body.append(host);
  const declarations = [];
  try {
    for (const [probe, node] of rows) {
      const top = node.getBoundingClientRect().top;
      const range = doc.createRange(); range.selectNodeContents(node);
      const rect = [...range.getClientRects()].find((r) => r.height) || node.getBoundingClientRect();
      const baselinePt = (rect.top - top + canvasFontAscent(getComputedStyle(node))) * 0.75;
      declarations.push(`--thesis-wb-${probe.id}:${round(baselinePt - probe.targetPt)}pt`);
    }
  } finally { host.remove(); }
  return `:root{${declarations.join(";")}}`;
}
