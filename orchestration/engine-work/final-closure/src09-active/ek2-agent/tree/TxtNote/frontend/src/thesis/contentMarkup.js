/** Math toolbar/KaTeX DOM is regenerated from data-latex. In particular its
 * block children inside an inline span cannot be saved and reparsed as HTML:
 * the browser would eject them from the paragraph and duplicate the formula.
 * Keep the authored widget attributes and native sidecar; remove only its view.
 */
const TAG = /<(\/?)([a-zA-Z][\w:-]*)((?:[^<>"']|"[^"]*"|'[^']*')*)>/g;
export function stripMathPresentation(html) {
  const source = String(html ?? ""), ranges = [];
  // Most imported paragraphs have no LaTeX widget. Avoid tokenizing their full
  // markup (including large inline image payloads) just to discover that fact.
  if (!source.includes("math-formula")) return source;
  let widget = null;
  for (const match of source.matchAll(TAG)) {
    const [, close, rawName, attributes] = match, name = rawName.toLowerCase();
    if (widget) {
      if (name === widget.name) widget.depth += close ? -1 : 1;
      if (widget.depth === 0) { ranges.push([widget.start, match.index]); widget = null; }
      continue;
    }
    const classes = attributes.match(/\sclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    if (!close && /\bmath-formula\b/.test(classes?.[1] ?? classes?.[2] ?? "") && /\sdata-latex\s*=/i.test(attributes)) {
      widget = { name, depth: 1, start: match.index + match[0].length };
    }
  }
  // An incomplete authored widget is left intact instead of swallowing text.
  let result = "", previous = 0;
  for (const [start, end] of ranges) { result += source.slice(previous, start); previous = end; }
  return result + source.slice(previous);
}
