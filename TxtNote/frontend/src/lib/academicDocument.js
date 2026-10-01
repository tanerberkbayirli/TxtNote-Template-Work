/**
 * Shared academic document model: HTML is still stored, but headings,
 * captions, footnotes and cross-references are stamped here so the editor,
 * PDF and Word exporters see the same structure.
 */

import { htmlWithoutPageGaps } from "./academicLayout.js";
import { latexToPlainText } from "./mathPlainText.js";

export const PAGE_NUMBER_POSITIONS = [
  { id: "bottom-center", label: "Alt orta" },
  { id: "bottom-right", label: "Alt sağ" },
  { id: "top-right", label: "Üst sağ" },
];

const UNNUMBERED_TITLES = new Set([
  "özet",
  "abstract",
  "anahtar kelimeler",
  "keywords",
  "içindekiler",
  "şekiller listesi",
  "tablolar listesi",
  "kapak sayfası",
  "tez başlığı",
  "öğrenci adı",
  "üniversite",
  "enstitü / fakülte",
  "bölüm",
  "danışman",
  "tarih",
  "ekler",
  "kaynakça",
  "yönetici özeti",
]);

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function decodeHtml(text) {
  return String(text ?? "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(value) {
  return decodeHtml(String(value ?? "").replace(/<[^>]+>/g, " "))
    .replace(/\u200B/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function attr(raw, name) {
  const match = String(raw ?? "").match(new RegExp(`\\b${name}="([^"]*)"`, "i"));
  return match ? match[1] : "";
}

function hasFlag(raw, name) {
  return new RegExp(`\\b${name}(="[^"]*")?`, "i").test(String(raw ?? ""));
}

function newId(prefix) {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rand}`;
}

export function isUnnumberedHeadingTitle(title) {
  return UNNUMBERED_TITLES.has(String(title ?? "").trim().toLocaleLowerCase("tr"));
}

export function headingNumberSequence(headings) {
  const depth = Math.max(3, ...headings.map((item) => item.level));
  const counters = Array(depth).fill(0);
  return headings.map((item) => {
    if (item.unnumbered || item.level < 1 || item.level > 6) return "";
    const index = item.level - 1;
    counters[index] += 1;
    for (let next = index + 1; next < depth; next += 1) counters[next] = 0;
    return counters.slice(0, index + 1).join(".");
  });
}

export function captionLabel(kind, number) {
  if (kind === "figure") return `Şekil ${number}`;
  if (kind === "table") return `Tablo ${number}`;
  if (kind === "equation") return `(${number})`;
  return String(number);
}

/** Strip a stamped "Tablo 1. " / "Şekil 2. " prefix so export does not double it. */
export function stripCaptionNumber(text) {
  return String(text ?? "")
    .replace(/^(Şekil|Tablo|Table|Figure)\s+\d+\.\s*/i, "")
    .trim();
}

export function joinCaptionText(label, caption) {
  const prefix = String(label || "").trim();
  const rest = stripCaptionNumber(caption);
  if (prefix && rest) return `${prefix}. ${rest}`;
  return prefix || rest;
}

export function xrefText(kind, number, headingText = "") {
  if (kind === "figure") return `Şekil ${number}`;
  if (kind === "table") return `Tablo ${number}`;
  if (kind === "equation") return `Denklem (${number})`;
  if (kind === "heading") return headingText ? `bölüm ${number}` : String(number);
  return String(number);
}

function headingLevelFromNode(node) {
  if (!node) return 0;
  const tag = node.tagName;
  if (/^H[1-6]$/.test(tag)) return Number(tag.slice(1));
  if (node.classList?.contains("fmt-size-heading") || node.classList?.contains("academic-h1")) return 1;
  if (node.classList?.contains("fmt-size-subheading") || node.classList?.contains("academic-h2")) return 2;
  if (node.classList?.contains("academic-h3")) return 3;
  return 0;
}

function runsFromNode(node) {
  if (!node) return [];
  if (node.nodeType === 3) {
    const text = (node.textContent || "").replace(/\u200B/g, "");
    if (!text) return [];
    return [{ type: "text", text, bold: false, italic: false, underline: false, strike: false }];
  }
  if (node.nodeType !== 1) return [];
  if (node.classList?.contains("academic-footnote")) {
    return [
      {
        type: "footnote",
        id: node.getAttribute("data-fn-id") || newId("fn"),
        text: node.getAttribute("data-fn-text") || "",
        index: Number(node.getAttribute("data-fn-index") || 0),
      },
    ];
  }
  if (node.classList?.contains("academic-xref")) {
    return [
      {
        type: "xref",
        refId: node.getAttribute("data-ref-id") || "",
        kind: node.getAttribute("data-ref-kind") || "figure",
        text: stripTags(node.innerHTML || node.textContent),
      },
    ];
  }
  if (node.classList?.contains("academic-cite")) {
    return [{ type: "text", text: stripTags(node.textContent), bold: false, italic: false, underline: false, strike: false }];
  }
  if (node.classList?.contains("math-formula")) {
    const latex = node.getAttribute("data-latex") || "";
    return [{ type: "math", latex, text: latexToPlainText(latex) || stripTags(node.textContent), display: false }];
  }
  if (node.tagName === "BR") return [{ type: "break" }];
  if (node.tagName === "A") {
    return [{ type: "link", href: node.getAttribute("href") || "", children: [...node.childNodes].flatMap(runsFromNode) }];
  }
  const style = {
    bold: Boolean(node.classList?.contains("fmt-bold") || /^(B|STRONG)$/.test(node.tagName)),
    italic: Boolean(node.classList?.contains("fmt-italic") || /^(I|EM)$/.test(node.tagName)),
    underline: Boolean(node.classList?.contains("fmt-underline") || node.tagName === "U"),
    strike: Boolean(node.classList?.contains("fmt-strike") || /^(S|DEL)$/.test(node.tagName)),
  };
  return [...node.childNodes].flatMap((child) => {
    const inner = runsFromNode(child);
    return inner.map((run) => {
      if (run.type !== "text") return run;
      return {
        ...run,
        bold: run.bold || style.bold,
        italic: run.italic || style.italic,
        underline: run.underline || style.underline,
        strike: run.strike || style.strike,
      };
    });
  });
}

function alignOf(node) {
  if (!node?.classList) return "left";
  if (node.classList.contains("fmt-align-center") || node.style?.textAlign === "center") return "center";
  if (node.classList.contains("fmt-align-right") || node.style?.textAlign === "right") return "right";
  if (node.classList.contains("fmt-align-justify") || node.style?.textAlign === "justify") return "justify";
  return "left";
}

function figureBlock(node) {
  const img = node.querySelector?.("img") || node;
  const caption = node.querySelector?.("figcaption");
  const captionText = stripTags(caption?.textContent || node.getAttribute("data-caption") || img?.alt || "");
  return {
    type: "figure",
    id: node.getAttribute("data-academic-id") || img?.getAttribute("data-academic-id") || newId("fig"),
    src: img?.getAttribute("src") || "",
    width: Number(img?.getAttribute("width") || 0),
    height: Number(img?.getAttribute("height") || 0),
    align: alignOf(node) === "left" ? "center" : alignOf(node),
    ...(node.getAttribute("data-caption-kind") ? { captionKind: node.getAttribute("data-caption-kind") } : {}),
    caption: captionText.replace(/^(Şekil|Figure)\s+\d+\.\s*/i, "").trim(),
    alt: img?.getAttribute("alt") || captionText,
  };
}

function tableBlock(node) {
  const captionEl = node.querySelector?.("caption");
  const rows = [...(node.rows || [])].map((row) =>
    [...row.cells].map((cell) => ({
      text: stripTags(cell.textContent),
      header: cell.tagName === "TH" || row.parentElement?.tagName === "THEAD",
      colspan: cell.colSpan || 1,
      rowspan: cell.rowSpan || 1,
      align: alignOf(cell),
      runs: runsFromNode(cell),
    })),
  );
  return {
    type: "table",
    id: node.getAttribute("data-academic-id") || newId("tbl"),
    caption: stripCaptionNumber(stripTags(captionEl?.textContent)),
    rows,
  };
}

function listBlock(node) {
  const ordered = node.tagName === "OL";
  const items = [...node.children]
    .filter((child) => child.tagName === "LI")
    .map((li) => ({
      runs: [...li.childNodes].filter((n) => n.tagName !== "UL" && n.tagName !== "OL").flatMap(runsFromNode),
      text: stripTags(
        [...li.childNodes]
          .filter((n) => n.tagName !== "UL" && n.tagName !== "OL")
          .map((n) => n.textContent)
          .join(" "),
      ),
      lists: [...li.children].filter((n) => n.tagName === "UL" || n.tagName === "OL").map(listBlock),
    }));
  return { type: "list", ordered, className: node.getAttribute("class") || "", items };
}

function parseNodeList(nodes) {
  const blocks = [];
  for (const node of nodes) {
    if (node.nodeType === 3) {
      const text = (node.textContent || "").replace(/\u200B/g, "");
      if (text.trim()) blocks.push({ type: "paragraph", align: "left", runs: [{ type: "text", text, bold: false, italic: false, underline: false, strike: false }] });
      continue;
    }
    if (node.nodeType !== 1) continue;
    const tag = node.tagName;
    if (node.classList.contains("academic-page-break") || hasFlag(node.outerHTML, "data-academic-page-break")) {
      blocks.push({ type: "pageBreak" });
      continue;
    }
    if (node.classList.contains("academic-toc") || node.getAttribute("data-academic-toc")) {
      blocks.push({ type: "toc" });
      continue;
    }
    if (node.classList.contains("academic-figure")) {
      blocks.push(figureBlock(node));
      continue;
    }
    if (node.classList.contains("math-formula--block") || node.getAttribute("data-display") === "block") {
      const latex = node.getAttribute("data-latex") || "";
      blocks.push({
        type: "math",
        id: node.getAttribute("data-academic-id") || newId("eq"),
        latex,
        text: latexToPlainText(latex) || stripTags(node.textContent),
        numbered: node.getAttribute("data-eq-numbered") === "true",
      });
      continue;
    }
    if (node.classList.contains("academic-code") || node.classList.contains("code-block") || tag === "PRE") {
      const code = (node.getAttribute("data-code") || node.textContent || "").replace(/\u200B/g, "");
      blocks.push({ type: "code", text: code.replace(/\n$/, "") });
      continue;
    }
    if (tag === "TABLE") {
      blocks.push(tableBlock(node));
      continue;
    }
    if (tag === "UL" || tag === "OL") {
      blocks.push(listBlock(node));
      continue;
    }
    if (tag === "IMG") {
      blocks.push(figureBlock(node));
      continue;
    }
    const headingLevel = headingLevelFromNode(node);
    const looksHeading = headingLevel > 0 && ( /^H[1-6]$/.test(tag) || node.classList.contains("academic-h"));
    if (looksHeading || (/^H[1-6]$/.test(tag))) {
      const title = stripTags(node.textContent);
      const unnumbered =
        node.hasAttribute("data-unnumbered") ||
        node.getAttribute("data-numbered") === "false" ||
        isUnnumberedHeadingTitle(title);
      blocks.push({
        type: "heading",
        level: headingLevel || 1,
        text: title,
        unnumbered,
        id: node.getAttribute("data-academic-id") || newId("h"),
        keepWithNext: true,
      });
      continue;
    }
    if (/^(DIV|P|BLOCKQUOTE|SECTION|SPAN)$/.test(tag)) {
      if (node.querySelector?.("h1,h2,h3,figure,table,ul,ol,pre,.academic-figure,.math-formula--block,.academic-code,.academic-toc,.academic-page-break")) {
        blocks.push(...parseNodeList(node.childNodes));
        continue;
      }
      const runs = runsFromNode(node);
      if (runs.length) blocks.push({ type: tag === "BLOCKQUOTE" ? "quote" : "paragraph", align: alignOf(node), ...(node.getAttribute("data-thesis-style") ? { thesisStyle: node.getAttribute("data-thesis-style") } : {}), runs });
    }
  }
  return blocks;
}

/** Nodes that end a line of flowing text; everything else is inline. */
const FLOW_BLOCK_TAGS = /^(DIV|P|BLOCKQUOTE|SECTION|H[1-6]|UL|OL|TABLE|FIGURE|PRE|IMG|HR)$/;
const FLOW_BLOCK_CLASSES = [".academic-figure", ".academic-table-wrap", ".math-formula--block", ".academic-code", ".code-block", ".academic-toc", ".academic-page-break"];
const isFlowBlock = (node) => FLOW_BLOCK_TAGS.test(node.tagName) || node.matches(FLOW_BLOCK_CLASSES.join(",")) || node.getAttribute("data-display") === "block";
/** Only an alignment the user chose; `undefined` means the template's. */
const explicitAlign = (node) => (/\bfmt-align-(left|center|right|justify)\b/.test(node.getAttribute("class") || "") ? alignOf(node) : undefined);

/**
 * Editor bodies store most paragraphs as lines: text ended by Enter ("\n") or <br>,
 * at the top level or inside alignment divs, with formatting spans, footnotes and
 * links inline. One paragraph per line (`line: true`, as the editor draws it: no
 * paragraph spacing) keeps every run; <p> elements stay real paragraphs.
 */
function parseLineFlow(nodes, align) {
  const blocks = [];
  let runs = [];
  let open = false;
  const flush = (force) => {
    if (open || force) blocks.push({ type: "paragraph", align, line: true, runs });
    runs = [];
    open = false;
  };
  const add = (list) => {
    for (const run of list) {
      if (run.type === "break") { flush(true); continue; }
      if (run.type !== "text") { runs.push(run); open = true; continue; }
      run.text.split("\n").forEach((part, index) => {
        if (index) flush(true);
        if (part) { runs.push({ ...run, text: part }); open = true; }
      });
    }
  };
  for (const node of nodes) {
    if (node.nodeType === 3) { add(runsFromNode(node)); continue; }
    if (node.nodeType !== 1) continue;
    if (!isFlowBlock(node) && !node.querySelector("h1,h2,h3,h4,h5,h6,p,div,ul,ol,table,figure,pre")) { add(runsFromNode(node)); continue; }
    flush(false);
    const plainContainer = /^(DIV|SECTION|SPAN)$/.test(node.tagName) && !node.matches(FLOW_BLOCK_CLASSES.join(","));
    if (plainContainer) {
      blocks.push(...parseLineFlow(node.childNodes, explicitAlign(node) ?? align));
    } else if ((node.tagName === "P" || node.tagName === "BLOCKQUOTE") && !node.querySelector("h1,h2,h3,h4,h5,h6,div,ul,ol,table,figure,pre")) {
      // A line break inside a paragraph stays a line break in the same Word paragraph.
      const paragraphRuns = runsFromNode(node).flatMap((run) => run.type === "text" && run.text.includes("\n")
        ? run.text.split("\n").flatMap((part, index) => [...(index ? [{ type: "break" }] : []), ...(part ? [{ ...run, text: part }] : [])])
        : [run]);
      // A trailing <br> draws no extra line; an empty <p></p> draws nothing at all.
      const drawsLine = paragraphRuns.some((run) => run.type === "break") || node.textContent.length > 0;
      while (paragraphRuns.at(-1)?.type === "break") paragraphRuns.pop();
      if (paragraphRuns.length || drawsLine) blocks.push({ type: node.tagName === "P" ? "paragraph" : "quote", align: explicitAlign(node) ?? align, line: false, ...(node.getAttribute("data-thesis-style") ? { thesisStyle: node.getAttribute("data-thesis-style") } : {}), runs: paragraphRuns });
    } else {
      blocks.push(...parseNodeList([node]));
    }
  }
  flush(false);
  return blocks;
}

function runsFromHtmlFragment(inner) {
  const runs = [], stack = [];
  const source = String(inner ?? "");
  const re = /<sup\b([^>]*academic-footnote[^>]*)>([\s\S]*?)<\/sup>|<span\b([^>]*academic-xref[^>]*)>([\s\S]*?)<\/span>|<\/?([a-z][\w-]*)\b([^>]*)>|([^<]+)/gi;
  for (const match of source.matchAll(re)) {
    if (match[1] !== undefined) {
      runs.push({ type: "footnote", id: attr(match[1], "data-fn-id") || newId("fn"), text: attr(match[1], "data-fn-text") || stripTags(match[2]), index: Number(attr(match[1], "data-fn-index") || 0) });
    } else if (match[3] !== undefined) {
      runs.push({ type: "xref", refId: attr(match[3], "data-ref-id"), kind: attr(match[3], "data-ref-kind") || "figure", text: stripTags(match[4]) });
    } else if (match[5]) {
      const tag = match[5].toLowerCase(), attrs = match[6] || "";
      if (tag === "br") { runs.push({ type: "break" }); continue; }
      if (match[0].startsWith("</")) {
        const index = stack.findLastIndex((entry) => entry.tag === tag);
        if (index >= 0) stack.splice(index);
      } else if (!/^(img|hr|input)$/.test(tag) && !match[0].endsWith("/>")) {
        stack.push({ tag, bold: /^(b|strong)$/.test(tag) || /\bfmt-bold\b/.test(attrs), italic: /^(i|em)$/.test(tag) || /\bfmt-italic\b/.test(attrs), underline: tag === "u" || /\bfmt-underline\b/.test(attrs), strike: /^(s|strike|del)$/.test(tag) || /\bfmt-strike\b/.test(attrs) });
      }
    } else {
      const value = decodeHtml(match[7] || "").replace(/\u200B/g, "");
      value.split("\n").forEach((part, index) => {
        if (index) runs.push({ type: "break" });
        if (part) runs.push({ type: "text", text: part, ...Object.fromEntries(["bold", "italic", "underline", "strike"].map((key) => [key, stack.some((entry) => entry[key])])) });
      });
    }
  }
  return runs;
}

function parseWithRegex(html) {
  const blocks = [];
  const source = String(html ?? "");
  const re =
    /<(h[1-6]|pre|figure|table|nav|blockquote|div|span|ul|ol|p)([^>]*)>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = re.exec(source))) {
    const tag = match[1].toLowerCase();
    const rawAttr = match[2] || "";
    const inner = match[3] || "";
    if (tag === "div" && /<(?:h[1-6]|p|table|figure|ul|ol)\b/i.test(inner)) { blocks.push(...parseWithRegex(inner)); continue; }
    if (/data-academic-page-break/i.test(rawAttr) || /academic-page-break/.test(rawAttr)) {
      blocks.push({ type: "pageBreak" });
      continue;
    }
    if (/academic-toc|data-academic-toc/i.test(rawAttr)) {
      blocks.push({ type: "toc" });
      continue;
    }
    if (tag === "span") {
      if (!/math-formula--block|data-display="block"/i.test(rawAttr)) continue;
      const latex = attr(rawAttr, "data-latex");
      blocks.push({
        type: "math",
        id: attr(rawAttr, "data-academic-id") || newId("eq"),
        latex,
        text: latexToPlainText(latex) || stripTags(inner),
        numbered: /data-eq-numbered="true"/i.test(rawAttr),
      });
      continue;
    }
    if (/^h[1-6]$/.test(tag)) {
      const title = stripTags(inner);
      const level = Number(tag.slice(1));
      const unnumbered = /data-unnumbered/i.test(rawAttr) || isUnnumberedHeadingTitle(title);
      blocks.push({
        type: "heading",
        level,
        text: title,
        unnumbered,
        id: attr(rawAttr, "data-academic-id") || newId("h"),
        keepWithNext: true,
      });
      continue;
    }
    if (tag === "figure") {
      const src = attr(inner, "src");
      const caption = stripTags(inner.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i)?.[1] || "");
      blocks.push({
        type: "figure",
        id: attr(rawAttr, "data-academic-id") || newId("fig"),
        src,
        width: Number(attr(inner, "width") || 0),
        height: Number(attr(inner, "height") || 0),
        align: "center",
        ...(attr(rawAttr, "data-caption-kind") ? { captionKind: attr(rawAttr, "data-caption-kind") } : {}),
        caption: caption.replace(/^(Şekil|Figure)\s+\d+\.\s*/i, "").trim(),
        alt: caption,
      });
      continue;
    }
    if (tag === "pre" || /academic-code|code-block/.test(rawAttr)) {
      const text = decodeHtml(inner.replace(/<[^>]+>/g, "")).replace(/\u200B/g, "").replace(/\n$/, "");
      blocks.push({ type: "code", text });
      continue;
    }
    if (tag === "ul" || tag === "ol") {
      const items = [...inner.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((item) => ({
        text: stripTags(item[1]),
        runs: runsFromHtmlFragment(item[1]),
      }));
      blocks.push({ type: "list", ordered: tag === "ol", className: attr(rawAttr, "class"), items });
      continue;
    }
    if (tag === "table") {
      const rows = [...inner.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((row) =>
        [...row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => ({
          text: stripTags(cell[1]),
          header: /<th/i.test(cell[0]),
          colspan: 1,
          rowspan: 1,
        })),
      );
      blocks.push({
        type: "table",
        id: attr(rawAttr, "data-academic-id") || newId("tbl"),
        caption: stripCaptionNumber(stripTags(inner.match(/<caption[^>]*>([\s\S]*?)<\/caption>/i)?.[1] || "")),
        rows,
      });
      continue;
    }
    if (tag === "p" || tag === "blockquote") {
      const runs = runsFromHtmlFragment(inner);
      blocks.push({
        type: tag === "blockquote" ? "quote" : "paragraph",
        align: /fmt-align-center/.test(rawAttr) ? "center" : /fmt-align-right/.test(rawAttr) ? "right" : /fmt-align-justify/.test(rawAttr) ? "justify" : /fmt-align-left/.test(rawAttr) ? "left" : undefined,
        line: false,
        ...(attr(rawAttr, "data-thesis-style") ? { thesisStyle: attr(rawAttr, "data-thesis-style") } : {}),
        runs: runs.length ? runs : [{ type: "text", text: stripTags(inner) }],
      });
    }
  }
  return blocks;
}

/** `lines`: paragraphs follow the editor's lines (thesis export); see parseLineFlow. */
export function parseAcademicHtml(html, { lines = false } = {}) {
  const cleaned = htmlWithoutPageGaps(html);
  if (typeof document !== "undefined") {
    const template = document.createElement("template");
    template.innerHTML = cleaned;
    return lines ? parseLineFlow(template.content.childNodes) : parseNodeList(template.content.childNodes);
  }
  return parseWithRegex(cleaned);
}

function stampHeadingAttributes(headings) {
  const numbers = headingNumberSequence(headings);
  return headings.map((item, index) => ({ ...item, number: numbers[index] }));
}

export function numberAcademicBlocks(blocks) {
  const headings = [];
  const figures = [];
  const tables = [];
  const equations = [];
  for (const block of blocks) {
    if (block.type === "heading") headings.push(block);
    if (block.type === "figure") figures.push(block);
    if (block.type === "table") tables.push(block);
    if (block.type === "math" && block.numbered) equations.push(block);
  }
  const numberedHeadings = stampHeadingAttributes(headings);
  numberedHeadings.forEach((item, index) => {
    headings[index].number = item.number;
  });
  figures.forEach((item, index) => {
    item.number = index + 1;
    item.label = captionLabel("figure", item.number);
  });
  tables.forEach((item, index) => {
    item.number = index + 1;
    item.label = captionLabel("table", item.number);
  });
  equations.forEach((item, index) => {
    item.number = index + 1;
    item.label = captionLabel("equation", item.number);
  });
  const targets = new Map();
  for (const item of numberedHeadings) {
    if (item.id) targets.set(item.id, { kind: "heading", number: item.number, text: item.text });
  }
  for (const item of figures) targets.set(item.id, { kind: "figure", number: item.number, text: item.caption });
  for (const item of tables) targets.set(item.id, { kind: "table", number: item.number, text: item.caption });
  for (const item of equations) targets.set(item.id, { kind: "equation", number: item.number, text: item.text });

  let footnoteIndex = 0;
  const walkRuns = (runs = []) =>
    runs.map((run) => {
      if (run.type === "footnote") {
        footnoteIndex += 1;
        return { ...run, index: footnoteIndex };
      }
      if (run.type === "xref") {
        const target = targets.get(run.refId);
        if (!target) return run;
        return { ...run, kind: target.kind, text: xrefText(target.kind, target.number, target.text), number: target.number };
      }
      return run;
    });

  for (const block of blocks) {
    if (block.runs) block.runs = walkRuns(block.runs);
    if (block.items) {
      for (const item of block.items) {
        if (item.runs) item.runs = walkRuns(item.runs);
      }
    }
  }
  return { blocks, targets, footnoteCount: footnoteIndex };
}

export function tocEntries(blocks) {
  return blocks
    .filter((block) => block.type === "heading" && !block.unnumbered)
    .map((block) => ({
      id: block.id,
      level: block.level,
      number: block.number || "",
      text: block.text,
      title: `${block.number ? `${block.number} ` : ""}${block.text}`.trim(),
    }));
}

export function decorateAcademicDom(root, { captions = true, explicitHeadings = false } = {}) {
  if (!root?.querySelectorAll) return false;
  const headingNodes = [...root.querySelectorAll("h1,h2,h3,h4,h5,h6,.academic-h")].filter((node) => {
    if (node.closest?.(".academic-toc")) return false;
    return headingLevelFromNode(node) > 0;
  });
  const headingMeta = headingNodes.map((node) => {
    const title = stripTags(node.textContent);
    const unnumbered =
      node.hasAttribute("data-unnumbered") ||
      node.getAttribute("data-numbered") === "false" ||
      (!explicitHeadings && isUnnumberedHeadingTitle(title));
    if (!node.getAttribute("data-academic-id")) node.setAttribute("data-academic-id", newId("h"));
    const level = headingLevelFromNode(node) || 1;
    node.classList.add("academic-h", `academic-h${level}`);
    node.setAttribute("data-academic-heading", String(level));
    if (unnumbered) node.setAttribute("data-unnumbered", "true");
    else node.removeAttribute("data-unnumbered");
    return { node, level, unnumbered, id: node.getAttribute("data-academic-id"), text: title };
  });
  const numbers = headingNumberSequence(headingMeta);
  headingMeta.forEach((item, index) => {
    if (numbers[index]) item.node.setAttribute("data-number", numbers[index]);
    else item.node.removeAttribute("data-number");
    item.number = numbers[index];
  });

  const figures = [...root.querySelectorAll("figure.academic-figure, .academic-figure")];
  figures.forEach((node, index) => {
    if (!node.getAttribute("data-academic-id")) node.setAttribute("data-academic-id", newId("fig"));
    node.setAttribute("data-kind", "figure");
    node.setAttribute("data-number", String(index + 1));
    const caption = captions ? node.querySelector("figcaption") : null;
    if (!caption) return;
    let label = captions ? caption.querySelector(".academic-caption-label") : null;
    if (captions && !label) {
      label = node.ownerDocument.createElement("span");
      label.className = "academic-caption-label";
      label.setAttribute("contenteditable", "false");
      caption.insertBefore(label, caption.firstChild);
    }
    label.textContent = `${captionLabel("figure", index + 1)}. `;
  });

  const tables = [...root.querySelectorAll("table")];
  tables.forEach((node, index) => {
    if (!node.getAttribute("data-academic-id")) node.setAttribute("data-academic-id", newId("tbl"));
    node.setAttribute("data-kind", "table");
    node.setAttribute("data-number", String(index + 1));
    node.classList.add("academic-table");
    let caption = node.querySelector(":scope > caption");
    if (!caption) {
      caption = node.ownerDocument.createElement("caption");
      node.insertBefore(caption, node.firstChild);
    }
    let label = captions ? caption.querySelector(".academic-caption-label") : null;
    if (captions && !label) {
      label = node.ownerDocument.createElement("span");
      label.className = "academic-caption-label";
      label.setAttribute("contenteditable", "false");
      caption.insertBefore(label, caption.firstChild);
    }
    if (label) label.textContent = `${captionLabel("table", index + 1)}. `;
    padEmptyTableCells(node);
    wrapAcademicTable(node);
  });
  ensureTableCaretPads(root);

  const equations = [...root.querySelectorAll(".math-formula--block, .math-formula[data-display='block']")];
  let eq = 0;
  equations.forEach((node) => {
    if (node.getAttribute("data-eq-numbered") !== "true") {
      node.removeAttribute("data-number");
      return;
    }
    eq += 1;
    if (!node.getAttribute("data-academic-id")) node.setAttribute("data-academic-id", newId("eq"));
    node.setAttribute("data-kind", "equation");
    node.setAttribute("data-number", String(eq));
  });

  const targets = new Map();
  headingMeta.forEach((item) => targets.set(item.id, { kind: "heading", number: item.number, text: item.text }));
  figures.forEach((node) =>
    targets.set(node.getAttribute("data-academic-id"), {
      kind: "figure",
      number: node.getAttribute("data-number"),
      text: stripTags(node.querySelector("figcaption")?.textContent),
    }),
  );
  tables.forEach((node) =>
    targets.set(node.getAttribute("data-academic-id"), {
      kind: "table",
      number: node.getAttribute("data-number"),
      text: stripTags(node.querySelector("caption")?.textContent),
    }),
  );
  equations.forEach((node) => {
    if (node.getAttribute("data-eq-numbered") !== "true") return;
    targets.set(node.getAttribute("data-academic-id"), {
      kind: "equation",
      number: node.getAttribute("data-number"),
      text: node.getAttribute("data-latex") || "",
    });
  });

  root.querySelectorAll(".academic-xref").forEach((node) => {
    const target = targets.get(node.getAttribute("data-ref-id"));
    if (!target) return;
    node.setAttribute("data-ref-kind", target.kind);
    node.textContent = xrefText(target.kind, target.number, target.text);
  });

  const footnotes = [...root.querySelectorAll("sup.academic-footnote, .academic-footnote")];
  footnotes.forEach((node, index) => {
    if (!node.getAttribute("data-fn-id")) node.setAttribute("data-fn-id", newId("fn"));
    node.setAttribute("data-fn-index", String(index + 1));
    if (!node.textContent.trim()) node.textContent = String(index + 1);
    else node.textContent = String(index + 1);
  });

  root.querySelectorAll(".academic-toc, [data-academic-toc]").forEach((node) => {
    let list = node.querySelector(".academic-toc__list");
    if (!list) {
      list = node.ownerDocument.createElement("ol");
      list.className = "academic-toc__list";
      node.appendChild(list);
    }
    list.innerHTML = headingMeta
      .filter((item) => !item.unnumbered)
      .map((item) => {
        const title = `${item.number ? `${item.number} ` : ""}${escapeHtml(item.text)}`;
        return `<li class="academic-toc__item academic-toc__item--h${item.level}" data-ref-id="${item.id}">${title}</li>`;
      })
      .join("");
  });
  return true;
}

export function normalizeAcademicHtml(html) {
  const cleaned = htmlWithoutPageGaps(html);
  if (typeof document !== "undefined") {
    const template = document.createElement("template");
    template.innerHTML = cleaned;
    decorateAcademicDom(template.content);
    return template.innerHTML;
  }
  return cleaned;
}

export function collectFootnotes(blocks) {
  const notes = [];
  const walk = (runs = []) => {
    for (const run of runs) {
      if (run.type === "footnote") notes.push(run);
    }
  };
  for (const block of blocks) {
    walk(block.runs);
    for (const item of block.items || []) walk(item.runs);
  }
  return notes;
}

export function headingHtml(level, text, options = {}) {
  const safeLevel = Math.min(6, Math.max(1, Number(level) || 1));
  const numbered = options.numbered !== false && !isUnnumberedHeadingTitle(text);
  const flags = numbered ? "" : ` data-unnumbered="true"`;
  return `<h${safeLevel} class="academic-h academic-h${safeLevel}" data-academic-heading="${safeLevel}"${flags}>${escapeHtml(text)}</h${safeLevel}>`;
}

export function paragraphHtml(text) {
  return `<p>${escapeHtml(text)}</p>`;
}

export function pageBreakHtml() {
  return `<div class="academic-page-break" data-academic-page-break="true" contenteditable="false"></div>`;
}

export function tocHtml() {
  return `<nav class="academic-toc" data-academic-toc="true" contenteditable="false"><p class="academic-toc__title">İçindekiler</p><ol class="academic-toc__list"></ol></nav>`;
}

export function footnoteHtml(text, id = newId("fn")) {
  return `<sup class="academic-footnote" contenteditable="false" data-fn-id="${escapeHtml(id)}" data-fn-text="${escapeHtml(text)}">1</sup>`;
}

/** Footnote numbers and texts as stored in editor HTML (data-fn-index / data-fn-text). */
export function footnotesFromHtml(html) {
  const items = [];
  for (const match of String(html ?? "").matchAll(/<(?:sup|span)\b[^>]*academic-footnote[^>]*>/gi)) {
    const index = attr(match[0], "data-fn-index");
    if (index) items.push({ index, text: decodeHtml(attr(match[0], "data-fn-text")) });
  }
  return items;
}

export function xrefHtml(refId, kind = "figure", label = "Şekil 1") {
  return `<span class="academic-xref" contenteditable="false" data-ref-id="${escapeHtml(refId)}" data-ref-kind="${escapeHtml(kind)}">${escapeHtml(label)}</span>`;
}

function clampInt(value, min, max, fallback) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function padEmptyTableCells(table) {
  const doc = table.ownerDocument;
  table.querySelectorAll("th, td").forEach((cell) => {
    const hasText = [...cell.childNodes].some((node) => node.nodeType === 3 && String(node.textContent ?? "").length);
    if (!hasText) cell.insertBefore(doc.createTextNode("\u200B"), cell.firstChild);
    if (!cell.hasChildNodes()) cell.appendChild(doc.createElement("br"));
  });
}

function isCaretPadNode(node) {
  if (!node) return false;
  if (node.nodeType === 3) return true;
  return node.nodeName === "BR" || (node.nodeType === 1 && node.tagName === "P" && !(node.textContent || "").replace(/\u200B/g, "").trim());
}

export function ensureTableCaretPads(root) {
  if (!root?.querySelectorAll) return;
  const doc = root.ownerDocument;
  root.querySelectorAll(".academic-table-wrap").forEach((el) => {
    const parent = el.parentNode;
    if (!parent) return;
    if (!isCaretPadNode(el.previousSibling)) parent.insertBefore(doc.createTextNode("\u200B"), el);
    if (!isCaretPadNode(el.nextSibling)) parent.insertBefore(doc.createTextNode("\u200B"), el.nextSibling);
  });
}

export function placeCaretAfterTable(node, root) {
  const wrap =
    node?.classList?.contains("academic-table-wrap") ? node : node?.closest?.(".academic-table-wrap") || node;
  if (!wrap?.parentNode) return;
  ensureTableCaretPads(root || wrap.parentNode);
  let pad = wrap.nextSibling;
  if (!pad || pad.nodeType !== 3) {
    pad = wrap.ownerDocument.createTextNode("\u200B");
    wrap.parentNode.insertBefore(pad, wrap.nextSibling);
  }
  const sel = wrap.ownerDocument.getSelection?.() || window.getSelection();
  if (!sel) return;
  const range = wrap.ownerDocument.createRange();
  range.setStart(pad, pad.textContent.length);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  root?.focus?.();
}

function wrapAcademicTable(table) {
  if (!(table instanceof HTMLElement) || table.tagName !== "TABLE") return table;
  let parent = table.parentElement;
  while (parent && /^(P|H[1-6]|SPAN|A|LI|LABEL|BUTTON)$/.test(parent.tagName)) {
    parent.parentNode?.insertBefore(table, parent.nextSibling);
    if (parent.childNodes.length === 0) parent.remove();
    parent = table.parentElement;
  }
  if (parent?.classList.contains("academic-table-wrap")) return parent;
  const wrap = table.ownerDocument.createElement("div");
  wrap.className = "academic-table-wrap";
  wrap.setAttribute("data-academic-table", "true");
  table.parentNode?.insertBefore(wrap, table);
  wrap.appendChild(table);
  return wrap;
}

export function tableHtml(rows = 3, cols = 3, captionText = "Tablo başlığı") {
  const safeCols = clampInt(cols, 1, 12, 3);
  const safeRows = clampInt(rows, 2, 20, 3);
  const title = escapeHtml(String(captionText ?? "").trim() || "Tablo başlığı");
  const header = `<tr>${Array.from({ length: safeCols }, (_, i) => `<th>Sütun ${i + 1}</th>`).join("")}</tr>`;
  const body = Array.from({ length: safeRows - 1 }, () => `<tr>${Array.from({ length: safeCols }, () => "<td>\u200B</td>").join("")}</tr>`).join("");
  return `<div class="academic-table-wrap" data-academic-table="true"><table class="academic-table" data-kind="table"><caption><span class="academic-caption-label" contenteditable="false">Tablo 1. </span><span class="academic-caption-text">${title}</span></caption><thead>${header}</thead><tbody>${body}</tbody></table></div>\u200B`;
}

export function isBlankAcademicNote(note) {
  const title = stripTags(note?.title);
  const content = stripTags(note?.content);
  const authors = String(note?.researchData?.docAuthors ?? "").trim();
  const summary = String(note?.researchData?.docAbstract ?? "").trim();
  return !title && !content && !authors && !summary;
}
// The shared academic figure block uses physical paragraph spacing in editor and export.
export const ACADEMIC_FIGURE_MARGIN_PT = 15;
export const ACADEMIC_TABLE_CELL_PADDING_PT = Object.freeze({ vertical: 6, horizontal: 8 });
