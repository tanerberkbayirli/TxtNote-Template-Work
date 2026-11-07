/**
 * Linked citations and the bibliography they produce (one source pool, three render modes).
 *
 * Data: `thesis.sources` is the pool, one record per work ({ id, kind, authors, year, title, publication, volume, issue,
 * pages, doi, url, entryOverride? }, the shape apa7.js formats). A citation in the text stores only which source it points
 * to and an optional locator (page):
 *
 *   <span class="thesis-cite" contenteditable="false" data-cite-id="src_…" data-cite-key="cite_…" data-cite-locator="45"></span>
 *
 * Its visible label is presentation, never stored: `storedCitationHtml` strips it on save, `renderCitationHtml` draws it
 * for the current mode (compile: editor, print, PDF, DOCX all read the compiled HTML; `decorateCitations` keeps the live
 * editor DOM in step without rewriting what the user is typing).
 *
 *   parenthetical  (Yılmaz, 2026, s. 45) inline, before the sentence's full stop
 *   footnote       a page-bottom footnote (sup.academic-footnote, the existing footnote machinery) "Yılmaz, 2026, s. 45."
 *   numeric        (1) / (1, s. 45), numbers by first citation in the document
 *
 * The bibliography is derived, never stored: exactly the pool sources the text cites, one entry per source, A→Z by first
 * author surname (numeric: citation order). A citation removed from the text drops its source from the list on the next
 * compile; a source added to the text appears. `entryOverride` is the user's hand-corrected entry text: it replaces only
 * the formatted text, the entry stays tied to the source id, so adding/removing citations keeps working.
 */
import { apa7Citation, apa7ReferenceRuns, apa7SortSources } from "./apa7.js";

export const CITATION_MODES = Object.freeze(["parenthetical", "footnote", "numeric"]);
export const CITATION_MODE_LABELS = Object.freeze({ parenthetical: "Parantezli (Yazar, Yıl)", footnote: "Dipnotlu (sayfa altı)", numeric: "Numaralı (1)" });
export const SOURCE_FIELDS = Object.freeze(["kind", "thesisType", "authors", "year", "title", "publication", "volume", "issue", "pages", "doi", "url", "entryOverride"]);
/** Degree of a thesis source (kind "thesis"): the bibliography's bracket names only this one. */
export const THESIS_TYPES = Object.freeze({ master: "Yüksek Lisans", phd: "Doktora" });
export const SOURCE_KINDS = Object.freeze({ book: "Kitap", article: "Makale", chapter: "Kitap bölümü", thesis: "Tez", web: "Web sayfası", report: "Rapor" });

