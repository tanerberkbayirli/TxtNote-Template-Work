import { resolveLineSpacing } from "./typography.js";

/** Word reserves header/footer paragraph height beyond nominal pgMar values.
 * Keep nominal margins for DOCX while displaying the actual text frame. */
export function resolveSourcePageFrame(input, nominalMargins = input.docxMargins || input.margins) {
  const page = { ...input };
  const height = paragraphs => (paragraphs || []).reduce((sum, p) => {
    let pitch;
    try { pitch = resolveLineSpacing(p.style, { mode: "word", ...p.style.lineSpacing }).pitchPt; }
    catch { pitch = (p.style.fontSizePt || 11) * 1.2; }
    return sum + pitch + (p.style.spaceBeforePt || 0) + (p.style.spaceAfterPt || 0);
  }, 0) * 25.4 / 72;
  // The flow has one column height for every page of the section, so the first-page variant (title page) must not shrink the
  // body of all later pages: it only counts when the section has no regular variant at all.
  const maxHeight = part => Math.max(...["", "first", "even"].filter(prefix => prefix !== "first" || !part?.paragraphs?.length).map(prefix => {
    const position = prefix ? prefix + "Position" : "position";
    const paragraphs = prefix ? prefix + "Paragraphs" : "paragraphs";
    return part?.[position] ? 0 : height(part?.[paragraphs]);
  }));
  const margins = nominalMargins;
  if (!margins || !["topMm", "bottomMm", "leftMm", "rightMm"].every(key => Number.isFinite(margins[key]))) return page;
  const top = Math.max(margins.topMm, (page.header?.distanceMm || 0) + maxHeight(page.header));
  const bottom = Math.max(margins.bottomMm, (page.footer?.distanceMm || 0) + maxHeight(page.footer));
  page.margins = { ...margins, topMm: top, bottomMm: bottom };
  // A taller first-page footer (title page variant) shortens that page's body only: the flow has one column height, so the difference
  // is kept for footnotes.js layoutFirstPageReserves, which cuts the first page above it.
  delete page.firstFooterExtraMm;
  if (page.differentFirstPage && page.footer?.firstParagraphs?.length && page.footer?.paragraphs?.length && !page.footer.firstPosition) {
    const first = Math.max(margins.bottomMm, (page.footer.distanceMm || 0) + height(page.footer.firstParagraphs));
    if (first - bottom > 0.5) page.firstFooterExtraMm = first - bottom;
  }
  if (top > margins.topMm || bottom > margins.bottomMm) page.docxMargins = { ...margins };
  else delete page.docxMargins;
  return page;
}
