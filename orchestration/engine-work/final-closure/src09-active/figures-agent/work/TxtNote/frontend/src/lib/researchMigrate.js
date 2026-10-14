/**
 * Old araştırma notes become akademik yazı. Empty bodies are filled from the
 * legacy fields; leftover sources stay on `researchData` if present.
 */

const PLAIN_FIELDS = [
  ["sourceTitle", "Kaynak / çalışma adı"],
  ["authors", "Yazar(lar)"],
  ["publicationYear", "Yayın yılı"],
  ["publication", "Dergi / konferans / üniversite"],
  ["doi", "DOI"],
  ["url", "URL"],
  ["keywords", "Anahtar kelimeler"],
];

const RICH_FIELDS = [
  ["abstract", "Özet"],
  ["researchQuestion", "Araştırma Sorusu / Hipotez"],
  ["methodology", "Yöntem / Metodoloji"],
  ["findings", "Bulgular"],
  ["personalNotes", "Kendi Notlarım"],
  ["relatedWorks", "İlişkili Çalışmalar"],
];

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function looksEmpty(value) {
  return !String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\u200B/g, "")
    .trim();
}

function heading(label) {
  return `<span class="fmt-size-subheading">${escapeHtml(label)}</span>`;
}

function section(label, body) {
  if (looksEmpty(body)) return "";
  return `${heading(label)}<br>${body}`;
}

export function flattenResearchData(data) {
  if (!data || typeof data !== "object") return "";

  const chunks = [];
  for (const [field, label] of PLAIN_FIELDS) {
    const value = data[field];
    if (looksEmpty(value)) continue;
    chunks.push(section(label, escapeHtml(String(value))));
  }
  for (const [field, label] of RICH_FIELDS) {
    const html = section(label, data[field]);
    if (html) chunks.push(html);
  }

  const quotes = Array.isArray(data.quotes) ? data.quotes : [];
  quotes.forEach((quote, index) => {
    if (!quote || typeof quote !== "object") return;
    const parts = [];
    if (!looksEmpty(quote.text)) parts.push(quote.text);
    if (!looksEmpty(quote.page)) parts.push(`Sayfa: ${escapeHtml(String(quote.page))}`);
    if (!looksEmpty(quote.comment)) parts.push(escapeHtml(String(quote.comment)));
    if (parts.length === 0) return;
    chunks.push(section(`Alıntı ${index + 1}`, parts.join("<br>")));
  });

  return chunks.join("<br><br>");
}

export function flattenResearchNote(note) {
  const content = looksEmpty(note?.content) ? flattenResearchData(note?.researchData) : (note?.content ?? "");
  return {
    ...note,
    content,
  };
}

function sourcesFromResearch(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.sources)) {
    return data.sources.filter((item) => item && typeof item === "object");
  }
  const sources = [];
  if (!looksEmpty(data.sourceTitle) || !looksEmpty(data.authors) || !looksEmpty(data.doi) || !looksEmpty(data.url)) {
    sources.push({
      id: "legacy-source",
      kind: "article",
      authors: data.authors ?? "",
      title: data.sourceTitle ?? "",
      year: data.publicationYear ?? "",
      publication: data.publication ?? "",
      pages: "",
      doi: data.doi ?? "",
      url: data.url ?? "",
    });
  }
  const quotes = Array.isArray(data.quotes) ? data.quotes : [];
  quotes.forEach((quote, index) => {
    if (!quote || typeof quote !== "object") return;
    if (looksEmpty(quote.text) && looksEmpty(quote.comment)) return;
    sources.push({
      id: quote.id || `legacy-quote-${index + 1}`,
      kind: "other",
      authors: "",
      title: looksEmpty(quote.text) ? `Alıntı ${index + 1}` : String(quote.text).replace(/<[^>]+>/g, " ").trim().slice(0, 80),
      year: "",
      publication: "",
      pages: quote.page ?? "",
      doi: "",
      url: "",
    });
  });
  return sources;
}

/** Old araştırma notes become akademik yazı; keep sources and fill an empty body. */
export function migrateAcademicNote(note) {
  const flattened = flattenResearchNote(note);
  const data = note?.researchData;
  if (!data || typeof data !== "object") {
    return flattened;
  }
  return {
    ...flattened,
    researchData: {
      ...data,
      sources: sourcesFromResearch(data),
      docAuthors: data.docAuthors ?? "",
      institution: data.institution ?? "",
      keywords: data.keywords ?? "",
      docAbstract: data.docAbstract || (looksEmpty(data.abstract) ? "" : String(data.abstract).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()),
    },
  };
}

export function promoteAcademicItem(item) {
  if (!item || (item.noteType !== "research" && item.noteType !== "academic")) return item;
  if (item.noteType === "academic") return item;
  return { ...item, noteType: "academic" };
}
