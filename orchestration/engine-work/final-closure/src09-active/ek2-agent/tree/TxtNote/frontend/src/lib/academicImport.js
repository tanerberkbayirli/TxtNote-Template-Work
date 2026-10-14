/**
 * Recognize academic cover fields (title, authors, institution, keywords,
 * abstract) from imported PDF / Word / plain text so the editor can correct
 * and re-export them.
 */

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function htmlToText(html) {
  return String(html ?? "")
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr|blockquote|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\u200B/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const ABSTRACT_LINE = /^(özet|abstract|özetçe)\s*:?\s*$/i;
const ABSTRACT_PREFIX = /^(özet|abstract|özetçe)\s*[:：]\s*(.+)$/i;
const KEYWORDS_LINE = /^(anahtar\s*kelimeler|anahtar\s*sözcükler|keywords|key\s*words)\s*:?\s*(.*)$/i;
const BODY_HEADING =
  /^(giriş|introduction|yöntem|method|methodology|bulgular|findings|tartışma|discussion|sonuç|conclusion|kaynakça|references|bibliography|1[\.\)\-]?\s*(giriş|introduction))\s*:?\s*$/i;
const INSTITUTION =
  /üniversite|university|fakülte|faculty|enstitü|institute|yüksekokul|college|akademi|conservator|okulu|department|bölümü/i;

function looksLikeAuthors(line) {
  const value = String(line ?? "").trim();
  if (!value || value.length > 180) return false;
  if (INSTITUTION.test(value)) return false;
  if (ABSTRACT_LINE.test(value) || ABSTRACT_PREFIX.test(value) || KEYWORDS_LINE.test(value)) return false;
  if (BODY_HEADING.test(value)) return false;
  if (/https?:\/\//i.test(value) || /@/.test(value)) return false;
  if (/\d{4}/.test(value) && value.length < 8) return false;
  const parts = value
    .split(/\s*[,;]\s*|\s+ve\s+|\s+and\s+|\s+&\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2 && parts.every((part) => part.split(/\s+/).length <= 5 && /[\p{L}]/u.test(part))) {
    return true;
  }
  const words = value.split(/\s+/);
  return words.length >= 2 && words.length <= 6 && /^[\p{L}][\p{L}'’.\-]+(?:\s+[\p{L}][\p{L}'’.\-]+)+$/u.test(value);
}

function linesToHtml(lines) {
  const blocks = [];
  let buffer = [];
  const flush = () => {
    if (!buffer.length) return;
    blocks.push(`<p>${escapeHtml(buffer.join(" "))}</p>`);
    buffer = [];
  };
  for (const line of lines) {
    if (!line) {
      flush();
      continue;
    }
    if (BODY_HEADING.test(line) || /^[A-ZÇĞİÖŞÜÂÎÛ][^\n]{0,80}$/.test(line) && line.length < 60 && !/[.!?]$/.test(line)) {
      flush();
      blocks.push(`<span class="fmt-size-heading">${escapeHtml(line)}</span>`);
      continue;
    }
    buffer.push(line);
  }
  flush();
  return blocks.join("");
}

export function emptyAcademicPaper() {
  return {
    title: "",
    authors: "",
    institution: "",
    keywords: "",
    abstract: "",
    bodyHtml: "",
  };
}

export function parseAcademicPlainText(raw) {
  const paper = emptyAcademicPaper();
  const lines = String(raw ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim());

  let index = 0;
  while (index < lines.length && !lines[index]) index += 1;
  if (index >= lines.length) return paper;

  const titleParts = [lines[index]];
  index += 1;
  while (index < lines.length && lines[index] && !looksLikeAuthors(lines[index]) && !INSTITUTION.test(lines[index]) && !KEYWORDS_LINE.test(lines[index]) && !ABSTRACT_LINE.test(lines[index]) && !ABSTRACT_PREFIX.test(lines[index]) && !BODY_HEADING.test(lines[index]) && titleParts.join(" ").length < 180) {
    if (lines[index].length > 90) break;
    titleParts.push(lines[index]);
    index += 1;
  }
  paper.title = titleParts.join(" ").trim();

  while (index < lines.length && !lines[index]) index += 1;
  if (index < lines.length && looksLikeAuthors(lines[index])) {
    paper.authors = lines[index];
    index += 1;
  }

  while (index < lines.length && !lines[index]) index += 1;
  if (index < lines.length && INSTITUTION.test(lines[index])) {
    paper.institution = lines[index];
    index += 1;
  }

  const body = [];
  let inAbstract = false;
  const abstract = [];

  for (; index < lines.length; index += 1) {
    const line = lines[index];
    const keyMatch = line.match(KEYWORDS_LINE);
    if (keyMatch) {
      paper.keywords = (keyMatch[2] || "").trim();
      if (!paper.keywords) {
        index += 1;
        while (index < lines.length && lines[index] && !ABSTRACT_LINE.test(lines[index]) && !ABSTRACT_PREFIX.test(lines[index]) && !BODY_HEADING.test(lines[index])) {
          paper.keywords = [paper.keywords, lines[index]].filter(Boolean).join(" ");
          index += 1;
        }
        index -= 1;
      }
      inAbstract = false;
      continue;
    }

    const absPrefix = line.match(ABSTRACT_PREFIX);
    if (absPrefix) {
      inAbstract = true;
      abstract.push(absPrefix[2].trim());
      continue;
    }
    if (ABSTRACT_LINE.test(line)) {
      inAbstract = true;
      continue;
    }
    if (BODY_HEADING.test(line)) {
      inAbstract = false;
      body.push(line);
      continue;
    }
    if (inAbstract) {
      if (!line && abstract.length) {
        inAbstract = false;
        continue;
      }
      if (line) abstract.push(line);
      continue;
    }
    body.push(line);
  }

  paper.abstract = abstract.join(" ").replace(/\s+/g, " ").trim();
  paper.bodyHtml = linesToHtml(body);
  return paper;
}

