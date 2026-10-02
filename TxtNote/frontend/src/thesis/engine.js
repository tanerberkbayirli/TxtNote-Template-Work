import { migrateThesisTemplate, validateThesisContent, validateThesisTemplate } from "./validation.js";
import { isThesisSectionActive, orderedThesisSections, thesisSectionContent, thesisSectionCountMet, thesisSectionMode } from "./document.js";
import { styleNonceAttribute, withoutInlineStyleAttributes } from "../lib/cspStyles.js";
import { flattenSpecialPage, isSpecialPageSection, resolveSpecialPage, specialPageCss, specialPageHtml } from "./specialPages.js";
import { collectIndexSources, generatedIndexRule, resolveGeneratedIndexes, thesisPresentationHtml } from "./generatedIndex.js";

import { plainThesisText, thesisSourceHtml } from "./sourceHtml.js";
import { countFootnoteRefs, resolveFootnoteRule } from "./footnotes.js";
import { thesisGroupHasPageContent } from "./pageLayout.js";
import { resolveLayoutNodes, resolveLayoutPage } from "./layoutDocument.js";
import { resolveLayoutTypography } from "./layoutProperties.js";
import { ACADEMIC_TABLE_CELL_PADDING_PT } from "../lib/academicDocument.js";
import { wordBaselineCss, wordBaselineProbe } from "./wordBaseline.js";
import { exceptionSet, isExceptionToken } from "./transformExceptions.js";
import { blockDescriptors, blockGapActive, gapBetween } from "./blockGap.js";

const tokenPattern = /\{\{([A-Z][A-Z0-9_]*)\}\}/g;
const escapeHtml = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const plainText = plainThesisText;
const round3 = (value) => Math.round(value * 1000) / 1000;
const cssFamily = (value) => JSON.stringify(String(value || "Times New Roman"));

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

/**
 * Drawn line pitch of a stored lineHeight. "multiplier" (default) is a CSS factor of the font
 * size. "word" is Word's "n lines": n × the font's single line (`singleLineEm`, e.g. Times New
 * Roman 1.15 em = 13.8 pt at 12 pt). The stored value keeps its meaning (1.5 = one and a half
 * lines), so DOCX still writes Word's own line spacing.
 */
