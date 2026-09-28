import { validateSpecialPageBlocks } from "./specialPages.js";
import { MM_PER_PT } from "./units.js";
import { validateFootnoteRule } from "./footnotes.js";

export const THESIS_SCHEMA_VERSION = 1;
/** Values a placeholder may take from the laid-out document instead of user input (never stored). */
export const THESIS_DERIVED_VALUES = Object.freeze(["totalPages", "frontLastLabel", "mainPageCount"]);
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const positive = (value) => Number.isFinite(value) && value > 0;
const nonnegative = (value) => Number.isFinite(value) && value >= 0;
const text = (value) => typeof value === "string" && value.trim().length > 0;
const numberingFormats = new Set(["arabic", "roman-lower", "roman-upper"]);
const positions = new Set(["top", "bottom"]);
const aligns = new Set(["left", "center", "right", "justify"]);
const placeholderPattern = /\{\{([A-Z][A-Z0-9_]*)\}\}/g;
const sectionModes = new Set(["editable", "static", "generated"]);

export function normalizeLengthMm(value, unit = "mm") {
  if (!Number.isFinite(value)) throw new Error("Ölçü sayısal olmalı");
  if (unit === "mm") return value;
  if (unit === "cm") return value * 10;
  if (unit === "pt") return value * MM_PER_PT;
  throw new Error(`Bilinmeyen ölçü birimi: ${unit}`);
}

