import { manualTocEntries } from "./manualToc.js";
import { chapterNumberSequence, extractThesisHeadings, formatNumber, groupThesisSections, transformThesisText } from "./engine.js";
import { flattenSpecialPage, resolveSpecialPage, specialPageHtml } from "./specialPages.js";
import { resolveLayoutNodes } from "./layoutDocument.js";
import { resolvePresentationHtml } from "./presentationLayout.js";
import { buildThesisPageModel, flowPagePitchPx, pageCountFromFlowHeight, pageMetrics, thesisGroupHasPageContent } from "./pageLayout.js";

const escape = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
import { plainThesisText, thesisSourceHtml } from "./sourceHtml.js";
import { blockDescriptors } from "./blockGap.js";
import { ENDNOTE_REF_SELECTOR, FOOTNOTE_REF_SELECTOR, renumberEndnoteRefs, renumberFootnoteRefs } from "./footnotes.js";
import { applyTransformExceptions, exceptionSet, wrapExceptionWords } from "./transformExceptions.js";
import { decorateTableSemantics, sourceFlowTableIds } from "./tableSemantics.js";
export { plainThesisText, thesisSourceHtml } from "./sourceHtml.js";
const text = plainThesisText;
export const INDEX_ITERATION_CAP = 6;

export function generatedIndexRule(section, toc, body) {
  const legacy = { tableOfContents: "toc", listOfFigures: "figures", listOfTables: "tables" }[section.type];
  const config = section.generatedIndex || {};
  const kind = config.kind || legacy;
  if (!kind) return null;
  return { kind, title: kind === "toc" ? toc.heading : section.title, levels: kind === "toc" ? toc.levels : undefined,
    maxDepth: Infinity, includePageNumbers: kind === "toc" ? toc.showPageNumbers : true, leader: "dots",
    pageNumberAlignment: "right", indentMm: 10, ...config, style: { ...body, firstLineIndentMm: 0, align: "left", ...config.style } };
}

/**
 * Caption number from a numbering format. Before the first numbered chapter (e.g. an
 * unnumbered introduction) there is no chapter number: the `{chapter}` part and its
 * separator are left out ("Şekil 1"), never a made-up "0.1".
 */
export function formatCaptionNumber(format, chapter, n) {
  const withChapter = chapter ? format.replace(/\{chapter\}/g, chapter) : format.replace(/\{chapter\}[^{}\p{L}\p{N}]*|[^{}\p{L}\p{N}]*\{chapter\}/gu, "");
  return withChapter.replace(/\{n\}/g, n);
}

/** Equation number: like a caption number, but brackets around `{chapter}` stay ("({chapter}.{n})" → "(1.1)", "(1)" before the first numbered chapter). */
export function formatEquationNumber(format, chapter, n) {
  return (chapter ? format.replace(/\{chapter\}/g, chapter) : format.replace(/\{chapter\}[.\-–:/·\s]*/g, "")).replace(/\{n\}/g, n);
}

/** Printed caption label, e.g. "Şekil 2.1." (default "{label} {number}.") or "Şekil 2.1" ("{label} {number}"). */
export function formatCaptionLabel(rule, number) {
  return String(rule.labelFormat || "{label} {number}.").replace(/\{label\}/g, rule.label).replace(/\{number\}/g, number);
}

/** Width (CSS px) of `text` in the computed font of `style` (canvas, the same measure the layout PDF uses). */
let widthContext = null;
export function textWidthPx(style, text) {
  widthContext ||= document.createElement("canvas").getContext("2d");
  widthContext.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  return widthContext.measureText(text).width;
}

/** Caption kind named by a figure's `data-caption-kind`, when the template defines it ("" otherwise). */
export const knownCaptionKind = (id, rules) => id && rules.captionKinds && Object.hasOwn(rules.captionKinds, id) ? id : "";
export const captionKindOf = (attrs, rules) => knownCaptionKind(String(attrs || "").match(/\bdata-caption-kind=["']([^"']*)["']/i)?.[1], rules);

/** Caption rule of a `figure`/`table` element, or of a template caption kind. */
export const captionRuleOf = (rules, tag, kind = "") => kind ? rules.captionKinds[kind] : rules[tag === "figure" ? "figures" : "tables"];

// Appendix index items are semantic title paragraphs: a bold leading "EK n." label, or a level-1–3
// heading with the same label. Ordinary prose mentioning an appendix is deliberately not indexed.
function appendixItems(html) {
  const items = [];
  for (const match of html.matchAll(/<(p|h[1-3])\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const [, tag, inner] = match;
    const leadingMarkup = inner.trim();
    const value = text(inner).replace(/\s+/g, " ").trim();
    if (!/^(?:EK|APPENDIX)\s+[^\s.:)]+[.):]?\s+\S/iu.test(value)) continue;
    if (!/^h[1-3]$/i.test(tag) && !/^<(?:b|strong)\b/i.test(leadingMarkup)) continue;
    items.push({ text: value, offset: match.index });
  }
  return items;
}
function isAppendixItemNode(node) {
  const value = text(node.innerHTML).replace(/\s+/g, " ").trim();
  return /^(?:EK|APPENDIX)\s+[^\s.:)]+[.):]?\s+\S/iu.test(value)
    && (/^H[1-3]$/.test(node.tagName) || /^<(?:b|strong)\b/i.test(node.innerHTML.trim()));
}

