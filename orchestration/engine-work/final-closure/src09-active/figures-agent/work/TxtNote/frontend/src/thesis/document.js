/**
 * A thesis document is a TxtNote note: its title and main rich-text body use
 * the ordinary note fields; template selection, metadata and other editable
 * section bodies live in note.researchData.thesis. The template is only read.
 */
import { thesisSourceHtml } from "./sourceHtml.js";
import { normalizeStaticFormat } from "./staticFormat.js";

export function createThesisDocument(template, selection, year = new Date().getFullYear()) {
  return {
    selection: { ...selection },
    templateId: template.id,
    templateVersion: template.templateVersion,
    schemaVersion: template.schemaVersion,
    values: { YEAR: String(year) },
    sectionContent: {},
    enabledSections: [],
  };
}

/**
 * Thesis metadata lives in thesis.values, keyed by placeholder name. The thesis
 * title is the ordinary note title and is exposed as THESIS_TITLE. These are the
 * standard fields every template can use; a template may declare more.
 */
export const THESIS_METADATA_FIELDS = {
  THESIS_TITLE_EN: { label: "İngilizce başlık", type: "text" },
  STUDENT_NAME: { label: "Öğrenci", type: "text" },
  STUDENT_NUMBER: { label: "Öğrenci numarası", type: "text" },
  DEPARTMENT_NAME: { label: "Bölüm", type: "text" },
  ADVISOR_NAME: { label: "Danışman", type: "text" },
  CO_ADVISOR_NAME: { label: "İkinci danışman", type: "text" },
  CITY: { label: "Şehir", type: "text" },
  YEAR: { label: "Yıl", type: "number" },
  DATE: { label: "Tarih", type: "date" },
};

/** Old notes use the original keys; newer templates may use the clearer aliases. */
export const THESIS_METADATA_ALIASES = { CO_ADVISOR_NAME: "SECOND_ADVISOR_NAME", SECOND_ADVISOR_NAME: "CO_ADVISOR_NAME", DEPARTMENT_NAME: "DEPARTMENT", DEPARTMENT: "DEPARTMENT_NAME" };

export function thesisMetadataValue(thesis, key) {
  return thesis?.values?.[key] ?? thesis?.values?.[THESIS_METADATA_ALIASES[key]];
}

/** Return new thesis state with one metadata value (and its alias) changed. */
export function updateThesisMetadata(thesis, key, value) {
  const text = String(value ?? "");
  const alias = THESIS_METADATA_ALIASES[key];
  return { ...thesis, values: { ...thesis?.values, [key]: text, ...(alias ? { [alias]: text } : {}) } };
}

/**
 * Section behaviour comes from template data:
 * - editable: the user writes it; HTML lives in the note, keyed by section id
 * - static: template-owned content/blocks, read-only
 * - generated: built from the document (TOC, lists), never user content
 */
export const THESIS_SECTION_MODES = Object.freeze(["editable", "static", "generated"]);
/** Only used for templates that predate `mode`; explicit `mode` always wins. */
const LEGACY_GENERATED_TYPES = new Set(["tableOfContents", "listOfTables", "listOfFigures"]);

export function thesisSectionMode(section) {
  if (THESIS_SECTION_MODES.includes(section?.mode)) return section.mode;
  if (section?.editable === true) return "editable";
  if (LEGACY_GENERATED_TYPES.has(section?.type)) return "generated";
  if (section?.editable === false) return "static";
  return section?.content || Array.isArray(section?.blocks) ? "static" : "editable";
}

export function isThesisSectionEditable(section) {
  return thesisSectionMode(section) === "editable";
}

/** Template sections in display order: optional numeric `order`, otherwise array position. */
export function orderedThesisSections(template) {
  return (template?.sections || [])
    .map((section, index) => ({ section, key: Number.isFinite(section?.order) ? section.order : index, index }))
    .sort((a, b) => a.key - b.key || a.index - b.index)
    .map((entry) => entry.section);
}

/** Ids of the optional sections the user turned on; malformed stored data reads as none. */
export function thesisEnabledSections(thesis) {
  return Array.isArray(thesis?.enabledSections) ? thesis.enabledSections : [];
}

