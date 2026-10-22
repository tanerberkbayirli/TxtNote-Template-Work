/**
 * Engine defaults for rules an official source may not define at all (orchestration/motor/ALTYAPI.md: never force an invented value on a template).
 * A template that omits one of them renders with the engine's own default instead of having to carry a placeholder value:
 * - `typography.headings` absent -> levels 1-3 in the body font/size, bold, no numbering;
 * - `tables` / `figures` absent -> label "Tablo"/"Şekil" ("Table"/"Figure" for language "en"), tables above, figures below,
 *   body font/size, document-wide arabic numbering "{n}"; an absent `position` / `style` / `numbering` of a given rule gets the same default;
 * - `bibliography` absent -> heading "Kaynakça"/"References", body font/size; an absent `style` likewise;
 * - `page.header` / `page.footer` without `heightMm` / `distanceMm` -> 0 / 12.5 mm (Word's own default header/footer distance).
 * - `page.orientation` absent -> "portrait" (the sheet is drawn from widthMm x heightMm as given; "landscape" swaps them on export).
 * - a caption rule's `numbering` without `sequence` -> "arabic" (the same counter an absent `numbering` gets); its scope and format are never guessed.
 * - no `tabStopMm` -> default tab stops every 12.5 mm (Word's default for a Turkish/metric document, 709 twips); the editor's tab-size and the
 *   DOCX `w:defaultTabStop` both read ENGINE_DEFAULT_TAB_STOP_MM, so a typed tab lands at the same place in both.
 * - a wholly omitted header/footer remains absent in source and validation, but resolved section rules use the same 0 / 12.5 mm runtime geometry.
 * Only ABSENT keys are filled, never keys a template sets, so a fully specified template is returned unchanged (same object).
 */
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

export const ENGINE_DEFAULT_HEADER_DISTANCE_MM = 12.5;
export const ENGINE_DEFAULT_TAB_STOP_MM = 12.5;
export const ENGINE_DEFAULT_ORIENTATION = "portrait";
export const ENGINE_DEFAULT_CAPTION_SEQUENCE = "arabic";

export function withEngineDefaults(template) {
  if (!isObject(template) || !isObject(template.typography?.body)) return template;
  const body = template.typography.body;
  const english = String(template.language || "").toLowerCase().startsWith("en");
  const inherit = { fontFamily: body.fontFamily, fontSizePt: body.fontSizePt };
  const numbering = () => ({ scope: "document", format: "{n}", sequence: "arabic" });
  let changed = false;
  const out = { ...template };
  if (!isObject(template.typography.headings) || !Object.keys(template.typography.headings).length) {
    out.typography = { ...template.typography, headings: { 1: { ...inherit, fontWeight: 700 }, 2: { ...inherit, fontWeight: 700 }, 3: { ...inherit, fontWeight: 700 } } };
    changed = true;
  }
  const caption = (rule, label, position) => {
    if (rule === undefined) { changed = true; return { label, position, style: { ...inherit }, numbering: numbering() }; }
    const noSequence = isObject(rule) && isObject(rule.numbering) && rule.numbering.sequence === undefined;
    if (!isObject(rule) || (rule.position !== undefined && isObject(rule.style) && isObject(rule.numbering) && !noSequence)) return rule;
    changed = true;
    return {
      ...rule,
      position: rule.position === undefined ? position : rule.position,
      style: isObject(rule.style) ? rule.style : { ...inherit },
      numbering: !isObject(rule.numbering) ? numbering() : noSequence ? { ...rule.numbering, sequence: ENGINE_DEFAULT_CAPTION_SEQUENCE } : rule.numbering,
    };
  };
  out.tables = caption(template.tables, english ? "Table" : "Tablo", "above");
  out.figures = caption(template.figures, english ? "Figure" : "Şekil", "below");
  if (template.bibliography === undefined) { out.bibliography = { heading: english ? "References" : "Kaynakça", style: { ...inherit } }; changed = true; }
  else if (isObject(template.bibliography) && template.bibliography.style === undefined) { out.bibliography = { ...template.bibliography, style: { ...inherit } }; changed = true; }
  if (isObject(template.page)) {
    const page = { ...template.page };
    if (page.orientation === undefined) { page.orientation = ENGINE_DEFAULT_ORIENTATION; changed = true; }
    for (const kind of ["header", "footer"]) {
      const part = template.page[kind];
      if (isObject(part) && (part.heightMm === undefined || part.distanceMm === undefined)) { page[kind] = { ...part, heightMm: part.heightMm ?? 0, distanceMm: part.distanceMm ?? ENGINE_DEFAULT_HEADER_DISTANCE_MM }; changed = true; }
    }
    out.page = page;
  }
  return changed ? out : template;
}
