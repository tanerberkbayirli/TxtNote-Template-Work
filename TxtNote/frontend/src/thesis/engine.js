import { migrateThesisTemplate, validateThesisContent, validateThesisTemplate } from "./validation.js";
import { isThesisSectionActive, orderedThesisSections, thesisSectionContent, thesisSectionCountMet, thesisSectionMode } from "./document.js";
import { customFormatCss } from "../config/format.js";
import { styleNonceAttribute, withoutInlineStyleAttributes } from "../lib/cspStyles.js";
import { flattenSpecialPage, isSpecialPageSection, resolveSpecialPage, specialPageHtml } from "./specialPages.js";
import { collectIndexSources, generatedIndexRule, resolveGeneratedIndexes, thesisPresentationHtml } from "./generatedIndex.js";
import { plainThesisText, thesisSourceHtml } from "./sourceHtml.js";
import { countFootnoteRefs, resolveFootnoteRule } from "./footnotes.js";
import { thesisGroupHasPageContent } from "./pageLayout.js";
import { resolveLayoutNodes, resolveLayoutPage } from "./layoutDocument.js";
import { resolveLayoutTypography } from "./layoutProperties.js";
import { wordBaselineProbe } from "./wordBaseline.js";
import { exceptionSet, isExceptionToken } from "./transformExceptions.js";
import { ENGINE_DEFAULT_HEADER_DISTANCE_MM } from "./engineDefaults.js";
import { escapeHtml, effectiveLineHeight, thesisSectionCss, thesisFootnoteCss, sectionTextStyles } from "./engineCss.js";
export { effectiveLineHeight, cellPaddingCss, indentMm, thesisSectionCss, thesisFootnoteCss } from "./engineCss.js";

const tokenPattern = /\{\{([A-Z][A-Z0-9_]*)\}\}/g;
const plainText = plainThesisText;

/** Turkish ordinal words (uppercase) for chapter labels: BİRİNCİ BÖLÜM. Beyond ten the label falls back to "11.". */
const ORDINAL_TR_UPPER = ["BİRİNCİ", "İKİNCİ", "ÜÇÜNCÜ", "DÖRDÜNCÜ", "BEŞİNCİ", "ALTINCI", "YEDİNCİ", "SEKİZİNCİ", "DOKUZUNCU", "ONUNCU"];
/** Caption numbers embed the chapter as digits even when the chapter heading prints an ordinal word. */
export const chapterNumberSequence = (sequence) => /^ordinal/.test(sequence || "") ? "arabic" : sequence || "arabic";

export function formatNumber(value, format = "arabic") {
  if (!Number.isInteger(value) || value < 1) return "";
  if (format === "arabic") return String(value);
  if (format === "ordinal-tr-upper") return ORDINAL_TR_UPPER[value - 1] || `${value}.`;
  if (!["roman-lower", "roman-upper", "alpha-lower", "alpha-upper"].includes(format)) return String(value);
  if (format === "alpha-upper" || format === "alpha-lower") {
    let current = value;
    let letters = "";
    while (current > 0) { current -= 1; letters = String.fromCharCode(65 + current % 26) + letters; current = Math.floor(current / 26); }
    return format === "alpha-lower" ? letters.toLowerCase() : letters;
  }
  const numerals = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let rest = value;
  let result = "";
  for (const [n, symbol] of numerals) while (rest >= n) { result += symbol; rest -= n; }
  return format === "roman-lower" ? result.toLowerCase() : result;
}

export function resolvePlaceholders(source, definitions, values = {}) {
  const missing = new Set();
  const result = String(source ?? "").replace(tokenPattern, (_, key) => {
    const definition = definitions?.[key];
    if (!definition) { missing.add(key); return ""; }
    const value = values[key] ?? definition.defaultValue ?? "";
    if (definition.required && !String(value).trim()) missing.add(key);
    return String(value);
  });
  return { text: result, missing: [...missing] };
}

export function resolveChromeText(source, values = {}) {
  return String(source || "").replace(tokenPattern, (_, key) => String(values[key] ?? ""));
}

