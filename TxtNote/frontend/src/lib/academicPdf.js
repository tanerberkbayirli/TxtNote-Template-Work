/**
 * Academic PDF: selectable, searchable text on A4 — never a full-page raster.
 */

import { jsPDF } from "jspdf";
import { academicFileStem, academicPaperFields, downloadBlob, A4_CSS } from "./academicExport.js";
import { snapshotAcademicStack, EXPORT_WIDGET_CSS } from "./academicSnapshot.js";
import { customFormatCss } from "../config/format.js";
import { collectFootnotes, numberAcademicBlocks, parseAcademicHtml, tocEntries } from "./academicDocument.js";
import { ACADEMIC_PDF_FONT, embedAcademicPdfFonts, pdfFontStyle, academicPdfFont } from "./academicFonts.js";
import {
  PDF_TYPE,
  PT_MM,
  applyPageNumbering,
  approximateWidth,
  boxesFromBlocks,
  contentSize,
  paginateBoxes,
} from "./academicPdfLayout.js";
import { PAGE, PAGE_HEIGHT_PX, PAGE_GAP_PX, layoutAcademicPages } from "./academicLayout.js";

function measureWithPdf(pdf) {
  return (text, fontSizePt, style = {}) => {
    if (!text) return 0;
    try {
      pdf.setFont(ACADEMIC_PDF_FONT, style.mono ? "normal" : pdfFontStyle(style));
      pdf.setFontSize(fontSizePt);
      return pdf.getTextWidth(String(text));
    } catch {
      return approximateWidth(text, fontSizePt, style);
    }
  };
}

function coverBlocks(paper) {
  const blocks = [];
  if (paper.title) {
    blocks.push({ type: "heading", level: 1, text: paper.title, unnumbered: true, keepWithNext: true });
  }
  if (paper.authors) {
    blocks.push({
      type: "paragraph",
      align: "center",
      runs: [{ type: "text", text: paper.authors, italic: false }],
    });
  }
  if (paper.institution) {
    blocks.push({
      type: "paragraph",
      align: "center",
      runs: [{ type: "text", text: paper.institution, italic: true }],
    });
  }
  if (paper.keywords) {
    blocks.push({
      type: "paragraph",
      align: "center",
      runs: [{ type: "text", text: paper.keywords, italic: true }],
    });
  }
  if (paper.summary) {
    blocks.push({ type: "heading", level: 1, text: "Özet", unnumbered: true, keepWithNext: true });
    blocks.push({
      type: "paragraph",
      align: "justify",
      runs: [{ type: "text", text: paper.summary }],
    });
  }
  return blocks;
}

function bibliographyBlocks(paper) {
  if (!paper.bibliographyEnabled) return [];
  const blocks = [{ type: "heading", level: 1, text: "Kaynakça", unnumbered: true, keepWithNext: true }];
  const items = (paper.bibliographyItems || []).filter(Boolean).map((text) => ({ text, runs: [{ type: "text", text }] }));
  if (items.length) blocks.push({ type: "list", ordered: false, items });
  return blocks;
}

function pageNumberPoint(position, margin) {
  const yBottom = PAGE.heightMm - Math.max(10, margin * 0.45);
  const yTop = Math.max(10, margin * 0.45);
  if (position === "top-right") return { x: PAGE.widthMm - margin, y: yTop, align: "right" };
  if (position === "bottom-right") return { x: PAGE.widthMm - margin, y: yBottom, align: "right" };
  return { x: PAGE.widthMm / 2, y: yBottom, align: "center" };
}

function setStyle(pdf, { bold, italic, size, mono } = {}) {
  pdf.setFont(ACADEMIC_PDF_FONT, mono ? "normal" : pdfFontStyle({ bold, italic }));
  pdf.setFontSize(size || PDF_TYPE.body);
  pdf.setTextColor(17, 17, 17);
}

