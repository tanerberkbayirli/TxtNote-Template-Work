/**
 * Citation labels and bibliography HTML for academic notes.
 */

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function authorNames(authors) {
  return String(authors ?? "").split(/;|\sand\s|\s&\s/).map((name) => name.trim()).filter(Boolean);
}
function surname(author) {
  return author.includes(",") ? author.split(",")[0].trim() : author.split(/\s+/).at(-1);
}
function authorLabel(source) {
  const names = authorNames(source.authors).map(surname);
  if (names.length > 2) return `${names[0]} ve ark.`;
  return names.join(" & ") || String(source.title ?? "").trim();
}
function yearLabel(source, sources = []) {
  const year = String(source.year ?? "").trim();
  const matches = sources.filter((s) => authorLabel(s) === authorLabel(source) && String(s.year ?? "").trim() === year)
    .sort((a, b) => String(a.title).localeCompare(String(b.title), "tr") || String(a.id).localeCompare(String(b.id)));
  const index = matches.findIndex((s) => s.id === source.id);
  return (year || "t.y.") + (matches.length > 1 && index >= 0 ? String.fromCharCode(97 + index) : "");
}

export function emptySource() {
  return {
    id: "",
    kind: "article",
    authors: "",
    title: "",
    year: "",
    publication: "",
    pages: "",
    volume: "",
    issue: "",
    accessed: "",
    doi: "",
    url: "",
  };
}

export function citeLabel(source, locator = "", sources = []) {
  if (!source) return "(eksik kaynak)";
  const author = authorLabel(source);
  const year = String(source.year ?? "").trim();
  const where = String(locator ?? "").trim();
  return `(${author || "kaynak"}${year ? `, ${yearLabel(source, sources)}` : ""}${where ? `, s. ${where}` : ""})`;
}

export function bibliographyLine(source, sources = []) {
  if (!source) return "";
  const authors = String(source.authors ?? "").trim();
  const year = String(source.year ?? "").trim();
  const title = String(source.title ?? "").trim();
  const publication = String(source.publication ?? "").trim();
  const pages = String(source.pages ?? "").trim();
  const doi = String(source.doi ?? "").trim();
  const url = String(source.url ?? "").trim();
  const parts = [];
  const sentence = (value) => /[.!?]$/.test(value) ? value : `${value}.`;
  if (authors) parts.push(sentence(authors));
  if (year || authors) parts.push(`(${yearLabel(source, sources)}).`);
  if (title) parts.push(sentence(title));
  const volume = String(source.volume ?? "").trim();
  const issue = String(source.issue ?? "").trim();
  if (publication || volume || issue) parts.push(`${publication}${volume ? `${publication ? ", " : ""}${volume}` : ""}${issue ? `(${issue})` : ""}.`);
  if (pages) parts.push(`s. ${pages}.`);
  if (doi) parts.push(`https://doi.org/${doi.replace(/^https?:\/\/doi\.org\//i, "")}`);
  else if (url) parts.push(url);
  if (source.accessed && !doi) parts.push(`Erişim: ${source.accessed}.`);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export function citationHtml(source, locator = "", sources = []) {
  const id = escapeHtml(source?.id ?? "");
  const label = escapeHtml(citeLabel(source, locator, sources));
  return `<span class="academic-cite" data-source-id="${id}" data-locator="${escapeHtml(locator)}" contenteditable="false">${label}</span>\u200B`;
}

export function bibliographyHtml(sources) {
  const rows = (Array.isArray(sources) ? sources : [])
    .slice().sort((a, b) => String(a.authors || a.title).localeCompare(String(b.authors || b.title), "tr") || String(a.year).localeCompare(String(b.year)) || String(a.title).localeCompare(String(b.title), "tr"))
    .map((source) => bibliographyLine(source, sources))
    .filter(Boolean);
  const items = rows.length
    ? rows.map((line) => `<li>${escapeHtml(line)}</li>`).join("")
    : "<li>Henüz kaynak yok.</li>";
  return `<div class="academic-bibliography" contenteditable="false"><div class="academic-bibliography__title">Kaynakça</div><ol>${items}</ol></div>\u200B`;
}

export function refreshCitations(root, sources) {
  if (!root) return;
  const list = Array.isArray(sources) ? sources : [];
  root.querySelectorAll(".academic-cite").forEach((el) => {
    const id = el.getAttribute("data-source-id");
    const source = list.find((item) => item.id === id);
    el.textContent = citeLabel(source, el.getAttribute("data-locator"), list);
  });
  const bib = root.querySelector(".academic-bibliography");
  if (!bib) return;
  const template = document.createElement("template");
  template.innerHTML = bibliographyHtml(list);
  const next = template.content.querySelector(".academic-bibliography");
  if (next) bib.replaceWith(next);
}

export function upsertBibliography(root, sources) {
  if (!root) return;
  const template = document.createElement("template");
  template.innerHTML = bibliographyHtml(sources);
  const next = template.content.querySelector(".academic-bibliography");
  if (!next) return;
  const existing = root.querySelector(".academic-bibliography");
  if (existing) existing.replaceWith(next);
  else {
    if (root.lastChild && root.lastChild.nodeType === Node.TEXT_NODE) {
      root.appendChild(document.createElement("br"));
    }
    root.appendChild(next);
    root.appendChild(document.createTextNode("\u200B"));
  }
}

export function isEventInAcademicBlock(event) {
  return Boolean(
    event.target?.closest?.(".academic-cite, .academic-figure, .academic-bibliography"),
  );
}

export function normalizeHttpUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^(https?:\/\/|mailto:)/i.test(raw)) return raw;
  if (/^\/\//.test(raw)) return `https:${raw}`;
  return `https://${raw}`;
}
