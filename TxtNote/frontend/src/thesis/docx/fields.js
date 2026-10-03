import { Paragraph, ImportedXmlComponent, TextRun } from "docx";
import { fieldXmlText } from "./xml.js";

function complexFieldMarker(instruction, edge, properties = {}) {
  // Word derives a refreshed field's typography from its BEGIN run, not merely
  // the cached result. Styling only the cache resets NUMPAGES to Normal's font.
  const font = typeof properties.font === "string" ? properties.font : properties.font?.ascii;
  const rPr = font || properties.size ? `<w:rPr>${font ? `<w:rFonts w:ascii="${fieldXmlText(font)}" w:hAnsi="${fieldXmlText(font)}" w:cs="${fieldXmlText(font)}"/>` : ""}${properties.size ? `<w:sz w:val="${properties.size}"/><w:szCs w:val="${properties.size}"/>` : ""}${properties.bold ? "<w:b/>" : ""}${properties.italics ? "<w:i/>" : ""}</w:rPr>` : "";
  const xml = edge === "begin"
    ? `<w:r>${rPr}<w:fldChar w:fldCharType="begin" w:dirty="true"/><w:instrText xml:space="preserve">${fieldXmlText(instruction)}</w:instrText><w:fldChar w:fldCharType="separate"/></w:r>`
    : `<w:r>${rPr}<w:fldChar w:fldCharType="end"/></w:r>`;
  // fromXmlString returns an unnamed document wrapper (serialized as <undefined>); unwrap to the real <w:r>.
  const parsed = ImportedXmlComponent.fromXmlString(xml);
  return parsed.root.find((child) => child instanceof ImportedXmlComponent) || parsed;
}
/** Complex run field with a cached display value; safe inside any paragraph. */
export function complexFieldRuns(instruction, cached = "", properties = {}) {
  return [complexFieldMarker(instruction, "begin", properties), new TextRun({ ...properties, text: String(cached) }), complexFieldMarker(instruction, "end", properties)];
}
export function wrapParagraphsInField(paragraphs, instruction) {
  if (!paragraphs.length) return paragraphs;
  const first = paragraphs[0];
  // Paragraph.root starts with paragraph properties. Keeping the field begin in
  // the first cached row avoids adding a blank line to university index pages.
  first.root.splice(1, 0, complexFieldMarker(instruction, "begin"));
  paragraphs[paragraphs.length - 1].root.push(complexFieldMarker(instruction, "end"));
  return paragraphs;
}
export function emptyComplexFieldParagraph(instruction) {
  return new Paragraph({ spacing: { before: 0, after: 0 }, children: [complexFieldMarker(instruction, "begin"), complexFieldMarker(instruction, "end")] });
}
export function indexFieldInstruction(rule, styleLevels, noPageLevels = []) {
  const parts = ["TOC", "\\h", '\\f "A"'];
  if (styleLevels.length) parts.push(`\\t "${styleLevels.map(({ id, level }) => `${id},${level}`).join(",")}"`);
  if (noPageLevels.length) {
    const ordered = [...new Set(noPageLevels)].sort((a, b) => a - b);
    if (ordered.some((level, index) => index && level !== ordered[index - 1] + 1)) throw new Error("This thesis TOC needs non-contiguous Word page-number exclusions, which the field format cannot represent safely.");
    parts.push(`\\n "${ordered[0]}-${ordered[ordered.length - 1]}"`);
  }
  return parts.join(" ");
}
export function tocSpecialField(entry) {
  const title = String(entry.title || "").replace(/"/g, '\\"');
  const level = Number.isFinite(entry.wordTocLevel) ? entry.wordTocLevel : entry.level || 1;
  const noPage = entry.includePageNumber === false ? " \\n" : "";
  // Complex field runs (begin / instrText / end). A w:fldSimple TC made Word scramble section order and drop page numbers.
  const xml = `<w:p><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> ${fieldXmlText(`TC "${title}" \\f A \\l ${level}${noPage}`)} </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>`;
  const wrapper = ImportedXmlComponent.fromXmlString(xml);
  const holder = wrapper.root.find((child) => child instanceof ImportedXmlComponent) || wrapper;
  return holder.root.filter((child) => child instanceof ImportedXmlComponent);
}