// Any stored or presented citation element: <span|sup class="… thesis-cite …" …>label</span|sup>.
const CITE_HTML = /<(sup|span)\b(?=[^>]*\bclass=["'][^"']*\bthesis-cite\b)([^>]*)>[^<]*<\/\1>/gi;

const escapeHtml = (text) => String(text ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const unescapeHtml = (text) => String(text ?? "").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const trim = (value) => String(value ?? "").trim();
const attr = (attrs, name) => unescapeHtml(attrs.match(new RegExp(`\\s${name}=(["'])(.*?)\\1`, "i"))?.[2] ?? "");

/** New id for a source or a citation occurrence. */
export function newCitationId(prefix = "src") {
  const random = globalThis.crypto?.randomUUID?.().replace(/-/g, "").slice(0, 12) ?? Math.random().toString(36).slice(2, 14);
  return `${prefix}_${random}`;
}

/** A clean pool record: known fields only, strings trimmed of nothing (the user's text is kept as typed). */
/**
 * Which fields each kind of source has (besides authors, year, title — and url/doi at the end, optional). `publication`
 * is the kind's container: publisher (book), journal (article), university (thesis), site name (web), book (chapter),
 * institution (report). A web page has no DOI. The form shows exactly these; a saved source keeps exactly these.
 */
export const SOURCE_KIND_FIELDS = Object.freeze({
  book: Object.freeze(["publication"]),
  article: Object.freeze(["publication", "volume", "issue", "pages"]),
  chapter: Object.freeze(["publication", "pages"]),
  thesis: Object.freeze(["thesisType", "publication"]),
  web: Object.freeze(["publication"]),
  report: Object.freeze(["publication"]),
});
const COMMON_SOURCE_FIELDS = Object.freeze(["kind", "authors", "year", "title", "url", "doi", "entryOverride"]);

/** Fields a source of `kind` keeps: the common ones and its own (a web page drops the DOI). */
export function sourceFieldsFor(kind) {
  const own = SOURCE_KIND_FIELDS[kind] || SOURCE_KIND_FIELDS.book;
  return [...COMMON_SOURCE_FIELDS.filter((key) => !(kind === "web" && key === "doi")), ...own];
}

/** A clean pool record: known fields of its kind only (a field of another kind left in the form is not stored), text as typed. */
export function normalizeSource(source = {}) {
  const out = { id: trim(source.id) || newCitationId("src") };
  out.kind = SOURCE_KINDS[source.kind] ? String(source.kind) : "book";
  const keep = new Set(sourceFieldsFor(out.kind));
  for (const key of SOURCE_FIELDS) if (key !== "kind" && keep.has(key) && source[key] !== undefined && source[key] !== null) out[key] = String(source[key]);
  return out;
}

export function thesisSources(thesis) {
  return Array.isArray(thesis?.sources) ? thesis.sources.filter((source) => source && typeof source === "object" && trim(source.id)) : [];
}

/** The mode a template's own rule asks for: numeric for numbered styles, footnote for note styles, else parenthetical. */
export function templateCitationMode(template) {
  const declared = `${template?.bibliography?.citationStyle || ""} ${template?.citationStyle || ""}`;
  if (/numeric|vancouver|ieee/i.test(declared)) return "numeric";
  if (/footnote|dipnot|notes|isnad|chicago/i.test(declared)) return "footnote";
  return "parenthetical";
}

/** The document's mode: the user's one-click choice (thesis.citationMode), else the template's. */
export function citationMode(template, thesis) {
  return CITATION_MODES.includes(thesis?.citationMode) ? thesis.citationMode : templateCitationMode(template);
}

/** The stored (label-free) element for one citation. */
export function citationHtml(sourceId, { locator = "", key = newCitationId("cite") } = {}) {
  return `<span class="thesis-cite" contenteditable="false" data-cite-id="${escapeHtml(sourceId)}" data-cite-key="${escapeHtml(key)}"${trim(locator) ? ` data-cite-locator="${escapeHtml(trim(locator))}"` : ""}></span>`;
}

function citationParts(attrs) {
  return { id: attr(attrs, "data-cite-id"), key: attr(attrs, "data-cite-key"), locator: attr(attrs, "data-cite-locator") };
}

/** Save form: every citation element back to its label-free stored element (labels and footnote form are presentation). */
export function storedCitationHtml(html) {
  const source = String(html ?? "");
  if (!source.includes("thesis-cite")) return source;
  let index = 0;
  let out = source.replace(CITE_HTML, (all, tag, attrs) => {
    const { id, key, locator } = citationParts(attrs);
    index += 1;
    // A pasted citation without its occurrence key gets a deterministic one: saving the same HTML twice gives the same note.
    return id ? citationHtml(id, { key: key || `cite_${id}_${index}`, locator }) : all;
  });
  // One stored position for every mode: just before the sentence's full stop, without the space a label needs.
  // A footnote mark after the stop ("metin.¹"), a label after a space ("metin (A).") or after "metin. " and a stop inside
  // formatting ("<b>metin.</b>¹") all store as "metin<cite>." — so a parenthetical label always ends up before the stop.
  out = out.replace(AFTER_SPACE, "$1");
  for (let previous = ""; previous !== out;) { previous = out; out = out.replace(AFTER_STOP, "$2$3$1"); }
  return out.replace(AFTER_SPACE, "$1");
}

const STORED_CITE = '<span class="thesis-cite"[^>]*></span>';
const STOP = "[.!?…]+";
// The stop may be inside inline formatting that closes before the citation: the stop leaves the formatting.
const AFTER_STOP = new RegExp(`(${STOP})((?:</(?:b|i|em|strong|u|s|span|sub|sup|a)>)*)(${STORED_CITE})`, "g");
const AFTER_SPACE = new RegExp(`(?: |&nbsp;|\\u00a0)(${STORED_CITE})`, "g");
const BEFORE_STOP = new RegExp(`((?:${STORED_CITE})+)(${STOP})`, "g");
const BLOCK_START = /<(?:p|li|td|th|h[1-6]|div|blockquote)\b[^>]*>$|<br\b[^>]*>$/i;

/** Citation occurrences of some HTMLs, in document order. */
export function citationOccurrences(htmls) {
  const out = [];
  for (const html of htmls) for (const match of String(html ?? "").matchAll(CITE_HTML)) out.push(citationParts(match[2]));
  return out.filter((entry) => entry.id);
}

/** Source ids in order of their first citation. */
export function citedSourceIds(htmls) {
  return [...new Set(citationOccurrences(htmls).map((entry) => entry.id))];
}

/**
 * Everything a render needs, computed once per compile from the pool and the text of every editable section.
 * `sources` is the pool, `cited` the ids the text cites (citation order), `counts` citations per id.
 */
export function citationContext(template, thesis, htmls) {
  const sources = thesisSources(thesis).map(normalizeSource);
  const occurrences = citationOccurrences(htmls);
  const cited = [...new Set(occurrences.map((entry) => entry.id))];
  const counts = {};
  for (const entry of occurrences) counts[entry.id] = (counts[entry.id] || 0) + 1;
  const mode = citationMode(template, thesis);
  const lang = template?.language === "en" ? "en" : "tr";
  const known = new Set(sources.map((source) => source.id));
  // Numbers follow the first citation; only sources that exist are numbered (a dangling citation shows a warning label).
  const numbers = Object.fromEntries(cited.filter((id) => known.has(id)).map((id, index) => [id, index + 1]));
  return { mode, lang, sources, cited, counts, numbers, templateMode: templateCitationMode(template), active: sources.length > 0 || occurrences.length > 0 };
}

const missingLabel = (lang) => (lang === "en" ? "(missing source)" : "(kaynak bulunamadı)");

/** Visible text of one citation in the context's mode. */
export function citationLabel(context, id, locator = "") {
  const source = context.sources.find((item) => item.id === id);
  if (!source) return missingLabel(context.lang);
  const where = trim(locator);
  if (context.mode === "numeric") {
    const page = where ? `, ${/[–-]/.test(where) ? (context.lang === "en" ? "pp." : "ss.") : (context.lang === "en" ? "p." : "s.")} ${where}` : "";
    return `(${context.numbers[id] ?? "?"}${page})`;
  }
  // Year suffixes (2026a/2026b) are counted among the cited sources: those are the ones the reader finds in the list.
  const pool = context.sources.filter((item) => context.cited.includes(item.id));
  const label = apa7Citation(source, { locator: where, sources: pool.length ? pool : [source], lang: context.lang });
  if (context.mode !== "footnote") return label;
  const bare = label.replace(/^\(|\)$/g, "");
  return /[.!?]$/.test(bare) ? bare : `${bare}.`;
}

/** Presentation element of one citation (what the editor shows and the exports read). */
export function presentedCitationHtml(context, { id, key, locator }) {
  const label = citationLabel(context, id, locator);
  const data = `data-cite-id="${escapeHtml(id)}" data-cite-key="${escapeHtml(key)}"${locator ? ` data-cite-locator="${escapeHtml(locator)}"` : ""}`;
  if (context.mode === "footnote" && context.sources.some((item) => item.id === id)) {
    return `<sup class="academic-footnote thesis-cite" contenteditable="false" data-fn-id="${escapeHtml(key)}" data-fn-text="${escapeHtml(label)}" ${data}>1</sup>`;
  }
  return `<span class="thesis-cite${context.sources.some((item) => item.id === id) ? "" : " is-missing"}" contenteditable="false" ${data}>${escapeHtml(label)}</span>`;
}

/** Draws every citation of `html` for the context (stored and already-presented elements alike). */
export function renderCitationHtml(html, context) {
  if (!String(html ?? "").includes("thesis-cite")) return String(html ?? "");
  // From the one stored position: footnote marks move after the full stop, labels get a space before them.
  let source = storedCitationHtml(html);
  if (context.mode === "footnote") source = source.replace(BEFORE_STOP, "$2$1");
  return source.replace(CITE_HTML, (all, tag, attrs, offset, whole) => {
    const parts = citationParts(attrs);
    if (!parts.id) return all;
    const presented = presentedCitationHtml(context, parts);
    if (presented.startsWith("<sup")) return presented;
    const before = whole.slice(Math.max(0, offset - 200), offset);
    return !before || /(?:\s|&nbsp;)$/.test(before) || BLOCK_START.test(before) ? presented : ` ${presented}`;
  });
}

/** Removes every citation of one source (used when the source itself is deleted from the pool). */
export function removeSourceCitations(html, sourceId) {
  const source = String(html ?? "");
  if (!source.includes("thesis-cite")) return source;
  return source.replace(CITE_HTML, (all, tag, attrs) => (citationParts(attrs).id === sourceId ? "" : all));
}

// An entry with empty parts ("(t.y.). .") keeps one full stop; "t.y." and an ellipsis are left alone.
const tidyEntry = (text) => String(text).replace(/\s+/g, " ").replace(/\.\s+\./g, ".").trim();

const sortKey = (source) => trim(source.authors) ? "" : trim(source.entryOverride) || trim(source.title);

/**
 * The bibliography: exactly the cited pool sources, one entry each. Author-date and footnote modes sort A→Z by first
 * author surname (then year, title); a source without authors sorts by its title or hand-written text. Numeric: citation order.
 */
export function bibliographyEntries(context) {
  const cited = context.sources.filter((source) => context.cited.includes(source.id));
  const ordered = context.mode === "numeric"
    ? [...cited].sort((a, b) => context.numbers[a.id] - context.numbers[b.id])
    : apa7SortSources(cited.map((source) => ({ ...source, authors: trim(source.authors) || sortKey(source) }))).map((sorted) => cited.find((source) => source.id === sorted.id));
  return ordered.map((source) => {
    const override = trim(source.entryOverride);
    const runs = override ? [{ text: override, italic: false }] : apa7ReferenceRuns(source, cited, context.lang);
    const text = tidyEntry(runs.map((run) => run.text).join(""));
    const html = runs.map((run) => (run.italic ? `<i>${escapeHtml(run.text)}</i>` : escapeHtml(run.text))).join("").replace(/\s{2,}/g, " ").replace(/\.\s+\./g, ".").trim();
    return { id: source.id, text, html, manual: Boolean(override), number: context.numbers[source.id] };
  }).filter((entry) => entry.text);
}

/** The formatted entry a source would get without its hand-written text (shown next to the manual edit). */
export function formattedEntryText(context, source) {
  const cited = context.sources.filter((item) => context.cited.includes(item.id));
  return tidyEntry(apa7ReferenceRuns(normalizeSource({ ...source, entryOverride: undefined }), cited.length ? cited : [source], context.lang).map((run) => run.text).join(""));
}

/** Bibliography list HTML; each entry carries its source id so the page can open that source for editing. */
export function bibliographyListHtml(entries, { numbered = false, legacy = [] } = {}) {
  const rows = [
    ...entries.map((entry) => `<li data-thesis-source-id="${escapeHtml(entry.id)}"${entry.manual ? ' data-thesis-source-manual="true"' : ""}>${numbered ? `${entry.number ?? ""}. ` : ""}${entry.html}</li>`),
    ...legacy.map((text) => `<li>${escapeHtml(text)}</li>`),
  ];
  return rows.length ? `<ul class="thesis-bibliography">${rows.join("")}</ul>` : "";
}

/** Model summary for the editor: how to label a citation of the live DOM, and what the pool panel shows. */
export function citationSummary(context, entries) {
  return {
    mode: context.mode,
    templateMode: context.templateMode,
    lang: context.lang,
    counts: context.counts,
    numbers: context.numbers,
    entryCount: entries.length,
    citedCount: context.cited.length,
    labels: Object.fromEntries(context.sources.map((source) => [source.id, citationLabel(context, source.id)])),
    sources: context.sources,
    cited: context.cited,
  };
}

/**
 * Keeps the live editor DOM in step with the model (labels after a source edit, numbers after a citation was removed)
 * without touching what the user types: only citation atoms change, and only when their label or form differs.
 */
export function decorateCitations(root, summary) {
  if (!root || !summary) return;
  const context = { ...summary };
  const switched = [];
  for (const element of root.querySelectorAll(".thesis-cite[data-cite-id]")) {
    const parts = { id: element.getAttribute("data-cite-id"), key: element.getAttribute("data-cite-key") || "", locator: element.getAttribute("data-cite-locator") || "" };
    const wantsNote = context.mode === "footnote" && context.sources.some((item) => item.id === parts.id);
    const isNote = element.classList.contains("academic-footnote");
    const label = citationLabel(context, parts.id, parts.locator);
    if (wantsNote !== isNote) {
      const template = element.ownerDocument.createElement("template");
      template.innerHTML = presentedCitationHtml(context, parts);
      const next = template.content.firstChild;
      element.replaceWith(next);
      switched.push(next);
    } else if (isNote) {
      if (element.getAttribute("data-fn-text") !== label) element.setAttribute("data-fn-text", label);
    } else {
      if (element.textContent !== label) element.textContent = label;
      // Stored HTML keeps no space before a citation (storedCitationHtml); the editor loads it as stored, so a label gets it here.
      spaceBeforeLabel(element);
    }
  }
  // A mode switch moves the atoms to the other side of the full stop, as renderCitationHtml places them (footnotes in
  // reverse order so "(A)(B)." becomes ".¹²"; labels in document order so ".(A)(B)" becomes "(A) (B).").
  if (context.mode === "footnote") for (const element of switched.reverse()) placeAsFootnote(element);
  else for (const element of switched) placeAsLabel(element);
}

const TRAILING_STOP = /[.!?…]+$/;
const LEADING_STOP = /^[.!?…]+/;

/**
 * The text right before / after an atom, through empty text nodes and transparent inline wrappers (word-justification
 * runs, bold/italic); null at a block edge or another atom. Returns the text node, or the atom for "another citation".
 */
function adjacentText(element, forward) {
  let node = forward ? element.nextSibling : element.previousSibling;
  for (let parent = element.parentNode; !node && parent && /^(SPAN|B|I|EM|STRONG|U)$/.test(parent.tagName) && !parent.classList?.contains("thesis-cite"); parent = parent.parentNode) {
    node = forward ? parent.nextSibling : parent.previousSibling;
  }
  while (node) {
    if (node.nodeType === 3) { if (node.data.length) return node; node = forward ? node.nextSibling : node.previousSibling; continue; }
    if (node.nodeType !== 1 || node.tagName === "BR") return null;
    if (node.matches?.('.thesis-cite,[contenteditable="false"]')) return node;
    const deep = forward ? node.firstChild : node.lastChild;
    node = deep || (forward ? node.nextSibling : node.previousSibling);
  }
  return null;
}

function placeAsFootnote(element) {
  const before = adjacentText(element, false);
  if (before?.nodeType === 3 && /[  ]$/.test(before.data)) before.data = before.data.slice(0, -1);
  const after = adjacentText(element, true);
  const stop = after?.nodeType === 3 ? after.data.match(LEADING_STOP)?.[0] : null;
  if (!stop) return;
  after.data = after.data.slice(stop.length);
  element.before(element.ownerDocument.createTextNode(stop));
}

function placeAsLabel(element) {
  const before = adjacentText(element, false);
  const stop = before?.nodeType === 3 ? before.data.match(TRAILING_STOP)?.[0] : null;
  if (stop) {
    before.data = before.data.slice(0, -stop.length);
    let anchor = element;
    while (anchor.nextSibling?.nodeType === 1 && anchor.nextSibling.classList?.contains("thesis-cite")) anchor = anchor.nextSibling;
    anchor.after(element.ownerDocument.createTextNode(stop));
  }
  spaceBeforeLabel(element);
}

/** "metin (A)" and "(A) (B)": one space before a label unless it starts its block or follows whitespace. */
function spaceBeforeLabel(element) {
  const previous = adjacentText(element, false);
  if (previous && (previous.nodeType === 1 || !/\s$/.test(previous.data))) element.before(element.ownerDocument.createTextNode(" "));
}
