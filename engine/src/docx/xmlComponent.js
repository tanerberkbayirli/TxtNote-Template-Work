import { ImportedXmlComponent } from './runtime.js';

/** docx's string importer trims text, including significant spaces between
 * rich runs in native shapes. Convert the already validated DOM directly. */
export function nativeXmlComponent(node) {
  const attributes=Object.fromEntries(Array.from(node.attributes || []).map(a=>[a.name,a.value]));
  const out=new ImportedXmlComponent(node.nodeName,Object.keys(attributes).length?attributes:undefined);
  const textElement=['t','delText','instrText'].includes(node.localName);
  for (const child of Array.from(node.childNodes || [])) {
    if (child.nodeType===1)out.push(nativeXmlComponent(child));
    else if ([3,4].includes(child.nodeType) && (textElement || /\S/u.test(child.nodeValue || '')))out.push(child.nodeValue);
  }
  return out;
}
