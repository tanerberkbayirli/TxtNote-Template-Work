/**
 * Academic notes export as A4 PDF or Word (.docx).
 */

import {
  AlignmentType,
  Document,
  ExternalHyperlink,
  Footer,
  FootnoteReferenceRun,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  TableOfContents,
  TextRun,
  Table, TableRow, TableCell, WidthType, BorderStyle, LevelFormat,
  convertMillimetersToTwip,
} from "docx";
import { customFormatCss, validCustomFormatAttr } from "../config/format.js";
import { ACADEMIC_CSS, fitImageSize, htmlWithoutPageGaps, tightenAcademicFlow } from "./academicLayout.js";
import { bibliographyItemsForExport } from "./academicBibliography.js";
import { joinCaptionText, numberAcademicBlocks, parseAcademicHtml } from "./academicDocument.js";
import { cssColorToHex, cssPxToHalfPoints, EXPORT_WIDGET_CSS, snapshotAcademicArticle } from "./academicSnapshot.js";
import { mathFromLatex } from "./mathOmml.js";
import { latexToPlainText } from "./mathPlainText.js";
import { codeFromElement } from "./codeBlock.js";

function stripTags(value) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\u200B/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export const A4_CSS = `${ACADEMIC_CSS}
  @page { size:A4; margin:25mm; }
  html,body { margin:0; padding:0; background:#fff; }
  @media print { .academic-document { width:auto; padding:0; } }
`;

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function academicFileStem(title) {
  const plain = stripTags(title);
  const slug = plain
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "akademik-yazi";
}

export function serializeAcademicBody(html) {
  const cleaned = htmlWithoutPageGaps(html);
  if (typeof document === "undefined") return cleaned;
  const template = document.createElement("template");
  template.innerHTML = cleaned;
  tightenAcademicFlow(template.content);
  return template.innerHTML;
}

export function academicPaperFields(doc) {
  return {
    title: stripTags(doc?.title) || "Başlıksız yazı",
    authors: String(doc?.docAuthors ?? "").trim(),
    institution: String(doc?.institution ?? "").trim(),
    keywords: String(doc?.keywords ?? "").trim(),
    summary: String(doc?.docAbstract ?? "").trim(),
    bibliographyEnabled: Boolean(doc?.bibliographyEnabled),
    bibliographyItems: bibliographyItemsForExport(doc),
    html: serializeAcademicBody(doc?.html),
  };
}

