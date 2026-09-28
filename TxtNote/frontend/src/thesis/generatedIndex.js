import { formatNumber, groupThesisSections, transformThesisText } from "./engine.js";
import { flattenSpecialPage, resolveSpecialPage, specialPageHtml } from "./specialPages.js";
import { buildThesisPageModel, pageCountFromFlowHeight, pageMetrics, thesisGroupHasPageContent } from "./pageLayout.js";

const escape = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
import { plainThesisText, thesisSourceHtml } from "./sourceHtml.js";
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

/** One ordered semantic source stream for headings and both caption kinds. */
export function collectIndexSources(sections, extractHeadings) {
  const sources = [];
  const headingCounters = [];
  let chapter = "";
  let chapterKey = 0;
  const global = { figure: 0, table: 0 };
  let local = { figure: 0, table: 0 };
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
    for (const match of html.matchAll(/<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>|<(figure|table)\b[^>]*>([\s\S]*?)<\/\4>/gi)) {
      if (match[1]) {
        const entry = outline[headingIndex++];
        if (!entry) continue;
        if (entry.level === 1 && !entry.unnumbered) { chapter = formatNumber(entry.counters[0], section.rules.headings[1]?.numbering?.sequence || "arabic"); chapterKey += 1; local = { figure: 0, table: 0 }; }
        const transform = entry.unnumbered ? "none" : section.rules.headings[entry.level]?.textTransform || "none";
        sources.push({ ...entry, kind: "toc", sectionId: section.id, anchor: `${section.id}-source-${ordinal++}`, chapterKey, ...(transform !== "none" ? { textTransform: transform } : {}), ...(section.tocEntry === "none" ? { tocHidden: true } : {}) });
      } else {
        const kind = match[4].toLowerCase();
        const tag = kind === "figure" ? "figcaption" : "caption";
        const inner = match[5].match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
        if (!inner) continue;
        // Legacy plain prefixes are accepted; new notes store caption text alone.
        const title = text(inner[1]).replace(/^(Şekil|Tablo|Figure|Table)\s+\d+(?:\.\d+)*\.\s*/i, "");
        if (!title) continue;
        global[kind] += 1; local[kind] += 1;
        const rule = section.rules[kind === "figure" ? "figures" : "tables"];
        const n = rule.numbering.scope === "chapter" ? local[kind] : global[kind];
        const number = formatCaptionNumber(rule.numbering.format, chapter, formatNumber(n, rule.numbering.sequence));
        const label = formatCaptionLabel(rule, number);
        sources.push({ kind: kind === "figure" ? "figures" : "tables", sectionId: section.id, anchor: `${section.id}-source-${ordinal++}`, title, label, number, chapterKey });
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
      return { ...entry, text: [entry.label, title].filter(Boolean).join(" "), page: pages[entry.anchor]?.label ?? "" };
    });
}

export function generatedIndexHtml(entries, rule) {
  const pageHeading = rule.includePageNumbers && rule.pageHeading ? `<div class="thesis-index-page-heading">${escape(rule.pageHeading)}</div>` : "";
  return `<h1 data-unnumbered="true">${escape(rule.title)}</h1>${pageHeading}<ol class="thesis-toc" data-thesis-generated="${escape(rule.kind)}">${entries.map((entry) => `<li data-index-level="${entry.level || 1}" data-index-target="${escape(entry.anchor)}"><span class="thesis-index-text">${escape(entry.text)}</span>${rule.includePageNumbers ? `<span class="thesis-index-leader">${rule.leader === "dots" ? ".".repeat(80) : ""}</span><span class="thesis-index-page">${escape(entry.page)}</span>` : ""}</li>`).join("")}</ol>`;
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
    const entries = model.indexSources.filter((entry) => entry.sectionId === section.id);
    let index = 0;
    host.querySelectorAll("[data-thesis-anchor]").forEach((node) => { node.removeAttribute("data-thesis-anchor"); node.removeAttribute("data-thesis-number"); });
    host.querySelectorAll("h1,h2,h3,h4,h5,h6,figcaption,caption").forEach((node) => {
      if (/caption$/i.test(node.tagName)) {
        node.removeAttribute("data-thesis-caption"); node.removeAttribute("data-thesis-caption-auto"); node.removeAttribute("data-thesis-caption-hang");
        node.querySelectorAll(".academic-caption-label").forEach((label) => label.remove());
        if (node.tagName === "FIGCAPTION") node.setAttribute("contenteditable", section.editable ? "true" : "false");
        if (section.editable && node.tagName === "FIGCAPTION" && !node.firstChild) node.appendChild(node.ownerDocument.createElement("br"));
        const rule = section.rules[node.tagName === "FIGCAPTION" ? "figures" : "tables"];
        if (node.tagName === "FIGCAPTION") {
          const figure = node.parentElement;
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
        const rule = section.rules[entry.kind];
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
}

/** Print/static HTML uses the same source labels; no independent counters. */
export function thesisPresentationHtml(section) {
  let heading = 0, caption = 0;
  const headings = (section.indexSources || []).filter((entry) => entry.kind === "toc");
  const captions = (section.indexSources || []).filter((entry) => entry.kind !== "toc");
  let html = thesisSourceHtml(section.html).replace(/<h([1-6])\b([^>]*)>/gi, (tag, level, attrs) => {
    const entry = headings[heading++];
    return entry?.label ? `<h${level}${attrs} data-thesis-number="${escape(entry.label)}">` : tag;
  }).replace(/<(figcaption|caption)\b([^>]*)>([\s\S]*?)<\/\1>/gi, (tag, name, attrs, inner) => {
    if (!text(inner)) return tag;
    const entry = captions[caption++];
    return entry ? `<${name}${attrs} data-thesis-caption="${escape(entry.label)} ">${inner}</${name}>` : tag;
  });
  if (section.rules.figures.position === "above") html = html.replace(/(<figure\b[^>]*>)([\s\S]*?)(<figcaption\b[^>]*>[\s\S]*?<\/figcaption>)([\s\S]*?)(<\/figure>)/gi, "$1$3$2$4$5");
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