export function effectiveLineHeight(lineHeight, spacing) {
  const factor = spacing?.mode === "word" ? spacing.singleLineEm : 1;
  return Math.round((lineHeight || 1.5) * factor * 10000) / 10000;
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
  return {
    page: {
      ...template.page,
      ...override.page,
      margins: { ...template.page.margins, ...override.page?.margins },
      numbering: { ...template.page.numbering, ...override.page?.numbering },
      header: { ...template.page.header, ...override.page?.header },
      footer: { ...template.page.footer, ...override.page?.footer },
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
  const { enabled, position, align, format } = page.numbering;
  return JSON.stringify({ widthMm: page.widthMm, heightMm: page.heightMm, orientation: page.orientation, margins: page.margins, header: page.header, footer: page.footer, numbering: { enabled, position, align, format } });
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

/** First-line indent and left padding; a hanging indent (mm) moves every line but the first right. */
export const indentMm = (style) => style.hangingIndentMm > 0
  ? { first: -style.hangingIndentMm, left: (style.leftIndentMm || 0) + style.hangingIndentMm }
  : { first: style.firstLineIndentMm || 0, left: style.leftIndentMm || 0 };

function serializeStyle(style, lineSpacing) {
  const indent = indentMm(style);
  return `font-family:${cssFamily(style.fontFamily)};font-size:${style.fontSizePt}pt;font-weight:${style.fontWeight || 400};font-style:${style.italic ? "italic" : "normal"};text-align:${style.align || "left"};line-height:${effectiveLineHeight(style.lineHeight, lineSpacing)};letter-spacing:${style.characterSpacingPt || 0}pt;text-decoration:${style.decoration || "none"};text-transform:${style.textTransform || "none"};margin-top:${style.spaceBeforePt || 0}pt;margin-bottom:${style.spaceAfterPt || 0}pt;text-indent:${indent.first}mm;padding-left:${indent.left}mm;padding-right:${style.rightIndentMm || 0}mm;${style.color ? `color:${style.color};` : ""}${style.tabStopMm > 0 ? `tab-size:${style.tabStopMm}mm;` : ""}`;
}

/** Typography of a caption label run (bold "Şekil 2.1"), when it differs from the caption text. */
const labelCss = (style = {}) => [style.fontWeight ? `font-weight:${style.fontWeight}` : "", style.italic !== undefined ? `font-style:${style.italic ? "italic" : "normal"}` : "", style.fontSizePt ? `font-size:${style.fontSizePt}pt` : "", style.fontFamily ? `font-family:${cssFamily(style.fontFamily)}` : "", style.decoration ? `text-decoration:${style.decoration}` : ""].filter(Boolean).map((rule) => `${rule};`).join("");

/** Text styles of a section that draw lines (for the opt-in Word baseline placement). */
function sectionTextStyles(section) {
  const { body, headings, tables, figures, bibliography, footnotes, captionKinds, paragraphStyles } = section.rules;
  const text = section.type === "bibliography" ? bibliography.style : body;
  const styles = [text, bibliography.style, tables.style, figures.style, ...Object.values(headings), ...Object.values(captionKinds || {}).map((rule) => rule.style), ...Object.values(paragraphStyles || {}).map((style) => ({ ...text, ...style }))];
  if (tables.cellStyle) styles.push({ ...text, ...tables.cellStyle });
  if (section.generatedIndex) styles.push(section.generatedIndex.style, { ...section.generatedIndex.style, ...section.generatedIndex.pageHeadingStyle });
  if (footnotes?.style) styles.push(footnotes.style);
  const visit = (nodes) => { for (const node of nodes || []) { if (node.type === "text") styles.push(node.style); visit(node.blocks); } };
  visit(section.layout);
  return styles;
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

export function thesisSectionCss(section) {
  const { page, body, headings, tables, figures, lineSpacing } = section.rules;
  const lh = (value) => effectiveLineHeight(value, lineSpacing);
  // Opt-in Word line placement: a paint-only offset per text style (see wordBaseline.js).
  const lift = (style) => wordBaselineCss(wordBaselineProbe(style, lineSpacing, lh(style?.lineHeight)));
  const styleCss = (style) => serializeStyle(style, lineSpacing);
  // A hanging indent belongs to the paragraphs (the `.thesis-body p` rule), never to the page/flow container around them.
  const containerCss = (style) => styleCss({ ...style, hangingIndentMm: 0 });
  const textCss = (style) => serializeStyle(style, lineSpacing) + lift(style);
  const id = section.id;
  const paperScope = `.thesis-paper[data-thesis-section="${id}"]`;
  const fragmentScope = `.thesis-flow-section[data-thesis-flow-section="${id}"]`;
  const scope = `:is(${paperScope},${fragmentScope})`;
  // What the user types in a bibliography section is bibliography entries (DOCX uses the same style).
  const text = section.type === "bibliography" ? section.rules.bibliography.style : body;
  // With template caption kinds the plain-figure caption rules must not leak into a kind's figures.
  const kindIds = Object.keys(section.rules.captionKinds || {});
  const plainFigure = kindIds.length ? `figure:not(:is(${kindIds.map((kind) => `[data-caption-kind="${kind}"]`).join(",")})) ` : "";
  const rules = [
    `${paperScope}{${containerCss(body)}box-sizing:border-box;position:relative;z-index:1;width:${page.widthMm}mm;min-height:${page.heightMm}mm;padding:${page.margins.topMm}mm ${page.margins.rightMm}mm ${page.margins.bottomMm}mm ${page.margins.leftMm}mm;margin:0;background:transparent;color:#000;text-indent:0;}`,
    `${fragmentScope}{${containerCss(body)}display:block;margin:0;text-indent:0;}`,
    // A special page anchored to the bottom margin fills its page and puts its content at the bottom.
    ...(section.verticalAlign === "bottom" ? [`${fragmentScope}{display:flex;flex-direction:column;justify-content:flex-end;min-height:${page.heightMm - page.margins.topMm - page.margins.bottomMm}mm}`] : []),
    // Legacy loose lines keep their geometry. New <p> blocks have real paragraph spacing.
    `${scope} .thesis-body{font-family:${cssFamily(text.fontFamily)};font-size:${text.fontSizePt}pt;line-height:${lh(text.lineHeight)};text-align:${text.align || "left"};margin:0;padding:0;text-indent:${text.firstLineIndentMm || 0}mm each-line;white-space:pre-wrap;overflow-wrap:break-word;}`,
    `${scope} .thesis-body :is(ul,ol,table,figure,pre,.academic-code,.academic-table-wrap,.math-formula){text-indent:0;}`,
    `${scope} .thesis-body .rich-text-body{font-family:${cssFamily(text.fontFamily)};font-size:${text.fontSizePt}pt;line-height:${lh(text.lineHeight)};text-align:${text.align || "left"};color:${text.color || "#000"};min-height:0;padding:0;margin:0;overflow:visible;}`,
    `${scope} .thesis-body p{margin:${text.spaceBeforePt || 0}pt 0 ${text.spaceAfterPt || 0}pt;text-indent:${indentMm(text).first}mm;${text.hangingIndentMm > 0 ? `padding-left:${indentMm(text).left}mm;` : ""}${text.tabStopMm > 0 ? `tab-size:${text.tabStopMm}mm;` : ""}${lift(text)}}`,
    ...(lift(text) ? [`${scope} .thesis-body :is(ul,ol):not(.thesis-bibliography,.thesis-toc)>li{${lift(text)}}`, `${scope} .thesis-body :is(li,td,th,figcaption,caption) p{top:0}`] : []),
    // Named paragraph styles (typography.paragraphStyles): <p data-thesis-style="id"> is the body paragraph with the style's keys on top.
    ...Object.entries(section.rules.paragraphStyles || {}).map(([id, style]) => `${scope} .thesis-body p[data-thesis-style="${id}"]{${textCss({ ...text, ...style })}${style.keepWithNext ? "break-after:avoid;" : ""}}`),
    // First paragraph after a heading (Word's separate "first body" style), e.g. without indent.
    ...(text.firstAfterHeading ? [`${scope} .thesis-body :is(h1,h2,h3,h4,h5,h6)+p{text-indent:${indentMm({ ...text, ...text.firstAfterHeading }).first}mm}`] : []),
    `${scope} .thesis-body img{max-width:100%;max-height:${page.heightMm - page.margins.topMm - page.margins.bottomMm}mm;height:auto;object-fit:contain;}`,
    `${scope} .thesis-body table{width:100%;border-collapse:collapse;}`,
    ...(tables.borders?.preset === "threeRule" || tables.borders?.preset === "none" ? [
      // Three-rule table: a rule above the table, below the header row and below the table; no verticals.
      // !important: the editor's own table stylesheet (index.css) sets cell borders/padding with it.
      `${scope} .thesis-body td,${scope} .thesis-body th{border:0 !important;padding:${tables.cellPadding || "0 1.9mm"} !important;}`,
      ...(tables.borders.preset === "threeRule" ? [
        // The rules sit on the first/last row cells: a border on the table box would also enclose an above-table caption.
        `${scope} .thesis-body table>thead:first-of-type>tr:first-child>*,${scope} .thesis-body table:not(:has(>thead))>tbody:first-of-type>tr:first-child>*{border-top:${tables.borders.widthPt || 0.5}pt solid #000 !important;}`,
        `${scope} .thesis-body table>:is(tbody,tfoot):last-child>tr:last-child>*{border-bottom:${tables.borders.widthPt || 0.5}pt solid #000 !important;}`,
        `${scope} .thesis-body thead tr:last-child>*{border-bottom:${tables.borders.widthPt || 0.5}pt solid #000 !important;}`,
      ] : []),
    ] : [`${scope} .thesis-body td,${scope} .thesis-body th{border:1px solid #888;padding:${ACADEMIC_TABLE_CELL_PADDING_PT.vertical}pt ${ACADEMIC_TABLE_CELL_PADDING_PT.horizontal}pt;}`]),
    `${scope} .thesis-body caption{caption-side:${tables.position === "above" ? "top" : "bottom"};${textCss(tables.style)}text-align:${tables.captionAlignment === "auto" ? "center" : tables.captionAlignment || tables.style.align || "left"};margin-top:${tables.spacingBeforePt ?? tables.style.spaceBeforePt ?? 0}pt;margin-bottom:${tables.spacingAfterPt ?? tables.style.spaceAfterPt ?? 0}pt;}`,
    // Captions are document text: the academic editor's muted figcaption colour does not apply.
    `${scope} .thesis-body ${plainFigure}figcaption{${textCss(figures.style)}color:#000;text-align:${figures.captionAlignment === "auto" ? "center" : figures.captionAlignment || figures.style.align || "left"};margin-top:${figures.spacingBeforePt ?? figures.style.spaceBeforePt ?? 0}pt;margin-bottom:${figures.spacingAfterPt ?? figures.style.spaceAfterPt ?? 0}pt;}`,
    `${scope} [data-thesis-caption]::before{content:attr(data-thesis-caption);}`,
    ...[["caption", tables], [`${plainFigure}figcaption`, figures]].flatMap(([tag, rule]) => [
      ...(rule.labelStyle ? [`${scope} .thesis-body ${tag}[data-thesis-caption]::before{${labelCss(rule.labelStyle)}}`] : []),
      // The label is an inline box exactly as wide as the hang: justification cannot stretch the gap after it, so the caption text starts where the continuation lines start.
      ...(rule.hangingIndent === "label" ? [`${scope} .thesis-body ${tag}[data-thesis-caption-hang]{padding-left:attr(data-thesis-caption-hang px, 0px);text-indent:calc(-1 * attr(data-thesis-caption-hang px, 0px))}`, `${scope} .thesis-body ${tag}[data-thesis-caption-hang]::before{display:inline-block;width:attr(data-thesis-caption-hang px, 0px);text-indent:0;white-space:nowrap}`]
        : rule.hangingIndent > 0 ? [`${scope} .thesis-body ${tag}[data-thesis-caption]{padding-left:${rule.hangingIndent}mm;text-indent:-${rule.hangingIndent}mm}`] : []),
    ]),
    // Figure box (opt-in `box`): image alignment and the figure's own outer spacing (the editor stylesheet's default margin is dropped).
    ...[[plainFigure ? plainFigure.trim() : "figure", figures], ...Object.entries(section.rules.captionKinds || {}).map(([kind, rule]) => [`figure[data-caption-kind="${kind}"]`, rule])].filter(([, rule]) => rule.box).flatMap(([sel, rule]) => [
      `${scope} .thesis-body ${sel}{margin:${rule.box.spaceBeforePt || 0}pt 0 ${rule.box.spaceAfterPt || 0}pt;}`,
      `${scope} .thesis-body ${sel} img{display:block;margin-left:${rule.box.align === "left" ? 0 : "auto"};margin-right:${rule.box.align === "right" ? 0 : "auto"};}`,
    ]),
    // Template caption kinds ("photo"): a figure marked data-caption-kind gets its own caption typography.
    ...Object.entries(section.rules.captionKinds || {}).flatMap(([kind, rule]) => {
      const sel = `${scope} .thesis-body figure[data-caption-kind="${kind}"] figcaption`;
      return [
        `${sel}{${textCss(rule.style)}color:#000;text-align:${rule.captionAlignment === "auto" ? "center" : rule.captionAlignment || rule.style.align || "left"};margin-top:${rule.spacingBeforePt ?? rule.style.spaceBeforePt ?? 0}pt;margin-bottom:${rule.spacingAfterPt ?? rule.style.spaceAfterPt ?? 0}pt;}`,
        ...(rule.labelStyle ? [`${sel}[data-thesis-caption]::before{${labelCss(rule.labelStyle)}}`] : []),
        ...(rule.hangingIndent === "label" ? [`${sel}[data-thesis-caption-hang]{padding-left:attr(data-thesis-caption-hang px, 0px);text-indent:calc(-1 * attr(data-thesis-caption-hang px, 0px))}`, `${sel}[data-thesis-caption-hang]::before{display:inline-block;width:attr(data-thesis-caption-hang px, 0px);text-indent:0;white-space:nowrap}`]
          : rule.hangingIndent > 0 ? [`${sel}[data-thesis-caption]{padding-left:${rule.hangingIndent}mm;text-indent:-${rule.hangingIndent}mm}`] : []),
      ];
    }),
    // Measured auto alignment must outrank the caption rules above (same scope + .thesis-body + element; the extra attribute beats a caption-kind selector).
    `${scope} .thesis-body :is(figcaption,caption)[data-thesis-caption-auto="center"][data-thesis-anchor]{text-align:center}${scope} .thesis-body :is(figcaption,caption)[data-thesis-caption-auto="justify"][data-thesis-anchor]{text-align:justify}`,
    `${scope} .thesis-bibliography{${textCss(section.rules.bibliography.style)}padding-left:${section.rules.bibliography.hangingIndentMm || 0}mm;}`,
    `${scope} .thesis-body [data-thesis-number]::before{content:attr(data-thesis-number) " ";}`,
    // Heading numbers printed on their own line above the title (numbering.placement "ownLine"): same style, same block.
    ...Object.entries(headings).filter(([, style]) => style.numbering?.placement === "ownLine").map(([level]) => `${scope} .thesis-body h${level}[data-thesis-number]::before{content:attr(data-thesis-number);display:block}`),
    `${scope} .thesis-fixed{white-space:pre-wrap;}`,
    `${scope} .thesis-layout-text{white-space:normal;overflow-wrap:break-word;}`,
    `${scope} .thesis-layout-spacer{display:block;max-width:100%;}`,
    // Block rules are keyed by index per section: scoped to the section's own fragment, never the shared page paper (a later static section of the same page would inherit this section's block heights/styles).
    ...specialPageCss(`:is(${fragmentScope})`, section.layout, textCss),
  ];
  // Continuation caption rows of split tables (tableContinuation.js): a caption cell like the table caption, then the repeated header.
  if (tables.continuation && tables.position === "above") {
    const row = `${scope} .thesis-body tr[data-thesis-cont="caption"]>td.thesis-cont-caption`;
    const align = tables.captionAlignment === "auto" ? "center" : tables.captionAlignment || tables.style.align || "left";
    rules.push(
      `${scope} .thesis-body tr[data-thesis-cont]{break-inside:avoid}`,
      `${scope} .thesis-body tr[data-thesis-cont="caption"]{break-before:column}`,
      `${row}{${textCss(tables.style)}border:0 !important;padding:0 0 ${tables.spacingAfterPt ?? tables.style.spaceAfterPt ?? 0}pt !important;text-align:${align};}`,
      `${row}[data-thesis-caption-auto="center"]{text-align:center}${row}[data-thesis-caption-auto="justify"]{text-align:justify}`,
      ...(tables.labelStyle ? [`${scope} .thesis-body .thesis-cont-label{${labelCss(tables.labelStyle)}}`] : []),
      ...(tables.hangingIndent === "label" ? [`${row}[data-thesis-caption-hang]{padding-left:attr(data-thesis-caption-hang px, 0px) !important;text-indent:calc(-1 * attr(data-thesis-caption-hang px, 0px))}`]
        : tables.hangingIndent > 0 ? [`${row}{padding-left:${tables.hangingIndent}mm !important;text-indent:-${tables.hangingIndent}mm}`] : []),
      ...(tables.borders?.preset === "threeRule" ? [`${scope} .thesis-body tr[data-thesis-cont-first]>*{border-top:${tables.borders.widthPt || 0.5}pt solid #000 !important}${scope} .thesis-body tr[data-thesis-cont-last]>*{border-bottom:${tables.borders.widthPt || 0.5}pt solid #000 !important}`] : []),
    );
  }
  // Equations (opt-in): blocks lose the editor chrome, the formula is centered, the number sits flush right/left of the block.
  if (section.rules.equations) {
    const eq = section.rules.equations;
    const block = `${scope} .thesis-body .math-formula--block`;
    rules.push(
      // style.lineHeight (opt-in) makes the block one paragraph-like line of the equation style; its vertical placement comes from the
      // block-gap table (blockGap.js) plus measured presentation attributes (see decorateThesisSources): caret pads cancelled
      // (pad-before/after), one-line formulas lifted/dropped onto the nominal line (lift/drop), wide formulas fitted (fit).
      `${block}{background:transparent;border:0;border-radius:0;margin:${eq.style?.lineHeight ? "0" : `${eq.style?.spaceBeforePt || 0}pt`} 0 ${eq.style?.lineHeight ? "0" : `${eq.style?.spaceAfterPt || 0}pt`};padding:0;text-align:center;${eq.style?.fontFamily ? `--thesis-pdf-equation-font:${cssFamily(eq.style.fontFamily)};font-family:${cssFamily(eq.style.fontFamily)};` : ""}${eq.style?.fontSizePt ? `font-size:${eq.style.fontSizePt}pt;` : ""}${eq.style?.lineHeight ? `line-height:${lh(eq.style.lineHeight)};` : ""}}`,
      ...(eq.style?.lineHeight ? [
        `${block}[data-thesis-eq-pad-before]{margin-top:calc(0pt - attr(data-thesis-eq-pad-before px, 0px))}${block}[data-thesis-eq-pad-after]{margin-bottom:calc(0pt - attr(data-thesis-eq-pad-after px, 0px))}`,
        `${block}{padding-top:attr(data-thesis-eq-lift px, 0px);padding-bottom:attr(data-thesis-eq-drop px, 0px)}`,
        `${block}[data-thesis-eq-fit] .katex{font-size:attr(data-thesis-eq-fit em, 1em)}`,
      ] : []),
      // With the line-grid opt-in the formula wraps at its break points inside gutters the width of the number, so it never runs under it.
      `${block} .math-formula__render{padding:${eq.style?.lineHeight ? "0 3.6em" : "0"}}`,
      ...(eq.style?.lineHeight ? [`${block} .katex{white-space:normal}`] : []),
      ...(eq.style?.lineHeight ? [`${block} .katex-display{margin:0}`] : []),
      // fontSizePt is the size of the formula itself (KaTeX scales its glyphs by 1.21 em by default).
      ...(eq.style?.fontSizePt ? [`${block} .katex{font-size:1em}`] : []),
      // The formula search / copy toolbar stays available on hover but takes no space in the page.
      `${block} .math-formula__toolbar{position:absolute;top:0;right:0;z-index:2;visibility:hidden}${block}:hover .math-formula__toolbar,${block}:focus-within .math-formula__toolbar{visibility:visible}`,
      `${block}[data-thesis-eq]::after{content:attr(data-thesis-eq);position:absolute;top:50%;transform:translateY(-50%);line-height:1;white-space:nowrap;text-indent:0;${eq.style?.fontFamily ? `font-family:${cssFamily(eq.style.fontFamily)},${cssFamily(body.fontFamily)};` : ""}${eq.style?.fontSizePt ? `font-size:${eq.style.fontSizePt}pt;` : ""}${eq.style?.fontWeight ? `font-weight:${eq.style.fontWeight};` : ""}${eq.style?.italic ? "font-style:italic;" : ""}}`,
      `${block}[data-thesis-eq-side="right"]::after{right:0}${block}[data-thesis-eq-side="left"]::after{left:0}`,
      // With a measured baseline the number sits on it (line-height 1 box: baseline 0.8375 em below its top for Times New Roman).
      ...(eq.style?.lineHeight ? [`${block}[data-thesis-eq][data-thesis-eq-base]::after{top:calc(attr(data-thesis-eq-base px, 0px) - 0.8375em);transform:none}`] : []),
    );
  }
  // Optional table body rule (e.g. single spacing, centered names/values); a cell's own alignment still wins.
  if (tables.cellStyle) {
    const cell = tables.cellStyle;
    rules.push(`${scope} .thesis-body :is(td,th){${cell.align ? `text-align:${cell.align};` : ""}${cell.lineHeight ? `line-height:${lh(cell.lineHeight)};` : ""}${cell.fontSizePt ? `font-size:${cell.fontSizePt}pt;` : ""}${cell.fontFamily ? `font-family:${cssFamily(cell.fontFamily)};` : ""}text-indent:0;${lift({ ...text, ...cell })}}`);
    rules.push(`${scope} .thesis-body :is(td,th) p{margin:0;text-indent:0;text-align:inherit;}`);
  }
  if (section.generatedIndex) {
    const index = section.generatedIndex;
    rules.push(`${scope} .thesis-toc{${textCss(index.style)}text-indent:0;list-style:none;padding:0;}`);
    rules.push(`${scope} .thesis-toc li{display:flex;align-items:baseline;break-inside:avoid;margin:0;}`);
    rules.push(`${scope} .thesis-index-text{min-width:0;white-space:normal}${scope} .thesis-index-leader{flex:1;min-width:4mm;overflow:hidden;white-space:nowrap}${scope} .thesis-index-page{flex:none;min-width:${index.pageColumnWidthMm > 0 ? `${index.pageColumnWidthMm}mm;width:${index.pageColumnWidthMm}mm` : "8mm"};text-align:${index.pageNumberAlignment};}`);
    if (index.pageHeading) rules.push(`${scope} .thesis-index-page-heading{${textCss({ ...index.style, ...index.pageHeadingStyle })}text-align:right;text-indent:0;margin:0;}`);
    for (const level of Object.keys(headings)) rules.push(`${scope} [data-index-level="${level}"]{padding-left:${(Number(level) - 1) * index.indentMm}mm;}`);
    // Optional: label typography, wrapped lines hanging under the entry title, per-level row styles.
    if (index.labelStyle) rules.push(`${scope} .thesis-index-label{${labelCss(index.labelStyle)}}`);
    if (index.hanging === "label") rules.push(`${scope} .thesis-index-text{display:flex;align-items:baseline;column-gap:0.25em}${scope} .thesis-index-text>.thesis-index-label{flex:none;white-space:nowrap}${scope} .thesis-index-text>.thesis-index-title{min-width:0}`);
    // hanging as a length: wrapped entry lines start that far right of the first line (Word "hanging"), independent of the label width.
    if (index.hanging > 0) rules.push(`${scope} .thesis-index-text{padding-left:${index.hanging}mm;text-indent:-${index.hanging}mm}`);
    // "unnumbered" (rows of unnumbered titles) is emitted last, so it overrides the level rule of the same specificity.
    for (const [level, style] of Object.entries(index.levelStyles || {}).sort(([a], [b]) => Number(a === "unnumbered") - Number(b === "unnumbered"))) {
      rules.push(`${scope} .thesis-toc li[${level === "unnumbered" ? "data-index-unnumbered" : `data-index-level="${level}"`}]{${labelCss(style)}${style.spaceBeforePt !== undefined ? `margin-top:${style.spaceBeforePt}pt;` : ""}${style.spaceAfterPt !== undefined ? `margin-bottom:${style.spaceAfterPt}pt;` : ""}${Number.isFinite(style.leftIndentMm) ? `padding-left:${style.leftIndentMm}mm;` : ""}${style.align ? `text-align:${style.align};` : ""}${style.includePageNumber === false ? "display:block;" : ""}}`);
    }
    // Extra space above the first unnumbered title row that follows numbered rows (back matter after the chapters).
    if (index.unnumberedAfterNumberedSpaceBeforePt > 0) rules.push(`${scope} .thesis-toc li:not([data-index-unnumbered]) + li[data-index-unnumbered]{margin-top:${index.unnumberedAfterNumberedSpaceBeforePt}pt;}`);
    // leaderFlow "inline": leader dots and page number are floats inside the title box, i.e. on the last line of a wrapped entry (Word's right tab with leader).
    if (index.leaderFlow === "inline") rules.push(
      `${scope} .thesis-toc li{display:block}`,
      `${scope} .thesis-index-text{display:flex;align-items:baseline;column-gap:0.25em}${scope} .thesis-index-text>.thesis-index-label{flex:none;white-space:nowrap}`,
      `${scope} .thesis-index-text>.thesis-index-title{flex:1 1 0;min-width:0;overflow:hidden;position:relative}`,
      // The leader is out of flow at its static position (the end of the last text line); the title box clips it and the page float covers its tail.
      `${scope} .thesis-index-title>.thesis-index-leader{position:absolute;flex:none;min-width:0;padding-left:0.25em;white-space:nowrap}`,
      `${scope} .thesis-index-title>.thesis-index-page{float:right;flex:none;min-width:0;background:#fff;padding-left:0.25em}`,
    );
    // Rows whose heading number is on its own line (numbering.placement "ownLine"): number line, then the title line.
    if (Object.values(headings).some((style) => style.numbering?.placement === "ownLine")) rules.push(`${scope} .thesis-toc li[data-index-label-line] .thesis-index-text{display:block}${scope} .thesis-toc li[data-index-label-line] .thesis-index-label{display:block}`);
  }
  // Opt-in Word paragraph spacing: the gap between two paragraphs/headings is after(prev) + before(next)
  // instead of CSS's collapsed max(). The next block's top margin carries the sum, so the collapse
  // yields exactly the sum; unforced page breaks still truncate it (Word drops space at a page top).
  if (lineSpacing?.paragraphSpacing === "additive") {
    const blocks = [["p", text], ...Object.entries(section.rules.paragraphStyles || {}).map(([id, style]) => [`p[data-thesis-style="${id}"]`, { ...text, ...style }]), ...Object.entries(headings).map(([level, style]) => [`h${level}`, style])];
    for (const [previous, before] of blocks) {
      for (const [next, after] of blocks) {
        // A heading that starts a page (pageBreakBefore) keeps only its own space-before: the previous block's space-after stays on the page before (a forced break does not truncate the margin).
        if (/^h\d$/.test(next) && after.pageBreakBefore) continue;
        rules.push(`${scope} .thesis-body ${previous}+${next}{margin-top:${Math.round(((before.spaceAfterPt || 0) + (after.spaceBeforePt || 0)) * 1000) / 1000}pt}`);
      }
    }
  }
  // lineSpacing.blockGap "paragraphPitch": the gap between ANY two block kinds comes from one table (blockGap.js), also used by the DOCX writer.
  if (blockGapActive(section.rules)) {
    const descriptors = blockDescriptors(section.rules, text, plainFigure ? plainFigure.trim() : "figure");
    const eqKind = descriptors.find((d) => d.kind === "eq");
    // Blocks own no editor margins of their own here: the table decides.
    rules.push(`${scope} .thesis-body .academic-table-wrap{margin:0}${scope} .thesis-body .academic-table-wrap table{margin-bottom:0}${scope} .thesis-body :is(ul,ol):not(.thesis-bibliography,.thesis-toc){margin-top:0;margin-bottom:0}`);
    for (const prev of descriptors) {
      for (const next of descriptors) {
        const gap = gapBetween(section.rules, prev, next);
        if (gap === null) continue;
        const pair = `${scope} .thesis-body ${prev.selector}+${next.selector}`;
        if (next.kind !== "eq") { rules.push(`${pair}{margin-top:${gap}pt}`); continue; }
        // Before an equation the caret pad (a line box between the two blocks) sits between the margins: subtract the previous
        // block's own space-after and the pad; after an equation the equation's own negative margin already cancels the pad.
        rules.push(`${pair}{margin-top:${gap}pt}`, `${pair}[data-thesis-eq-pad-before]{margin-top:calc(${round3(gap - prev.exit.cssAfter)}pt - attr(data-thesis-eq-pad-before px, 0px))}`);
        if (prev.kind === "eq") rules.push(`${pair}[data-thesis-eq-pad-before]{margin-top:${gap}pt}`);
      }
    }
    void eqKind;
  }
  // Exception words of an uppercase/capitalized heading (transformExceptions.js) stay lower-case.
  if (Object.values(headings).some((style) => exceptionSet(style))) rules.push(`${scope} .thesis-body span[data-thesis-lower]{text-transform:lowercase}`);
  for (const [level, style] of Object.entries(headings)) {
    rules.push(`${scope} .thesis-body h${level}{${textCss(style)}break-before:${style.pageBreakBefore ? "page" : "auto"};break-after:${style.keepWithNext ? "avoid" : "auto"};}`);
    rules.push(`${scope} .thesis-body h${level}[data-unnumbered]{break-before:auto;}`);
    if (style.pageBreakBefore && style.pageBreakUnlessAfterHeading) rules.push(`${scope} .thesis-body :is(h1,h2,h3,h4,h5,h6) + h${level}{break-before:auto;}`);
  }
  return rules.join("\n");
}

/** Page-bottom note area of one page group: drawn on its sheets, measured by a hidden twin. */
export function thesisFootnoteCss(group) {
  const { page, footnotes } = group.rules;
  if (!footnotes) return "";
  const { style, separator } = footnotes;
  const scope = `.thesis-footnote-area[data-thesis-footnote-group="${group.id}"]`;
  return [
    `${scope}{position:absolute;box-sizing:border-box;left:${page.margins.leftMm}mm;width:${page.widthMm - page.margins.leftMm - page.margins.rightMm}mm;margin:0;padding:${separator.enabled ? separator.spaceBeforePt : 0}pt 0 0;color:#000;font-family:${cssFamily(style.fontFamily)};font-size:${style.fontSizePt}pt;line-height:${effectiveLineHeight(style.lineHeight, group.rules.lineSpacing)};text-align:${style.align};white-space:normal;overflow-wrap:break-word;pointer-events:none}`,
    `${scope}[data-thesis-footnote-measure]{top:0;visibility:hidden}`,
    `${scope} .thesis-footnote-separator{display:block;width:${separator.widthPercent}%;height:0;margin:0 0 ${separator.spaceAfterPt}pt;border:0;border-top:${separator.thicknessPt}pt solid #111}`,
    `${scope} .thesis-footnote-list{list-style:none;margin:0;padding:0}`,
    `${scope} .thesis-footnote{margin:${style.spaceBeforePt}pt 0 ${style.spaceAfterPt}pt;padding:0 ${style.rightIndentMm}mm 0 ${style.leftIndentMm}mm;text-indent:${style.firstLineIndentMm}mm;font-weight:${style.fontWeight};font-style:${style.italic ? "italic" : "normal"};letter-spacing:${style.characterSpacingPt}pt;${wordBaselineCss(wordBaselineProbe(style, group.rules.lineSpacing, effectiveLineHeight(style.lineHeight, group.rules.lineSpacing)))}}`,
    `${scope} .thesis-footnote-label{position:relative;top:-.35em;font-size:.75em;line-height:0;vertical-align:baseline}`,
  ].join("\n");
}

export function buildThesisCss(documentModel) {
  return `.thesis-paper *{box-sizing:border-box}.thesis-page-stack{position:relative}.thesis-sheet{position:absolute;left:0;background:#fff;box-shadow:0 8px 28px rgba(0,0,0,.13);overflow:hidden;pointer-events:none}.thesis-footnote-layer{position:absolute;inset:0;pointer-events:none}.thesis-toc{list-style:none;padding:0}.thesis-toc li{margin-bottom:4pt}.thesis-toc-level-2{padding-left:10mm}.thesis-toc-level-3{padding-left:20mm}.thesis-paper .academic-page-gap{display:block;width:100%;margin:0;padding:0;border:0;pointer-events:none;user-select:none}.thesis-flow-section[data-thesis-fixed-content="true"] .rich-text-body[data-empty="true"]:before{content:none}.thesis-layout-strong{font-weight:700}\n${documentModel.sections.map(thesisSectionCss).join("\n")}\n${groupThesisSections(documentModel.sections).map(thesisFootnoteCss).join("\n")}`;
}

export function buildThesisPrintHtml(documentModel, { nonce = "" } = {}) {
  const groups = groupThesisSections(documentModel.sections).filter(thesisGroupHasPageContent);
  const pages = groups.map((group) => `<section class="thesis-paper" data-thesis-section="${escapeHtml(group.id)}">${group.sections.map((section) => `<section class="thesis-flow-section" data-thesis-flow-section="${escapeHtml(section.id)}"><div class="thesis-body">${withoutInlineStyleAttributes(thesisPresentationHtml(section, documentModel.language))}</div></section>`).join("")}</section>`).join("");
  const pageRules = groups.map((group) => `@page thesis_${group.id}{size:${group.rules.page.widthMm}mm ${group.rules.page.heightMm}mm;margin:0}.thesis-paper[data-thesis-section="${group.id}"]{page:thesis_${group.id}}`).join("");
  const css = `${buildThesisCss(documentModel)}${pageRules}body{margin:0;background:#fff}.thesis-paper{background:#fff}@media print{.thesis-paper{break-before:page;box-shadow:none}.thesis-paper:first-child{break-before:auto}}`.replace(/<\/style/gi, "<\\/style");
  return `<!doctype html><html lang="${escapeHtml(documentModel.language || "tr")}"><head><meta charset="utf-8"><title>${escapeHtml(documentModel.title)}</title><style${styleNonceAttribute(nonce)}>${css}</style></head><body>${pages}</body></html>`;
}
