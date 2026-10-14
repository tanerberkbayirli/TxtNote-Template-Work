/** Native Word equations retain their structured OMML through the HTML compatibility view.
 * The payload is inert attribute text; only math and Word formatting XML can reach the writer.
 */
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { ImportedXmlComponent } from "docx";
import { mathFromLatex } from "../../lib/mathOmml.js";

const M = "http://schemas.openxmlformats.org/officeDocument/2006/math";
const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

function nativeEquationElements(source, keepParagraph) {
  if (typeof source !== "string" || source.length > 2_000_000 || /<!|<\?/i.test(source)) throw new Error("Geçersiz Word denklemi");
  const errors = [];
  const doc = new DOMParser({ errorHandler: { warning: (e) => errors.push(e), error: (e) => errors.push(e), fatalError: (e) => errors.push(e) } })
    .parseFromString(`<root xmlns:m="${M}" xmlns:w="${W}">${source}</root>`, "application/xml");
  const elements = (node) => Array.from(node.childNodes || []).filter((n) => n.nodeType === 1);
  const roots = elements(doc.documentElement);
  if (errors.length || roots.length !== 1 || roots[0].namespaceURI !== M || !["oMath", "oMathPara"].includes(roots[0].localName)) throw new Error("Geçersiz Word denklemi");
  const validate = (node) => {
    if (![M, W].includes(node.namespaceURI)) throw new Error("Word denkleminde desteklenmeyen XML");
    // Equation XML must never introduce relationships, fields, active objects or non-math paragraphs.
    if (node.namespaceURI === W && !/^(?:rPr|rFonts|b|bCs|i|iCs|caps|smallCaps|strike|dstrike|outline|shadow|emboss|imprint|noProof|snapToGrid|vanish|webHidden|color|spacing|w|kern|position|sz|szCs|highlight|u|effect|bdr|shd|fitText|vertAlign|rtl|cs|em|lang|eastAsianLayout|specVanish|oMath|rStyle)$/.test(node.localName)) throw new Error("Word denkleminde desteklenmeyen biçim");
    elements(node).forEach(validate);
  };
  validate(roots[0]);
  const root = roots[0];
  // m:oMathPara is a legal w:p child, but Word only shows it as display math when it is the paragraph's sole content;
  // beside a tab/number (numbered equations) or text the oMath children are written inline (matrix/n-ary/accent and
  // font properties remain intact either way).
  if (root.localName === "oMathPara" && keepParagraph) {
    if (!elements(root).some((n) => n.namespaceURI === M && n.localName === "oMath")) throw new Error("Boş Word denklemi");
    return [root];
  }
  const math = root.localName === "oMathPara" ? elements(root).filter((n) => n.namespaceURI === M && n.localName === "oMath") : [root];
  if (!math.length) throw new Error("Boş Word denklemi");
  return math;
}

export function nativeEquationXml(source, { keepParagraph = false } = {}) {
  const serializer = new XMLSerializer();
  return nativeEquationElements(source, keepParagraph).map((node) => serializer.serializeToString(node));
}

/** Component tree straight from the validated DOM. docx's string importer drops whitespace-only text, which would
 * delete Word's significant `<m:t xml:space="preserve"> </m:t>` spaces; here text inside m:t/w:t is kept verbatim. */
function component(node) {
  const attributes = {};
  for (const a of Array.from(node.attributes || [])) attributes[a.name] = a.value;
  const out = new ImportedXmlComponent(node.nodeName, Object.keys(attributes).length ? attributes : undefined);
  const textElement = node.localName === "t";
  for (const child of Array.from(node.childNodes || [])) {
    if (child.nodeType === 1) out.push(component(child));
    else if ((child.nodeType === 3 || child.nodeType === 4) && (textElement || /\S/.test(child.nodeValue || ""))) out.push(child.nodeValue);
  }
  return out;
}

/** `soleContent`: the equation is the only thing in its paragraph, so a source m:oMathPara (display math, with its
 * justification) is written as is. */
export function equationRun(item, style = {}, { soleContent = false } = {}) {
  if (!item.omml) return mathFromLatex(item.latex || item.text, style, { strictUnsupported: true });
  // Several m:oMath of one m:oMathPara become sibling paragraph children (never a synthetic wrapper tag).
  const nodes = nativeEquationElements(item.omml, soleContent).map(component);
  return nodes.length === 1 ? nodes[0] : nodes;
}

