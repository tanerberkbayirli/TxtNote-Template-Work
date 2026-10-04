/**
 * Template compliance audit: compares the compiled document with the template rules and
 * lists where the document departs from them. Pure data in, findings out; the editor shows
 * them and jumps to the section. Nothing here knows a university — every expectation is
 * read from the resolved rules of the section, and each finding names its source.
 *
 * Severity: error = a template requirement is broken (or the page cannot be produced as
 * required); warning = the text departs from the template's formatting; info = worth a look
 * but no template rule decides it.
 */
import { parseAcademicHtml } from "../lib/academicDocument.js";
import { plainThesisText } from "./sourceHtml.js";

const ALIGN_LABELS = { left: "sola yaslı", center: "ortalı", right: "sağa yaslı", justify: "iki yana yaslı" };
const alignLabel = (value) => ALIGN_LABELS[value] || value || "şablon";
const PARAGRAPH_RE = /<p\b([^>]*)>([\s\S]*?)<\/p>/gi;

/** One paragraph of seeded-layout HTML reduced to what the template decides: alignment, size, weight, fields. */
export function layoutParagraphRecords(html) {
  const records = [];
  for (const match of String(html || "").matchAll(PARAGRAPH_RE)) {
    const attrs = match[1] || "";
    const inner = match[2] || "";
    if (/\bthesis-gap\b/.test(attrs)) continue;
    const text = plainThesisText(inner);
    const fields = [...inner.matchAll(/data-field=["']([A-Z][A-Z0-9_]*)["']/g)].map((m) => m[1]);
    if (!text && !fields.length) continue;
    const pt = inner.match(/\bfmt-pt-(\d+)\b/)?.[1] || attrs.match(/data-pt=["']([\d.]+)["']/)?.[1];
    records.push({
      align: attrs.match(/\bfmt-align-(left|center|right|justify)\b/)?.[1] || "left",
      pt: pt ? Number(pt) : null,
      bold: /<strong\b|\bfmt-bold\b/.test(inner),
      fields,
      text,
      hidden: /data-thesis-hidden=["']true["']/.test(attrs),
    });
  }
  return records;
}

function auditSeededLayout(section, placeholders, push) {
  const seed = layoutParagraphRecords(section.seedHtml).filter((record) => !record.hidden);
  const stored = layoutParagraphRecords(section.editableHtml).filter((record) => !record.hidden);
  const source = `şablon › ${section.id} › blocks`;
  const used = new Set();
  const take = (predicate) => {
    const index = stored.findIndex((record, i) => !used.has(i) && predicate(record));
    if (index < 0) return null;
    used.add(index);
    return stored[index];
  };
  for (const expected of seed) {
    const actual = expected.fields.length
      ? take((record) => expected.fields.every((field) => record.fields.includes(field)))
      : take((record) => record.text === expected.text);
    if (!actual) {
      if (expected.fields.length) {
        const required = expected.fields.some((field) => placeholders[field]?.required);
        push({ severity: required ? "error" : "warning", code: "layout.fieldRemoved", message: `${expected.fields.map((field) => placeholders[field]?.label || field).join(", ")} alanı sayfadan silinmiş`, expected: "şablonun alan satırı", actual: "yok", source });
      } else if (expected.text) {
        push({ severity: "info", code: "layout.lineRemoved", message: `Şablon satırı silinmiş: “${expected.text.slice(0, 40)}”`, expected: expected.text, actual: "yok", source });
      }
      continue;
    }
    const label = expected.fields.length ? expected.fields.map((field) => placeholders[field]?.label || field).join(", ") : `“${expected.text.slice(0, 30)}”`;
    if (actual.align !== expected.align) push({ severity: "warning", code: "layout.align", message: `${label} satırı ${alignLabel(actual.align)}; şablon ${alignLabel(expected.align)}`, expected: alignLabel(expected.align), actual: alignLabel(actual.align), source });
    if (expected.pt && actual.pt && actual.pt !== expected.pt) push({ severity: "warning", code: "layout.size", message: `${label} satırı ${actual.pt} pt; şablon ${expected.pt} pt`, expected: `${expected.pt} pt`, actual: `${actual.pt} pt`, source });
    if (expected.bold && !actual.bold) push({ severity: "warning", code: "layout.weight", message: `${label} satırı kalın değil; şablon kalın`, expected: "kalın", actual: "normal", source });
  }
  const extra = stored.filter((_, index) => !used.has(index));
  if (extra.length) push({ severity: "info", code: "layout.extraLines", message: `Sayfaya şablonda olmayan ${extra.length} satır eklenmiş`, expected: "şablon satırları", actual: extra.map((record) => record.text.slice(0, 30)).join(" | "), source });
}

function auditBody(section, push) {
  const { body, figures, tables } = section.rules;
  const html = section.editableHtml || "";
  const source = `şablon › ${section.id} › typography.body`;
  const blocks = parseAcademicHtml(html);
  const bodyAlign = body.align || "left";
  let alignCount = 0, sizeCount = 0, sizeExample = null, alignExample = null, lastLevel = 0;
  const walk = (list) => {
    for (const block of list || []) {
      if (block.type === "paragraph" || block.type === "quote") {
        if (block.align && block.align !== bodyAlign && block.align !== "left") { alignCount += 1; alignExample ??= block.align; }
        for (const run of block.runs || []) if (run.sizePt && run.sizePt !== body.fontSizePt) { sizeCount += 1; sizeExample ??= run.sizePt; break; }
        if (block.sizePt && block.sizePt !== body.fontSizePt) { sizeCount += 1; sizeExample ??= block.sizePt; }
      } else if (block.type === "heading") {
        if (!block.unnumbered && lastLevel && block.level > lastLevel + 1) push({ severity: "warning", code: "heading.skip", message: `Başlık ${block.level} doğrudan Başlık ${lastLevel} altında (ara düzey atlanmış): “${block.text.slice(0, 40)}”`, expected: `Başlık ${lastLevel + 1}`, actual: `Başlık ${block.level}`, source: `şablon › typography.headings` });
        if (!block.unnumbered) lastLevel = block.level;
      } else if (block.type === "figure") {
        if (!block.caption) push({ severity: "warning", code: "figure.caption", message: `${figures.label} yazısı olmayan görsel`, expected: `${figures.label} yazısı (${figures.position === "above" ? "üstte" : "altta"})`, actual: "yok", source: `şablon › figures` });
      } else if (block.type === "table") {
        if (!block.caption && !/\bthesis-layout-row\b/.test(block.className || "")) push({ severity: "warning", code: "table.caption", message: `${tables.label} yazısı olmayan tablo`, expected: `${tables.label} yazısı (${tables.position === "above" ? "üstte" : "altta"})`, actual: "yok", source: `şablon › tables` });
        for (const row of block.rows || []) for (const cell of row) if (cell.blocks) walk(cell.blocks);
      }
    }
  };
  walk(blocks);
  if (alignCount) push({ severity: "warning", code: "paragraph.align", message: `${alignCount} paragraf ${alignLabel(alignExample)}; şablon gövde metni ${alignLabel(bodyAlign)}`, expected: alignLabel(bodyAlign), actual: alignLabel(alignExample), source });
  if (sizeCount) push({ severity: "warning", code: "paragraph.size", message: `${sizeCount} paragrafta ${sizeExample} pt yazı; şablon gövde metni ${body.fontSizePt} pt`, expected: `${body.fontSizePt} pt`, actual: `${sizeExample} pt`, source });
  if (/\bfmt-size-(heading|subheading)\b/.test(html)) push({ severity: "warning", code: "heading.pseudo", message: "Büyütülmüş metinle yapılmış başlık var; başlıklar “Paragraf biçimi” menüsünden Başlık 1–4 olarak seçilmeli (dizin ve numaralandırma buna bağlı)", expected: "Başlık 1–4", actual: "büyütülmüş metin", source: `şablon › typography.headings` });
  if (/\bfmt-color-(red|blue|green)\b/.test(html)) push({ severity: "info", code: "text.color", message: "Renkli metin var; şablon renk kuralı tanımlamıyor, kılavuzunuzu kontrol edin", expected: "—", actual: "renkli metin", source: "şablon: kural yok" });
}

/**
 * Audit a compiled document. `groups` (groupThesisSections) with `pageCounts` lets the audit
 * see page overflow of standalone pages; both are optional.
 */
export function checkThesisCompliance(model, { groups = [], pageCounts = {}, placeholders = null } = {}) {
  const findings = [];
  const definitions = placeholders || model.placeholders || {};
  for (const section of model.sections || []) {
    const push = (finding) => findings.push({ sectionId: section.id, sectionTitle: section.title, ...finding });
    if (section.missingPlaceholders?.length) push({ severity: "error", code: "metadata.missing", message: `Eksik bilgi: ${section.missingPlaceholders.map((key) => definitions[key]?.label || key).join(", ")}`, expected: "dolu", actual: "boş", source: "şablon › placeholders" });
    if (section.editableLayout && !section.seeded && section.seedHtml) auditSeededLayout(section, definitions, push);
    if (section.editable && !section.editableLayout) {
      const text = plainThesisText(section.editableHtml || "");
      if (!text && section.required && section.type !== "mainContent") push({ severity: "warning", code: "section.empty", message: "Zorunlu bölüm boş", expected: "metin", actual: "boş", source: `şablon › sections › ${section.id} › status: required` });
      if (text) auditBody(section, push);
    }
  }
  for (const group of groups) {
    const first = group.sections[0];
    const count = pageCounts[group.id];
    if (count > 1 && (first.editableLayout || first.specialPage || first.group === "cover")) {
      findings.push({ sectionId: first.id, sectionTitle: first.title, severity: "error", code: "page.overflow", message: `${first.title} ${count} sayfaya taşıyor; tek sayfa olmalı`, expected: "1 sayfa", actual: `${count} sayfa`, source: `şablon › sections › ${first.id} (özel sayfa)` });
    }
  }
  for (const item of model.validation?.errors || []) findings.push({ sectionId: "", sectionTitle: "Tez bilgileri", severity: "error", code: `validation.${item.code}`, message: item.message, expected: String(item.expected ?? ""), actual: String(item.actual ?? ""), source: `şablon › validation › ${item.field}` });
  for (const item of model.validation?.warnings || []) findings.push({ sectionId: "", sectionTitle: "Tez bilgileri", severity: "warning", code: `validation.${item.code}`, message: item.message, expected: String(item.expected ?? ""), actual: String(item.actual ?? ""), source: `şablon › validation › ${item.field}` });
  const order = { error: 0, warning: 1, info: 2 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);
  const count = (severity) => findings.filter((finding) => finding.severity === severity).length;
  return { findings, errors: count("error"), warnings: count("warning"), infos: count("info") };
}