/** The declarative visibleWhen condition alone (no status); true when a section has none. */
export function thesisSectionConditionMet(section, thesis) {
  if (!section?.visibleWhen) return true;
  // A count condition ({ count, gte }) reads the compiled document, not metadata: see thesisSectionCountMet.
  if (section.visibleWhen.count !== undefined) return true;
  const { field, equals, notEquals, in: choices } = section.visibleWhen;
  const value = thesis?.values?.[field] ?? (field === "degreeType" ? thesis?.selection?.degreeType : undefined);
  if (Object.hasOwn(section.visibleWhen, "equals") && value !== equals) return false;
  if (Object.hasOwn(section.visibleWhen, "notEquals") && value === notEquals) return false;
  if (choices && !choices.includes(value)) return false;
  return true;
}

/**
 * `visibleWhen: { count: "tables" | "figures" | "equations" | <caption kind>, gte: n }`: the section appears only when the
 * document has at least n such items (e.g. a list of tables from three tables on). `sources` are the collected index sources.
 */
export function thesisSectionCountMet(section, sources) {
  const condition = section?.visibleWhen;
  if (condition?.count === undefined) return true;
  return sources.filter((entry) => entry.kind === condition.count).length >= condition.gte;
}

/** disabled: never shown; optional: shown once the user enables it; required: always. */
export function isThesisSectionActive(section, thesis) {
  if (section?.status === "disabled") return false;
  if (!thesisSectionConditionMet(section, thesis)) return false;
  if (section?.status === "optional") return thesisEnabledSections(thesis).includes(section.id);
  return true;
}

/** The only thing that identifies stored user HTML is the section's stable id. */
export function thesisSectionContentKey(section) {
  return section.id;
}

export function thesisSectionContent(section, thesis, mainContent = "") {
  if (!isThesisSectionEditable(section)) return "";
  return section.type === "mainContent" ? mainContent : thesis?.sectionContent?.[thesisSectionContentKey(section)] ?? "";
}

/**
 * Document-local replacement for template-owned text (a section's title heading, its fixed paragraphs).
 * Stored in thesis.textOverrides[sectionId][kind]; the template is never written and no override means template text.
 */
export function thesisTextOverride(thesis, sectionId, kind) {
  const value = thesis?.textOverrides?.[sectionId]?.[kind];
  return typeof value === "string" ? value : undefined;
}

/** New thesis state with one override set; `text === undefined` restores the template text. */
export function setThesisTextOverride(thesis, sectionId, kind, text) {
  if (thesisTextOverride(thesis, sectionId, kind) === text) return thesis;
  const { [sectionId]: current = {}, ...others } = thesis?.textOverrides || {};
  const { [kind]: _removed, ...rest } = current;
  const entry = text === undefined ? rest : { ...rest, [kind]: String(text) };
  const textOverrides = Object.keys(entry).length ? { ...others, [sectionId]: entry } : others;
  return { ...thesis, textOverrides };
}

/** Character format (see staticFormat.js) of the template-owned text `kind` ("title" | "fixed"). */
export function thesisTextFormat(thesis, sectionId, kind) {
  const value = thesis?.textOverrides?.[sectionId]?.[`${kind}Format`];
  return value && typeof value === "object" ? value : undefined;
}

/** New thesis state with the format of `kind` replaced; an empty format restores the template formatting. */
export function setThesisTextFormat(thesis, sectionId, kind, format) {
  const clean = normalizeStaticFormat(format);
  const key = `${kind}Format`;
  const current = thesisTextFormat(thesis, sectionId, kind);
  if (!Object.keys(clean).length ? current === undefined : JSON.stringify(current) === JSON.stringify(clean)) return thesis;
  const { [sectionId]: entry = {}, ...others } = thesis?.textOverrides || {};
  const { [key]: _removed, ...rest } = entry;
  const next = Object.keys(clean).length ? { ...rest, [key]: clean } : rest;
  return { ...thesis, textOverrides: Object.keys(next).length ? { ...others, [sectionId]: next } : others };
}

/** Return a new note only for editable sections; never write into a template. */
export function updateThesisNoteSection(note, section, html) {
  if (!isThesisSectionEditable(section)) return note;
  const content = thesisSourceHtml(html);
  if (section.type === "mainContent") {
    return note.content === content ? note : { ...note, content };
  }
  const researchData = note.researchData || {};
  const thesis = researchData.thesis || {};
  const key = thesisSectionContentKey(section);
  if (thesis.sectionContent?.[key] === content) return note;
  return {
    ...note,
    researchData: {
      ...researchData,
      thesis: {
        ...thesis,
        sectionContent: { ...thesis.sectionContent, [key]: content },
      },
    },
  };
}