/** Explicit page-number typography is shared by the browser, PDF, and DOCX renderers. */
export function resolvePageNumberStyle(body = {}, numbering = {}) {
  return {
    ...body,
    ...(numbering.style || {}),
    fontFamily: numbering.style?.fontFamily || body.fontFamily,
    fontSizePt: numbering.style?.fontSizePt || body.fontSizePt,
    // Weight/italic never inherit from the section body (a bold special-page body must not bold the number); only numbering.style sets them.
    fontWeight: numbering.style?.fontWeight ?? 400,
    italic: numbering.style?.italic ?? false,
  };
}

export function transformThesisText(value, style = {}, language = "tr") {
  const text = String(value ?? "");
  const capitalize = (word) => word[0].toLocaleUpperCase(language) + word.slice(1);
  // textTransformExceptions ("ve", "veya", "ile"): those words stay lower-case inside uppercase/capitalize.
  const exceptions = exceptionSet(style, language);
  if (exceptions) return text.replace(/\S+/g, (token) => isExceptionToken(token, exceptions, language) ? token.toLocaleLowerCase(language) : style.textTransform === "uppercase" ? token.toLocaleUpperCase(language) : capitalize(token));
  if (style.textTransform === "uppercase") return text.toLocaleUpperCase(language);
  if (style.textTransform === "lowercase") return text.toLocaleLowerCase(language);
  if (style.textTransform === "capitalize") return text.replace(/\S+/g, capitalize);
  return text;
}

function mergeCaption(base, override) {
  return override ? { ...base, ...override, style: { ...base.style, ...override.style }, numbering: { ...base.numbering, ...override.numbering }, ...(base.cellStyle || override.cellStyle ? { cellStyle: { ...base.cellStyle, ...override.cellStyle } } : {}) } : base;
}

/**
 * Document-level choices a template offers (e.g. figure/table numbering scope). The
 * chosen id lives in the thesis state; the template itself is never modified.
 */
export function applyThesisDocumentChoices(template, thesis = {}) {
  const choice = (template.captionNumberingChoices || []).find((item) => item.id === thesis?.captionNumbering);
  if (!choice) return template;
  const withChoice = (rule) => ({ ...rule, numbering: { ...rule.numbering, ...choice.numbering } });
  return { ...template, tables: withChoice(template.tables), figures: withChoice(template.figures), ...(template.captionKinds ? { captionKinds: Object.fromEntries(Object.entries(template.captionKinds).map(([id, rule]) => [id, withChoice(rule)])) } : {}) };
}

export function resolveSectionRules(template, section) {
  const override = section.overrides || {};
  const chromePart = (kind) => {
    const base = template.page[kind];
    const local = override.page?.[kind];
    return base === undefined && local === undefined
      ? { heightMm: 0, distanceMm: ENGINE_DEFAULT_HEADER_DISTANCE_MM }
      : { heightMm: 0, distanceMm: ENGINE_DEFAULT_HEADER_DISTANCE_MM, ...base, ...local };
  };
  return {
    page: {
      ...template.page,
      ...override.page,
      margins: { ...template.page.margins, ...override.page?.margins },
      numbering: { ...template.page.numbering, ...override.page?.numbering },
      header: chromePart("header"),
      footer: chromePart("footer"),
    },
    body: { ...template.typography.body, ...template.typography.paragraph, ...override.body, ...override.paragraph },
    footnotes: resolveFootnoteRule(template.typography.footnotes, override.footnotes, { ...template.typography.body, ...override.body }),
    headings: Object.fromEntries(Object.entries(template.typography.headings).map(([level, style]) => [level, { ...style, ...override.headings?.[level], numbering: { ...style.numbering, ...override.headings?.[level]?.numbering } }])),
    tables: mergeCaption(template.tables, override.tables),
    figures: mergeCaption(template.figures, override.figures),
    ...(template.captionKinds ? { captionKinds: Object.fromEntries(Object.entries(template.captionKinds).map(([id, rule]) => [id, mergeCaption(rule, override.captionKinds?.[id])])) } : {}),
    ...(template.equations ? { equations: template.equations } : {}),
    ...(template.typography.paragraphStyles ? { paragraphStyles: template.typography.paragraphStyles } : {}),
    bibliography: template.bibliography,
    toc: template.toc,
    ...(template.typography.lineSpacing ? { lineSpacing: template.typography.lineSpacing } : {}),
  };
}

