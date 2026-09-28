/** Tauri assigns a per-document nonce to this static, bundled style element.
 * Read the property: browsers deliberately hide nonce attribute values.
 * Never obtain a nonce from editable/user-provided HTML.
 */
export function trustedStyleNonce(documentRoot = globalThis.document) {
  return documentRoot?.getElementById("txtnote-trusted-style")?.nonce || "";
}

export function styleNonceAttribute(nonce = "") {
  return nonce ? ` nonce="${String(nonce).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]))}"` : "";
}

const TAG = /<(\/?)([a-zA-Z][\w:-]*)((?:[^"'<>]|"[^"]*"|'[^']*')*)>/g;
const ATTRIBUTE = /(\s+)([^\s=/>]+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/g;
/** Rendered formulas and highlighted code are widgets that re-render themselves; their styles stay. */
const WIDGET = /\sclass\s*=\s*(?:"[^"]*|'[^']*|)\b(?:math-formula|code-block)\b/i;

/** Editor HTML never needs a style attribute: formats are fmt-* classes and image
 * dimensions persist as width/height. Chromium's editing commands still add them
 * (image resize, `<span style>` when merging blocks), and the production CSP reports
 * each one even while parsing an inert template, so they are dropped from the string
 * before it is parsed. Match complete attributes so quoted alt/src values containing
 * `style=` survive.
 */
export function withoutInlineStyleAttributes(html) {
  const source = String(html ?? "");
  if (!/\sstyle\s*=/i.test(source)) return source;
  let widget = null;
  return source.replace(TAG, (tag, close, name, attributes) => {
    const tagName = name.toLowerCase();
    if (widget) {
      if (tagName === widget.name) widget.depth += close ? -1 : 1;
      if (!widget.depth) widget = null;
      return tag;
    }
    if (close) return tag;
    if (WIDGET.test(attributes)) {
      widget = { name: tagName, depth: 1 };
      return tag;
    }
    return `<${name}${attributes.replace(ATTRIBUTE, (attribute, space, attributeName) => attributeName.toLowerCase() === "style" ? "" : attribute)}>`;
  });
}