export function validateTextStyle(style, path = "style") {
  const errors = [];
  if (!object(style)) return [`${path} nesne olmalı`];
  if (!text(style.fontFamily)) errors.push(`${path}.fontFamily gerekli`);
  if (!positive(style.fontSizePt) || style.fontSizePt > 96) errors.push(`${path}.fontSizePt geçersiz`);
  if (style.fontWeight !== undefined && (!Number.isFinite(style.fontWeight) || style.fontWeight < 100 || style.fontWeight > 900)) errors.push(`${path}.fontWeight geçersiz`);
  if (style.lineHeight !== undefined && (!positive(style.lineHeight) || style.lineHeight > 5)) errors.push(`${path}.lineHeight geçersiz`);
  if (style.align !== undefined && !aligns.has(style.align)) errors.push(`${path}.align geçersiz`);
  for (const key of ["characterSpacingPt", "spaceBeforePt", "spaceAfterPt"]) {
    if (style[key] !== undefined && !nonnegative(style[key])) errors.push(`${path}.${key} geçersiz`);
  }
  for (const key of ["firstLineIndentMm", "leftIndentMm", "rightIndentMm"]) {
    if (style[key] !== undefined && !Number.isFinite(style[key])) errors.push(`${path}.${key} geçersiz`);
  }
  if (style.hangingIndentMm !== undefined && !nonnegative(style.hangingIndentMm)) errors.push(`${path}.hangingIndentMm geçersiz`);
  if (style.tabStopMm !== undefined && !positive(style.tabStopMm)) errors.push(`${path}.tabStopMm geçersiz`);
  if (style.color !== undefined && !/^#[0-9a-f]{6}$/i.test(style.color)) errors.push(`${path}.color #rrggbb olmalı`);
  return errors;
}

function validateNumbering(rule, path) {
  const errors = [];
  if (!object(rule)) return [`${path} gerekli`];
  if (typeof rule.enabled !== "boolean") errors.push(`${path}.enabled gerekli`);
  if (!positions.has(rule.position)) errors.push(`${path}.position geçersiz`);
  if (!["left", "center", "right"].includes(rule.align)) errors.push(`${path}.align geçersiz`);
  if (!numberingFormats.has(rule.format)) errors.push(`${path}.format geçersiz`);
  if (rule.startAt !== undefined && (!Number.isInteger(rule.startAt) || rule.startAt < 1)) errors.push(`${path}.startAt geçersiz`);
  if (rule.style !== undefined && (!object(rule.style) || (rule.style.fontSizePt !== undefined && !(positive(rule.style.fontSizePt) && rule.style.fontSizePt <= 96)) || (rule.style.fontFamily !== undefined && !text(rule.style.fontFamily)))) errors.push(`${path}.style geçersiz`);
  return errors;
}

function validatePage(page, path = "page") {
  const errors = [];
  if (!object(page)) return [`${path} gerekli`];
  if (!positive(page.widthMm) || !positive(page.heightMm)) errors.push(`${path} boyutları geçersiz`);
  if (!["portrait", "landscape"].includes(page.orientation)) errors.push(`${path}.orientation geçersiz`);
  const margins = page.margins;
  if (!object(margins)) errors.push(`${path}.margins gerekli`);
  else {
    for (const key of ["topMm", "bottomMm", "leftMm", "rightMm"]) {
      if (!nonnegative(margins[key])) errors.push(`${path}.margins.${key} geçersiz`);
    }
    if (positive(page.widthMm) && nonnegative(margins.leftMm) && nonnegative(margins.rightMm) && margins.leftMm + margins.rightMm >= page.widthMm) errors.push(`${path} yatay kenar boşlukları sayfayı aşıyor`);
    if (positive(page.heightMm) && nonnegative(margins.topMm) && nonnegative(margins.bottomMm) && margins.topMm + margins.bottomMm >= page.heightMm) errors.push(`${path} dikey kenar boşlukları sayfayı aşıyor`);
  }
  for (const kind of ["header", "footer"]) {
    const part = page[kind];
    if (part === undefined) continue;
    if (!object(part) || !nonnegative(part.heightMm) || !nonnegative(part.distanceMm)) errors.push(`${path}.${kind} geçersiz`);
    if (part?.firstPage !== undefined && !["same", "omit"].includes(part.firstPage)) errors.push(`${path}.${kind}.firstPage geçersiz`);
  }
  errors.push(...validateNumbering(page.numbering, `${path}.numbering`));
  return errors;
}

function validateCaption(caption, path) {
  const errors = [];
  if (!object(caption)) return [`${path} gerekli`];
  if (!text(caption.label)) errors.push(`${path}.label gerekli`);
  if (!["above", "below"].includes(caption.position)) errors.push(`${path}.position geçersiz`);
  errors.push(...validateTextStyle(caption.style, `${path}.style`));
  if (!object(caption.numbering) || !["document", "chapter"].includes(caption.numbering.scope) || !text(caption.numbering.format) || !numberingFormats.has(caption.numbering.sequence)) errors.push(`${path}.numbering geçersiz`);
  if (caption.captionAlignment !== undefined && ![...aligns, "auto"].includes(caption.captionAlignment)) errors.push(`${path}.captionAlignment geçersiz`);
  for (const key of ["spacingBeforePt", "spacingAfterPt"]) if (caption[key] !== undefined && !nonnegative(caption[key])) errors.push(`${path}.${key} geçersiz`);
  if (caption.cellStyle !== undefined) errors.push(...(object(caption.cellStyle) ? validateTextStyle({ ...caption.style, ...caption.cellStyle }, `${path}.cellStyle`) : [`${path}.cellStyle nesne olmalı`]));
  if (caption.labelFormat !== undefined && !(text(caption.labelFormat) && caption.labelFormat.includes("{number}"))) errors.push(`${path}.labelFormat {number} içermeli`);
  if (caption.labelStyle !== undefined) errors.push(...(object(caption.labelStyle) ? validateTextStyle({ ...caption.style, ...caption.labelStyle }, `${path}.labelStyle`) : [`${path}.labelStyle nesne olmalı`]));
  if (caption.hangingIndent !== undefined && caption.hangingIndent !== "label" && !positive(caption.hangingIndent)) errors.push(`${path}.hangingIndent geçersiz`);
  return errors;
}

function validateIndex(index, body, headings, path) {
  if (!object(index)) return [`${path} nesne olmalı`];
  const errors = [];
  if (!["toc", "figures", "tables"].includes(index.kind)) errors.push(`${path}.kind geçersiz`);
  if (index.maxDepth !== undefined && (!Number.isInteger(index.maxDepth) || index.maxDepth < 1 || index.maxDepth > 6)) errors.push(`${path}.maxDepth geçersiz`);
  if (index.levels !== undefined && (!Array.isArray(index.levels) || index.levels.some((n) => !headings?.[n]))) errors.push(`${path}.levels geçersiz`);
  if (index.title !== undefined && !text(index.title)) errors.push(`${path}.title geçersiz`);
  if (index.includePageNumbers !== undefined && typeof index.includePageNumbers !== "boolean") errors.push(`${path}.includePageNumbers geçersiz`);
  if (index.leader !== undefined && !["dots", "none"].includes(index.leader)) errors.push(`${path}.leader geçersiz`);
  if (index.pageNumberAlignment !== undefined && !["left", "center", "right"].includes(index.pageNumberAlignment)) errors.push(`${path}.pageNumberAlignment geçersiz`);
  if (index.indentMm !== undefined && !nonnegative(index.indentMm)) errors.push(`${path}.indentMm geçersiz`);
  if (index.style) errors.push(...validateTextStyle({ ...body, ...index.style }, `${path}.style`));
  if (index.pageHeading !== undefined && !text(index.pageHeading)) errors.push(`${path}.pageHeading geçersiz`);
  if (index.pageHeadingStyle !== undefined) errors.push(...validateTextStyle({ ...body, ...index.style, ...index.pageHeadingStyle }, `${path}.pageHeadingStyle`));
  if (index.matchHeadingTransform !== undefined && typeof index.matchHeadingTransform !== "boolean") errors.push(`${path}.matchHeadingTransform geçersiz`);
  return errors;
}

/** Advisory rules never block saving or exporting. Fields resolve from metadata or editable section text. */
export function validateThesisContent(template, thesis, values = thesis?.values || {}) {
  const result = { errors: [], warnings: [] };
  for (const [field, rule] of Object.entries(template.validation || {})) {
    const raw = values[field] ?? thesis?.sectionContent?.[field] ?? "";
    const items = Array.isArray(raw) ? raw.filter((item) => String(item).trim()) : String(raw).split(rule.separator || /[,;\n]/).map((item) => item.trim()).filter(Boolean);
    if (rule.minItems !== undefined && items.length < rule.minItems) result[rule.severity === "error" ? "errors" : "warnings"].push({ code: "minItems", field, expected: rule.minItems, actual: items.length, message: rule.message || `${field}: en az ${rule.minItems} öğe gerekli (${items.length}).` });
  }
  return result;
}

export function validateThesisTemplate(template) {
  const errors = [];
  if (!object(template)) return ["Şablon nesne olmalı"];
  if (template.schemaVersion !== THESIS_SCHEMA_VERSION) errors.push(`schemaVersion ${THESIS_SCHEMA_VERSION} olmalı`);
  for (const key of ["id", "templateVersion", "universityId", "universityName", "degreeType", "language"]) {
    if (!text(template[key])) errors.push(`${key} gerekli`);
  }
  if (!["demo", "generic", "official"].includes(template.status)) errors.push("status geçersiz");
  if (!object(template.source) || !["official", "manual", "imported"].includes(template.source.type)) errors.push("source geçersiz");
  // An official guide may be a distributed file without a public URL; it is then named by documentName.
  if (template.status === "official" && (template.source?.type !== "official" || !(text(template.source?.url) || text(template.source?.documentName)) || !text(template.source?.verifiedAt))) errors.push("official şablon için kaynak (URL veya belge adı) ve doğrulama tarihi gerekli");
  errors.push(...validatePage(template.page));
  errors.push(...validateTextStyle(template.typography?.body, "typography.body"));
  if (template.typography?.paragraph) errors.push(...validateTextStyle({ ...template.typography.body, ...template.typography.paragraph }, "typography.paragraph"));
  errors.push(...validateFootnoteRule(template.typography?.footnotes, "typography.footnotes", validateTextStyle, template.typography?.body));
  const lineSpacing = template.typography?.lineSpacing;
  if (lineSpacing !== undefined && !(object(lineSpacing) && (lineSpacing.mode === "multiplier" || (lineSpacing.mode === "word" && positive(lineSpacing.singleLineEm) && lineSpacing.singleLineEm <= 3)))) errors.push("typography.lineSpacing geçersiz");
  if (lineSpacing?.paragraphSpacing !== undefined && !["collapse", "additive"].includes(lineSpacing.paragraphSpacing)) errors.push("typography.lineSpacing.paragraphSpacing geçersiz");
  if (lineSpacing?.baseline !== undefined && !(lineSpacing.mode === "word" && ["css", "word"].includes(lineSpacing.baseline))) errors.push("typography.lineSpacing.baseline geçersiz");
  if (template.validation !== undefined) {
    if (!object(template.validation)) errors.push("validation nesne olmalı");
    else for (const [field, rule] of Object.entries(template.validation)) {
      if (!object(rule) || !Number.isInteger(rule.minItems) || rule.minItems < 0) errors.push(`validation.${field}.minItems geçersiz`);
      if (rule?.separator !== undefined && (typeof rule.separator !== "string" || !rule.separator)) errors.push(`validation.${field}.separator geçersiz`);
      if (rule?.severity !== undefined && !["error", "warning"].includes(rule.severity)) errors.push(`validation.${field}.severity geçersiz`);
    }
  }
  const headings = template.typography?.headings;
  if (!object(headings) || !Object.keys(headings).length) errors.push("typography.headings gerekli");
  else for (const [level, style] of Object.entries(headings)) {
    if (!/^[1-9]\d*$/.test(level)) errors.push(`heading seviyesi ${level} geçersiz`);
    errors.push(...validateTextStyle(style, `typography.headings.${level}`));
    if (style.numbering && !text(style.numbering.format)) errors.push(`typography.headings.${level}.numbering.format geçersiz`);
  }
  if (!object(template.placeholders)) errors.push("placeholders gerekli");
  else for (const [key, definition] of Object.entries(template.placeholders)) {
    if (!/^[A-Z][A-Z0-9_]*$/.test(key)) errors.push(`placeholder ${key} geçersiz`);
    if (!object(definition) || !text(definition.label) || !text(definition.type)) errors.push(`placeholder ${key} tanımı geçersiz`);
    else if (definition.derived !== undefined && !THESIS_DERIVED_VALUES.includes(definition.derived)) errors.push(`placeholder ${key}.derived geçersiz`);
  }
  const sections = template.sections;
  if (!Array.isArray(sections) || !sections.length) errors.push("sections gerekli");
  else {
    const ids = new Set();
    for (const section of sections) {
      if (!object(section) || !text(section.id)) { errors.push("section id gerekli"); continue; }
      if (ids.has(section.id)) errors.push(`duplicate section: ${section.id}`);
      ids.add(section.id);
      if (!/^[a-zA-Z][\w-]*$/.test(section.id)) errors.push(`section id geçersiz: ${section.id}`);
      if (!text(section.type) || !text(section.title) || !text(section.group)) errors.push(`section ${section.id} kimliği eksik`);
      if (!["required", "optional", "disabled"].includes(section.status)) errors.push(`section ${section.id} status geçersiz`);
      if (section.editable !== undefined && typeof section.editable !== "boolean") errors.push(`section ${section.id}.editable geçersiz`);
      if (section.mode !== undefined && !sectionModes.has(section.mode)) errors.push(`section ${section.id}.mode geçersiz`);
      if (sectionModes.has(section.mode) && typeof section.editable === "boolean" && section.editable !== (section.mode === "editable")) errors.push(`section ${section.id}.mode ile editable çelişiyor`);
      if (section.order !== undefined && !Number.isFinite(section.order)) errors.push(`section ${section.id}.order geçersiz`);
      if (section.showTitle !== undefined && typeof section.showTitle !== "boolean") errors.push(`section ${section.id}.showTitle geçersiz`);
      if (section.type === "mainContent" && section.mode !== undefined && section.mode !== "editable") errors.push(`section ${section.id}: mainContent düzenlenebilir olmalı`);
      if (section.pageBreakBefore !== undefined && typeof section.pageBreakBefore !== "boolean") errors.push(`section ${section.id}.pageBreakBefore geçersiz`);
      if (section.standalone !== undefined && (typeof section.standalone !== "boolean" || !Array.isArray(section.blocks))) errors.push(`section ${section.id}.standalone yalnız blocks ile ve boolean olmalı`);
      if (section.tocEntry !== undefined && !["headings", "title", "none"].includes(section.tocEntry)) errors.push(`section ${section.id}.tocEntry geçersiz`);
      if (section.generatedIndex !== undefined) {
        if (section.mode !== "generated") errors.push(`section ${section.id}.generatedIndex: mode generated olmalı`);
        errors.push(...validateIndex(section.generatedIndex, template.typography?.body, headings, `section ${section.id}.generatedIndex`));
      }
      if (section.visibleWhen !== undefined) {
        const condition = section.visibleWhen;
        if (!object(condition) || !text(condition.field) || Object.keys(condition).some((key) => !["field", "equals", "notEquals", "in"].includes(key)) || ["equals", "notEquals", "in"].filter((key) => Object.hasOwn(condition, key)).length !== 1 || (condition.in !== undefined && !Array.isArray(condition.in)) || [condition.equals, condition.notEquals, ...(condition.in || [])].some((v) => v !== undefined && !["string", "number", "boolean"].includes(typeof v))) errors.push(`section ${section.id}.visibleWhen geçersiz`);
      }
      if (section.blocks !== undefined) {
        if ((section.mode !== undefined && section.mode !== "static") || section.editable === true) errors.push(`section ${section.id}: özel sayfa blocks düzenlenemez; mode static olmalı`);
        const baseStyle = { ...template.typography?.body, ...section.overrides?.body };
        errors.push(...validateSpecialPageBlocks(section.blocks, { path: `section ${section.id}.blocks`, placeholders: template.placeholders || {}, baseStyle, validateStyle: validateTextStyle }));
      }
      const overrides = section.overrides;
      if (overrides) {
        if (overrides.page) {
          const merged = { ...template.page, ...overrides.page, margins: { ...template.page?.margins, ...overrides.page.margins }, numbering: { ...template.page?.numbering, ...overrides.page.numbering }, header: { ...template.page?.header, ...overrides.page.header }, footer: { ...template.page?.footer, ...overrides.page.footer } };
          errors.push(...validatePage(merged, `section ${section.id}.page`));
        }
        if (overrides.body) errors.push(...validateTextStyle({ ...template.typography?.body, ...overrides.body }, `section ${section.id}.body`));
        if (overrides.paragraph) errors.push(...validateTextStyle({ ...template.typography?.body, ...template.typography?.paragraph, ...overrides.body, ...overrides.paragraph }, `section ${section.id}.paragraph`));
        if (overrides.footnotes) errors.push(...validateFootnoteRule({ ...template.typography?.footnotes, ...overrides.footnotes, separator: { ...template.typography?.footnotes?.separator, ...overrides.footnotes.separator } }, `section ${section.id}.footnotes`, validateTextStyle, { ...template.typography?.body, ...overrides.body }));
        for (const [level, style] of Object.entries(overrides.headings || {})) {
          if (!headings?.[level]) errors.push(`section ${section.id} heading ${level} bulunamadı`);
          else errors.push(...validateTextStyle({ ...headings[level], ...style }, `section ${section.id}.headings.${level}`));
        }
        if (overrides.tables) errors.push(...validateCaption({ ...template.tables, ...overrides.tables, style: { ...template.tables?.style, ...overrides.tables.style }, numbering: { ...template.tables?.numbering, ...overrides.tables.numbering } }, `section ${section.id}.tables`));
        if (overrides.figures) errors.push(...validateCaption({ ...template.figures, ...overrides.figures, style: { ...template.figures?.style, ...overrides.figures.style }, numbering: { ...template.figures?.numbering, ...overrides.figures.numbering } }, `section ${section.id}.figures`));
      }
      for (const match of String(section.content || "").matchAll(placeholderPattern)) {
        if (!template.placeholders?.[match[1]]) errors.push(`section ${section.id}: ${match[1]} placeholder tanımı eksik`);
      }
    }
    if (!sections.some((section) => section.type === "mainContent" && section.status !== "disabled")) errors.push("mainContent bölümü gerekli");
  }
  errors.push(...validateCaption(template.tables, "tables"), ...validateCaption(template.figures, "figures"));
  if (template.captionNumberingChoices !== undefined) {
    const choices = template.captionNumberingChoices;
    if (!Array.isArray(choices)) errors.push("captionNumberingChoices liste olmalı");
    else choices.forEach((choice, index) => {
      const numbering = { ...template.tables?.numbering, ...choice?.numbering };
      if (!object(choice) || !text(choice.id) || !text(choice.label) || !object(choice.numbering) || !["document", "chapter"].includes(numbering.scope) || !text(numbering.format) || !numberingFormats.has(numbering.sequence)) errors.push(`captionNumberingChoices.${index} geçersiz`);
      if (choices.findIndex((item) => item?.id === choice?.id) !== index) errors.push(`captionNumberingChoices.${index} id tekrarı`);
    });
  }
  errors.push(...validateTextStyle(template.bibliography?.style, "bibliography.style"));
  if (!text(template.bibliography?.heading)) errors.push("bibliography.heading gerekli");
  if (!object(template.toc) || !Array.isArray(template.toc.levels) || template.toc.levels.some((level) => !Number.isInteger(level) || level < 1 || !headings?.[level])) errors.push("toc.levels geçersiz");
  if (typeof template.toc?.showPageNumbers !== "boolean") errors.push("toc.showPageNumbers gerekli");
  return errors;
}

export function validateThesisRegistry(registry) {
  if (!Array.isArray(registry)) return ["Registry liste olmalı"];
  const errors = [];
  const ids = new Set();
  for (const entry of registry) {
    if (!text(entry?.id)) errors.push("Registry id gerekli");
    if (!text(entry?.templateVersion)) errors.push(`Registry ${entry?.id}: templateVersion gerekli`);
    if (ids.has(entry?.id)) errors.push(`duplicate template id: ${entry.id}`);
    ids.add(entry?.id);
    if (typeof entry?.load !== "function") errors.push(`Registry ${entry?.id}: load eksik`);
  }
  return errors;
}

/** Future versions enter here with explicit migration functions. */
export function migrateThesisTemplate(raw) {
  if (raw?.schemaVersion === THESIS_SCHEMA_VERSION) return raw;
  throw new Error(`Desteklenmeyen tez şema sürümü: ${raw?.schemaVersion ?? "yok"}`);
}