function sharedPageSignature(page) {
  const numbering = page.numbering || {};
  return JSON.stringify({
    widthMm: page.widthMm,
    heightMm: page.heightMm,
    orientation: page.orientation,
    margins: page.margins,
    header: page.header,
    footer: page.footer,
    numbering: {
      enabled: numbering.enabled,
      position: numbering.position,
      align: numbering.align,
      format: numbering.format,
      baselineFromTopMm: numbering.baselineFromTopMm,
      xMm: numbering.xMm,
      widthMm: numbering.widthMm,
      style: numbering.style,
      centerOnPage: numbering.centerOnPage,
    },
  });
}

/**
 * Adjacent sections may share a physical page when their page chrome agrees.
 * Covers and block-layout special pages never share a page flow, unless a block
 * layout declares `standalone: false` (lines above/below an editable section).
 */
const standalonePage = (section) => section.group === "cover" || (Boolean(section.specialPage) && section.standalone !== false);

export function groupThesisSections(sections) {
  const groups = [];
  for (const section of sections) {
    const previous = groups[groups.length - 1];
    const sameKind = previous && !standalonePage(previous.sections[0]) && !standalonePage(section);
    if (sameKind && section.pageBreakBefore === false && !section.rules.page.numbering.restart && sharedPageSignature(previous.rules.page) === sharedPageSignature(section.rules.page)) {
      previous.sections.push(section);
    } else {
      groups.push({ id: section.id, title: section.title, rules: section.rules, sections: [section] });
    }
  }
  return groups;
}

