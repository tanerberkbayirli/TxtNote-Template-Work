import { contentNodesFromHtml, contentNodesToHtml } from './contentModel.js';

/** Display formatting only: metadata stored in the note is never rewritten. */
export function formatPlaceholderValue(value, definition, language = 'tr') {
  const text = String(value ?? '');
  if (definition?.nameFormat !== 'surnameUpper') return text;
  return text.replace(/(\S+)(\s*)$/u, (_, surname, trailing) => surname.toLocaleUpperCase(language) + trailing);
}

/** Remove empty flow paragraphs, never table-cell placeholders, anchors or objects. */
export function normalizeFlowParagraphs(html, policy) {
  if (policy !== 'omit') return html;
  let changed = false;
  const empty = node => {
    if (node.type === 'text') return !node.text.replace(/&nbsp;|&#160;|&#x0*a0;/gi, ' ').trim();
    if (!['p', 'br', 'span', 'b', 'strong', 'i', 'em', 'u', 's', 'font'].includes(node.tag)) return false;
    if (Object.keys(node.attributes || {}).some(key => key === 'id' || key === 'name' || key.startsWith('data-'))) return false;
    return (node.children || []).every(empty);
  };
  const clean = nodes => nodes.flatMap((node, index) => {
    // Preserve an editor's leading/trailing insertion paragraph and padding
    // around explicit page breaks. Only redundant gaps inside prose are removed.
    if (node.tag === 'p' && empty(node)) {
      const prose = other => ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'figure', 'table', 'ul', 'ol'].includes(other?.tag) && !empty(other);
      const gap = other => (other.type === 'text' || other.tag === 'p') && empty(other);
      const before = nodes.slice(0, index).findLast(other => !gap(other));
      const after = nodes.slice(index + 1).find(other => !gap(other));
      if (prose(before) && prose(after)) { changed = true; return []; }
    }
    if (['div', 'section', 'article', 'blockquote'].includes(node.tag)) return [{ ...node, children: clean(node.children || []) }];
    return [node];
  });
  const nodes = clean(contentNodesFromHtml(html));
  return changed ? contentNodesToHtml(nodes, { stampIds: false }) : html;
}

/** Strict templates keep drafts editable, but cannot export incomplete thesis information. */
export function thesisExportIssues(model) {
  if (model?.exportValidation !== 'strict') return [];
  const missing = [...new Set((model.sections || []).flatMap(section => section.missingPlaceholders || []))];
  return [...(model.validation?.errors || []), ...missing.map(field => ({
    code: 'requiredMetadata', field,
    message: `${model.placeholderLabels?.[field] || field}: zorunlu tez bilgisini doldurun.`,
  }))];
}

export function assertThesisExportReady(model) {
  const issues = thesisExportIssues(model);
  if (issues.length) throw new Error(`Tez dışa aktarılamadı: ${[...new Set(issues.map(issue => issue.message))].join(' ')}`);
}
