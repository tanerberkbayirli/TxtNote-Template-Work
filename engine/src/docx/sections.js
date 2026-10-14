import { Footer, Header, NumberFormat, PageNumber, Paragraph, TextRun } from "./runtime.js";
import { resolveChromeText, resolvePageNumberStyle } from "../engine.js";
import { positionedPageNumberDocx } from "../layoutDocx.js";
import { wordBaselineProbe } from "../wordBaseline.js";
import { alignDocx, mmPerPt, plainRuns, twip } from "./xml.js";
import { docxParagraph, runProps } from "./paragraphs.js";

export const pageFormat = (value) => ({ "roman-lower": NumberFormat.LOWER_ROMAN, "roman-upper": NumberFormat.UPPER_ROMAN, "alpha-lower": NumberFormat.LOWER_LETTER, "alpha-upper": NumberFormat.UPPER_LETTER }[value] || NumberFormat.DECIMAL);
/**
 * Header/footer of one Word section, mirroring the editor's sheet chrome: text at
 * 10pt, the page number as a PAGE field at body size on its edge (nearest the paper
 * edge), and `firstPage: "omit"` hiding only the text on a group's first page. Every
 * section defines its own parts, so Word never carries a number into an unnumbered page.
 */
export function chromeDocx(section, values, context, groupStart, omitNumberOnFirst = false) {
  const { page, body } = section.rules;
  const chromeStyle = { ...body, fontSizePt: 10, align: "left", firstLineIndentMm: 0, leftIndentMm: 0, rightIndentMm: 0, spaceBeforePt: 0, spaceAfterPt: 0, lineHeight: 1.1, textTransform: "none", fontWeight: 400, italic: false };
  const number = page.numbering;
  const numberEdge = number.position === "top" ? "top" : "bottom";
  // Page numbers use the template's numbering style (e.g. 10 pt) when given, else the body type.
  const numberParagraph = () => {
    const style = resolvePageNumberStyle(body, number);
    if (Number.isFinite(number.baselineFromTopMm)) {
      const fontSizePt = number.style?.fontSizePt || body.fontSizePt;
      const xMm = Number.isFinite(number.xMm) ? number.xMm : page.margins.leftMm;
      const widthMm = Number.isFinite(number.widthMm) ? number.widthMm : page.widthMm - page.margins.leftMm - page.margins.rightMm;
      const baseline = wordBaselineProbe({ ...style, fontSizePt }, { mode: "word", baseline: "word", singleLineEm: 1 }, 1);
      if (!baseline) throw new Error("DOCX PAGE baseline measurement is unsupported for " + (style.fontFamily || "the configured font"));
      const baselineAscentMm = baseline.targetPt * mmPerPt;
      const heightMm = fontSizePt * 1.25 * mmPerPt;
      return positionedPageNumberDocx({ xMm, yMm: number.baselineFromTopMm - baselineAscentMm, widthMm, heightMm, fontFamily: style.fontFamily, fontSizePt, align: number.align }, context.language);
    }
    // centerOnPage: shift the centred text frame so its centre is the physical page centre (right indent = leftMargin - rightMargin).
    const pageShiftMm = number.centerOnPage && number.align === "center" ? page.margins.leftMm - page.margins.rightMm : 0;
    const shiftIndent = pageShiftMm > 0 ? { right: twip(pageShiftMm) } : pageShiftMm < 0 ? { left: twip(-pageShiftMm) } : null;
    return new Paragraph({ alignment: alignDocx(number.align), spacing: { before: 0, after: 0 }, ...(shiftIndent ? { indent: shiftIndent } : {}), children: [new TextRun({ ...runProps(style, context.language), children: [PageNumber.CURRENT] })] });
  };
  const part = (edge, text, withNumber = true, slot = "default") => {
    const chrome = edge === "top" ? page.header : page.footer;
    const textStyle = { ...chromeStyle, ...(slot === "first" ? chrome?.firstStyle : slot === "even" ? chrome?.evenStyle : chrome?.style) };
    const paragraphs = slot === "first" ? chrome?.firstParagraphs : slot === "even" ? chrome?.evenParagraphs : chrome?.paragraphs;
    const chromeRuns = text => String(text).split(/(\{\{(?:PAGE|NUMPAGES)\}\}|\n|\t)/).flatMap(value => value === "{{PAGE}}" ? [{ type: "page" }] : value === "{{NUMPAGES}}" ? [{ type: "numpages" }] : value === "\n" ? [{ type: "break" }] : value === "\t" ? [{ type: "tab" }] : plainRuns(value));
    const position = slot === "first" ? chrome?.firstPosition : slot === "even" ? chrome?.evenPosition : chrome?.position;
    if (position && text === "{{PAGE}}") return [positionedPageNumberDocx({ ...position, fontFamily: textStyle.fontFamily, fontSizePt: textStyle.fontSizePt, align: textStyle.align }, context.language)];
    const children = [];
    if (withNumber && number.enabled && numberEdge === edge && edge === "top") children.push(numberParagraph());
    // Chrome text keeps the editor's fixed 1.1 line box in every template.
    if (paragraphs) for (const p of paragraphs) children.push(docxParagraph(chromeRuns(resolveText(p.text)), { ...chromeStyle, ...p.style }, { ...context, lineSpacing: null }));
    else if (text) children.push(docxParagraph(chromeRuns(text), textStyle, { ...context, lineSpacing: null }));
    if (withNumber && number.enabled && numberEdge === edge && edge === "bottom") children.push(numberParagraph());
    for (let i = 0; i < (chrome?.trailingBlankLines || 0); i += 1) children.push(docxParagraph([], { ...body, lineHeight: 1, spaceBeforePt: 0, spaceAfterPt: 0, firstLineIndentMm: 0 }, context));
    return children.length ? children : [new Paragraph({ children: [] })];
  };
  const resolveText = (content) => resolveChromeText(content, { ...values, PAGE: "{{PAGE}}", NUMPAGES: "{{NUMPAGES}}" });
  const headerText = resolveText(page.header?.content);
  const footerText = resolveText(page.footer?.content);
  const headers = context.omitEmptyHeaderParts ? undefined : { default: new Header({ children: part("top", headerText) }) };
  const footers = { default: new Footer({ children: part("bottom", footerText) }) };
  const omitHeader = Boolean(groupStart && page.header?.firstPage === "omit" && headerText);
  const omitFooter = Boolean(groupStart && page.footer?.firstPage === "omit" && footerText);
  // numbering.omitOnChapterStart: the first page of the Word section (a chapter opening) is counted but prints no number.
  const omitNumber = Boolean(omitNumberOnFirst && number.enabled && number.omitOnChapterStart);
  const differentFirst = page.differentFirstPage || (!context.omitEmptyHeaderParts && page.header?.firstContent !== undefined) || page.footer?.firstContent !== undefined;
  if (omitHeader || omitFooter || omitNumber || differentFirst) {
    if (headers) headers.first = new Header({ children: part("top", omitHeader ? "" : resolveText(page.header?.firstContent ?? headerText), !omitNumber, "first") });
    footers.first = new Footer({ children: part("bottom", omitFooter ? "" : resolveText(page.footer?.firstContent ?? footerText), !omitNumber, "first") });
  }
  // Once even/odd headers are enabled document-wide, all sections need an even
  // part, including sections that use identical content on both page parities.
  if (context.evenAndOddHeaders) {
    if (headers) headers.even = new Header({ children: part("top", resolveText(page.header?.evenContent ?? headerText), true, "even") });
    footers.even = new Footer({ children: part("bottom", resolveText(page.footer?.evenContent ?? footerText), true, "even") });
  }
  return { headers, footers, titlePage: Boolean(omitHeader || omitFooter || omitNumber || differentFirst) };
}