export function extractThesisHeadings(html, rules, counters = []) {
  const headings = [];
  const re = /<h([1-9])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;
  for (const match of String(html || "").matchAll(re)) {
    const level = Number(match[1]);
    const unnumbered = /data-unnumbered|data-numbered=["']false["']/i.test(match[2]);
    // A section title marked data-thesis-toc="title" is listed in the TOC without a number.
    if (unnumbered) { headings.push({ level, title: plainText(match[3]), label: "", unnumbered: true, ...(/data-thesis-toc=["']title["']/i.test(match[2]) ? { tocTitle: true } : {}), counters: [...counters] }); continue; }
    counters[level - 1] = (counters[level - 1] || 0) + 1;
    for (let i = level; i < counters.length; i += 1) counters[i] = 0;
    const rule = rules.headings[level]?.numbering;
    // A level with no heading yet (H2 before any H1) reads 0, as in Word ("0.1", not ".1").
    const label = rule?.enabled === false ? "" : String(rule?.format || `{${level}}`).replace(/\{(\d+)\}/g, (_, n) => formatNumber(counters[Number(n) - 1] || 0, rule?.sequence || "arabic") || "0");
    headings.push({ level, title: plainText(match[3]), label, ...(label && rule?.placement === "ownLine" ? { labelLine: true } : {}), id: `heading-${headings.length + 1}`, counters: [...counters] });
  }
  return headings;
}

export function numberThesisHtml(html, rules) {
  const outline = extractThesisHeadings(html, rules).filter((entry) => !entry.unnumbered);
  let index = 0;
  return String(html || "").replace(/<h([1-9])\b([^>]*)>/gi, (full, level, attrs) => {
    if (!rules.headings[level] || /data-unnumbered|data-numbered=["']false["']/i.test(attrs)) return full;
    const label = outline[index++]?.label;
    return label ? `<h${level}${attrs} data-thesis-number="${escapeHtml(label)}">` : full;
  });
}

/** Covers and the main body carry their own headings; templates may override with showTitle. */

const UNTITLED_SECTION_TYPES = new Set(["outerCover", "innerCover", "tableOfContents", "mainContent"]);
const showsSectionTitle = (section) => typeof section.showTitle === "boolean" ? section.showTitle : !UNTITLED_SECTION_TYPES.has(section.type);
/** Does a block tree read any of `keys` (a metadata field or a `{{KEY}}` in text)? */
const usesFields = (blocks, keys) => keys.length > 0 && (blocks || []).some((block) => keys.some((key) => block.field === key || String(block.value ?? "").includes(`{{${key}}}`)) || usesFields(block.blocks, keys));

/**
 * Every font family a template names (typography, captions, bibliography, indexes,
 * section overrides and special-page blocks). An official template's PDF embeds the
 * genuine system programs of these families (see systemPdfFonts.js); demo/generic
 * templates keep the bundled metric-compatible face.
 */
export function templateFontFamilies(template) {
  const families = new Set();
  const add = (style) => { if (style?.fontFamily) families.add(String(style.fontFamily)); };
  const blocks = (list) => { for (const block of list || []) { add(block.style); blocks(block.blocks); } };
  const typography = template.typography || {};
  Object.values(typography.paragraphStyles || {}).forEach(add);
  [typography.body, typography.paragraph, typography.footnotes, template.tables?.style, template.tables?.cellStyle, template.tables?.labelStyle, template.figures?.style, template.figures?.labelStyle, template.bibliography?.style, template.page?.numbering?.style, template.equations?.style].forEach(add);
  Object.values(typography.headings || {}).forEach(add);
  for (const kind of Object.values(template.captionKinds || {})) { add(kind?.style); add(kind?.labelStyle); }
  for (const section of template.sections || []) {
    const o = section.overrides || {};
    [o.body, o.paragraph, o.footnotes, o.tables?.style, o.figures?.style, o.page?.numbering?.style, o.equations?.style, section.generatedIndex?.style, section.generatedIndex?.pageHeadingStyle].forEach(add);
    Object.values(o.headings || {}).forEach(add);
    blocks(section.blocks);
  }
  return [...families];
}

/** Resolved document is the sole input to editor rendering and both exporters. */
export function compileThesisDocument(templateInput, thesisInput = {}, title = "", mainContent = "", bibliographyItems = []) {
  // Stored thesis state may be missing or malformed (old notes, imports); it never breaks compilation.
  const thesis = thesisInput && typeof thesisInput === "object" ? thesisInput : {};
  const errors = validateThesisTemplate(migrateThesisTemplate(templateInput));
  if (errors.length) throw new Error(`Geçersiz tez şablonu: ${errors.join("; ")}`);
  const template = applyThesisDocumentChoices(migrateThesisTemplate(templateInput), thesis);
  const values = {
    UNIVERSITY_NAME: template.universityName,
    INSTITUTE_NAME: template.instituteName || "",
    DEGREE_TYPE: template.degreeType,
    THESIS_TITLE: title,
    ...thesis.values,
    THESIS_TITLE: title,
  };
  // Old notes use the original keys; newer templates may use the clearer aliases.
  for (const [original, alias] of [["CO_ADVISOR_NAME", "SECOND_ADVISOR_NAME"], ["DEPARTMENT_NAME", "DEPARTMENT"]]) {
    const value = thesis.values?.[original] ?? thesis.values?.[alias];
    if (value !== undefined) { values[original] = value; values[alias] = value; }
  }
  // Derived placeholders (e.g. the total page count) come from the laid-out document, never from
  // stored metadata (an old stored value is ignored); resolveGeneratedIndexes fills them in.
  const derivedFields = Object.fromEntries(Object.entries(template.placeholders).filter(([, definition]) => definition.derived).map(([key, definition]) => [key, definition.derived]));
  for (const key of Object.keys(derivedFields)) values[key] = "";
  const sections = [];
  for (const section of orderedThesisSections(template)) {
    if (!isThesisSectionActive(section, { ...thesis, values: { ...values, degreeType: values.degreeType ?? values.DEGREE_TYPE } })) continue;
    const rules = resolveSectionRules(template, section);
    rules.page = resolveLayoutPage(rules.page, section.id, 0, thesis.layout);
    rules.body = resolveLayoutTypography(rules.body, section.id, thesis.layout);
    const mode = thesisSectionMode(section);
    const editable = mode === "editable";
    const source = thesisSourceHtml(thesisSectionContent(section, thesis, mainContent));
    const fixed = resolvePlaceholders(section.content || "", template.placeholders, values);
    const fixedHtml = fixed.text ? fixed.text.split("\n").map((line) => `<p class="thesis-fixed">${escapeHtml(line) || "&nbsp;"}</p>`).join("") : "";
    const specialPage = isSpecialPageSection(section);
    const layout = specialPage ? resolveSpecialPage(section.blocks, { definitions: template.placeholders, values, baseStyle: rules.body, language: template.language }) : null;
    if (layout) layout.blocks = resolveLayoutNodes(layout.blocks, section.id, thesis.layout, rules.body);
    // tocEntry: "headings" (default) lists the section's headings, "title" also its title, "none" nothing.
    const tocEntry = ["title", "none"].includes(section.tocEntry) ? section.tocEntry : "headings";
    // titleNumbering "continueH1": the title is the next numbered chapter ("6. KAYNAKLAR") in the text and the TOC.
    const sectionHeading = !showsSectionTitle(section) ? "" : section.titleNumbering === "continueH1" ? `<h1>${escapeHtml(section.title)}</h1>` : `<h1 data-unnumbered="true"${tocEntry === "title" ? ' data-thesis-toc="title"' : ""}>${escapeHtml(section.title)}</h1>`;
    const bibliographyHtml = section.type === "bibliography" && bibliographyItems.some((item) => String(item).trim())
      ? `<ul class="thesis-bibliography">${bibliographyItems.filter((item) => String(item).trim()).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "";
    const additions = !layout ? resolveLayoutNodes([], section.id, thesis.layout, rules.body) : [];
    const prefixHtml = layout ? specialPageHtml(layout.blocks) : `${sectionHeading}${fixedHtml}${specialPageHtml(additions)}`;
    const html = mode === "generated" ? "" : `${prefixHtml}${source || ""}${bibliographyHtml}`;
    sections.push({ id: section.id, type: section.type, title: section.title, group: section.group, ...(section.verticalAlign ? { verticalAlign: section.verticalAlign } : {}), status: section.status, required: section.status === "required", order: sections.length, mode, editable, pageBreakBefore: section.pageBreakBefore !== false, specialPage, standalone: specialPage ? section.standalone !== false : false, tocEntry, fixedContent: Boolean(section.content || section.blocks?.length), html, prefixHtml, suffixHtml: bibliographyHtml, editableHtml: source, layout: layout?.blocks || (additions.length ? additions : null), layoutBlocks: layout ? flattenSpecialPage(layout.blocks) : null, derivedLayout: layout && usesFields(section.blocks, Object.keys(derivedFields)) ? { blocks: section.blocks, definitions: template.placeholders, baseStyle: rules.body, language: template.language, sectionId: section.id, documentLayout: thesis.layout } : null, missingPlaceholders: [...new Set([...fixed.missing, ...(layout?.missing || [])])], rules });
  }
  // footnotes.numbering "document": references count on through the sections (default: each body restarts at 1).
  let footnoteCount = 0;
  for (const section of sections) {
    if (section.rules.footnotes.numbering !== "document") continue;
    section.footnoteOffset = footnoteCount;
    footnoteCount += countFootnoteRefs(section.html);
  }
  for (const section of sections) {
    const definition = template.sections.find((item) => item.id === section.id);
    section.generatedIndex = section.mode === "generated" ? generatedIndexRule(definition, template.toc, section.rules.body) : null;
    if (section.mode === "generated" && !section.generatedIndex) section.html = `<h1 data-unnumbered="true">${escapeHtml(section.title)}</h1><ol class="thesis-toc"></ol>`;
  }
  let indexSources = collectIndexSources(sections, extractThesisHeadings);
  // Count conditions (visibleWhen { count, gte }) read the collected captions; a section left out also leaves the sources.
  const kept = sections.filter((section) => thesisSectionCountMet(template.sections.find((item) => item.id === section.id), indexSources));
  if (kept.length !== sections.length) {
    sections.splice(0, sections.length, ...kept);
    sections.forEach((section, index) => { section.order = index; });
    indexSources = collectIndexSources(sections, extractThesisHeadings);
  }
  for (const section of sections) section.indexSources = indexSources.filter((entry) => entry.sectionId === section.id);
  return resolveGeneratedIndexes({ templateId: template.id, templateVersion: template.templateVersion, schemaVersion: template.schemaVersion, documentLayout: thesis.layout, status: template.status, language: template.language, systemFonts: template.status === "official" ? templateFontFamilies(template) : [], title, values, derivedFields, headings: indexSources.filter((entry) => entry.kind === "toc" && !entry.unnumbered), indexSources, sections, source: template.source, validation: validateThesisContent(template, thesis, values) });
}

/** Probes of every text style in the document whose lines use Word baseline placement. */
export function thesisWordBaselineProbes(documentModel) {
  const probes = new Map();
  for (const section of documentModel.sections || []) {
    const spacing = section.rules.lineSpacing;
    for (const style of sectionTextStyles(section)) {
      const probe = wordBaselineProbe(style, spacing, effectiveLineHeight(style?.lineHeight, spacing));
      if (probe) probes.set(probe.id, probe);
    }
  }
  return [...probes.values()];
}

export function buildThesisCss(documentModel) {
  const inlineFormats = [
    ".thesis-body .fmt-size-heading{font-size:28px;line-height:1.35}.thesis-body .fmt-size-subheading{font-size:20px;line-height:1.45}.thesis-body .fmt-size-body{font-size:15px;line-height:2}",
    ".thesis-body .fmt-color-black{color:#000000}.thesis-body .fmt-color-red{color:#be123c}.thesis-body .fmt-color-blue{color:#0369a1}.thesis-body .fmt-color-green{color:#047857}",
    ".thesis-body .fmt-highlight-yellow{background-color:#fff2a8}.thesis-body .fmt-highlight-green{background-color:#c9f2d0}.thesis-body .fmt-highlight-cyan{background-color:#bdefff}.thesis-body .fmt-highlight-magenta{background-color:#f5c8ee}",
    ...[8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24].map((pt) => `.thesis-body .fmt-pt-${pt}{font-size:${pt}pt}`),
    ...Array.from({ length: 8 }, (_, index) => `.thesis-body [data-txt-indent="${index + 1}"]{margin-left:${(index + 1) * 5}mm}`),
  ].join("\n");
  return `.thesis-paper *{box-sizing:border-box}.thesis-page-stack{position:relative}.thesis-sheet{position:absolute;left:0;background:#fff;box-shadow:0 8px 28px rgba(0,0,0,.13);overflow:hidden;pointer-events:none}.thesis-footnote-layer{position:absolute;inset:0;pointer-events:none}.thesis-toc{list-style:none;padding:0}.thesis-toc li{margin-bottom:4pt}.thesis-toc-level-2{padding-left:10mm}.thesis-toc-level-3{padding-left:20mm}.thesis-paper .academic-page-gap{display:block;width:100%;margin:0;padding:0;border:0;pointer-events:none;user-select:none}.thesis-flow-section[data-thesis-fixed-content="true"] .rich-text-body[data-empty="true"]:before{content:none}.thesis-layout-strong{font-weight:700}\n${inlineFormats}\n${documentModel.sections.map(thesisSectionCss).join("\n")}\n${groupThesisSections(documentModel.sections).map(thesisFootnoteCss).join("\n")}`;
}

export function buildThesisPrintHtml(documentModel, { nonce = "" } = {}) {
  const groups = groupThesisSections(documentModel.sections).filter(thesisGroupHasPageContent);
  const pages = groups.map((group) => `<section class="thesis-paper" data-thesis-section="${escapeHtml(group.id)}">${group.sections.map((section) => `<section class="thesis-flow-section" data-thesis-flow-section="${escapeHtml(section.id)}"><div class="thesis-body">${withoutInlineStyleAttributes(thesisPresentationHtml(section, documentModel.language))}</div></section>`).join("")}</section>`).join("");
  const pageRules = groups.map((group) => `@page thesis_${group.id}{size:${group.rules.page.widthMm}mm ${group.rules.page.heightMm}mm;margin:0}.thesis-paper[data-thesis-section="${group.id}"]{page:thesis_${group.id}}`).join("");
  const css = `${buildThesisCss(documentModel)}${customFormatCss(pages, ".thesis-body")}${pageRules}body{margin:0;background:#fff}.thesis-paper{background:#fff}@media print{.thesis-paper{break-before:page;box-shadow:none}.thesis-paper:first-child{break-before:auto}}`.replace(/<\/style/gi, "<\\/style");
  return `<!doctype html><html lang="${escapeHtml(documentModel.language || "tr")}"><head><meta charset="utf-8"><title>${escapeHtml(documentModel.title)}</title><style${styleNonceAttribute(nonce)}>${css}</style></head><body>${pages}</body></html>`;
}
