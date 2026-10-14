import { plainThesisText } from "./sourceHtml.js";

const normalizedHeading = value => plainThesisText(value).normalize("NFKC").toLocaleUpperCase("tr").replace(/^\s*(?:[IVXLCDM]+|\d+(?:\.\d+)*)[.)]?\s+/u, "").replace(/\s+/g," ").trim();

/** Source-backed structural checks. They report draft problems; they never rewrite author text. */
export function contentRuleIssues(field, rule, html) {
  const issues = [];
  const issue = (code, actual, message, expected) => issues.push({ code, field, actual, expected, message });
  const source = String(html || "");
  const visible = plainThesisText(source);
  if (rule.headingSequence) {
    const level = rule.headingLevel || 1;
    const headings = [...source.matchAll(new RegExp(`<h${level}\\b[^>]*>([\\s\\S]*?)<\\/h${level}>`, "gi"))].map(match => normalizedHeading(match[1]));
    const positions = rule.headingSequence.map(group => headings.findIndex(heading => (Array.isArray(group) ? group : [group]).some(title => normalizedHeading(title) === heading)));
    const missing = rule.headingSequence.filter((_, index) => positions[index] < 0).map(group => (Array.isArray(group) ? group : [group]).join(" / "));
    if (missing.length) issue("missingHeadings", missing, `Eksik ana bölümler: ${missing.join(", ")}.`, rule.headingSequence);
    else if (positions.some((position,index) => index > 0 && position <= positions[index-1])) issue("headingOrder", headings, "Ana bölümleri kılavuzdaki sıraya göre düzenleyin.", rule.headingSequence);
  }
  if (rule.numericCitations && visible.trim()) {
    const authorYear = visible.match(/\([\p{L}\s’'.,&;\-]+,\s*(?:18|19|20)\d{2}[a-z]?[^)]*\)/gu) || [];
    if (authorYear.length) issue("authorYearCitation", authorYear.slice(0,3), "Bu şablonda atıflar geçiş sırasına göre parantez içinde sayısal olmalıdır; yazar-yıl biçimindeki atıfları kontrol edin.");
    const numbers = [...visible.matchAll(/\((\d+(?:\s*[,;–-]\s*\d+)*)\)/g)].flatMap(match => match[1].split(/[,;–-]/).map(Number));
    if (!numbers.length) issue("numericCitationsMissing", 0, "Metinde parantez içinde sayısal atıf bulunamadı; kaynak gösterimini kontrol edin.");
    // A range contributes its first and last endpoints here, so only single
    // numbers/lists can establish a missing first-use number unambiguously.
    const singles = [...visible.matchAll(/\((\d+(?:\s*[,;]\s*\d+)*)\)/g)].flatMap(match => match[1].split(/[,;]/).map(Number));
    const firstUses = [...new Set(singles)];
    if (!/\(\d+\s*[–-]\s*\d+/.test(visible) && firstUses.some((number,index) => number !== index+1)) issue("citationOrder", firstUses, "Kaynak numaralarının ilk geçişi 1'den başlayarak sırayla ilerlemelidir.");
  }
  if (rule.numberedEntries && visible.trim()) {
    // An authored ordered list already provides visible automatic numbers.
    const numberedLists = source.replace(/<ol\b([^>]*)>([\s\S]*?)<\/ol>/gi, (_, attrs, content) => {
      let number = Number(attrs.match(/\bstart=["']?(\d+)/i)?.[1] || 1);
      return content.replace(/<li\b([^>]*)>/gi, (tag, liAttrs) => {
        const explicit = liAttrs.match(/\bvalue=["']?(\d+)/i)?.[1];
        if (explicit) number = Number(explicit);
        return `${tag}${number++}. `;
      });
    });
    const rows = [...numberedLists.matchAll(/<(p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map(match => plainThesisText(match[2]).trim()).filter(Boolean);
    const entries = rows.length ? rows : visible.split(/\n/).map(row => row.trim()).filter(Boolean);
    const numbers = entries.map(row => Number(row.match(/^(\d+)[.)]\s*/)?.[1] || 0));
    if (!numbers.length || numbers.some((number,index) => number !== index+1)) issue("numberedBibliography", numbers, "Kaynakça girdilerini 1'den başlayarak metindeki ilk geçiş sırasına göre numaralayın.");
  }
  return issues;
}

/** Counts must come from settled physical pagination, never from word counts. */
export function validateThesisPageCounts(model, counts = {}) {
  return (model?.sections || []).flatMap(section => {
    if (!section.maxPages || !Number.isFinite(counts[section.id]) || counts[section.id] <= section.maxPages) return [];
    return [{ code:"maxPages", field:section.id, expected:section.maxPages, actual:counts[section.id], message:`${section.title}: kılavuz en fazla ${section.maxPages} sayfa öngörüyor; mevcut çıktı ${counts[section.id]} sayfa.` }];
  });
}
