const M = "http://schemas.openxmlformats.org/officeDocument/2006/math";
const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
/** Word uses display math only for a paragraph containing one equation and no
 * other drawing content. Even a preserved space in a separate run makes it
 * inline math; bookmarks and proofing/formatting markers do not. */
export function inlineEquationContext(paragraph) {
  let equations = 0, other = false;
  const visit = node => {
    if (node.namespaceURI === M && ["oMath", "oMathPara"].includes(node.localName)) { equations++; return; }
    if (node.namespaceURI === W) {
      if (["pPr", "rPr"].includes(node.localName)) return;
      if (["t", "delText"].includes(node.localName) && node.textContent.length) other = true;
      if (["tab", "br", "cr", "drawing", "pict", "object", "sym", "footnoteReference", "endnoteReference"].includes(node.localName)) other = true;
    }
    Array.from(node.childNodes || []).filter(n => n.nodeType === 1).forEach(visit);
  };
  visit(paragraph);
  return other || equations !== 1;
}
/** Document-wide Word defaults are consulted only when a n-ary has no limLoc. */
export function equationMathSettings(settings) {
  const mathPr = Array.from(settings?.childNodes || []).find(n => n.namespaceURI === M && n.localName === "mathPr");
  const location = (name, fallback) => {
    const element = Array.from(mathPr?.childNodes || []).find(n => n.namespaceURI === M && n.localName === name);
    const val = element?.getAttributeNS(M, "val");
    return ["subSup", "undOvr"].includes(val) ? val : fallback;
  };
  const mathFont = Array.from(mathPr?.childNodes || []).find(n => n.namespaceURI === M && n.localName === "mathFont")?.getAttributeNS(M, "val");
  return { naryLimit: location("naryLim", "undOvr"), integralLimit: location("intLim", "subSup"), ...(mathFont ? { mathFont } : {}) };
}
/** A safe MathML compatibility view; the original OMML remains the export authority. */
export function equationPreview(node, { naryLimit = "undOvr", integralLimit = "subSup", inlineMath, mathFont = "Cambria Math" } = {}) {
  const kids = (n) => Array.from(n?.childNodes || []).filter((c) => c.nodeType === 1);
  const child = (n, name) => kids(n).find((c) => c.localName === name);
  const text = (value) => ({ text: String(value || "") });
  const el = (tag, children = [], attributes = {}) => ({ tag, attributes, children });
  const value = (n, name, fallback = "") => child(n, name)?.getAttributeNS(M, "val") || fallback;
  const visit = (n) => {
    const row = (part) => el("mrow", kids(part).filter((c) => !/Pr$/.test(c.localName)).map(visit));
    const arg = (name) => row(child(n, name));
    switch (n.localName) {
      case "t": return el("mi", [text(n.textContent)]);
      case "f": {
        const type = value(child(n, "fPr"), "type", "bar");
        const numerator = arg("num"), denominator = arg("den");
        if (type === "lin") return el("mrow", [numerator, el("mo", [text("⁄")], { stretchy: "false", lspace: "0", rspace: "0" }), denominator]);
        return el("mfrac", [numerator, denominator], type === "noBar" ? { linethickness: "0" } : {});
      }
      case "sSup": return el("msup", [arg("e"), arg("sup")]);
      case "sSub": return el("msub", [arg("e"), arg("sub")]);
      case "sSubSup": return el("msubsup", [arg("e"), arg("sub"), arg("sup")]);
      case "rad": return value(child(n, "radPr"), "degHide") === "1" || !child(n, "deg")?.textContent ? el("msqrt", [arg("e")]) : el("mroot", [arg("e"), arg("deg")]);
      case "m": {
        const pr = child(n, "mPr");
        // Word's default matrix rows have at least one Cambria Math hhea line
        // (ascent 1595 + gap 353, descent 455, UPM 2048). MathML Core otherwise
        // stacks only ink boxes, making three ordinary rows about a line short.
        // Leave explicitly authored row spacing and other math fonts alone.
        const defaultRows = mathFont.toLowerCase() === "cambria math" && !child(pr, "rSp") && !child(pr, "rSpRule");
        return el("mtable", kids(n).filter((c) => c.localName === "mr").map((r) => el("mtr", kids(r).filter((c) => c.localName === "e").map((c) => el("mtd", [...(defaultRows ? [el("mspace", [], { width: "0", height: "0.951171875em", depth: "0.22216796875em" })] : []), row(c)])))));
      }
      case "nary": {
        const pr = child(n, "naryPr"), character = value(pr, "chr", "∫");
        // Word places sum/product limits above and below by default, integral limits at the side.
        // Explicit limLoc wins; hidden limits must take no space in the compatibility view.
        const limitLocation = child(pr, "limLoc");
        const underOver = !inlineMath && (limitLocation ? limitLocation.getAttributeNS(M, "val") || "undOvr" : /^[∫-∳]$/u.test(character) ? integralLimit : naryLimit) === "undOvr";
        const hidden = (name) => Boolean(child(pr, name)) && !["0", "false", "off"].includes(value(pr, name).toLowerCase());
        const sub = !hidden("subHide"), sup = !hidden("supHide");
        const op = el("mo", [text(character)], { movablelimits: "false", ...(inlineMath ? { largeop: "false" } : {}) });
        const attributes = underOver ? { displaystyle: "true" } : {};
        const lower = arg("sub"), upper = arg("sup"), body = arg("e");
        // Word moves text from a hidden argument to the next visible argument.
        // Preserve even contradictory source content instead of dropping it.
        if (!sub) upper.children.unshift(...lower.children);
        if (!sup) body.children.unshift(...upper.children);
        const limits = sub && sup ? el(underOver ? "munderover" : "msubsup", [op, lower, upper], attributes)
          : sub ? el(underOver ? "munder" : "msub", [op, lower], attributes)
          : sup ? el(underOver ? "mover" : "msup", [op, upper], attributes) : op;
        return el("mrow", [limits, body]);
      }
      case "acc": return el("mover", [arg("e"), el("mo", [text(value(child(n, "accPr"), "chr", "ˆ"))])], { accent: "true" });
      case "bar": return el(value(child(n, "barPr"), "pos") === "bot" ? "munder" : "mover", [arg("e"), el("mo", [text("¯")])]);
      case "limLow": return el("munder", [arg("e"), arg("lim")]);
      case "limUpp": return el("mover", [arg("e"), arg("lim")]);
      case "d": {
        const pr = child(n, "dPr");
        // A missing property uses Word's default; a present empty property hides it.
        const character = (name, fallback) => child(pr, name) ? child(pr, name).getAttributeNS(M, "val") || "" : fallback;
        const begin = character("begChr", "("), end = character("endChr", ")"), separator = character("sepChr", "|");
        const parts = [];
        if (begin) parts.push(el("mo", [text(begin)], { fence: "true" }));
        for (const argument of kids(n).filter((c) => c.localName === "e")) {
          if (parts.length > (begin ? 1 : 0) && separator) parts.push(el("mo", [text(separator)], { separator: "true" }));
          parts.push(row(argument));
        }
        if (end) parts.push(el("mo", [text(end)], { fence: "true" }));
        return el("mrow", parts);
      }
      case "eqArr": return el("mtable", kids(n).filter((c) => c.localName === "e").map((c) => el("mtr", [el("mtd", [row(c)])])));
      default: return row(n);
    }
  };
  return el("math", [visit(node)], { xmlns: "http://www.w3.org/1998/Math/MathML", display: node.localName === "oMathPara" ? "block" : "inline", ...(inlineMath !== undefined ? { displaystyle: inlineMath ? "false" : "true" } : {}) });
}


