import { AlignmentType, BorderStyle } from "docx";
import { parseAcademicHtml } from "../../lib/academicDocument.js";
import { extractThesisHeadings } from "../engine.js";
import { foldFieldMarkup } from "./fields.js";
import { MM_PER_PT, mmToTwip, ptToTwip } from "../units.js";

export const mmPerPt = MM_PER_PT;
const strip = (html) => String(html ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").trim();
export const alignDocx = (value) => ({ center: AlignmentType.CENTER, right: AlignmentType.RIGHT, justify: AlignmentType.JUSTIFIED }[value] || AlignmentType.LEFT);
export const blockText = (block) => {
  const runs = block.runs || [];
  return runs.map((run) => run.type === "break" ? "\n" : run.type === "link" ? (run.children || []).map((child) => child.text || "").join("") : run.text || "").join("") || block.text || "";
};
const stripSpecialLayoutMarkup = (source) => {
  const html = String(source ?? "");
  const tagPattern = /<!--[\s\S]*?-->|<![^>]*>|<[^>]+>/g;
  const voidTags = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
  let output = "";
  let cursor = 0;
  let skipped = [];
  for (const match of html.matchAll(tagPattern)) {
    const token = match[0];
    const start = match.index;
    const parsed = token.match(/^<\s*(\/?)\s*([A-Za-z][\w:-]*)/);
    if (skipped.length) {
      if (parsed) {
        const [, closing, rawName] = parsed;
        const name = rawName.toLowerCase();
        if (closing) {
          const index = skipped.lastIndexOf(name);
          if (index >= 0) skipped.splice(index);
        } else if (!voidTags.has(name) && !/\/\s*>$/.test(token)) skipped.push(name);
      }
      cursor = start + token.length;
      continue;
    }
    output += html.slice(cursor, start);
    if (/\bdata-thesis-block(?:\s|=|\/?>)/i.test(token) && parsed) {
      const [, closing, rawName] = parsed;
      const name = rawName.toLowerCase();
      if (!closing && !voidTags.has(name) && !/\/\s*>$/.test(token)) skipped = [name];
    } else output += token;
    cursor = start + token.length;
  }
  if (!skipped.length) output += html.slice(cursor);
  return output;
};
const APPENDIX_TITLE = /^(?:EK|APPENDIX)\s+[^\s.:)]+[.):]?\s+\S/iu;
export const asBlocks = (section) => {
  // Word fields, bookmarks and citation chips of the editor HTML become inline reference runs (fields.js); `fieldIssues` records what could not.
  const fieldIssues = [];
  const cleanHtml = foldFieldMarkup(stripSpecialLayoutMarkup(section.html), fieldIssues);
  const outline = (section.indexSources || extractThesisHeadings(cleanHtml, section.rules)).filter((entry) => !entry.kind || entry.kind === "toc");
  let headingIndex = 0;
  // Caption counters and heading labels are compiled once, across the document.
  const captions = (section.indexSources || []).filter((entry) => entry.kind !== "toc" && entry.kind !== "equations" && entry.kind !== "appendices");
  // Appendix title paragraphs (bold "EK n." lead or a level 1-3 heading) carry the bookmark their index row points at.
  const appendices = (section.indexSources || []).filter((entry) => entry.kind === "appendices");
  let appendixIndex = 0;
  const appendixAnchor = (block) => {
    if (appendixIndex >= appendices.length) return undefined;
    const value = blockText(block).replace(/\s+/g, " ").trim();
    const lead = (block.runs || []).find((run) => run.type === "text" && run.text?.trim());
    if (!APPENDIX_TITLE.test(value) || !((block.type === "heading" && Number(block.level) <= 3) || (block.type === "paragraph" && lead?.bold))) return undefined;
    const at = appendices.findIndex((entry, i) => i >= appendixIndex && entry.title === value);
    if (at < 0) return undefined;
    appendixIndex = at + 1;
    return appendices[at].anchor;
  };
  const equations = (section.indexSources || []).filter((entry) => entry.kind === "equations");
  let equationIndex = 0;
  let captionIndex = 0;
  const blocks = parseAcademicHtml(cleanHtml, { lines: true }).map((block) => {
    if (block.type === "heading") { const entry = outline[headingIndex++]; return { ...block, thesisAnchor: entry?.anchor, appendixAnchor: appendixAnchor(block), unnumbered: Boolean(entry?.unnumbered), thesisNumber: entry?.label || "", thesisNumberLine: Boolean(entry?.labelLine) }; }
    if (block.type === "math" && block.numbered && section.rules.equations) { const entry = equations[equationIndex++]; return { ...block, equationLabel: entry?.label || "", equationAnchor: entry?.anchor }; }
    if ((block.type === "table" || block.type === "figure") && block.caption) { const entry = captions[captionIndex++]; return { ...block, captionNumber: entry?.number || "", captionLabel: entry?.label || "", captionAnchor: entry?.anchor, captionKind: entry?.captionKind || "", caption: entry?.title || block.caption }; }
    if (block.type === "paragraph") { const anchor = appendixAnchor(block); return anchor ? { ...block, appendixAnchor: anchor } : block; }
    return block;
  });
  blocks.fieldIssues = fieldIssues;
  return blocks;
};
export const captionText = (label, block) => `${block.captionLabel || `${label} ${block.captionNumber}.`} ${block.caption}`;
/* ---------------------------------------------------------------------------
 * DOCX: structural + typographic parity with the editor, using Word semantics
 * (styles, runs, numbering, tables, sections, header/footer PAGE fields).
 * Everything comes from the compiled model; nothing here knows a university.
 * ------------------------------------------------------------------------- */

// Rounded, not floored like docx's convertMillimetersToTwip: A4 is exactly Word's 11906 × 16838.
export const twip = (mm) => mmToTwip(mm || 0);
export const pt = (value) => ptToTwip(value || 0);
export const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
export const CELL_BORDER = { style: BorderStyle.SINGLE, size: 6, color: "888888" };
export const plainRuns = (text) => [{ type: "text", text: String(text ?? "") }];
export const halfPointSize = (fontSizePt) => {
  const size = Number(fontSizePt) * 2;
  if (!Number.isFinite(size) || !Number.isInteger(size)) throw new Error(`DOCX metin boyutu ${fontSizePt} pt yarım punto biriminde tam olarak saklanamıyor`);
  return size;
};
export const fieldXmlText = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export function imageBytes(src) {
  const match = String(src || "").match(/^data:image\/(png|jpe?g);base64,(.+)$/i);
  if (!match) return null;
  const binary = typeof atob === "function" ? atob(match[2]) : Buffer.from(match[2], "base64").toString("binary");
  return { type: /png/i.test(match[1]) ? "png" : "jpg", data: Uint8Array.from(binary, (char) => char.charCodeAt(0)) };
}
