/** Give loose text/<br> lines a paragraph before changing its block style. */
export function paragraphAtCaret(root, range) {
  if (!range || !root.contains(range.startContainer)) return null;
  const doc = root.ownerDocument;
  const element = range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentElement;
  const existing = element?.closest('p,h1,h2,h3,h4,h5,h6');
  if (existing && existing !== root && root.contains(existing)) return existing;
  const container = element?.closest('div,li,td,th');
  const host = container && root.contains(container) ? container : root;
  let current = range.startContainer;
  if (current === host) current = host.childNodes[range.startOffset] || null;
  else while (current && current.parentNode !== host) current = current.parentNode;
  const boundary = node => node?.nodeType === 1 && /^(BR|P|DIV|H[1-6]|UL|OL|TABLE|FIGURE|HR)$/.test(node.tagName);
  // A root boundary before a block must not wrap that block inside another paragraph.
  if (current && boundary(current) && current.tagName !== 'BR') {
    return /^(P|H[1-6])$/.test(current.tagName) ? current : null;
  }
  let first = current;
  while (first?.previousSibling && !boundary(first.previousSibling)) first = first.previousSibling;
  const paragraph = doc.createElement('p');
  const caret = { node: range.startContainer, offset: range.startOffset };
  host.insertBefore(paragraph, first);
  let node = first;
  while (node && !boundary(node)) {
    const next = node.nextSibling;
    paragraph.appendChild(node);
    node = next;
  }
  if (node?.nodeName === 'BR') node.remove();
  if (!paragraph.firstChild) paragraph.appendChild(doc.createElement('br'));
  if (paragraph.contains(caret.node)) range.setStart(caret.node, caret.offset);
  else range.setStart(paragraph, 0);
  range.collapse(true);
  return paragraph;
}