function drawLines(pdf, lines, x, y, { size, bold, italic, mono, align, width }) {
  setStyle(pdf, { size, bold, italic, mono });
  const lineH = (size || PDF_TYPE.body) * 1.75 * PT_MM;
  let cursor = y;
  for (const line of lines) {
    const text = line || " ";
    let drawX = x;
    if (align === "center") drawX = x + width / 2;
    else if (align === "right") drawX = x + width;
    pdf.text(text, drawX, cursor, { align: align === "left" || !align ? "left" : align, baseline: "top" });
    cursor += lineH;
  }
  return cursor;
}

async function drawImage(pdf, src, x, y, widthMm, heightMm) {
  if (!src) return;
  const match = String(src).match(/^data:image\/(jpeg|jpg|png|gif|webp);base64,/i);
  const format = match && /png|webp/i.test(match[1]) ? "PNG" : "JPEG";
  try {
    pdf.addImage(src, format, x, y, widthMm, heightMm, undefined, "FAST");
  } catch {
    /* skip broken image */
  }
}

function drawTable(pdf, box, x, y, width) {
  const capH = (box.captionLines?.length || 0) * (PDF_TYPE.caption * 1.5 * PT_MM);
  if (box.captionLines?.length) {
    drawLines(pdf, box.captionLines, x, y, {
      size: PDF_TYPE.caption,
      italic: true,
      align: "center",
      width,
    });
  }
  let cursor = y + capH;
  const cols = box.cols || 1;
  const colW = width / cols;
  pdf.setDrawColor(120);
  pdf.setLineWidth(0.2);
  for (const row of box.rows || []) {
    for (let c = 0; c < cols; c += 1) {
      const cell = row[c];
      const cellX = x + c * colW;
      pdf.rect(cellX, cursor, colW, box.rowH);
      if (cell?.text) {
        setStyle(pdf, { size: 10, bold: Boolean(cell.header) });
        pdf.text(String(cell.text), cellX + 1.5, cursor + 2, { baseline: "top", maxWidth: colW - 3 });
      }
    }
    cursor += box.rowH;
  }
  return cursor;
}

function drawFootnotes(pdf, notes, x, y, width) {
  if (!notes.length) return;
  pdf.setDrawColor(80);
  pdf.setLineWidth(0.2);
  pdf.line(x, y, x + Math.min(40, width), y);
  let cursor = y + 2;
  setStyle(pdf, { size: PDF_TYPE.footnote });
  const lineH = PDF_TYPE.footnote * 1.35 * PT_MM;
  for (const note of notes) {
    pdf.text(`${note.index}. ${note.text || ""}`, x, cursor, { baseline: "top", maxWidth: width });
    cursor += lineH;
  }
}