// ---- Persistent target identities -------------------------------------------------------------
// A cross-reference, bookmark or index row must keep pointing at the same heading / caption / appendix
// title when sections move, a table before it is deleted or an appendix is added. Positions ("source-3")
// cannot do that, so a target is named by the identity its element already carries: an explicit
// `data-target-id`, the academic id, or the content-model node id (`data-txt-node-id`, stable through edits).
// Elements without any of them keep the positional fallback anchor (older notes, plain HTML).
const TARGET_ID_ATTRS = ["data-target-id", "data-academic-id", "data-txt-node-id"];
/** Persistent identities named by an attribute string, strongest first. */
export function targetKeysOfAttrs(attrs) {
  const keys = [];
  for (const name of TARGET_ID_ATTRS) {
    const value = String(attrs || "").match(new RegExp(`(?:^|\\s)${name}=(?:"([^"]*)"|'([^']*)')`, "i"));
    const key = (value?.[1] ?? value?.[2] ?? "").trim();
    if (key && !keys.includes(key)) keys.push(key);
  }
  return keys;
}
/** The target elements of one section body, per category, in reading order (same matching as the source collector). */
function targetStreams(html) {
  const streams = { headings: [], captions: [], equations: [], appendices: [] };
  for (const match of html.matchAll(/<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>|<(figure|table)\b([^>]*)>([\s\S]*?)<\/\4>|<span\b([^>]*\bdata-eq-numbered=["']true["'][^>]*)>/gi)) {
    if (match[1]) streams.headings.push({ attrs: match[2], level: match[1], text: text(match[3]).replace(/\s+/g, " ").trim() });
    else if (match[7] !== undefined) streams.equations.push({ attrs: match[7] });
    else {
      const tag = match[4].toLowerCase(), captionTag = tag === "figure" ? "figcaption" : "caption";
      const caption = match[6].match(new RegExp(`<${captionTag}\\b[^>]*>([\\s\\S]*?)<\\/${captionTag}>`, "i"));
      streams.captions.push({ attrs: match[5], tag, text: caption ? text(caption[1]).replace(/\s+/g, " ").trim() : "" });
    }
  }
  for (const match of html.matchAll(/<(p|h[1-3])\b([^>]*)>([\s\S]*?)<\/\1>/gi)) {
    const value = text(match[3]).replace(/\s+/g, " ").trim();
    if (/^(?:EK|APPENDIX)\s+[^\s.:)]+[.):]?\s+\S/iu.test(value) && (/^h[1-3]$/i.test(match[1]) || /^<(?:b|strong)\b/i.test(match[3].trim()))) streams.appendices.push({ attrs: match[2], text: value });
  }
  return streams;
}
/**
 * Identity lists aligned to `base` (the compiled section HTML). Identities written on `base` itself win; the
 * stamped editor HTML (content-model node ids) supplies the rest when it is the same trailing run of elements
 * (the compiled HTML may start with a generated title). Anything that does not line up gets no identity.
 */
function alignedTargetKeys(base, stamped) {
  const own = targetStreams(base), other = stamped && stamped !== base ? targetStreams(stamped) : null;
  const result = {};
  for (const category of Object.keys(own)) {
    const list = own[category], keys = list.map((item) => targetKeysOfAttrs(item.attrs));
    const stampedList = other?.[category];
    if (stampedList?.length && stampedList.length <= list.length) {
      const offset = list.length - stampedList.length;
      const same = stampedList.every((item, i) => (item.text ?? "") === (list[offset + i].text ?? "") && (item.level ?? item.tag ?? "") === (list[offset + i].level ?? list[offset + i].tag ?? ""));
      if (same) stampedList.forEach((item, i) => { if (!keys[offset + i].length) keys[offset + i] = targetKeysOfAttrs(item.attrs); });
    }
    result[category] = keys;
  }
  return result;
}
/** Anchor named by a persistent identity (first one not taken yet), else null. */
function persistentAnchor(keys, taken) {
  const key = (keys || []).find((value) => !taken.has(value));
  if (key === undefined) return null;
  taken.add(key);
  // Keep the identity reversible: replacing every non-ASCII character with '_' aliases
  // unrelated targets (for example 'şekil' and 'ç ekil') after a section move.
  return `tgt-${encodeURIComponent(key)}`;
}

/** One ordered semantic source stream for headings and both caption kinds. */
export function collectIndexSources(sections, extractHeadings) {
  const sources = [];
  const headingCounters = [];
  let chapter = "";
  let chapterKey = 0;
  // Counters per caption kind: "figure", "table" and every template caption kind ("photo", ...).
  const global = {};
  let local = {};
  const takenKeys = new Set();
  for (const section of sections) {
    if (section.mode === "generated" || section.specialPage) {
      // Its title is the only source such a section has: an unnumbered level-1 TOC row.
      if (section.tocEntry === "title") sources.push({ kind: "toc", level: 1, title: section.generatedIndex?.title || section.title, label: "", unnumbered: true, tocTitle: true, counters: [...headingCounters], sectionId: section.id, anchor: `${section.id}-source-title`, chapterKey });
      continue;
    }
    const html = thesisSourceHtml(section.html);
    const outline = extractHeadings(html, section.rules, headingCounters);
    const identities = alignedTargetKeys(html, section.editorHtml ? thesisSourceHtml(section.editorHtml) : null);
    if (section.type === "appendices") {
      for (const [ordinal, item] of appendixItems(html).entries()) {
        const keys = identities.appendices[ordinal] || [];
        sources.push({ kind: "appendices", sectionId: section.id, title: item.text, label: "", anchor: persistentAnchor(keys, takenKeys) || `${section.id}-appendix-${ordinal + 1}`, ...(keys.length ? { targetKeys: keys } : {}), chapterKey });
      }
    }
    let headingIndex = 0;
    let ordinal = 0;
    let captionIndex = 0;
    let equationIndex = 0;
    for (const match of html.matchAll(/<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>|<(figure|table)\b([^>]*)>([\s\S]*?)<\/\4>|<span\b([^>]*\bdata-eq-numbered=["']true["'][^>]*)>/gi)) {
      if (match[1]) {
        const headingKeys = identities.headings[headingIndex] || [];
        const entry = outline[headingIndex++];
        if (!entry) continue;
        if (entry.level === 1 && !entry.unnumbered) { chapter = formatNumber(entry.counters[0], chapterNumberSequence(section.rules.headings[1]?.numbering?.sequence)); chapterKey += 1; local = {}; }
        const transform = entry.unnumbered ? "none" : section.rules.headings[entry.level]?.textTransform || "none";
        const exceptions = transform !== "none" ? section.rules.headings[entry.level]?.textTransformExceptions : undefined;
        sources.push({ ...entry, kind: "toc", sectionId: section.id, anchor: persistentAnchor(headingKeys, takenKeys) || `${section.id}-source-${ordinal}`, ...(headingKeys.length ? { targetKeys: headingKeys } : {}), chapterKey, ...(transform !== "none" ? { textTransform: transform, ...(exceptions?.length ? { textTransformExceptions: exceptions } : {}) } : {}), ...(section.tocEntry === "none" ? { tocHidden: true } : {}) });
        ordinal++;
      } else if (match[7] !== undefined) {
        const equationKeys = identities.equations[equationIndex++] || [];
        // Numbered display equation (opt-in: template.equations): its own counter, chapter or document wide.
        const rule = section.rules.equations;
        if (!rule || !/math-formula--block|data-display=["']block["']/i.test(match[7])) continue;
        global.equation = (global.equation || 0) + 1; local.equation = (local.equation || 0) + 1;
        const label = formatEquationNumber(rule.numbering.format, chapter, rule.numbering.scope === "chapter" ? local.equation : global.equation);
        sources.push({ kind: "equations", sectionId: section.id, anchor: persistentAnchor(equationKeys, takenKeys) || `${section.id}-equation-${global.equation}`, label, number: label, ...(equationKeys.length ? { targetKeys: equationKeys } : {}), chapterKey });
      } else {
        const tag = match[4].toLowerCase();
        const captionKeys = identities.captions[captionIndex++] || [];
        const captionTag = tag === "figure" ? "figcaption" : "caption";
        const inner = match[6].match(new RegExp(`<${captionTag}\\b[^>]*>([\\s\\S]*?)<\\/${captionTag}>`, "i"));
        if (!inner) continue;
        // Legacy plain prefixes are accepted; new notes store caption text alone.
        const title = text(inner[1]).replace(/^(Şekil|Tablo|Figure|Table)\s+\d+(?:\.\d+)*\.\s*/i, "");
        if (!title) continue;
        // A figure may name a template caption kind (data-caption-kind); an unknown kind is a plain figure.
        const custom = tag === "figure" ? captionKindOf(match[5], section.rules) : "";
        const kind = custom || tag;
        global[kind] = (global[kind] || 0) + 1; local[kind] = (local[kind] || 0) + 1;
        const rule = captionRuleOf(section.rules, tag, custom);
        const n = rule.numbering.scope === "chapter" ? local[kind] : global[kind];
        const number = formatCaptionNumber(rule.numbering.format, chapter, formatNumber(n, rule.numbering.sequence));
        const label = formatCaptionLabel(rule, number);
        sources.push({ kind: custom || (tag === "figure" ? "figures" : "tables"), ...(custom ? { captionKind: custom } : {}), sectionId: section.id, anchor: persistentAnchor(captionKeys, takenKeys) || `${section.id}-source-${ordinal}`, ...(captionKeys.length ? { targetKeys: captionKeys } : {}), title, label, number, chapterKey });
        ordinal++;
      }
    }
  }
  return sources;
}

/**
 * Cross-reference lookup: every persistent identity of a source (explicit target id, academic id, node id) -> its source.
 * A reference whose target was deleted resolves to nothing (the writer reports it instead of printing a stale label).
 */
export function indexTargetMap(sources) {
  const map = new Map();
  for (const entry of sources || []) for (const key of entry.targetKeys || []) if (!map.has(key)) map.set(key, entry);
  return map;
}

export function indexEntries(sources, rule, pages = {}, language = "tr") {
  return sources.filter((entry) => entry.kind === rule.kind && (rule.kind !== "toc" || (!entry.tocHidden && (!entry.unnumbered || entry.tocTitle) && entry.level <= rule.maxDepth && (!rule.levels || rule.levels.includes(entry.level)))))
    .map((entry) => {
      // matchHeadingTransform: a row reads like its rendered heading (e.g. an uppercase H1).
      const title = rule.matchHeadingTransform && entry.textTransform ? transformThesisText(entry.title, entry, language) : entry.title;
      return { ...entry, text: [entry.label, title].filter(Boolean).join(" "), rowTitle: title, page: pages[entry.anchor]?.indexLabel ?? pages[entry.anchor]?.label ?? "", pageResolved: Object.hasOwn(pages, entry.anchor) };
    });
}

/** Row style of a generated-index entry: `levelStyles.unnumbered` for unnumbered title rows, else `levelStyles[level]`. */
export const indexRowStyle = (rule, entry) => (entry.unnumbered && rule.levelStyles?.unnumbered) || rule.levelStyles?.[entry.level || 1];

/** Whether a Word TOC row has a real page label to show after pagination. */
export function indexRowIncludesPageNumber(rule, entry) {
  return Boolean(rule.includePageNumbers)
    && indexRowStyle(rule, entry)?.includePageNumber !== false
    // An unnumbered target with an explicitly resolved empty index label is not a
    // page-numbered row. Hidden-but-counted targets have a nonempty indexLabel.
    && !(entry.unnumbered && entry.pageResolved === true && entry.page === "");
}

/** Targets whose resolved page mapping must be present before a generated-index export. */
export function generatedIndexPageTargets(model) {
  return [...new Set((model.sections || []).flatMap((section) => {
    const rule = section.generatedIndex;
    if (!rule?.includePageNumbers || (rule.kind === "toc" && model.manualToc?.enabled)) return [];
    return indexEntries(model.indexSources || [], rule, {}, model.language)
      .filter((entry) => indexRowStyle(rule, entry)?.includePageNumber !== false)
      .map((entry) => entry.anchor)
      .filter(Boolean);
  }))];
}

export function missingGeneratedIndexPages(model, pages = {}) {
  return generatedIndexPageTargets(model).filter((target) => !Object.hasOwn(pages, target));
}

/** Row that carries the page heading under pageHeadingPlacement "row" (-1: the heading is its own block). */
export function pageHeadingRowIndex(entries, rule) {
  let headingRow = -1;
  if (!rule.includePageNumbers || !rule.pageHeading || rule.pageHeadingPlacement !== "row") return headingRow;
  for (let index = 0; index < entries.length && entries[index].unnumbered && indexRowStyle(rule, entries[index])?.includePageNumber === false; index += 1) headingRow = index;
  return headingRow;
}

export function generatedIndexHtml(entries, rule) {
  // pageHeadingPlacement "row": the "Sayfa" heading sits in the page column of the last leading unnumbered row without a page
  // number (e.g. "İÇİNDEKİLER ... Sayfa" in a contents list that opens with ÖNSÖZ / İÇİNDEKİLER); without such a row it stays a block.
  const headingRow = pageHeadingRowIndex(entries, rule);
  const pageHeading = headingRow < 0 && rule.includePageNumbers && rule.pageHeading ? `<div class="thesis-index-page-heading">${escape(rule.pageHeading)}</div>` : "";
  // Label ("Şekil 2.1", "1.2") and title are separate spans so a template can style the label and hang
  // wrapped lines under the title; without those rules they read exactly as one text.
  const inline = rule.leaderFlow === "inline";
  const rowText = (entry, tail = "") => entry.label && entry.rowTitle !== undefined
    ? inline && rule.hanging > 0
      ? `<span class="thesis-index-title"><span class="thesis-index-label">${escape(entry.label)}</span> ${escape(entry.rowTitle)}${tail}</span>`
      : `<span class="thesis-index-label">${escape(entry.label)}</span> <span class="thesis-index-title">${escape(entry.rowTitle)}${tail}</span>`
    : inline ? `<span class="thesis-index-title">${escape(entry.text)}${tail}</span>` : escape(entry.text);
  // A level may list its rows without page numbers (e.g. centred chapter rows): levelStyles[level].includePageNumber === false.
  // levelStyles.unnumbered styles the unnumbered title rows (ÖZET, GİRİŞ, KAYNAKÇA, …) of any level and wins over the level's own style.
  const withPage = (entry) => rule.includePageNumbers && indexRowStyle(rule, entry)?.includePageNumber !== false;
  const leader = (entry) => `<span class="thesis-index-leader">${rule.leader === "dots" ? ".".repeat(400) : ""}</span><span class="thesis-index-page">${escape(entry.page)}</span>`;
  // leaderFlow "inline": leader and page number sit inside the title box, on the last line of a wrapped entry (floats, see engine CSS).
  return `<h1 data-unnumbered="true">${escape(rule.title)}</h1>${pageHeading}<ol class="thesis-toc" data-thesis-generated="${escape(rule.kind)}">${entries.map((entry, index) => `<li data-index-level="${entry.level || 1}" data-index-target="${escape(entry.anchor)}"${entry.manualPage ? ` data-index-manual-page="${escape(entry.page)}" tabindex="0" role="link" aria-label="${escape(entry.text)}, sayfa ${escape(entry.page)}"` : ""}${entry.unnumbered && rule.levelStyles?.unnumbered ? ' data-index-unnumbered="true"' : ""}${entry.labelLine ? ' data-index-label-line="true"' : ""}${index === headingRow ? ' data-index-page-heading="true"' : ""}><span class="thesis-index-text">${rowText(entry, inline && withPage(entry) ? leader(entry) : "")}</span>${!inline && withPage(entry) ? leader(entry) : index === headingRow ? `<span class="thesis-index-leader"></span><span class="thesis-index-page" data-index-page-heading="true">${escape(rule.pageHeading)}</span>` : ""}</li>`).join("")}</ol>`;
}

/**
 * Values of derived placeholders from the current pagination: `counts` are the measured
 * physical pages per page group (renderedIndexPages), an unmeasured group counts as one.
 */
export function derivedThesisValues(model, counts = {}) {
  const fields = Object.entries(model.derivedFields || {});
  if (!fields.length) return {};
  const pageModel = buildThesisPageModel(groupThesisSections(model.sections), counts);
  const totalPages = pageModel.reduce((sum, group) => sum + group.pages.length, 0);
  // Main matter = from the first group whose numbering restarts in Arabic to the end (appendices included);
  // front matter = the pages before it, read by the label of its last numbered page ("ix").
  const mainIndex = pageModel.findIndex((group) => { const rule = model.sections.find((section) => section.id === group.groupId)?.rules.page.numbering; return rule?.restart && rule.format === "arabic"; });
  const before = mainIndex < 0 ? [] : pageModel.slice(0, mainIndex).flatMap((group) => group.pages);
  const derived = {
    totalPages: String(totalPages),
    frontLastLabel: [...before].reverse().find((page) => page.label)?.label || "",
    mainPageCount: mainIndex < 0 ? "" : String(pageModel.slice(mainIndex).reduce((sum, group) => sum + group.pages.length, 0)),
  };
  return Object.fromEntries(fields.map(([key, kind]) => [key, derived[kind] ?? ""]));
}

/** A special page that reads derived values, laid out again with them (same resolver, same paths). */
function withDerivedLayout(section, values) {
  const { blocks, definitions, baseStyle, language, sectionId, documentLayout } = section.derivedLayout;
  const layout = resolveSpecialPage(blocks, { definitions, values, baseStyle, language });
  layout.blocks = resolveLayoutNodes(layout.blocks, sectionId || section.id, documentLayout, baseStyle);
  const prefixHtml = specialPageHtml(layout.blocks);
  return { ...section, layout: layout.blocks, layoutBlocks: flattenSpecialPage(layout.blocks), prefixHtml, html: `${prefixHtml}${section.editableHtml || ""}${section.suffixHtml || ""}` };
}

/**
 * Generated indexes and derived values (e.g. the total page count) both come from the current
 * layout pass: `pages` are anchor pages, `counts` physical pages per group. Nothing is stored.
 */
export function resolveGeneratedIndexes(model, pages = {}, counts = {}) {
  const derived = derivedThesisValues(model, counts);
  const values = { ...model.values, ...derived };
  return { ...model, values, indexPages: pages, sections: model.sections.map((current) => {
    const section = current.derivedLayout ? withDerivedLayout(current, values) : current;
    if (!section.generatedIndex) return { ...section, documentLayout: model.documentLayout };
    const manual = section.generatedIndex.kind === "toc" && model.manualToc?.enabled;
    const counters = [];
    const headingRules = model.sections.find(item => item.type === "mainContent")?.rules || section.rules;
    const indexRows = manual ? manualTocEntries(model.manualToc.rows).map(row => {
      if (row.literalTitle) return row;
      const heading = extractThesisHeadings(`<h${row.level}${row.unnumbered ? ' data-unnumbered="true"' : ''}>${escape(row.title)}</h${row.level}>`, headingRules, counters)[0];
      const title = section.generatedIndex.matchHeadingTransform ? transformThesisText(row.title, headingRules.headings[row.level] || {}, model.language) : row.title;
      return { ...row, label: heading.label, labelLine: heading.labelLine, rowTitle: title, text: [heading.label, title].filter(Boolean).join(" ") };
    }) : indexEntries(model.indexSources, section.generatedIndex, pages, model.language);
    const presentation = resolvePresentationHtml(generatedIndexHtml(indexRows, section.generatedIndex), section, model.documentLayout, "generated");
    return { ...section, documentLayout: model.documentLayout, indexRows, presentationElements: presentation.elements,
      html: presentation.html + specialPageHtml(section.layout || []) };
  }) };
}

/** Decorate existing source nodes without replacing an editor or its text. */
/** The caret pad below a block equation: the measured value when it is plausible (the next block is in the same column, at most a few lines
 *  away), else the line height of the flow (the pad is one anonymous line box). Pure so the stamping rule is testable. */
export function equationPadAfter(measured, lineHeight, most) {
  if (Number.isFinite(measured) && measured > 0.5 && measured < most) return measured;
  return Number.isFinite(lineHeight) && lineHeight > 0.5 && lineHeight < most ? lineHeight : 0;
}

const equationDataAttributes = ["data-thesis-eq", "data-thesis-eq-side", "data-thesis-eq-pad-before", "data-thesis-eq-pad-after", "data-thesis-eq-lift", "data-thesis-eq-drop", "data-thesis-eq-base", "data-thesis-eq-fit", "data-thesis-eq-shift", "data-thesis-ieq-pad-before", "data-thesis-ieq-pad-after", "data-thesis-ieq-lift", "data-thesis-ieq-drop", "data-thesis-ieq-fit", "data-thesis-ieq-shift"];
const roundLayout = (value) => Number.isFinite(value) ? Math.round(value * 1000) / 1000 : null;

/** Geometry and presentation state used by the paged PDF writer for every display equation. */
export function equationLayoutSignature(root) {
  if (!root?.querySelectorAll || !root?.ownerDocument?.defaultView) return "[]";
  const win = root.ownerDocument.defaultView, origin = root.getBoundingClientRect();
  const element = (node) => {
    if (!node) return null;
    const rect = node.getBoundingClientRect(), style = win.getComputedStyle(node);
    return {
      rect: [rect.left - origin.left, rect.top - origin.top, rect.right - origin.left, rect.bottom - origin.top].map(roundLayout),
      style: [style.marginTop, style.marginBottom, style.paddingTop, style.paddingBottom, style.lineHeight, style.fontSize, style.top],
    };
  };
  const equations = [...root.querySelectorAll(".thesis-body .math-formula--block")].map((node) => ({
    latex: node.getAttribute("data-latex"),
    attributes: equationDataAttributes.map((name) => node.getAttribute(name)),
    own: element(node), rendered: element(node.querySelector(".katex-html") || node.querySelector(".katex")),
    probe: element(node.querySelector("[data-thesis-eq-probe]")), previous: element(node.previousElementSibling), next: element(node.nextElementSibling),
  }));
  return JSON.stringify({ fonts: root.ownerDocument.fonts?.status || "unsupported", equations });
}

/** Wait for font metrics, remeasure equation presentation, and require stable equation geometry before a paged PDF export. */
export async function waitForStableEquationLayout(root, {
  prepare = () => {}, stableFrames = 3, maxFrames = 120, readSnapshot = equationLayoutSignature, nextFrame,
} = {}) {
  const doc = root?.ownerDocument, fonts = doc?.fonts;
  const frame = nextFrame || (() => new Promise((resolve, reject) => {
    const raf = doc?.defaultView?.requestAnimationFrame;
    if (!raf) { reject(new Error("Equation layout requires animation-frame support.")); return; }
    raf.call(doc.defaultView, resolve);
  }));
  const requiredStableFrames = Math.max(1, Math.trunc(stableFrames) || 1);
  const frameLimit = Math.max(requiredStableFrames + 1, Math.trunc(maxFrames) || 120);
  let readyPromise = null, fontsReady = !fonts, prepared = false, previous = null, sameFrames = 0;
  const watchFonts = () => {
    const latest = fonts?.ready || null;
    if (latest === readyPromise) return;
    readyPromise = latest;
    fontsReady = !fonts || !latest;
    prepared = false; previous = null; sameFrames = 0;
    if (latest) Promise.resolve(latest).then(() => {
      if (fonts?.ready === latest) fontsReady = true;
    }, () => {
      if (fonts?.ready === latest) fontsReady = true;
    });
  };
  if (fonts) watchFonts();
  for (let i = 0; i < frameLimit; i += 1) {
    await frame();
    if (fonts) {
      watchFonts();
      if (!fontsReady || fonts.status === "loading") { previous = null; sameFrames = 0; continue; }
    }
    if (!prepared) {
      await prepare(root);
      prepared = true; previous = null; sameFrames = 0;
      continue;
    }
    const current = readSnapshot(root);
    sameFrames = current === previous ? sameFrames + 1 : 0;
    previous = current;
    if (sameFrames >= requiredStableFrames) return current;
  }
  throw new Error(`Equation layout did not stabilize within ${frameLimit} animation frames; PDF export cancelled.`);
}

export function decorateThesisSources(root, model) {
  for (const section of model.sections) {
    if (section.generatedIndex || section.specialPage) {
      // A listed generated/special section is found by its whole flow section (its first line).
      const flow = root.querySelector(`[data-thesis-flow-section="${section.id}"]`);
      const title = model.indexSources.find((entry) => entry.sectionId === section.id && entry.tocTitle);
      if (flow && title) flow.setAttribute("data-thesis-anchor", title.anchor);
      else flow?.removeAttribute("data-thesis-anchor");
      continue;
    }
    const host = root.querySelector(`[data-thesis-flow-section="${section.id}"] .thesis-body`);
    if (!host) continue;
    decorateTableSemantics(host, section.rules.tables, { flowTableIds: sourceFlowTableIds(model.nativeDocument) });
    // Footnote numbers are derived here, never trusted from stored markup: 1, 2, 3 in reading order of this body,
    // continuing after the sections before it in document numbering (footnoteOffset).
    host.querySelectorAll(FOOTNOTE_REF_SELECTOR).forEach((node, i) => {
      const number = String((section.footnoteOffset || 0) + i + 1);
      if (node.getAttribute("data-fn-index") !== number) node.setAttribute("data-fn-index", number);
      if (node.textContent !== number) node.textContent = number;
    });
    host.querySelectorAll(ENDNOTE_REF_SELECTOR).forEach((node, i) => {
      const number = String((section.endnoteOffset || 0) + i + 1);
      if (node.getAttribute("data-fn-index") !== number) node.setAttribute("data-fn-index", number);
      if (node.textContent !== number) node.textContent = number;
    });
    const entries = model.indexSources.filter((entry) => entry.sectionId === section.id && entry.kind !== "equations" && entry.kind !== "appendices");
    const equations = model.indexSources.filter((entry) => entry.sectionId === section.id && entry.kind === "equations");
    host.querySelectorAll("[data-thesis-eq]").forEach((node) => { node.removeAttribute("data-thesis-eq"); node.removeAttribute("data-thesis-eq-side"); });
    host.querySelectorAll('.math-formula--block[data-eq-numbered="true"], .math-formula[data-display="block"][data-eq-numbered="true"]').forEach((node, i) => {
      if (!equations[i]) return;
      node.setAttribute("data-thesis-eq", equations[i].label);
      node.setAttribute("data-thesis-eq-side", section.rules.equations.numberAlign === "left" ? "left" : "right");
    });
    // Block equations (template opt-in: equations.style.lineHeight) are placed by the block-gap table plus what is measured here, all
    // presentation attributes (never stored): the editor's caret pads (ZWSP text next to the formula, a line box of their own) are cancelled,
    // a one-line formula is lifted/dropped onto the nominal line (baseline 0.9336 em below the top, as a Word paragraph), a taller one keeps
    // its own taller line box, and a formula wider than the text area is shrunk (not below 8 pt) so it never runs under its number.
    // Without an `equations` rule Word writes the formula as a plain body paragraph: the same measurement runs against an implied rule
    // (body style, no line-height opt-in needed) so the formula sits on the body line instead of inside the editor's boxed chrome.
    const eqRule = section.rules.equations || { style: {} };
    if (!section.rules.equations || eqRule.style?.lineHeight) {
      const eqDescriptors = blockDescriptors(section.rules.equations ? section.rules : { ...section.rules, equations: eqRule }).filter((d) => d.exit);
      const eqDesc = eqDescriptors.find((d) => d.kind === "eq");
      const nominal = { ascent: eqDesc.nominal.ascentPt * 96 / 72, below: eqDesc.nominal.belowPt * 96 / 72 };
      for (const node of host.querySelectorAll(".math-formula--block")) {
        for (const name of ["pad-before", "pad-after", "lift", "drop", "base", "fit", "shift"]) { node.removeAttribute(`data-thesis-eq-${name}`); node.removeAttribute(`data-thesis-ieq-${name}`); }
        const html = node.querySelector(".katex-html"), base = html?.querySelector(".base, .katex-base");
        let probe = html?.querySelector("[data-thesis-eq-probe]");
        if (base && !probe) { probe = node.ownerDocument.createElement("span"); probe.setAttribute("data-thesis-eq-probe", ""); probe.style.cssText = "display:inline-block;width:0;height:0"; base.insertBefore(probe, base.firstChild); }
      }
      // Paragraphs are painted with a relative offset (Word baseline placement): their client rect moved, their layout box did not.
      const layoutEdge = (element, edge) => element.getBoundingClientRect()[edge] - (parseFloat(getComputedStyle(element).top) || 0) * (new DOMMatrixReadOnly(getComputedStyle(element.closest(".thesis-page-stack") || element).transform).a || 1);
      // The margin a block leaves below itself as the block-gap table models it (a figure caption's margin collapses through the figure, so the figure's own computed margin says 0).
      const spaceAfterPx = (element) => { const kind = [...eqDescriptors].reverse().find((d) => d.kind !== "eq" && element.matches(d.selector)); return kind ? kind.exit.cssAfter * 96 / 72 : parseFloat(getComputedStyle(element).marginBottom); };
      const measured = [...host.querySelectorAll(".math-formula--block")].map((node) => {
        const scale = new DOMMatrixReadOnly(getComputedStyle(node.closest(".thesis-page-stack") || node).transform).a || 1;
        const box = node.getBoundingClientRect(), own = getComputedStyle(node), probe = node.querySelector("[data-thesis-eq-probe]"), html = node.querySelector(".katex-html");
        const isPad = (sibling) => sibling?.nodeType === 3 && !sibling.data.replace(/[\u200B\s]/g, "");
        // A pad is at most a couple of lines: anything larger means the neighbour sits in the next column/page.
        const most = 3 * (parseFloat(own.lineHeight) || 30);
        const before = node.previousElementSibling, after = node.nextElementSibling;
        const padBefore = before && isPad(node.previousSibling) && before.compareDocumentPosition(node.previousSibling) & Node.DOCUMENT_POSITION_FOLLOWING
          ? (box.top - layoutEdge(before, "bottom")) / scale - spaceAfterPx(before) - parseFloat(own.marginTop) : 0;
        // First thing in a column (page top after a page break): the pad is what lies between the column top and the block.
        const flow = node.closest(".thesis-page-flow");
        let padFirst = 0;
        if (flow && isPad(node.previousSibling)) {
          const pitch = flowPagePitchPx(pageMetrics(section.rules.page)), end = (box.top - parseFloat(own.marginTop) * scale - flow.getBoundingClientRect().top) / scale;
          padFirst = end - Math.floor(end / pitch) * pitch;
        }
        // The caret pad after the formula is a line box of the flow's own line height. Measuring it needs the next block in the same
        // column; when the (attribute-free) layout puts that block in the next column or page the measurement is meaningless, so the
        // pad falls back to the line height it is by construction. Never leave it unset: that made the gap after depend on the position.
        const padAfter = isPad(node.nextSibling)
          ? equationPadAfter(after ? (layoutEdge(after, "top") - box.bottom) / scale - parseFloat(own.marginBottom) - parseFloat(getComputedStyle(after).marginTop) : null,
            parseFloat(getComputedStyle(node.parentElement).lineHeight), most) : 0;
        // Formula width against the room inside the number gutters (the formula wraps at its break points first; only a
        // formula with an unbreakable run wider than the room is shrunk).
        const width = html ? html.scrollWidth : 0, room = html ? html.clientWidth : 0;
        const label = node.getAttribute("data-thesis-eq");
        return { node, scale, most, space: { top: parseFloat(own.marginTop) || 0, bottom: parseFloat(own.marginBottom) || 0, before: before ? parseFloat(getComputedStyle(before).marginBottom) || 0 : 0, after: after ? parseFloat(getComputedStyle(after).marginTop) || 0 : 0 }, padBefore: isPad(node.previousSibling) ? equationPadAfter(padBefore > 0.5 && padBefore < most ? padBefore : padFirst, parseFloat(getComputedStyle(node.parentElement).lineHeight), most) : 0, padAfter, width, room, above: probe ? (probe.getBoundingClientRect().bottom - box.top) / scale : null, below: probe ? (box.bottom - probe.getBoundingClientRect().bottom) / scale : null };
      });
      for (const m of measured) {
        const put = (name, value) => m.node.setAttribute(`data-thesis-${section.rules.equations ? "eq" : "ieq"}-${name}`, String(Math.round(value * 1000) / 1000));
        // Implied rule: CSS margins collapse around the editor's pad line boxes only through the pad, so the block's own space before/after
        // (a Word paragraph's, collapsing with the neighbour's) is what remains after the pad is cancelled: gap = max(own, neighbour).
        const implied = !section.rules.equations;
        const padBefore = implied ? m.padBefore - Math.max(0, m.space.top - m.space.before) : m.padBefore;
        const padAfter = implied ? m.padAfter - Math.max(0, m.space.bottom - m.space.after) : m.padAfter;
        if (padBefore > 0.5 && padBefore < m.most) put("pad-before", padBefore);
        if (padAfter > 0.5 && padAfter < m.most) put("pad-after", padAfter);
        const room = m.room;
        const fit = m.width > room + 1 && room > 0 ? Math.max(room / m.width, 8 / (eqRule.style.fontSizePt || section.rules.body.fontSizePt || 12)) : 1;
        if (fit < 0.995) put("fit", Math.floor(fit * 100) / 100);
        if (m.above !== null) {
          const scaled = fit < 0.995 ? Math.floor(fit * 100) / 100 : 1;
          const above = m.above * scaled, below = m.below * scaled;
          // Implied rule (no template `equations`): a formula that fits the body line is painted onto it (shifted, never grown) so the block
          // is exactly one body line like Word's paragraph; KaTeX's superscript/strut metrics are taller than Cambria Math's line fit.
          const fits = !section.rules.equations && above + below <= nominal.ascent + nominal.below + 0.01;
          if (fits) {
            put("shift", above - nominal.ascent); put("lift", 0); put("drop", nominal.ascent + nominal.below - above - below); put("base", nominal.ascent);
          } else { put("lift", Math.max(0, nominal.ascent - above)); put("drop", Math.max(0, nominal.below - below)); put("base", Math.max(above, nominal.ascent)); }
        }
      }

    }
    let index = 0;
    host.querySelectorAll("[data-thesis-anchor]").forEach((node) => { node.removeAttribute("data-thesis-anchor"); node.removeAttribute("data-thesis-number"); });
    // Appendix title paragraphs carry their own attribute: an appendix heading (h1–h3) also keeps its TOC anchor.
    host.querySelectorAll("[data-thesis-appendix-anchor]").forEach((node) => node.removeAttribute("data-thesis-appendix-anchor"));
    const appendixEntries = model.indexSources.filter((entry) => entry.sectionId === section.id && entry.kind === "appendices");
    const appendixNodes = [...host.querySelectorAll("p,h1,h2,h3")].filter(isAppendixItemNode);
    appendixEntries.forEach((entry, i) => appendixNodes[i]?.setAttribute("data-thesis-appendix-anchor", entry.anchor));
    host.querySelectorAll("h1,h2,h3,h4,h5,h6,figcaption,caption").forEach((node) => {
      if (/caption$/i.test(node.tagName)) {
        node.removeAttribute("data-thesis-caption"); node.removeAttribute("data-thesis-caption-auto"); node.removeAttribute("data-thesis-caption-hang");
        node.querySelectorAll(".academic-caption-label").forEach((label) => label.remove());
        if (node.tagName === "FIGCAPTION") node.setAttribute("contenteditable", section.editable ? "true" : "false");
        if (section.editable && node.tagName === "FIGCAPTION" && !node.firstChild) node.appendChild(node.ownerDocument.createElement("br"));
        if (node.tagName === "FIGCAPTION") {
          const figure = node.parentElement;
          const rule = captionRuleOf(section.rules, "figure", knownCaptionKind(figure.getAttribute("data-caption-kind"), section.rules));
          if (rule.position === "above" && figure.firstElementChild !== node) figure.prepend(node);
          if (rule.position === "below" && figure.lastElementChild !== node) figure.append(node);
        }
      }
      if (/caption$/i.test(node.tagName) && !text(thesisSourceHtml(node.innerHTML))) return;
      const entry = entries[index++];
      if (!entry) return;
      node.setAttribute("data-thesis-anchor", entry.anchor);
      if (entry.kind === "toc") { if (entry.label) node.setAttribute("data-thesis-number", entry.label); }
      else {
        node.querySelectorAll(".academic-caption-label").forEach((label) => label.remove());
        node.setAttribute("data-thesis-caption", `${entry.label} `);
        const rule = entry.captionKind ? section.rules.captionKinds[entry.captionKind] : section.rules[entry.kind];
        // Hanging indent equal to the printed label ("Şekil 2.1 "): continuation lines start under the caption text.
        if (rule.hangingIndent === "label") node.setAttribute("data-thesis-caption-hang", String(Math.round(textWidthPx(getComputedStyle(node, "::before"), `${entry.label} `) * 1000) / 1000));
        else node.removeAttribute("data-thesis-caption-hang");
        if (rule.captionAlignment === "auto") {
          const range = node.ownerDocument.createRange(); range.selectNodeContents(node);
          const tops = new Set([...range.getClientRects()].filter((r) => r.width && r.height).map((r) => Math.round(r.top)));
          node.setAttribute("data-thesis-caption-auto", tops.size > 1 ? "justify" : "center");
        }
      }
    });
  }
  applyTransformExceptions(root, model);
}

/** Print/static HTML uses the same source labels; no independent counters. */
export function thesisPresentationHtml(section, language = "tr") {
  let heading = 0, caption = 0;
  const headings = (section.indexSources || []).filter((entry) => entry.kind === "toc");
  const captions = (section.indexSources || []).filter((entry) => entry.kind !== "toc" && entry.kind !== "equations");
  const equations = (section.indexSources || []).filter((entry) => entry.kind === "equations");
  let equation = 0;
  let html = renumberEndnoteRefs(renumberFootnoteRefs(thesisSourceHtml(section.html), section.footnoteOffset || 0), section.endnoteOffset || 0).replace(/<span\b([^>]*\bdata-eq-numbered=["']true["'][^>]*)>/gi, (tag, attrs) => {
    const entry = /math-formula--block|data-display=["']block["']/i.test(attrs) ? equations[equation++] : null;
    return entry ? `${tag.slice(0, -1)} data-thesis-eq="${escape(entry.label)}" data-thesis-eq-side="${section.rules.equations.numberAlign === "left" ? "left" : "right"}">` : tag;
  }).replace(/<h([1-6])\b([^>]*)>/gi, (tag, level, attrs) => {
    const entry = headings[heading++];
    return entry?.label ? `<h${level}${attrs} data-thesis-number="${escape(entry.label)}">` : tag;
  }).replace(/<(figcaption|caption)\b([^>]*)>([\s\S]*?)<\/\1>/gi, (tag, name, attrs, inner) => {
    if (!text(inner)) return tag;
    const entry = captions[caption++];
    return entry ? `<${name}${attrs} data-thesis-caption="${escape(entry.label)} ">${inner}</${name}>` : tag;
  });
  // Exception words of headings (textTransformExceptions) are wrapped so the print CSS keeps them lower-case.
  html = html.replace(/<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/gi, (whole, level, attrs, inner) => {
    const set = exceptionSet(section.rules.headings[level], language);
    return set ? `<h${level}${attrs}>${wrapExceptionWords(inner, set, language)}</h${level}>` : whole;
  });
  html = html.replace(/(<figure\b[^>]*>)([\s\S]*?)(<figcaption\b[^>]*>[\s\S]*?<\/figcaption>)([\s\S]*?)(<\/figure>)/gi, (whole, open, before, caption, after, close) => captionRuleOf(section.rules, "figure", captionKindOf(open, section.rules)).position === "above" ? `${open}${caption}${before}${after}${close}` : whole);
  return html;
}

/** Read the existing rendered flow. No estimated pages and no second pagination. */
export function renderedIndexPages(root, groups) {
  const counts = {};
  for (const group of groups) {
    const article = root.querySelector(`.thesis-paper[data-thesis-section="${group.id}"]`);
    const flow = article?.querySelector(".thesis-page-flow");
    counts[group.id] = !thesisGroupHasPageContent(group) ? 0 : flow && article.dataset.thesisLayout === "paged" ? pageCountFromFlowHeight(flow.offsetHeight, pageMetrics(group.rules.page)) : 1;
  }
  const pageModel = buildThesisPageModel(groups, counts);
  const result = {};
  groups.forEach((group, i) => {
    const article = root.querySelector(`.thesis-paper[data-thesis-section="${group.id}"]`);
    if (!article || article.dataset.thesisLayout !== "paged" || !pageModel[i].pages.length) return;
    const stack = article.parentElement;
    const zoom = new DOMMatrixReadOnly(getComputedStyle(stack).transform).a || 1;
    const origin = stack.getBoundingClientRect().top;
    const stride = pageMetrics(group.rules.page).stridePx;
    article.querySelectorAll("[data-thesis-anchor],[data-thesis-appendix-anchor]").forEach((node) => {
      const range = node.ownerDocument.createRange(); range.selectNodeContents(node);
      const rect = [...range.getClientRects()].find((r) => r.width && r.height) || node.getClientRects()[0];
      if (!rect) return;
      const index = Math.min(pageModel[i].pages.length - 1, Math.max(0, Math.floor(((rect.top - origin) / zoom + 0.5) / stride)));
      const page = pageModel[i].pages[index];
      const value = { label: page.label, indexLabel: page.indexLabel, physicalPage: page.physicalIndex + 1 };
      for (const anchor of [node.dataset.thesisAnchor, node.dataset.thesisAppendixAnchor]) if (anchor) result[anchor] = value;
    });
  });
  return { pages: result, counts };
}

/**
 * Confirm that a stable pagination candidate was committed by React and still matches the
 * measured flow on a later frame. Snapshot stability by itself is insufficient: generated
 * indexes can be stably blank while their page-map update is still queued.
 */
export async function confirmCommittedPagination({
  expectedState, expectedMeasurement, readCommittedState, readMeasurement, isCurrent = () => true,
  generation, nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve)),
}) {
  const canonical = (value) => Array.isArray(value) ? value.map(canonical)
    : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])])) : value;
  const same = (left, right) => JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
  await nextFrame();
  if (!isCurrent(generation) || !same(readCommittedState(), expectedState) || !same(readMeasurement(), expectedMeasurement)) return false;
  await nextFrame();
  return isCurrent(generation) && same(readCommittedState(), expectedState) && same(readMeasurement(), expectedMeasurement);
}
