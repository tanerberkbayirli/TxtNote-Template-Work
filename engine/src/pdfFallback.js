import { jsPDF } from "jspdf";
import { academicPdfFontFace, collectAcademicPdfFontRequests, exactAcademicPdfFont, embedAcademicPdfFonts, normalizeAcademicPdfFamily, pdfFontStyle } from "../../TxtNote/frontend/src/lib/academicFonts.js";
import { effectiveLineHeight, formatNumber, groupThesisSections, resolveChromeText, resolvePageNumberStyle, transformThesisText } from "./engine.js";
import { thesisGroupHasPageContent } from "./pageLayout.js";
import { flattenSpecialPage } from "./specialPages.js";
import { splitLayoutNodes } from "./layoutDocx.js";
import { asBlocks, blockText, captionText, mmPerPt } from "./docx/xml.js";

function pdfFont(pdf, style, exactFamilies = new Set()) {
  const family = normalizeAcademicPdfFamily(style.fontFamily);
  if (exactFamilies.has(family || style.fontFamily)) {
    const faceStyle = pdfFontStyle({ bold: style.fontWeight >= 600, italic: style.italic });
    pdf.setFont(exactAcademicPdfFont(pdf, faceStyle, style.fontFamily), faceStyle);
  }
  else if (/arial|helvetica/i.test(style.fontFamily)) pdf.setFont("helvetica", `${style.fontWeight >= 600 ? "bold" : ""}${style.italic ? "italic" : ""}` || "normal");
  else {
    const faceStyle = pdfFontStyle({ bold: style.fontWeight >= 600, italic: style.italic });
    const face = academicPdfFontFace(pdf, faceStyle, style.fontFamily);
    pdf.setFont(face.name, face.style);
  }
  pdf.setFontSize(style.fontSizePt);
  pdf.setTextColor(17, 17, 17);
}
function pdfChrome(pdf, section, pageNumber, firstPage, values, exactFamilies = new Set()) {
  const { page, body } = section.rules;
  const contentWidth = page.widthMm - page.margins.leftMm - page.margins.rightMm;
  const header = page.header;
  const footer = page.footer;
  pdfFont(pdf, { ...body, fontSizePt: Math.min(10, body.fontSizePt) }, exactFamilies);
  if (header?.content && !(firstPage && header.firstPage === "omit")) pdf.text(resolveChromeText(header.content, values), page.margins.leftMm, header.distanceMm + header.heightMm / 2, { maxWidth: contentWidth });
  if (footer?.content && !(firstPage && footer.firstPage === "omit")) pdf.text(resolveChromeText(footer.content, values), page.margins.leftMm, page.heightMm - footer.distanceMm, { maxWidth: contentWidth });
  const rule = page.numbering;
  if (!rule.enabled) return;
  const label = formatNumber(pageNumber, rule.format);
  const explicitBaseline = Number.isFinite(rule.baselineFromTopMm);
  const numberingStyle = resolvePageNumberStyle(body, rule);
  pdfFont(pdf, numberingStyle, exactFamilies);
  const defaultX = rule.align === "left" ? page.margins.leftMm : rule.align === "right" ? page.widthMm - page.margins.rightMm : page.widthMm / 2;
  const x = Number.isFinite(rule.xMm) && Number.isFinite(rule.widthMm)
    ? rule.xMm + (rule.align === "left" ? 0 : rule.align === "right" ? rule.widthMm : rule.widthMm / 2)
    : defaultX;
  const y = explicitBaseline
    ? rule.baselineFromTopMm
    : rule.position === "top" ? Math.max(6, page.margins.topMm / 2) : page.heightMm - Math.max(6, page.margins.bottomMm / 2);
  pdf.text(label, x, y, { align: rule.align, ...(explicitBaseline ? { baseline: "alphabetic" } : {}) });
}
function positionedPdfNode(pdf, node, language, lineSpacing, baseStyle = {}, exactFamilies = new Set()) {
  if (!Number.isFinite(node.xMm) || !Number.isFinite(node.yMm)) throw new Error(`Pozisyonlu öğe ${node.id || "?"} için x/y ölçüleri geçersiz`);
  const { xMm, yMm } = node;
  if (node.type === "image") {
    if (!(Number.isFinite(node.widthMm) && node.widthMm > 0 && Number.isFinite(node.heightMm) && node.heightMm > 0 && /^data:image\/(png|jpe?g);base64,/i.test(node.source || ""))) throw new Error(`Pozisyonlu görsel ${node.id || "?"} için geometri veya kaynak geçersiz`);
    pdf.addImage(node.source, /png/i.test(node.source.slice(0, 24)) ? "PNG" : "JPEG", xMm, yMm, node.widthMm, node.heightMm);
    return;
  }
  if (node.type === "separator") {
    if (!(Number.isFinite(node.widthMm) && node.widthMm > 0)) throw new Error(`Pozisyonlu çizgi ${node.id || "?"} için genişlik geçersiz`);
    const hex = /^#[0-9a-f]{6}$/i.test(node.style?.color || "") ? node.style.color.slice(1) : "111111";
    pdf.setDrawColor(Number.parseInt(hex.slice(0, 2), 16), Number.parseInt(hex.slice(2, 4), 16), Number.parseInt(hex.slice(4, 6), 16));
    pdf.setLineWidth((Number(node.thicknessPt) > 0 ? node.thicknessPt : 0.75) * mmPerPt);
    pdf.line(xMm, yMm, xMm + node.widthMm, yMm);
    return;
  }
  if (node.type !== "text") return;
  if (!(Number.isFinite(node.widthMm) && node.widthMm > 0)) throw new Error(`Pozisyonlu metin ${node.id || "?"} için genişlik geçersiz`);
  const style = { ...baseStyle, ...(node.style || {}) };
  pdfFont(pdf, style, exactFamilies);
  const hex = /^#[0-9a-f]{6}$/i.test(style.color || "") ? style.color.slice(1) : "111111";
  pdf.setTextColor(Number.parseInt(hex.slice(0, 2), 16), Number.parseInt(hex.slice(2, 4), 16), Number.parseInt(hex.slice(4, 6), 16));
  const indent = Number(style.leftIndentMm) || 0;
  const firstLineIndent = Number(style.firstLineIndentMm) || 0;
  const width = Math.max(0.1, node.widthMm - indent - (Number(style.rightIndentMm) || 0));
  const align = style.align || "left";
  const text = transformThesisText(node.text, style, language);
  const pitch = style.fontSizePt * effectiveLineHeight(style.lineHeight, lineSpacing, style) * mmPerPt;
  let top = yMm + (Number(style.spaceBeforePt) || 0) * mmPerPt;
  for (const paragraph of text.split("\n")) {
    const lines = pdf.splitTextToSize(paragraph || " ", width);
    for (const [lineIndex, line] of lines.entries()) {
      if (Number.isFinite(node.heightMm) && node.heightMm > 0 && top > yMm + node.heightMm) break;
      const lineIndent = lineIndex === 0 ? firstLineIndent : 0;
      const lineWidth = Math.max(0.1, width - lineIndent);
      const drawX = xMm + indent + lineIndent + (align === "center" ? lineWidth / 2 : align === "right" ? lineWidth : 0);
      pdf.text(line || " ", drawX, top, { align: align === "justify" ? "left" : align, baseline: "top", maxWidth: width });
      top += pitch;
    }
    top += (Number(style.spaceAfterPt) || 0) * mmPerPt;
  }
}
/** Searchable PDF. Pages, margins, type sizes and numbering come from the compiled model. */
export async function buildThesisPdf(model) {
  const first = model.sections[0]?.rules.page;
  const fontRequests = collectAcademicPdfFontRequests(model.documentLayout, model.sections);
  const exactFamilies = new Set(fontRequests.map(value => normalizeAcademicPdfFamily(value) || value));
  const pdf = new jsPDF({ unit: "mm", format: [first?.widthMm || 210, first?.heightMm || 297], compress: true });
  pdf.setProperties({ title: model.title || "Tez", creator: "TxtNote" });
  await embedAcademicPdfFonts(pdf, { templateId: model.templateId, extraFontFamilies: fontRequests, systemFonts: model.systemFonts || [] });
  let started = false;
  let logicalPage = 0;
  for (const group of groupThesisSections(model.sections)) {
    const { page } = group.rules;
    const numbering = page.numbering;
    if (numbering.restart) logicalPage = (numbering.startAt ?? 1) - 1;
    if (!thesisGroupHasPageContent(group)) continue;
    let sectionPage = 0;
    let y = page.margins.topMm;
    const width = page.widthMm - page.margins.leftMm - page.margins.rightMm;
    const startPage = () => {
      if (started) pdf.addPage([page.widthMm, page.heightMm], page.orientation);
      started = true; sectionPage += 1; logicalPage += 1;
      y = page.margins.topMm;
      pdfChrome(pdf, group.sections[0], logicalPage, sectionPage === 1, model.values, exactFamilies);
    };
    startPage();
    const write = (value, style, align = style.align || "left") => {
      if (style.pageBreakBefore && y > page.margins.topMm + 0.5) startPage();
      const source = transformThesisText(value, style, model.language);
      if (!source.trim()) { y += style.fontSizePt * effectiveLineHeight(style.lineHeight, group.rules.lineSpacing, style) * mmPerPt; return; }
      pdfFont(pdf, style, exactFamilies);
      const indent = Math.max(0, style.leftIndentMm || 0);
      const available = Math.max(10, width - indent - Math.max(0, style.rightIndentMm || 0));
      const lineHeight = style.fontSizePt * effectiveLineHeight(style.lineHeight, group.rules.lineSpacing, style) * mmPerPt;
      y += (style.spaceBeforePt || 0) * mmPerPt;
      for (const paragraph of source.split("\n")) {
        const lines = pdf.splitTextToSize(paragraph || " ", available);
        for (const line of lines) {
          if (y + lineHeight > page.heightMm - page.margins.bottomMm) { startPage(); pdfFont(pdf, style, exactFamilies); }
          const x = page.margins.leftMm + indent + (align === "center" ? available / 2 : align === "right" ? available : 0);
          pdf.text(line || " ", x, y, { align: align === "justify" ? "left" : align, baseline: "top" });
          y += lineHeight;
        }
      }
      y += (style.spaceAfterPt || 0) * mmPerPt;
    };
    for (const section of group.sections) {
    const { body, headings } = section.rules;
    const layoutSplit = section.layout ? splitLayoutNodes(section.layout) : { flow: [], positioned: [] };
    const flowLayout = section.layout ? flattenSpecialPage(layoutSplit.flow) : section.layoutBlocks;
    if (flowLayout) for (const block of flowLayout) {
      if (block.type === "spacer") y += block.heightMm;
      else if (block.type === "image") {
        const indentL = block.leftIndentMm || 0; const indentR = block.rightIndentMm || 0;
        const x = page.margins.leftMm + (block.align === "left" ? indentL : block.align === "right" ? width - indentR - block.widthMm : indentL + (width - indentL - indentR - block.widthMm) / 2);
        pdf.addImage(block.source, /png/i.test(block.source.slice(0, 20)) ? "PNG" : "JPEG", x, y, block.widthMm, block.heightMm);
        y += block.heightMm;
      }
      else write(block.text, block.style, block.style.align);
    }
    for (const node of [...layoutSplit.positioned].sort((left, right) => (left.zIndex || 0) - (right.zIndex || 0))) positionedPdfNode(pdf, node, model.language || "tr", section.rules.lineSpacing, body, exactFamilies);
    for (const block of asBlocks(section)) {
      if (block.type === "heading") {
        const style = headings[block.level] || headings[1] || body;
        const headingStyle = block.indentMm ? { ...style, leftIndentMm: (style.leftIndentMm || 0) + block.indentMm } : style;
        write(`${block.thesisNumber ? `${block.thesisNumber}${block.thesisNumberLine ? "\n" : " "}` : ""}${block.text}`, block.unnumbered ? { ...headingStyle, pageBreakBefore: false } : headingStyle);
      } else if (block.type === "paragraph" || block.type === "quote") {
        const style = section.type === "bibliography" ? section.rules.bibliography.style : body;
        write(blockText(block), block.indentMm ? { ...style, leftIndentMm: (style.leftIndentMm || 0) + block.indentMm } : style, block.align || body.align);
      } else if (block.type === "list") {
        (block.items || []).forEach((item, index) => write(`${section.type === "tableOfContents" ? "" : block.ordered ? `${index + 1}. ` : "• "}${item.text || blockText(item)}`, body, "left"));
      } else if (block.type === "table") {
        if (block.caption) write(captionText(section.rules.tables.label, block), section.rules.tables.style, section.rules.tables.align);
        for (const row of block.rows || []) write(row.map((cell) => cell.text).join("     "), body, "left");
      } else if (block.type === "figure") {
        const src = block.src;
        const imgWidth = Math.min(width, (block.width || 400) * mmPerPt * 0.75);
        const imgHeight = imgWidth * ((block.height || 250) / (block.width || 400));
        if (y + imgHeight > page.heightMm - page.margins.bottomMm) startPage();
        if (/^data:image\/(png|jpe?g|webp);base64,/i.test(src)) {
          try { pdf.addImage(src, /png|webp/i.test(src.slice(0, 20)) ? "PNG" : "JPEG", page.margins.leftMm + (width - imgWidth) / 2, y, imgWidth, imgHeight); y += imgHeight + 2; }
          catch { write(block.alt || "[Görsel]", body); }
        }
        if (block.caption) write(captionText(section.rules.figures.label, block), section.rules.figures.style, section.rules.figures.align);
      } else if (block.type === "code" || block.type === "math") {
        write(block.text || "", body);
      }
    }
    }
  }
  return pdf.output("blob");
}