export function buildPrintDocument(doc) {
  const paper = academicPaperFields(doc);
  const heading = escapeHtml(paper.title);
  const authors = escapeHtml(paper.authors);
  const place = escapeHtml(paper.institution);
  const keys = escapeHtml(paper.keywords);
  const summary = escapeHtml(paper.summary);
  const bibliographyList = paper.bibliographyItems
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>${heading}</title>
  <style>${A4_CSS}${customFormatCss(paper.html)}</style>
</head>
<body>
  <article class="paper academic-document">
    <h1 class="document-title">${heading}</h1>
    ${authors ? `<p class="authors">${authors}</p>` : ""}
    ${place ? `<p class="institution">${place}</p>` : ""}
    ${keys ? `<p class="keywords">${keys}</p>` : ""}
    ${summary ? `<section class="abstract"><h2>Özet</h2><p>${summary.replace(/\n/g, "<br>")}</p></section>` : ""}
    <div class="body">${paper.html}</div>
    ${paper.bibliographyEnabled ? `<section class="bibliography"><h2>Kaynakça</h2>${bibliographyList ? `<ul>${bibliographyList}</ul>` : ""}</section>` : ""}
  </article>
</body>
</html>`;
}

export async function downloadBlob(blob, fileName) {
  if (window.__TAURI_INTERNALS__) {
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke("write_academic_file", { fileName, contents: Array.from(new Uint8Array(await blob.arrayBuffer())) });
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function runStyle(el) {
  const style = { font: "Times New Roman", size: 24 };
  const explicit = {};
  const chain = [];
  for (let n = el; n?.nodeType === 1; n = n.parentElement) chain.unshift(n);
  for (const n of chain) {
    const c = n.classList;
    if (c.contains("fmt-size-body")) style.size = 24;
    if (c.contains("fmt-size-heading") || /^H[12]$/.test(n.tagName)) {
      style.size = 28;
      style.bold = true;
    }
    if (c.contains("fmt-size-subheading") || n.tagName === "H3") {
      style.size = 25;
      style.bold = true;
    }
    if (c.contains("fmt-bold") || /^(B|STRONG|TH)$/.test(n.tagName)) style.bold = true;
    if (c.contains("fmt-italic") || /^(I|EM)$/.test(n.tagName)) style.italics = true;
    if (c.contains("fmt-not-bold")) style.bold = false;
    if (c.contains("fmt-not-italic")) style.italics = false;
    if (c.contains("fmt-strike") || /^(S|DEL|STRIKE)$/.test(n.tagName)) style.strike = true;
    if (c.contains("fmt-underline") || n.tagName === "U") style.underline = {};
    if (c.contains("fmt-overline")) style.overline = true;
    for (const token of c) {
      const pt = token.match(/^fmt-pt-(\d+)$/);
      if (pt) style.size = Number(pt[1]) * 2;
    }
    const customPt = validCustomFormatAttr("data-fmt-pt", n.getAttribute("data-fmt-pt"));
    if (customPt) explicit.size = style.size = Number(customPt) * 2;
    const customColor = validCustomFormatAttr("data-fmt-color", n.getAttribute("data-fmt-color"));
    if (customColor) explicit.color = style.color = customColor.slice(1).toUpperCase();
    const customBg = validCustomFormatAttr("data-fmt-bg", n.getAttribute("data-fmt-bg"));
    if (customBg) explicit.shadingFill = style.shadingFill = customBg.slice(1).toUpperCase();
    for (const [name, color] of Object.entries({ black: "000000", red: "BE123C", blue: "0369A1", green: "047857" })) {
      if (c.contains(`fmt-color-${name}`)) style.color = color;
    }
    for (const [name, fill] of Object.entries({ yellow: "FFF2A8", green: "C9F2D0", cyan: "BDEFFF", magenta: "F5C8EE" })) {
      if (c.contains(`fmt-highlight-${name}`)) style.shadingFill = fill;
    }
  }
  const styled = el?.nodeType === 1 ? el : el?.parentElement;
  const view = styled?.ownerDocument?.defaultView;
  if (styled && view) {
    try {
      const cs = view.getComputedStyle(styled);
      style.size = cssPxToHalfPoints(cs.fontSize);
      const weight = Number.parseInt(cs.fontWeight, 10);
      if (weight >= 700) style.bold = true;
      if (cs.fontStyle === "italic" || cs.fontStyle === "oblique") style.italics = true;
      const deco = `${cs.textDecorationLine || ""} ${cs.textDecoration || ""}`;
      if (/\bunderline\b/.test(deco)) style.underline = {};
      if (/line-through/.test(deco)) style.strike = true;
      if (/\boverline\b/.test(deco)) style.overline = true;
      style.color = cssColorToHex(cs.color);
      if (cs.textTransform === "uppercase") style.uppercase = true;
      const family = String(cs.fontFamily || "")
        .split(",")[0]
        .replace(/["']/g, "")
        .trim();
      if (/consolas|courier|mono/i.test(family)) style.font = "Courier New";
      else style.font = "Times New Roman";
    } catch {
      /* keep class-based style */
    }
  }
  // Custom attribute values are authoritative over whatever the computed style resolved to.
  Object.assign(style, explicit);
  return style;
}

function transformRunText(text, style) {
  let next = text;
  if (style.uppercase) next = next.toLocaleUpperCase("tr");
  if (!style.overline) return next;
  return [...next].map((ch) => (ch.trim() ? `${ch}\u0305` : ch)).join("");
}

function readAlign(el) {
  for (let n = el; n?.nodeType === 1; n = n.parentElement) {
    for (const [id, value] of Object.entries({
      left: AlignmentType.LEFT,
      center: AlignmentType.CENTER,
      right: AlignmentType.RIGHT,
      justify: AlignmentType.JUSTIFIED,
    })) {
      if (n.classList.contains(`fmt-align-${id}`) || n.style.textAlign === id) return value;
    }
  }
  const view = el?.ownerDocument?.defaultView;
  if (el && view) {
    try {
      const align = view.getComputedStyle(el).textAlign;
      if (align === "center") return AlignmentType.CENTER;
      if (align === "right" || align === "end") return AlignmentType.RIGHT;
      if (align === "justify") return AlignmentType.JUSTIFIED;
    } catch {
      /* fall through */
    }
  }
  return AlignmentType.LEFT;
}

function paragraphSpacing(el) {
  const view = el?.ownerDocument?.defaultView;
  if (!el || !view) return { after: 0, line: 420 };
  try {
    const cs = view.getComputedStyle(el);
    const font = parseFloat(cs.fontSize) || 16;
    const linePx = Number.parseFloat(cs.lineHeight);
    const line = Number.isFinite(linePx) && font ? Math.round((linePx / font) * 240) : 420;
    const after = Math.round((Number.parseFloat(cs.marginBottom) || 0) * 15);
    const before = Math.round((Number.parseFloat(cs.marginTop) || 0) * 15);
    return { line, after, before };
  } catch {
    return { after: 0, line: 420 };
  }
}

function mathRuns(node) {
  const latex = node.getAttribute?.("data-latex") ?? "";
  const math = mathFromLatex(latex);
  if (math) return [math];
  const text = latexToPlainText(latex) || (node.textContent || "").replace(/\u200B/g, "");
  if (!text) return [];
  return [new TextRun({ text, font: "Times New Roman", italics: true, size: 24, color: "111111" })];
}

function inlineRuns(node, context) {
  if (node.nodeType === 3) {
    const style = runStyle(node.parentElement);
    const { overline, uppercase, ...run } = style;
    return (node.textContent || "")
      .replace(/\u200B/g, "")
      .split("\n")
      .flatMap((text, i) => [
        new TextRun({ ...run, text: transformRunText(text, { overline, uppercase }), ...(i ? { break: 1 } : {}) }),
      ]);
  }
  if (node.nodeType !== 1) return [];
  if (node.classList?.contains("academic-footnote")) {
    const notes = context?.footnotes || {};
    if (context && !context.footnotes) context.footnotes = notes;
    const id = Object.keys(notes).length + 1;
    notes[id] = {
      children: [
        new Paragraph({
          children: [new TextRun({ text: node.getAttribute("data-fn-text") || node.getAttribute("title") || "", font: "Times New Roman", size: 20 })],
        }),
      ],
    };
    return [new FootnoteReferenceRun(id)];
  }
  if (node.classList?.contains("academic-xref")) {
    return [new TextRun({ text: node.textContent || "", italics: true, font: "Times New Roman", size: 24 })];
  }
  if (node.classList?.contains("math-formula")) return mathRuns(node);
  if (node.tagName === "BR") return [new TextRun({ break: 1 })];
  if (node.tagName === "IMG") {
    try {
      return [imageRun(node)];
    } catch {
      return [];
    }
  }
  const children = [...node.childNodes].flatMap((child) => inlineRuns(child, context));
  if (node.tagName === "A") return [new ExternalHyperlink({ link: node.getAttribute("href") || "", children })];
  return children;
}

function imageRun(img) {
  const match = img?.getAttribute("src")?.match(/^data:image\/(jpeg|jpg|png|gif|webp);base64,(.+)$/i);
  if (!match) throw new Error("Word için görsel okunamadı. Görseli yeniden ekleyin.");
  const data = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
  const rect = typeof img.getBoundingClientRect === "function" ? img.getBoundingClientRect() : { width: 0, height: 0 };
  const width = Number(img.getAttribute("width")) || rect.width || img.naturalWidth;
  const height = Number(img.getAttribute("height")) || rect.height || img.naturalHeight;
  const size = fitImageSize(width, height);
  const type = match[1] === "png" || match[1] === "webp" ? "png" : match[1] === "gif" ? "gif" : "jpg";
  return new ImageRun({
    type,
    data,
    transformation: size,
    altText: { title: img.alt || "Şekil", description: img.alt || "Şekil", name: img.alt || "Şekil" },
  });
}
function headingLevelOf(node) {
  if (node.classList?.contains("academic-h3") || node.tagName === "H3") return HeadingLevel.HEADING_3;
  if (node.classList?.contains("academic-h2") || node.tagName === "H2") return HeadingLevel.HEADING_2;
  if (node.classList?.contains("academic-h1") || node.tagName === "H1" || node.classList?.contains("fmt-size-heading")) {
    return HeadingLevel.HEADING_1;
  }
  return null;
}

function pageChrome(position = "bottom-center") {
  const align = /right/.test(position) ? AlignmentType.RIGHT : AlignmentType.CENTER;
  const para = new Paragraph({
    alignment: align,
    children: [new TextRun({ children: [PageNumber.CURRENT], font: "Times New Roman", size: 20 })],
  });
  if (String(position).startsWith("top")) {
    return { headers: { default: new Header({ children: [para] }) } };
  }
  return { footers: { default: new Footer({ children: [para] }) } };
}

function bodyBlocks(root, context={level:0, counter:{value:0}, footnotes:{}}) {
  const out=[];
  let pending=[];
  const paragraph=(runs, el=root, options={})=>new Paragraph({
    children:runs.length?runs:[new TextRun("")], alignment:readAlign(el),
    spacing:{...paragraphSpacing(el), ...(el.tagName==="P" && !options.spacing ? {after:Math.max(paragraphSpacing(el).after||0, 200)} : {})}, ...options,
  });
  const flush=()=>{ if (pending.length) { out.push(paragraph(pending)); pending=[]; } };
  for (const node of root.childNodes) {
    if (node.nodeType!==1) { pending.push(...inlineRuns(node, context)); continue; }
    const tag=node.tagName;
    if (node.classList.contains("academic-figure")) {
      flush();
      const img=node.querySelector("img");
      const caption=node.querySelector("figcaption");
      if (img) out.push(paragraph([imageRun(img)],node,{alignment:AlignmentType.CENTER,keepNext:!!caption,spacing:{before:280,after:caption?120:280}}));
      if (caption) out.push(paragraph([new TextRun({text:caption.textContent,font:"Times New Roman",size:20,italics:true})],node,{alignment:AlignmentType.CENTER,spacing:{after:280,line:300}}));
    } else if (node.classList.contains("code-block") || node.classList.contains("academic-code") || (tag === "PRE" && node.classList.contains("academic-code"))) {
      flush();
      const code = codeFromElement(node);
      const lines = (code || "").split("\n");
      const runs = [];
      lines.forEach((line, i) => {
        if (i) runs.push(new TextRun({ break: 1 }));
        runs.push(new TextRun({ text: line.length ? line : " ", font: "Courier New", size: 21, color: "111111" }));
      });
      out.push(paragraph(runs.length ? runs : [new TextRun({ text: "", font: "Courier New", size: 21 })], node, {
        spacing: { before: 160, after: 200, line: 276 },
      }));
    } else if (node.classList.contains("math-formula--block") || node.getAttribute("data-display") === "block") {
      flush();
      const eq = node.getAttribute("data-number");
      const runs = [...mathRuns(node)];
      if (eq) runs.push(new TextRun({ text: `  (${eq})`, font: "Times New Roman", size: 24 }));
      out.push(paragraph(runs, node, {
        alignment: AlignmentType.CENTER,
        spacing: { before: 160, after: 160, line: 360 },
      }));
    } else if (tag==="IMG") {
      try { pending.push(imageRun(node)); } catch { /* skip unloaded image */ }
    } else if (node.classList.contains("academic-abstract") || (node.classList.contains("abstract") && (tag==="LABEL" || tag==="SECTION"))) {
      flush();
      const heading = node.querySelector(":scope > span, :scope > h2");
      if (heading && heading.textContent.trim()) {
        out.push(paragraph(inlineRuns(heading, context), heading, { spacing:{ after:160, line:336 } }));
      }
      const rest = node.ownerDocument.createElement("div");
      [...node.childNodes].forEach((child) => {
        if (child === heading) return;
        rest.appendChild(child.cloneNode(true));
      });
      out.push(...bodyBlocks(rest, context));
    } else if (node.classList.contains("academic-bibliography") || node.classList.contains("academic-bibliography-field")) {
      flush();
      out.push(paragraph([new TextRun({text:"KAYNAKÇA",bold:true,size:24,font:"Times New Roman"})],node,{keepNext:true,spacing:{before:440,after:160,line:336}}));
      for (const li of node.querySelectorAll("li")) {
        const text = (li.textContent || "").replace(/\u200B/g, "").trim();
        if (!text) continue;
        out.push(paragraph(inlineRuns(li, context), li, { numbering:{ reference:"academic-bibliography", level:0 }, spacing:{ after:120, line:420 } }));
      }
    } else if (tag==="TABLE") {
      flush();
      const caption = node.querySelector("caption");
      if (caption) {
        out.push(paragraph(
          [new TextRun({text:caption.textContent,font:"Times New Roman",size:20,italics:true})],
          caption,
          {alignment:AlignmentType.CENTER,keepNext:true,spacing:{before:200,after:80,line:300}},
        ));
      }
      out.push(new Table({
        width:{size:100,type:WidthType.PERCENTAGE},
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
          left: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
          right: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
          insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
        },
        rows:[...node.rows].map(row=>new TableRow({
          tableHeader:row.parentElement?.tagName==="THEAD",
          cantSplit:true,
          children:[...row.cells].map((cell) => {
            const children = bodyBlocks(cell,context);
            return new TableCell({
              columnSpan:cell.colSpan,
              rowSpan:cell.rowSpan,
              children: children.length ? children : [new Paragraph({ children: [new TextRun("")] })],
              margins:{top:100,bottom:100,left:100,right:100},
            });
          }),
        })),
      }));
    } else if (tag==="UL" || tag==="OL") {
      flush();
      const level=context.level || 0;
      const instance=++context.counter.value;
      const biblio = Boolean(node.closest(".bibliography"));
      for (const li of node.children) {
        const inline=[...li.childNodes].filter(n=>!['UL','OL'].includes(n.tagName)).flatMap((n)=>inlineRuns(n,context));
        const marker = biblio
          ? { numbering:{ reference:"academic-bibliography", level:0 } }
          : tag==="UL" ? {bullet:{level:Math.min(level,8)}} : {numbering:{reference:"academic-numbering",level:Math.min(level,8),instance}};
        out.push(paragraph(inline,li,marker));
        for (const nested of li.children) if (['UL','OL'].includes(nested.tagName)) { const wrapper=node.ownerDocument.createElement("div"); wrapper.appendChild(nested.cloneNode(true)); out.push(...bodyBlocks(wrapper,{...context,level:level+1})); }
      }
    } else if (node.classList.contains("academic-page-break") || node.hasAttribute?.("data-academic-page-break")) {
      flush();
      out.push(new Paragraph({ children: [new PageBreak()] }));
    } else if (node.classList.contains("academic-toc") || node.hasAttribute?.("data-academic-toc")) {
      flush();
      out.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        keepNext: true,
        children: [new TextRun({ text: "İçindekiler", bold: true, font: "Times New Roman", size: 28 })],
        spacing: { before: 200, after: 160, line: 336 },
      }));
      out.push(new TableOfContents("İçindekiler", { hyperlink: true, headingStyleRange: "1-3" }));
    } else if (/^(DIV|P|H[1-6]|BLOCKQUOTE|PRE|SECTION|LABEL)$/.test(tag)) {
      flush();
      const heading = headingLevelOf(node);
      if (heading && !node.querySelector("div,p,table,figure,ul,ol,section")) {
        const number = node.getAttribute("data-number");
        const plain = (node.textContent || "").replace(/\u200B/g, "").trim();
        const text = number && !plain.startsWith(number) ? `${number} ${plain}` : plain;
        out.push(new Paragraph({
          heading: node.hasAttribute("data-unnumbered") ? undefined : heading,
          keepNext: true,
          spacing: { before: 240, after: 160, line: 336 },
          children: [new TextRun({ text, bold: true, font: "Times New Roman", size: heading === HeadingLevel.HEADING_3 ? 24 : heading === HeadingLevel.HEADING_2 ? 25 : 28 })],
        }));
      } else if (node.querySelector("div,p,table,figure,ul,ol,section,h1,h2,h3,img,.math-formula--block,.code-block,.academic-toc,.academic-page-break")) {
        out.push(...bodyBlocks(node,context));
      } else out.push(paragraph(inlineRuns(node, context),node,{
        ...( /^H[1-6]$/.test(tag) ? {keepNext:true,spacing:{before:200,after:160,line:336}} : {}),
        ...(tag==="BLOCKQUOTE" ? {indent:{left:240},spacing:{before:200,after:200,line:420},border:{left:{color:"999999",style:BorderStyle.SINGLE,size:12,space:8}}} : {}),
      }));
    } else pending.push(...inlineRuns(node, context));
  }
  flush();
  return out.length ? out : [paragraph([])];
}

function decodeBase64(b64) {
  if (typeof Buffer !== "undefined") return Uint8Array.from(Buffer.from(b64, "base64"));
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function imageFromDataUrl(src, width, height, alt) {
  const match = String(src || "").match(/^data:image\/(jpeg|jpg|png|gif|webp);base64,(.+)$/i);
  if (!match) return null;
  const size = fitImageSize(width, height);
  const type = match[1] === "png" || match[1] === "webp" ? "png" : match[1] === "gif" ? "gif" : "jpg";
  return new ImageRun({
    type,
    data: decodeBase64(match[2]),
    transformation: size,
    altText: { title: alt || "Şekil", description: alt || "Şekil", name: alt || "Şekil" },
  });
}

function headingEnum(level) {
  if (level === 2) return HeadingLevel.HEADING_2;
  if (level === 3) return HeadingLevel.HEADING_3;
  return HeadingLevel.HEADING_1;
}

function runsFromModel(runs = [], context) {
  const out = [];
  for (const run of runs) {
    if (run.type === "footnote") {
      const notes = context.footnotes;
      const id = Object.keys(notes).length + 1;
      notes[id] = {
        children: [new Paragraph({ children: [new TextRun({ text: run.text || "", font: "Times New Roman", size: 20 })] })],
      };
      out.push(new FootnoteReferenceRun(id));
      continue;
    }
    if (run.type === "break") {
      out.push(new TextRun({ break: 1 }));
      continue;
    }
    const text = run.text || run.latex || "";
    if (!text) continue;
    out.push(
      new TextRun({
        text,
        bold: Boolean(run.bold),
        italics: Boolean(run.italic),
        underline: run.underline ? {} : undefined,
        strike: Boolean(run.strike),
        shading: run.shadingFill ? { fill: run.shadingFill, type: "clear" } : undefined,
        font: "Times New Roman",
        size: 24,
      }),
    );
  }
  return out.length ? out : [new TextRun("")];
}

export function blocksToDocxChildren(blocks, context = { footnotes: {} }) {
  const numbered = numberAcademicBlocks(blocks);
  const out = [];
  for (const block of numbered.blocks) {
    if (block.type === "pageBreak") {
      out.push(new Paragraph({ children: [new PageBreak()] }));
      continue;
    }
    if (block.type === "toc") {
      out.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "İçindekiler", bold: true, font: "Times New Roman", size: 28 })] }));
      out.push(new TableOfContents("İçindekiler", { hyperlink: true, headingStyleRange: "1-3" }));
      continue;
    }
    if (block.type === "heading") {
      const text = `${block.number ? `${block.number} ` : ""}${block.text}`;
      out.push(
        new Paragraph({
          heading: block.unnumbered ? undefined : headingEnum(block.level),
          keepNext: true,
          spacing: { before: 240, after: 160, line: 336 },
          children: [new TextRun({ text, bold: true, font: "Times New Roman", size: block.level === 3 ? 24 : block.level === 2 ? 25 : 28 })],
        }),
      );
      continue;
    }
    if (block.type === "figure") {
      const image = imageFromDataUrl(block.src, block.width, block.height, block.caption);
      if (image) {
        out.push(new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, children: [image], spacing: { before: 200, after: 80 } }));
      }
      const caption = joinCaptionText(block.label, block.caption);
      if (caption) {
        out.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: caption, italics: true, size: 20, font: "Times New Roman" })], spacing: { after: 200 } }));
      }
      continue;
    }
    if (block.type === "table") {
      const caption = joinCaptionText(block.label, block.caption);
      if (caption) {
        out.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: caption, italics: true, size: 20, font: "Times New Roman" })] }));
      }
      const rows = (block.rows || []).map(
        (row) =>
          new TableRow({
            cantSplit: true,
            children: row.map(
              (cell) =>
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: cell.text || " ", font: "Times New Roman", size: 22, bold: Boolean(cell.header) })] })],
                  margins: { top: 80, bottom: 80, left: 80, right: 80 },
                }),
            ),
          }),
      );
      if (rows.length) {
        out.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
              left: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
              right: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
              insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
            },
            rows,
          }),
        );
      }
      continue;
    }
    if (block.type === "code") {
      const lines = String(block.text || "").split("\n");
      const runs = [];
      lines.forEach((line, i) => {
        if (i) runs.push(new TextRun({ break: 1 }));
        runs.push(new TextRun({ text: line.length ? line : " ", font: "Courier New", size: 21 }));
      });
      out.push(new Paragraph({ children: runs.length ? runs : [new TextRun({ text: " ", font: "Courier New", size: 21 })], spacing: { before: 160, after: 200, line: 276 } }));
      continue;
    }
    if (block.type === "math") {
      const math = mathFromLatex(block.latex || "");
      const children = math ? [math] : [new TextRun({ text: block.text || block.latex || "", italics: true, font: "Times New Roman", size: 24 })];
      if (block.number) children.push(new TextRun({ text: `  (${block.number})`, font: "Times New Roman", size: 24 }));
      out.push(new Paragraph({ alignment: AlignmentType.CENTER, children, spacing: { before: 160, after: 160 } }));
      continue;
    }
    if (block.type === "list") {
      (block.items || []).forEach((item, index) => {
        out.push(
          new Paragraph({
            numbering: block.ordered ? { reference: "academic-numbering", level: 0, instance: 1 } : undefined,
            bullet: block.ordered ? undefined : { level: 0 },
            children: runsFromModel(item.runs || [{ type: "text", text: item.text || "" }], context),
          }),
        );
        void index;
      });
      continue;
    }
    out.push(
      new Paragraph({
        alignment: block.align === "center" ? AlignmentType.CENTER : block.align === "right" ? AlignmentType.RIGHT : AlignmentType.LEFT,
        children: runsFromModel(block.runs || [{ type: "text", text: block.text || "" }], context),
        spacing: { after: 200, line: 420 },
      }),
    );
  }
  return out.length ? out : [new Paragraph({ children: [new TextRun("")] })];
}

async function prepareImages(root) {
  await Promise.all([...root.querySelectorAll("img")].map(async (img)=>{
    const decoded=new Image();
    await new Promise((resolve,reject)=>{ const timer=setTimeout(()=>reject(new Error("Görsel yükleme zaman aşımı")),15000); decoded.onload=()=>{clearTimeout(timer);resolve();}; decoded.onerror=()=>{clearTimeout(timer);reject(new Error("Görsel yüklenemedi"));}; decoded.src=img.src; });
    const width = img.getAttribute("width") || decoded.naturalWidth;
    const height = img.getAttribute("height") || decoded.naturalHeight;
    const size=fitImageSize(width, height);
    if (!img.getAttribute("width")) {
      img.setAttribute("width",size.width);
      img.setAttribute("height",size.height);
    }
    if (!/^data:image\/(png|jpe?g|gif);/i.test(img.src)) {
      const canvas=document.createElement("canvas"); canvas.width=decoded.naturalWidth; canvas.height=decoded.naturalHeight;
      canvas.getContext("2d").drawImage(decoded,0,0); img.src=canvas.toDataURL("image/png");
    }
  }));
}

function coverFromFields(paper) {
  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: paper.title, font: "Times New Roman", bold: true, size: 32 })],
      spacing: { after: 280, line: 324 },
    }),
  ];
  if (paper.authors) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: paper.authors, size: 24, font: "Times New Roman" })],
        spacing: { after: 80 },
      }),
    );
  }
  if (paper.institution) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: paper.institution, italics: true, size: 24, font: "Times New Roman" })],
        spacing: { after: 160 },
      }),
    );
  }
  if (paper.keywords) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: paper.keywords, italics: true, size: 21, font: "Times New Roman" })],
        spacing: { after: 320 },
      }),
    );
  }
  if (paper.summary) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Özet", bold: true, size: 24, font: "Times New Roman" })],
        spacing: { after: 160, line:336 },
      }),
    );
    children.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        children: [new TextRun({ text: paper.summary, size: 22, font: "Times New Roman" })],
        spacing: { after: 360, line: 420 },
      }),
    );
  }
  return children;
}

export async function buildAcademicDocx(doc) {
  const paper = academicPaperFields(doc);
  const mm = convertMillimetersToTwip;
  const context = { level: 0, counter: { value: 0 }, footnotes: {} };
  let children;

  if (doc?.article && typeof document !== "undefined") {
    const clone = await snapshotAcademicArticle(doc.article);
    const host = document.createElement("div");
    host.style.cssText = "position:fixed;left:-10000px;top:0;width:210mm;background:#fff;color:#000;z-index:-1;";
    const style = document.createElement("style");
    style.textContent = `${A4_CSS}\n${EXPORT_WIDGET_CSS}`;
    host.appendChild(style);
    host.appendChild(clone);
    document.body.appendChild(host);
    try {
      await prepareImages(clone);
      children = bodyBlocks(clone, context);
    } finally {
      host.remove();
    }
  } else {
    children = coverFromFields(paper);
    children.push(...blocksToDocxChildren(parseAcademicHtml(paper.html), context));
    if (paper.bibliographyEnabled) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "Kaynakça", bold: true, size: 28, font: "Times New Roman" })],
          spacing: { before: 440, after: 160, line: 336 },
        }),
      );
      for (const text of paper.bibliographyItems) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            numbering: { reference: "academic-bibliography", level: 0 },
            children: [new TextRun({ text, size: 24, font: "Times New Roman" })],
            spacing: { after: 160, line: 360 },
          }),
        );
      }
    }
  }

  const file = new Document({
    title: paper.title,
    creator: "TxtNote",
    footnotes: context.footnotes,
    features: { updateFields: false },
    numbering:{config:[
      {reference:"academic-numbering",levels:Array.from({length:9},(_,level)=>({level,format:LevelFormat.DECIMAL,text:`%${level+1}.`,alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:480*(level+1),hanging:240}}}}))},
      {reference:"academic-bibliography",levels:[{level:0,format:LevelFormat.BULLET,text:"●",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:360,hanging:280}}}}]},
    ]},
    styles: {
      default: {
        document: {
          run: { font: "Times New Roman", size: 24 },
          paragraph: { spacing:{line:420, after:0} },
        },
        heading1: {
          run: { font: "Times New Roman", size: 28, bold: true },
          paragraph: { spacing: { before: 240, after: 160, line: 336 }, outlineLevel: 0, keepNext: true },
        },
        heading2: {
          run: { font: "Times New Roman", size: 25, bold: true },
          paragraph: { spacing: { before: 200, after: 140, line: 336 }, outlineLevel: 1, keepNext: true },
        },
        heading3: {
          run: { font: "Times New Roman", size: 24, bold: true },
          paragraph: { spacing: { before: 180, after: 120, line: 336 }, outlineLevel: 2, keepNext: true },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: mm(210), height: mm(297) },
            margin: { top: mm(25), bottom: mm(25), left: mm(25), right: mm(25) },
          },
        },
        ...pageChrome(doc?.pageNumberPosition || "bottom-center"),
        children,
      },
    ],
  });
  return Packer.toBlob(file);
}

export async function downloadAcademicDocx(doc) {
  const blob = await buildAcademicDocx(doc);
  return downloadBlob(blob, `${academicFileStem(doc.title)}.docx`);
}
