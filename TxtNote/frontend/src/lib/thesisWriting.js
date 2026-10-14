import { plainThesisText } from '../../../../engine/src/sourceHtml.js';

export const headingLabels = {1: 'Ana bölüm', 2: 'Alt başlık', 3: 'Alt başlığın altı', 4: 'Dördüncü düzey', 5: 'Beşinci düzey', 6: 'Altıncı düzey'};
export const normalizeWritingHeading = value => plainThesisText(value).toLocaleUpperCase('tr').replace(/^\s*\d+(?:\.\d+)*[.)]?\s+/, '').trim();
export const escapeWritingText = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
export function citationWithSpacing(text, before = '', after = '') {
  const value = String(text).trim();
  return `${/[\p{L}\p{N})\]]$/u.test(before) ? ' ' : ''}${value}${/^[\p{L}\p{N}]/u.test(after) ? ' ' : ''}`;
}

/** A conservative view of existing authored references; the original rich HTML stays intact. */
export function authoredReferences(html = '') {
  const source = String(html);
  const lists = [];
  let cursor = 0;
  return [...source.matchAll(/<(p|li)\b([^>]*)>([\s\S]*?)<\/\1>/gi)].flatMap(match => {
    for (const tag of source.slice(cursor, match.index).matchAll(/<(\/?)(ol|ul)\b([^>]*)>/gi)) {
      if (tag[1]) lists.pop();
      else lists.push({ordered: tag[2].toLowerCase() === 'ol', next: Number(tag[3].match(/\bstart=["']?(\d+)/i)?.[1] || 1)});
    }
    cursor = match.index + match[0].length;
    const text = plainThesisText(match[3]);
    if (!text) return [];
    const explicit = text.match(/^(\d+)[.)]\s+/);
    const list = lists.at(-1);
    const automatic = match[1].toLowerCase() === 'li' && list?.ordered ? Number(match[2].match(/\bvalue=["']?(\d+)/i)?.[1] || list.next) : null;
    if (automatic !== null) list.next = automatic + 1;
    const number = explicit ? Number(explicit[1]) : automatic;
    return [{text, number, start: match.index, end: match.index + match[0].length}];
  });
}

export function managedReferences(items = []) {
  return items.map((text,index) => ({text:String(text),index,key:`item-${index}`})).filter(entry => entry.text.trim()).map((entry,index) => ({...entry,number:index+1}));
}

export function numericReferenceOrder(records) {
  return records.length > 0 && records.every((record, index) => record.number === index + 1);
}

/** Append without flattening existing italics, hyperlinks, identifiers or imported markup. */
export function appendAuthoredReference(html, text, numeric = false) {
  const source = String(html || '');
  const rows = authoredReferences(source);
  if (numeric && !numericReferenceOrder(rows)) return null;
  const clean = escapeWritingText(String(text).trim().replace(numeric ? /^\d+[.)]\s+/ : /$^/, ''));
  if (!clean) return source;
  if (numeric && /<ol\b/i.test(source) && /<\/ol>\s*$/i.test(source)) {
    return source.replace(/<\/ol>(\s*)$/i, `<li>${clean}</li></ol>$1`);
  }
  return `${source}<p>${numeric ? `${rows.length + 1}. ` : ''}${clean}</p>`;
}

export function requiredHeadingChoices(template, sectionId, html = '') {
  const rule = template?.validation?.[sectionId];
  const level = rule?.headingLevel || 1;
  const normal = normalizeWritingHeading;
  const existing = [...String(html).matchAll(new RegExp(`<h${level}\\b[^>]*>([\\s\\S]*?)<\\/h${level}>`, 'gi'))].map(match => normal(match[1]));
  return (rule?.headingSequence || []).map(group => {
    const options = Array.isArray(group) ? group : [group];
    return {title: options[0], alternatives: options, level, present: options.some(title => existing.includes(normal(title)))};
  });
}
