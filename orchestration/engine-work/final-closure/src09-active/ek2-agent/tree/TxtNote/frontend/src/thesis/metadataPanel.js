import { THESIS_METADATA_ALIASES, THESIS_METADATA_FIELDS } from "./document.js";

const automatic = new Set(["THESIS_TITLE", "UNIVERSITY_NAME", "INSTITUTE_NAME", "DEGREE_TYPE"]);

/** Read actual template content, never source notes or unused placeholder declarations. */
export function thesisMetadataPanel(template, sections) {
  const activeIds = new Set(sections.map(section => section.id));
  const used = new Set();
  const scan = value => {
    if (typeof value === "string") {
      for (const match of value.matchAll(/\{\{([A-Z][A-Z0-9_]*)\}\}/g)) used.add(match[1]);
    } else if (Array.isArray(value)) value.forEach(scan);
    else if (value && typeof value === "object") {
      if (value.type === "metadata" && value.field) used.add(value.field);
      // Conditional co-advisors must remain fillable while their value is empty.
      for (const key of ["value", "content", "title", "prefix", "suffix", "fallback", "blocks"]) scan(value[key]);
    }
  };
  for (const section of template.sections || []) if (activeIds.has(section.id)) scan(section);
  const definitions = { ...THESIS_METADATA_FIELDS, ...template.placeholders };
  const fields = [];
  const emitted = new Set();
  for (const [key, definition] of Object.entries(definitions)) {
    const alias = THESIS_METADATA_ALIASES[key];
    if (automatic.has(key) || definition.derived || (template.language === "en" && key === "THESIS_TITLE_EN")) continue;
    if (!used.has(key) && !used.has(alias)) continue;
    if (emitted.has(key) || emitted.has(alias)) continue;
    fields.push([key, template.placeholders?.[key] || template.placeholders?.[alias] || definition]);
    emitted.add(key);
  }
  return { fields, hasPrimaryTitle: used.has("THESIS_TITLE") || (template.language === "en" && used.has("THESIS_TITLE_EN")) };
}
