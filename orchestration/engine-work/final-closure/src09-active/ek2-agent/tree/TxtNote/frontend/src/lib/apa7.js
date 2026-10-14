/**
 * APA 7 helper kit: a standalone tool, used on demand. No template, engine or editor imports it by default.
 * Source objects use the same shape as academicCite.js (emptySource()): authors ("Soyad, A.; Soyad, B."), year, title,
 * publication, volume, issue, pages, doi, url, kind ("article" | "book" | "chapter" | "web" | "thesis" ...).
 * Not covered: reference types beyond the common ones, group authors, translated works, direct-quote block formatting.
 */

const escapeHtml = (text) => String(text ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const trim = (value) => String(value ?? "").trim();
const sentence = (value) => (/[.!?]$/.test(value) ? value : `${value}.`);

export const APA7_HANGING_INDENT_MM = 12.7; // 0.5 in

function splitAuthors(authors) {
  return trim(authors).split(/;|\sand\s|\sve\s|\s&\s/).map((name) => name.trim()).filter(Boolean);
}
const surname = (name) => (name.includes(",") ? name.split(",")[0].trim() : name.split(/\s+/).at(-1));
// "Ada Lovelace" -> "Lovelace, A." ; "Lovelace, Ada" -> "Lovelace, A." ; "Lovelace, A." stays.
function referenceName(name) {
  const [last, rest = ""] = name.includes(",") ? name.split(/,(.*)/s).map((part) => part.trim()) : [surname(name), name.split(/\s+/).slice(0, -1).join(" ")];
  const initials = rest.split(/\s+/).filter(Boolean).map((part) => (/^(\p{L}\.)+$/u.test(part) || /^\p{L}$/u.test(part) ? part.replace(/\.?$/, ".") : `${part[0].toLocaleUpperCase("tr")}.`)).join(" ");
  return initials ? `${last}, ${initials}` : last;
}
function referenceAuthors(authors) {
  const names = splitAuthors(authors).map(referenceName);
  if (names.length <= 1) return names[0] || "";
  if (names.length <= 20) return `${names.slice(0, -1).join(", ")}, & ${names.at(-1)}`;
  return `${names.slice(0, 19).join(", ")}, ... ${names.at(-1)}`; // 21+: first 19, ellipsis, last
}

/** In-text author part: 1 name, "A & B" (parenthetical) / "A ve B" (narrative, tr), 3+ -> "A vd." (tr) or "A et al.". */
function citationAuthors(source, { lang, narrative }) {
  const names = splitAuthors(source.authors).map(surname);
  const and = narrative ? (lang === "tr" ? "ve" : "and") : "&";
  if (names.length >= 3) return `${names[0]} ${lang === "tr" ? "vd." : "et al."}`;
  if (names.length === 2) return `${names[0]} ${and} ${names[1]}`;
  return names[0] || trim(source.title);
}

/** a, b, c suffix for same author(s) + year, ordered by title, as APA requires. */
export function apa7YearLabel(source, sources = [], lang = "tr") {
  const year = trim(source.year) || (lang === "tr" ? "t.y." : "n.d.");
  const key = (s) => `${splitAuthors(s.authors).map(surname).join("|")}|${trim(s.year)}`;
  const same = sources.filter((s) => key(s) === key(source)).sort((a, b) => trim(a.title).localeCompare(trim(b.title), "tr") || trim(a.id).localeCompare(trim(b.id)));
  const index = same.findIndex((s) => s.id === source.id);
  return year + (same.length > 1 && index >= 0 ? String.fromCharCode(97 + index) : "");
}

/** (Yazar, 2020) | (Yazar & Yazar, 2020, s. 5) | narrative: Yazar (2020) */
export function apa7Citation(source, { locator = "", sources = [], lang = "tr", narrative = false } = {}) {
  if (!source) return lang === "tr" ? "(eksik kaynak)" : "(missing source)";
  const authors = citationAuthors(source, { lang, narrative });
  const year = apa7YearLabel(source, sources, lang);
  const where = trim(locator);
  const page = where ? `${/[–-]/.test(where) ? (lang === "tr" ? "ss." : "pp.") : (lang === "tr" ? "s." : "p.")} ${where}` : "";
  if (narrative) return `${authors} (${year}${page ? `, ${page}` : ""})`;
  return `(${authors}, ${year}${page ? `, ${page}` : ""})`;
}

/** Reference-list entry as run list [{text, italic}] so any renderer (HTML, DOCX runs) can use it. */
export function apa7ReferenceRuns(source, sources = [], lang = "tr") {
  if (!source) return [];
  const authors = referenceAuthors(source.authors);
  const title = trim(source.title);
  const publication = trim(source.publication);
  const volume = trim(source.volume);
  const issue = trim(source.issue);
  const pages = trim(source.pages);
  const kind = trim(source.kind) || "article";
  const doi = trim(source.doi).replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  const link = doi ? `https://doi.org/${doi}` : trim(source.url);
  const runs = [];
  const push = (text, italic = false) => { if (text) runs.push({ text, italic }); };
  if (authors) push(`${sentence(authors)} `);
  push(`(${apa7YearLabel(source, sources, lang)}). `);
  if (kind === "article") {
    if (title) push(`${sentence(title)} `);
    if (publication) push(publication, true);
    if (volume) { push(publication ? ", " : ""); push(volume, true); }
    if (issue) push(`(${issue})`);
    if (pages) push(`${publication || volume ? ", " : ""}${pages.replace(/-/g, "–")}`);
    push(".");
  } else if (kind === "chapter") {
    if (title) push(`${sentence(title)} `);
    if (publication) { push(lang === "tr" ? "İçinde " : "In "); push(publication, true); }
    if (pages) push(` (${lang === "tr" ? "ss." : "pp."} ${pages.replace(/-/g, "–")})`);
    push(".");
  } else {
    // book, thesis, web, report ...: italic title, publisher/site as the source element.
    if (title) push(title, true);
    if (kind === "thesis") push(lang === "tr" ? " [Yayımlanmamış yüksek lisans/doktora tezi]" : " [Unpublished thesis]");
    push(".");
    if (publication) push(` ${sentence(publication)}`);
  }
  if (link) push(` ${link}`);
  return runs.map((run) => ({ ...run, text: run.text.replace(/\.\.+/g, ".").replace(/\s{2,}/g, " ") }));
}
const runsText = (runs) => runs.map((run) => run.text).join("").replace(/\s+/g, " ").trim();
const runsHtml = (runs) => runs.map((run) => (run.italic ? `<i>${escapeHtml(run.text)}</i>` : escapeHtml(run.text))).join("").trim();

export function apa7Reference(source, sources = [], lang = "tr") { return runsText(apa7ReferenceRuns(source, sources, lang)); }

/** Alphabetical (first author surname, then year, then title), as APA requires; numbering is never added. */
export function apa7SortSources(sources) {
  const first = (s) => splitAuthors(s.authors).map(surname)[0] || trim(s.title);
  return [...(Array.isArray(sources) ? sources : [])].sort((a, b) => first(a).localeCompare(first(b), "tr") || trim(a.year).localeCompare(trim(b.year)) || trim(a.title).localeCompare(trim(b.title), "tr"));
}
export function apa7Bibliography(sources, lang = "tr") {
  const list = Array.isArray(sources) ? sources : [];
  return apa7SortSources(list).map((source) => ({ id: source.id, runs: apa7ReferenceRuns(source, list, lang) })).filter((entry) => entry.runs.length);
}
/** Unnumbered paragraphs with a 1.27 cm hanging indent, ready for HTML renderers. */
export function apa7BibliographyHtml(sources, lang = "tr") {
  return apa7Bibliography(sources, lang)
    .map((entry) => `<p style="margin:0 0 0 ${APA7_HANGING_INDENT_MM}mm;text-indent:-${APA7_HANGING_INDENT_MM}mm">${runsHtml(entry.runs)}</p>`)
    .join("");
}

/** Cross-check: every citation key appears in the list and vice versa. Returns {uncited, missing}. */
export function apa7CheckCoverage(citedIds, sources) {
  const cited = new Set(citedIds);
  const ids = new Set((sources || []).map((s) => s.id));
  return { uncited: [...ids].filter((id) => !cited.has(id)), missing: [...cited].filter((id) => !ids.has(id)) };
}

/**
 * Opt-in: returns a COPY of a thesis template whose reference list follows APA 7 (hanging indent 1.27 cm, double spacing,
 * left aligned, no extra paragraph gap). The template itself is never modified, and numbered-style templates (Vancouver)
 * are refused, because their university rule overrides APA. Everything else the university prescribes (margins, fonts,
 * heading look, table/figure captions) is left alone.
 */
export function withApa7Bibliography(template, { lineHeight = 2 } = {}) {
  const bibliography = template?.bibliography;
  if (!bibliography) throw new Error("Template has no bibliography rule.");
  const declared = `${bibliography.citationStyle || ""} ${template.citationStyle || ""}`;
  if (/numeric|vancouver/i.test(declared) || /numbered|numeric/i.test(template.id || "")) throw new Error(`This template prescribes a numbered citation style (${declared.trim() || template.id}); APA 7 does not apply.`);
  return {
    ...template,
    bibliography: {
      ...bibliography,
      citationStyle: "APA 7",
      // The hanging indent goes into style, never into the top-level hangingIndentMm (that one is added as a plain left indent).
      style: { ...bibliography.style, align: "left", lineHeight, spaceBeforePt: 0, spaceAfterPt: 0, hangingIndentMm: APA7_HANGING_INDENT_MM, firstLineIndentMm: 0 },
    },
  };
}
