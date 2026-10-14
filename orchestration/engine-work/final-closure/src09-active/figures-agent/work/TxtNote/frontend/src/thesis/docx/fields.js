import { Paragraph, ImportedXmlComponent, TextRun } from "docx";
import { fieldXmlText } from "./xml.js";

export function complexFieldMarker(instruction, edge, properties = {}) {
  // Word derives a refreshed field's typography from its BEGIN run, not merely
  // the cached result. Styling only the cache resets NUMPAGES to Normal's font.
  const font = typeof properties.font === "string" ? properties.font : properties.font?.ascii;
  const rPr = font || properties.size || properties.bold || properties.italics ? `<w:rPr>${font ? `<w:rFonts w:ascii="${fieldXmlText(font)}" w:hAnsi="${fieldXmlText(font)}" w:cs="${fieldXmlText(font)}"/>` : ""}${properties.bold ? "<w:b/>" : ""}${properties.italics ? "<w:i/>" : ""}${properties.size ? `<w:sz w:val="${properties.size}"/><w:szCs w:val="${properties.size}"/>` : ""}</w:rPr>` : "";
  const xml = edge === "begin"
    ? `<w:r>${rPr}<w:fldChar w:fldCharType="begin"/><w:instrText xml:space="preserve">${fieldXmlText(instruction)}</w:instrText><w:fldChar w:fldCharType="separate"/></w:r>`
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
// Word reads the 	 style list with the machine's list separator: ";" on tr-TR (a "," makes the field update drop every heading), "," elsewhere.
export function indexFieldInstruction(rule, styleLevels, noPageLevels = [], listSeparator = ",") {
  const parts = ["TOC", "\\h", '\\f "A"'];
  if (styleLevels.length) parts.push(`\\t "${styleLevels.map(({ id, level }) => `${id}${listSeparator}${level}`).join(listSeparator)}"`);
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

/* ---------------------------------------------------------------------------
 * Persistent targets, preserved Word fields, cross references and citations.
 *
 * Word bookmark names are the only link between a field (PAGEREF / REF / HYPERLINK \l) and its target, so
 * they must be unique, at most 40 characters and derived from a persistent identity (see generatedIndex.js).
 * Word fields and bookmarks of imported content travel through the editor HTML as marker spans; they are
 * folded back into real field / bookmark runs here. Nothing becomes plain text without a record
 * (the export context's `fieldIssues`).
 * ------------------------------------------------------------------------- */

/** Prefix of the bookmarks the thesis writer generates for index targets (rebuilt on every export). */
export const GENERATED_BOOKMARK_PREFIX = "_ref_";
const hash36 = (value) => {
  let h = 0x811c9dc5;
  for (const ch of String(value)) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36);
};
/**
 * Word bookmark name of an index anchor ("main-source-3" -> "_ref_main_source_3"). A name that sanitising or the
 * 40-character limit would make ambiguous (an underscore or non-ASCII letter in the anchor, a long anchor) ends in
 * a hash of the whole anchor, so two anchors never share a bookmark.
 */
export function targetBookmarkName(anchor) {
  const raw = String(anchor);
  const name = GENERATED_BOOKMARK_PREFIX + raw.replace(/[^A-Za-z0-9]/g, "_");
  if (name.length <= 40 && !/[^A-Za-z0-9-]/.test(raw)) return name;
  const suffix = `_${hash36(raw)}`;
  return name.slice(0, 40 - suffix.length) + suffix;
}

/** Field names the writer knows (any other field is still preserved verbatim, but reported). */
const KNOWN_FIELDS = new Set(["PAGE", "NUMPAGES", "SECTIONPAGES", "TOC", "TC", "TOA", "PAGEREF", "REF", "NOTEREF", "SEQ", "HYPERLINK", "STYLEREF", "SECTION", "DATE", "TIME", "CREATEDATE", "SAVEDATE", "PRINTDATE", "TITLE", "AUTHOR", "SUBJECT", "FILENAME", "DOCPROPERTY", "XE", "INDEX", "CITATION", "BIBLIOGRAPHY", "ADDIN", "SYMBOL", "EQ", "ASK", "SET", "IF", "MERGEFIELD", "INCLUDETEXT"]);
/** {name, known} of a field instruction (" PAGEREF _Ref1 \h " -> PAGEREF). */
export function classifyFieldInstruction(instruction) {
  const name = String(instruction ?? "").trim().split(/\s+/)[0]?.toUpperCase() || "";
  return { name, known: KNOWN_FIELDS.has(name) };
}
/** Bookmark a field instruction points at (REF / PAGEREF / NOTEREF target, HYPERLINK \l), else "". */
export function fieldTarget(instruction) {
  const text = String(instruction ?? "").trim();
  const { name } = classifyFieldInstruction(text);
  if (name === "HYPERLINK") return text.match(/\\l\s+(?:"([^"]+)"|(\S+))/i)?.slice(1).find(Boolean) || "";
  if (["REF", "PAGEREF", "NOTEREF"].includes(name)) return text.match(/^\S+\s+(?:"([^"]+)"|(\S+))/)?.slice(1).find(Boolean) || "";
  return "";
}

const encode = (value) => encodeURIComponent(String(value ?? ""));
const decode = (value) => { try { return decodeURIComponent(String(value ?? "")); } catch { return String(value ?? ""); } };
const attrOf = (attrs, name) => { const match = String(attrs).match(new RegExp(`(?:^|\\s)${name}=(?:"([^"]*)"|'([^']*)')`, "i")); return match ? (match[1] ?? match[2]) : undefined; };
const unescapeAttr = (value) => String(value ?? "").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
/** Marker span the block parser carries through as an inline reference run (`kind` says what it stands for). */
const marker = (kind, payload = "") => `<span class="academic-xref" data-ref-kind="${kind}" data-ref-id="${encode(payload)}"></span>`;
const citationMarker = (attrs, inner) => {
  const payload = JSON.stringify({ sourceId: unescapeAttr(attrOf(attrs, "data-source-id") || ""), locator: unescapeAttr(attrOf(attrs, "data-locator") || "") });
  return `<span class="academic-xref" data-ref-kind="cite" data-ref-id="${encode(payload)}">${inner}</span>`;
};

/**
 * Editor HTML of one section -> HTML whose Word field / bookmark / citation markers are inline reference runs.
 * Imported fields are kept only when their begin / end markers balance (otherwise the cached text stays and the
 * section is reported); a citation chip becomes a citation run instead of silently becoming its label.
 * `issues` receives {code, message} records.
 */
export function foldFieldMarkup(html, issues = []) {
  let source = String(html ?? "");
  if (!/data-docx-(?:field|bookmark-id|fldsimple)|academic-cite/.test(source)) return source;
  source = source.replace(/<span\b([^>]*\bacademic-cite\b[^>]*)>([^<]*)<\/span>/gi, (_, attrs, inner) => citationMarker(attrs, inner));
  const fieldSpan = /<span\b([^>]*\bdata-docx-field=["'](fldChar|instrText)["'][^>]*)>\s*<\/span>/gi;
  const kinds = [...source.matchAll(fieldSpan)].map((match) => match[2] === "instrText" ? "instruction" : attrOf(match[1], "data-docx-fldchar") || "");
  const fieldStack = [];
  let fieldsBalanced = true;
  for (const kind of kinds) {
    if (kind === "begin") fieldStack.push(false);
    else if (kind === "instruction" && (!fieldStack.length || fieldStack.at(-1))) fieldsBalanced = false;
    else if (kind === "separate") {
      if (!fieldStack.length || fieldStack.at(-1)) fieldsBalanced = false;
      else fieldStack[fieldStack.length - 1] = true;
    } else if (kind === "end") {
      if (!fieldStack.length) fieldsBalanced = false;
      else fieldStack.pop();
    }
  }
  fieldsBalanced &&= fieldStack.length === 0;
  if (!fieldsBalanced) issues.push({ code: "field-unbalanced", message: "Alan başlangıç/bitiş işaretleri eşleşmiyor; alanlar önbellek metni olarak bırakıldı" });
  source = source.replace(fieldSpan, (_, attrs, type) => {
    if (!fieldsBalanced) return "";
    if (type === "instrText") return marker("field-instruction", unescapeAttr(attrOf(attrs, "data-docx-instruction") ?? ""));
    const kind = attrOf(attrs, "data-docx-fldchar");
    return ["begin", "separate", "end"].includes(kind) ? marker(`field-${kind}`) : "";
  });
  // fldSimple wrappers: <span data-docx-fldsimple="INSTR">cached</span> -> begin, instruction, separate, cached, end.
  if (/data-docx-fldsimple/.test(source)) {
    const stack = [];
    let out = "", last = 0;
    for (const match of source.matchAll(/<span\b([^>]*)>|<\/span>/gi)) {
      out += source.slice(last, match.index);
      last = match.index + match[0].length;
      if (match[0][1] === "/") out += match[0] + (stack.pop() ? marker("field-end") : "");
      else {
        const instruction = attrOf(match[1], "data-docx-fldsimple");
        stack.push(instruction !== undefined);
        out += instruction === undefined ? match[0]
          : marker("field-begin") + marker("field-instruction", unescapeAttr(instruction)) + marker("field-separate") + match[0].replace(/\sdata-docx-fldsimple=(?:"[^"]*"|'[^']*')/i, "");
      }
    }
    source = out + source.slice(last);
  }
  // Bookmarks: a start carries the name, an end only the native id. Only ids with both ends in the section are kept.
  const bookmarkSpan = /<span\b([^>]*\bdata-docx-bookmark-id=["']([^"']*)["'][^>]*)>\s*<\/span>/gi;
  const starts = new Set();
  for (const match of source.matchAll(bookmarkSpan)) if (attrOf(match[1], "data-docx-bookmark-name")) starts.add(match[2]);
  source = source.replace(bookmarkSpan, (_, attrs, id) => {
    const name = unescapeAttr(attrOf(attrs, "data-docx-bookmark-name") || "");
    if (name) return marker("bookmark-start", JSON.stringify({ name, id }));
    return starts.has(id) ? marker("bookmark-end", id) : "";
  });
  return source;
}

const issue = (state, record) => { (state.fieldIssues ||= []).push(record); };
/**
 * Inline runs with reference markers -> runs with structured items:
 *   {type:"fieldStart", instruction} ... {type:"fieldEnd"}   (cached result runs sit between them, as in Word)
 *   {type:"bookmark", name, children}                         (an empty bookmark when its end lies in another paragraph)
 * `state` (the export context) keeps open fields across paragraphs: one field (a TOC) can span many.
 */
export function foldFieldRuns(runs, state) {
  const isMarker = (run) => run.type === "xref" && /^(?:field|bookmark)-/.test(run.kind || "");
  if (!runs?.some(isMarker)) return runs;
  const open = (state.openFields ||= []);
  const out = [];
  for (const run of runs) {
    const kind = isMarker(run) ? run.kind : "";
    if (kind === "field-begin") open.push({ code: "", result: false });
    else if (kind === "field-instruction") {
      const field = open.at(-1);
      if (!field) issue(state, { code: "field-orphan", message: "Alan kodu başlangıçsız bulundu ve atlandı" });
      else if (!field.result) field.code += decode(run.refId);
    } else if (kind === "field-separate") {
      const field = open.at(-1);
      if (field && !field.result) { field.result = true; out.push({ type: "fieldStart", instruction: field.code }); }
    } else if (kind === "field-end") {
      const field = open.pop();
      if (!field) { issue(state, { code: "field-orphan", message: "Alan bitişi başlangıçsız bulundu ve atlandı" }); continue; }
      if (!field.result) out.push({ type: "fieldStart", instruction: field.code });
      out.push({ type: "fieldEnd" });
      if (!classifyFieldInstruction(field.code).known) issue(state, { code: "field-unknown-preserved", message: `Bilinmeyen alan olduğu gibi korundu: ${field.code.trim()}` });
    } else out.push(run);
  }
  // Pair bookmark ends with their starts inside this paragraph.
  const result = [], stack = [];
  for (const run of out) {
    if (run.type === "xref" && run.kind === "bookmark-start") {
      let info = null;
      try { info = JSON.parse(decode(run.refId)); } catch { /* unusable marker */ }
      if (info?.name) { stack.push({ info, at: result.length }); result.push(run); }
    } else if (run.type === "xref" && run.kind === "bookmark-end") {
      const id = decode(run.refId);
      const index = stack.findLastIndex((entry) => entry.info.id === id);
      if (index < 0) continue;
      const entry = stack[index];
      const children = result.splice(entry.at).slice(1);
      stack.splice(index);
      result.push({ type: "bookmark", name: entry.info.name, children });
    } else result.push(run);
  }
  return result.map((run) => {
    if (run.type !== "xref" || run.kind !== "bookmark-start") return run;
    try { return { type: "bookmark", name: JSON.parse(decode(run.refId)).name, children: [] }; } catch { return { type: "text", text: "" }; }
  });
}

/** Valid, unique Word name of an imported bookmark, else "". Generated (_ref_) names are rebuilt by the writer, so they are skipped. */
export function importedBookmarkName(name, state) {
  const value = String(name ?? "").trim();
  if (!value || value.startsWith(GENERATED_BOOKMARK_PREFIX)) return "";
  if (value.length > 40 || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) { issue(state, { code: "bookmark-invalid", message: `Yer işareti adı geçersiz olduğundan atlandı: ${value}` }); return ""; }
  const names = (state.bookmarkNames ||= new Set());
  if (names.has(value)) { issue(state, { code: "bookmark-duplicate", message: `Yinelenen yer işareti atlandı: ${value}` }); return ""; }
  names.add(value);
  return value;
}

/**
 * Cross reference to a heading / caption / equation / appendix: a HYPERLINK \l field to the target's bookmark (the
 * shown text survives a Word field update), cached text = the current caption label. A target that no longer exists
 * stays a data field and is reported; it never turns into plain text.
 */
export function crossReferenceRuns(item, state, properties) {
  const entry = state.targets?.get(item.refId);
  const captioned = entry && (entry.captionKind || /^(?:figures|tables|equations)$/.test(entry.kind));
  const cached = captioned ? String(entry.label || "").replace(/[.:]\s*$/, "") || item.text : item.text || entry?.label || entry?.title || "";
  if (entry?.anchor) return complexFieldRuns(`HYPERLINK \\l "${targetBookmarkName(entry.anchor)}"`, cached, properties);
  issue(state, { code: "xref-target-missing", message: `Çapraz başvuru hedefi bulunamadı: ${item.refId}`, refId: item.refId, kind: item.kind });
  return complexFieldRuns(`ADDIN TxtNote.Xref ${JSON.stringify({ refId: item.refId, kind: item.kind })}`, cached, properties);
}
/** Source citation: an ADDIN field (Word leaves such fields alone on update) carrying source identity and locator; the label is its cached result. */
export function citationRuns(item, properties) {
  return complexFieldRuns(`ADDIN TxtNote.Cite ${decode(item.refId)}`, item.text || "", properties);
}

/**
 * Field / bookmark integrity of written document parts: every REF / PAGEREF / NOTEREF / HYPERLINK \l target must be a
 * bookmark of the document, bookmark names unique, field begin / separate / end balanced.
 * Returns { dangling: [{instruction, target, generated}], duplicates: [name], unbalanced }.
 */
export function auditDocxFields(xmlParts) {
  const names = [], targets = [];
  let unbalanced = false;
  for (const xml of [].concat(xmlParts)) {
    for (const match of String(xml).matchAll(/<w:bookmarkStart\b[^>]*\bw:name="([^"]*)"/g)) names.push(match[1]);
    for (const match of String(xml).matchAll(/<w:instrText\b[^>]*>([^<]*)<\/w:instrText>/g)) {
      const instruction = match[1].replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
      const target = fieldTarget(instruction);
      if (target) targets.push({ instruction: instruction.trim(), target });
    }
    const stack = [];
    for (const match of String(xml).matchAll(/<w:fldChar\b[^>]*\bw:fldCharType="(begin|separate|end)"/g)) {
      if (match[1] === "begin") stack.push(false);
      else if (match[1] === "separate") {
        if (!stack.length || stack.at(-1)) unbalanced = true;
        else stack[stack.length - 1] = true;
      } else if (!stack.length) unbalanced = true;
      else stack.pop();
    }
    if (stack.length) unbalanced = true;
  }
  const known = new Set(names);
  return {
    dangling: targets.filter(({ target }) => !known.has(target)).map((entry) => ({ ...entry, generated: entry.target.startsWith(GENERATED_BOOKMARK_PREFIX) })),
    duplicates: [...new Set(names.filter((name, index) => names.indexOf(name) !== index))],
    unbalanced,
  };
}
