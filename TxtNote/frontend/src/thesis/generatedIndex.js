import { chapterNumberSequence, formatNumber, groupThesisSections, transformThesisText } from "./engine.js";
import { flattenSpecialPage, resolveSpecialPage, specialPageHtml } from "./specialPages.js";
import { buildThesisPageModel, pageCountFromFlowHeight, pageMetrics, thesisGroupHasPageContent } from "./pageLayout.js";

const escape = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
import { plainThesisText, thesisSourceHtml } from "./sourceHtml.js";
import { FOOTNOTE_REF_SELECTOR, renumberFootnoteRefs } from "./footnotes.js";
import { applyTransformExceptions, exceptionSet, wrapExceptionWords } from "./transformExceptions.js";
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

/** One ordered semantic source stream for headings and both caption kinds. */
export function collectIndexSources(sections, extractHeadings) {
  const sources = [];
  const headingCounters = [];
  let chapter = "";
  let chapterKey = 0;
  // Counters per caption kind: "figure", "table" and every template caption kind ("photo", ...).
  const global = {};
  let local = {};
  for (const section of sections) {
    if (section.mode === "generated" || section.specialPage) {
      // Its title is the only source such a section has: an unnumbered level-1 TOC row.
      if (section.tocEntry === "title") sources.push({ kind: "toc", level: 1, title: section.generatedIndex?.title || section.title, label: "", unnumbered: true, tocTitle: true, counters: [...headingCounters], sectionId: section.id, anchor: `${section.id}-source-title`, chapterKey });
      continue;
    }
    const html = thesisSourceHtml(section.html);
    const outline = extractHeadings(html, section.rules, headingCounters);
    let headingIndex = 0;
    let ordinal = 0;
    for (const match of html.matchAll(/<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>|<(figure|table)\b([^>]*)>([\s\S]*?)<\/\4>|<span\b([^>]*\bdata-eq-numbered=["']true["'][^>]*)>/gi)) {
      if (match[1]) {
        const entry = outline[headingIndex++];
        if (!entry) continue;
        if (entry.level === 1 && !entry.unnumbered) { chapter = formatNumber(entry.counters[0], chapterNumberSequence(section.rules.headings[1]?.numbering?.sequence)); chapterKey += 1; local = {}; }
        const transform = entry.unnumbered ? "none" : section.rules.headings[entry.level]?.textTransform || "none";
        const exceptions = transform !== "none" ? section.rules.headings[entry.level]?.textTransformExceptions : undefined;
        sources.push({ ...entry, kind: "toc", sectionId: section.id, anchor: `${section.id}-source-${ordinal++}`, chapterKey, ...(transform !== "none" ? { textTransform: transform, ...(exceptions?.length ? { textTransformExceptions: exceptions } : {}) } : {}), ...(section.tocEntry === "none" ? { tocHidden: true } : {}) });
      } else if (match[7] !== undefined) {
        // Numbered display equation (opt-in: template.equations): its own counter, chapter or document wide.
        const rule = section.rules.equations;
        if (!rule || !/math-formula--block|data-display=["']block["']/i.test(match[7])) continue;
        global.equation = (global.equation || 0) + 1; local.equation = (local.equation || 0) + 1;
        const label = formatEquationNumber(rule.numbering.format, chapter, rule.numbering.scope === "chapter" ? local.equation : global.equation);
        sources.push({ kind: "equations", sectionId: section.id, label, number: label, chapterKey });
      } else {
        const tag = match[4].toLowerCase();
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
        sources.push({ kind: custom || (tag === "figure" ? "figures" : "tables"), ...(custom ? { captionKind: custom } : {}), sectionId: section.id, anchor: `${section.id}-source-${ordinal++}`, title, label, number, chapterKey });
      }
    }
  }
  return sources;
}

export function indexEntries(sources, rule, pages = {}, language = "tr") {
  return sources.filter((entry) => entry.kind === rule.kind && (rule.kind !== "toc" || (!entry.tocHidden && (!entry.unnumbered || entry.tocTitle) && entry.level <= rule.maxDepth && (!rule.levels || rule.levels.includes(entry.level)))))
    .map((entry) => {
      // matchHeadingTransform: a row reads like its rendered heading (e.g. an uppercase H1).
      const title = rule.matchHeadingTransform && entry.textTransform ? transformThesisText(entry.title, entry, language) : entry.title;
      return { ...entry, text: [entry.label, title].filter(Boolean).join(" "), rowTitle: title, page: pages[entry.anchor]?.label ?? "" };
    });
}

export function generatedIndexHtml(entries, rule) {
  const pageHeading = rule.includePageNumbers && rule.pageHeading ? `<div class="thesis-index-page-heading">${escape(rule.pageHeading)}</div>` : "";
  // Label ("Şekil 2.1", "1.2") and title are separate spans so a template can style the label and hang
  // wrapped lines under the title; without those rules they read exactly as one text.
  const inline = rule.leaderFlow === "inline";
  const rowText = (entry, tail = "") => entry.label && entry.rowTitle !== undefined ? `<span class="thesis-index-label">${escape(entry.label)}</span> <span class="thesis-index-title">${escape(entry.rowTitle)}${tail}</span>` : inline ? `<span class="thesis-index-title">${escape(entry.text)}${tail}</span>` : escape(entry.text);
  // A level may list its rows without page numbers (e.g. centred chapter rows): levelStyles[level].includePageNumber === false.
  const withPage = (entry) => rule.includePageNumbers && rule.levelStyles?.[entry.level]?.includePageNumber !== false;
  const leader = (entry) => `<span class="thesis-index-leader">${rule.leader === "dots" ? ".".repeat(400) : ""}</span><span class="thesis-index-page">${escape(entry.page)}</span>`;
  // leaderFlow "inline": leader and page number sit inside the title box, on the last line of a wrapped entry (floats, see engine CSS).
  return `<h1 data-unnumbered="true">${escape(rule.title)}</h1>${pageHeading}<ol class="thesis-toc" data-thesis-generated="${escape(rule.kind)}">${entries.map((entry) => `<li data-index-level="${entry.level || 1}" data-index-target="${escape(entry.anchor)}"${entry.labelLine ? ' data-index-label-line="true"' : ""}><span class="thesis-index-text">${rowText(entry, inline && withPage(entry) ? leader(entry) : "")}</span>${!inline && withPage(entry) ? leader(entry) : ""}</li>`).join("")}</ol>`;
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
  const { blocks, definitions, baseStyle, language } = section.derivedLayout;
  const layout = resolveSpecialPage(blocks, { definitions, values, baseStyle, language });
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
    if (!section.generatedIndex) return section;
    const indexRows = indexEntries(model.indexSources, section.generatedIndex, pages, model.language);
    return { ...section, indexRows, html: generatedIndexHtml(indexRows, section.generatedIndex) };
  }) };
}

/** Decorate existing source nodes without replacing an editor or its text. */
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
    // Footnote numbers are derived here, never trusted from stored markup: 1, 2, 3 in reading order of this body,
    // continuing after the sections before it in document numbering (footnoteOffset).
    host.querySelectorAll(FOOTNOTE_REF_SELECTOR).forEach((node, i) => {
      const number = String((section.footnoteOffset || 0) + i + 1);
      if (node.getAttribute("data-fn-index") !== number) node.setAttribute("data-fn-index", number);
      if (node.textContent !== number) node.textContent = number;
    });
    const entries = model.indexSources.filter((entry) => entry.sectionId === section.id && entry.kind !== "equations");
    const equations = model.indexSources.filter((entry) => entry.sectionId === section.id && entry.kind === "equations");
    host.querySelectorAll("[data-thesis-eq]").forEach((node) => { node.removeAttribute("data-thesis-eq"); node.removeAttribute("data-thesis-eq-side"); });
    host.querySelectorAll('.math-formula--block[data-eq-numbered="true"], .math-formula[data-display="block"][data-eq-numbered="true"]').forEach((node, i) => {
      if (!equations[i]) return;
      node.setAttribute("data-thesis-eq", equations[i].label);
      node.setAttribute("data-thesis-eq-side", section.rules.equations.numberAlign === "left" ? "left" : "right");
    });
    // Editor caret pads (ZWSP text next to a block formula) are line boxes of their own; an equation whose template opts into a
    // paragraph-like block (equations.style.lineHeight) cancels their height, so editor, PDF and Word space it the same.
    host.querySelectorAll(".math-formula--block").forEach((node) => {
      for (const side of ["before", "after"]) node.removeAttribute(`data-thesis-eq-pad-${side}`);
      if (!section.rules.equations?.style?.lineHeight) return;
      const scale = new DOMMatrixReadOnly(getComputedStyle(node.closest(".thesis-page-stack") || node).transform).a || 1;
      const isPad = (sibling) => sibling?.nodeType === 3 && !sibling.data.replace(/[\u200B\s]/g, "");
      const box = node.getBoundingClientRect(), own = getComputedStyle(node);
      // A pad is at most a couple of lines: anything larger means the neighbour sits in the next column/page.
      const most = 3 * (parseFloat(own.lineHeight) || 30);
      const set = (side, px) => { if (px > 0.5 && px < most) node.setAttribute(`data-thesis-eq-pad-${side}`, String(Math.round(px * 1000) / 1000)); };
      // Read both neighbours before writing anything: an attribute changes the margins and moves what is measured next.
      const before = node.previousElementSibling, after = node.nextElementSibling;
      const beforePad = before && isPad(node.previousSibling) && before.compareDocumentPosition(node.previousSibling) & Node.DOCUMENT_POSITION_FOLLOWING
        ? (box.top - before.getBoundingClientRect().bottom) / scale - parseFloat(getComputedStyle(before).marginBottom) - parseFloat(own.marginTop) : 0;
      const afterPad = after && isPad(node.nextSibling)
        ? (after.getBoundingClientRect().top - box.bottom) / scale - parseFloat(own.marginBottom) - parseFloat(getComputedStyle(after).marginTop) : 0;
      set("before", beforePad); set("after", afterPad);
    });
    let index = 0;
    host.querySelectorAll("[data-thesis-anchor]").forEach((node) => { node.removeAttribute("data-thesis-anchor"); node.removeAttribute("data-thesis-number"); });
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
  let html = renumberFootnoteRefs(thesisSourceHtml(section.html), section.footnoteOffset || 0).replace(/<span\b([^>]*\bdata-eq-numbered=["']true["'][^>]*)>/gi, (tag, attrs) => {
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
    article.querySelectorAll("[data-thesis-anchor]").forEach((node) => {
      const range = node.ownerDocument.createRange(); range.selectNodeContents(node);
      const rect = [...range.getClientRects()].find((r) => r.width && r.height) || node.getClientRects()[0];
      if (!rect) return;
      const index = Math.min(pageModel[i].pages.length - 1, Math.max(0, Math.floor(((rect.top - origin) / zoom + 0.5) / stride)));
      const page = pageModel[i].pages[index];
      result[node.dataset.thesisAnchor] = { label: page.label, physicalPage: page.physicalIndex + 1 };
    });
  });
  return { pages: result, counts };
}