export function parseAcademicHtml(html) {
  return parseAcademicPlainText(htmlToText(html));
}

async function inflateRaw(bytes) {
  if (typeof DecompressionStream !== "function") {
    throw new Error("Word belgesi açılamadı");
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function readZipEntry(buffer, fileName) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  let offset = 0;
  while (offset + 30 <= bytes.length) {
    if (view.getUint32(offset, true) !== 0x04034b50) {
      const next = bytes.indexOf(0x50, offset + 1);
      if (next < 0) break;
      offset = next;
      continue;
    }
    const method = view.getUint16(offset + 8, true);
    const compact = view.getUint32(offset + 18, true);
    const nameLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);
    const nameStart = offset + 30;
    const name = new TextDecoder("utf-8").decode(bytes.subarray(nameStart, nameStart + nameLen));
    const dataStart = nameStart + nameLen + extraLen;
    if (name === fileName) {
      return { method, packed: bytes.subarray(dataStart, dataStart + compact) };
    }
    offset = dataStart + Math.max(compact, 0);
  }
  return null;
}

async function fileFromZip(buffer, fileName) {
  const entry = readZipEntry(buffer, fileName);
  if (!entry) return "";
  if (entry.method === 0) return new TextDecoder("utf-8").decode(entry.packed);
  if (entry.method === 8) return new TextDecoder("utf-8").decode(await inflateRaw(entry.packed));
  throw new Error("Word belgesi açılamadı");
}

function xmlText(xml) {
  return String(xml ?? "")
    .replace(/<w:tab\b[^/]*\/>/g, "\t")
    .replace(/<w:br\b[^/]*\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<w:t\b[^>]*>/g, "")
    .replace(/<\/w:t>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

async function textFromPdf(buffer) {
  try {
    const pdfjs = await import("pdfjs-dist");
    if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
    }
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
    const pages = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      let line = "";
      const lines = [];
      let lastY = null;
      for (const item of content.items) {
        const y = item.transform?.[5];
        if (lastY != null && Math.abs(y - lastY) > 4) {
          lines.push(line.trim());
          line = "";
        }
        line += item.str || "";
        lastY = y;
      }
      if (line.trim()) lines.push(line.trim());
      pages.push(lines.join("\n"));
    }
    return pages.join("\n\n");
  } catch {
    throw new Error("PDF okunamadı. Word (.docx) olarak kaydedip içe aktarın.");
  }
}

async function textFromDocx(buffer) {
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
    if (result.value) return result.value;
  } catch {
    /* fall through to OOXML */
  }
  const xml = await fileFromZip(buffer, "word/document.xml");
  if (!xml) throw new Error("Word belgesi okunamadı");
  return xmlText(xml);
}

export async function importAcademicFile(file) {
  if (!file) throw new Error("Dosya seçilmedi");
  const name = String(file.name || "").toLowerCase();
  const buffer = await file.arrayBuffer();
  if (name.endsWith(".docx")) {
    return parseAcademicHtml(await textFromDocx(buffer));
  }
  if (name.endsWith(".pdf")) {
    return parseAcademicPlainText(await textFromPdf(buffer));
  }
  const text = new TextDecoder("utf-8").decode(buffer);
  if (name.endsWith(".html") || name.endsWith(".htm")) return parseAcademicHtml(text);
  return parseAcademicPlainText(text);
}