export async function buildAcademicPdf(doc) {
  const paper = academicPaperFields(doc);
  if(doc?.article && typeof document !== 'undefined'){
    await document.fonts?.ready;
    const snapshot=await snapshotAcademicStack(doc.article);
    if(!snapshot)throw new Error('Akademik belge görünümü hazırlanamadı');
    const host=document.createElement('div'),style=document.createElement('style');
    host.style.cssText='position:fixed;left:-100000px;top:0;width:210mm;background:white;';
    style.textContent=A4_CSS+EXPORT_WIDGET_CSS+customFormatCss(snapshot.article.outerHTML);
    host.append(style,snapshot.root);document.body.appendChild(host);
    try{
      const pages=doc.article.closest('.academic-stack') ? (doc.measuredPageCount || snapshot.sheetCount) : layoutAcademicPages(snapshot.article);
      const pitch=PAGE_HEIGHT_PX+PAGE_GAP_PX;
      const firstBreak=snapshot.article.querySelector('.academic-page-break');
      const boundary=firstBreak ? Math.max(1,Math.ceil((firstBreak.getBoundingClientRect().top-snapshot.root.getBoundingClientRect().top)/pitch)) : pages;
      const labels=applyPageNumbering(Array.from({length:pages},(_,i)=>({frontMatter:i<boundary})),doc.pageNumbering||{});
      const {buildMeasuredAcademicPdf}=await import('../../../../engine/src/layoutPdf.js');
      return await buildMeasuredAcademicPdf({root:snapshot.root,pages,pagePitchPx:pitch,title:paper.title,drawPage(pdf,i){
        const point=pageNumberPoint(doc.pageNumberPosition||'bottom-center',PAGE.marginMm);
        pdf.setFont(academicPdfFont(pdf),'normal');pdf.setFontSize(PDF_TYPE.pageNumber);pdf.setTextColor(17,17,17);pdf.text(labels[i].numberLabel||String(i+1),point.x,point.y,{align:point.align,baseline:'middle'});
      }});
    }finally{host.remove();}
  }
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  pdf.setProperties({ title: paper.title, creator: "TxtNote" });
  await embedAcademicPdfFonts(pdf);

  const bodyBlocks = parseAcademicHtml(paper.html);
  const combined = [...coverBlocks(paper), ...bodyBlocks, ...bibliographyBlocks(paper)];
  const numbered = numberAcademicBlocks(combined);
  const toc = tocEntries(numbered.blocks);
  const measure = measureWithPdf(pdf);
  const numbering = doc?.pageNumbering || { front: "arabic", body: "arabic" };
  const boxes = boxesFromBlocks(numbered.blocks, measure, {
    tocEntries: toc,
    frontMatter: numbering.front === "roman",
    endFrontMatterOnBreak: numbering.front === "roman",
  });
  const pages = applyPageNumbering(paginateBoxes(boxes, {}), numbering);
  const { width, margin } = contentSize();
  const position = doc?.pageNumberPosition || "bottom-center";
  const originX = margin;
  const originY = margin;

  pages.forEach((page, pageIndex) => {
    if (pageIndex) pdf.addPage();
    let y = originY;
    for (const item of page.items) {
      y += item.before || 0;
      if (item.type === "figure") {
        const imgX =
          item.align === "left" ? originX : item.align === "right" ? originX + width - item.width : originX + (width - item.width) / 2;
        void drawImage(pdf, item.src, imgX, y, item.width, item.imgHeight);
        if (item.captionLines?.length) {
          drawLines(pdf, item.captionLines, originX, y + item.imgHeight + 2, {
            size: PDF_TYPE.caption,
            italic: true,
            align: "center",
            width,
          });
        }
      } else if (item.type === "table") {
        drawTable(pdf, item, originX, y, width);
      } else if (item.type === "math") {
        drawLines(pdf, item.lines, originX, y, {
          size: item.size,
          italic: true,
          align: "center",
          width: item.number ? width - 16 : width,
        });
        if (item.number) {
          setStyle(pdf, { size: PDF_TYPE.body });
          pdf.text(`(${item.number})`, originX + width, y, { align: "right", baseline: "top" });
        }
      } else if (item.type === "code") {
        drawLines(pdf, item.lines, originX, y, { size: PDF_TYPE.code, mono: true, width });
      } else if (item.type === "heading") {
        drawLines(pdf, item.lines, originX, y, { size: item.size, bold: true, width });
      } else {
        drawLines(pdf, item.lines, originX, y, {
          size: item.size,
          italic: item.italic,
          align: item.align === "justify" ? "left" : item.align,
          width,
        });
      }
      y += item.height - (item.before || 0);
    }
    if (page.footnotes.length) {
      const fnTop = PAGE.heightMm - margin - page.footnotes.length * (PDF_TYPE.footnote * 1.35 * PT_MM) - 4;
      drawFootnotes(pdf, page.footnotes, originX, Math.max(y + 4, fnTop), width);
    }
    const point = pageNumberPoint(position, margin);
    setStyle(pdf, { size: PDF_TYPE.pageNumber });
    pdf.text(page.numberLabel || String(pageIndex + 1), point.x, point.y, { align: point.align, baseline: "middle" });
  });

  void collectFootnotes(numbered.blocks);
  return pdf.output("blob");
}

export async function downloadAcademicPdf(doc) {
  return downloadBlob(await buildAcademicPdf(doc), `${academicFileStem(doc.title)}.pdf`);
}
