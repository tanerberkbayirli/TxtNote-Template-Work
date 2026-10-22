import { attr, child, descendants, elements, isWord, val } from "./importPackage.js";
import { resolveSourcePageFrame } from "../sourcePageFrame.js";
import { readParagraphProperties, readRunProperties } from "./properties.js";

/** The common Word page-number textbox (DrawingML choice, never its VML duplicate). */
export function readPositionedPage(root, page, styles, report) {
  const anchors = descendants(root, n => n.localName === "anchor" && n.namespaceURI?.includes("wordprocessingDrawing"));
  if (anchors.length !== 1) return null;
  const anchor = anchors[0], find = (node, name) => descendants(node, n => n.localName === name)[0];
  const box = find(anchor, "txbxContent");
  if (!box) return null;
  const outsideText = descendants(root, n => isWord(n, "t")).some(n => {
    if (!n.textContent.trim()) return false;
    for (let parent = n.parentNode; parent && parent !== root; parent = parent.parentNode) {
      if (isWord(parent, "drawing") || isWord(parent, "pict")) return false;
    }
    return true;
  });
  if (outsideText) return null;
  const text = readChromeText(box, report).trim();
  if (text !== "{{PAGE}}") return null;
  const h = find(anchor, "positionH"), v = find(anchor, "positionV"), extent = find(anchor, "extent"), body = find(anchor, "bodyPr");
  const emu = value => Number(value || 0) / 36000;
  const width = emu(extent?.getAttribute("cx")), height = emu(extent?.getAttribute("cy"));
  const base = (node, vertical) => {
    const relative = node?.getAttribute("relativeFrom"), offset = find(node, "posOffset");
    const margin = page.margins || {};
    const origins = vertical ? { page: 0, margin: margin.topMm, topMargin: 0, bottomMargin: page.heightMm - margin.bottomMm }
      : { page: 0, margin: margin.leftMm, leftMargin: 0, rightMargin: page.widthMm - margin.rightMm };
    if (!offset || !Number.isFinite(origins[relative])) return NaN;
    return origins[relative] + emu(offset.textContent);
  };
  const left = emu(body?.getAttribute("lIns")), right = emu(body?.getAttribute("rIns")), top = emu(body?.getAttribute("tIns")), bottom = emu(body?.getAttribute("bIns"));
  const position = { xMm: base(h, false) + left, yMm: base(v, true) + top, widthMm: width - left - right, heightMm: height - top - bottom };
  if (!Object.values(position).every(Number.isFinite) || position.widthMm <= 0 || position.heightMm <= 0) return null;
  const p = find(box, "p"), pr = child(p, "pPr"), pid = val(pr, "pStyle") || styles.defaultParagraphId;
  const para = styles.paragraph(pid, readParagraphProperties(pr));
  const r = styles.run(pid, "", readRunProperties(child(find(p, "r"), "rPr"), styles.theme));
  return { text, position, style: { align: para.align || "left", fontFamily: r.fontFamily || "Times New Roman", fontSizePt: r.fontSizePt || 11, fontWeight: r.bold ? 700 : 400, italic: Boolean(r.italic) } };
}

/** Interpret only plain header/footer paragraphs and PAGE/NUMPAGES fields.
 * Keep source XML and report richer chrome instead of silently claiming fidelity. */
export function readChromeText(root, report) {
  let output = "", depth = 0, instruction = "", result = false;
  const field = (code, node) => {
    const name = String(code).trim().split(/\s+/)[0]?.toUpperCase();
    if (["PAGE", "NUMPAGES"].includes(name)) return `{{${name}}}`;
    report("header-footer-field", node, "Üst/alt bilgide desteklenmeyen alan korundu: " + code);
    return "";
  };
  const walk = node => {
    if (isWord(node, "fldSimple")) { output += field(attr(node, "instr"), node); return; }
    if (isWord(node, "fldChar")) {
      const kind = attr(node, "fldCharType");
      if (kind === "begin") { depth++; instruction = ""; result = false; }
      if (kind === "separate") { output += field(instruction, node); result = true; }
      if (kind === "end") { if (!result) output += field(instruction, node); depth = Math.max(0, depth - 1); result = false; }
      return;
    }
    if (isWord(node, "instrText")) { instruction += node.textContent || ""; return; }
    if (isWord(node, "t")) { if (!depth) output += node.textContent || ""; return; }
    if (["drawing", "pict", "tbl", "object"].some(name => isWord(node, name))) {
      report("header-footer-layout", node, "Üst/alt bilgide karmaşık nesne saklandı; çizimi desteklenmiyor"); return;
    }
    if (isWord(node, "tab")) { output += "\t"; return; }
    if (isWord(node, "br")) { output += "\n"; return; }
    for (const c of elements(node)) walk(c);
    if (isWord(node, "p")) output += "\n";
  };
  walk(root);
  return output.replace(/\n$/, "");
}

export function projectSourceChrome(sections, evenAndOdd, mirrored = false) {
  let format = "arabic";
  for (const section of sections) {
    const props = section.properties, page = props.rules.page;
    page.sectionParity = evenAndOdd || mirrored ? "physical" : "logical";
    format = page.numbering?.format || format;
    page.numbering = { ...page.numbering, enabled: false, restart: page.numbering?.restart || false, format };
    page.differentFirstPage = page.differentFirstPage === true;
    for (const kind of ["header", "footer"]) {
      const refs = props.headerFooterReferences[kind];
      const empty = [{ text: "", style: { fontFamily: props.rules.body.fontFamily || "Times New Roman", fontSizePt: props.rules.body.fontSizePt || 11, ...props.rules.body } }];
      const position = (ref, prefix) => ref?.displayPosition ? { [prefix]: ref.displayPosition } : {};
      page[kind] = { ...page[kind], distanceMm: page[kind]?.distanceMm ?? 12.7, heightMm: 0, content: refs.default?.displayText || "", style: refs.default?.displayStyle || {}, paragraphs: refs.default?.displayParagraphs || empty, ...position(refs.default, "position"),
        ...(page.differentFirstPage ? { firstContent: refs.first?.displayText || "", firstStyle: refs.first?.displayStyle || {}, firstParagraphs: refs.first?.displayParagraphs || empty, ...position(refs.first, "firstPosition") } : {}),
        ...(evenAndOdd ? { evenContent: refs.even?.displayText || "", evenStyle: refs.even?.displayStyle || {}, evenParagraphs: refs.even?.displayParagraphs || empty, ...position(refs.even, "evenPosition") } : {}), firstPage: "same" };
    }
    Object.assign(page, resolveSourcePageFrame(page));
  }
}

/** Safe raster pictures from retained header/footer nodes. Coordinates are
 * physical page mm; inline pictures use their paragraph's source spacing and
 * alignment. This also hydrates documents saved before rich chrome support. */
export function sourceChromeImages(ref, page, kind = "header") {
  const found=[];
  const images=nodes=>(nodes||[]).flatMap(n=>n.attributes && Object.hasOwn(n.attributes,"hidden") ? [] : n.tag === "img" ? [n] : images(n.children));
  let cursor=0;
  const paragraphs=nodes=>{for(const n of nodes||[]){if(n.properties?.nativeName === "p" || n.type === "paragraph"){
    const style=n.properties?.resolvedSource||{},pics=images(n.children);
    cursor+=(style.spaceBeforePt||0)*25.4/72;
    const widthMm=page.widthMm-page.margins.leftMm-page.margins.rightMm;
    const sizes=pics.map(p=>({node:p,widthMm:Number(p.attributes.width)*25.4/96,heightMm:Number(p.attributes.height)*25.4/96})).filter(p=>p.widthMm>0&&p.heightMm>0);
    const total=sizes.reduce((sum,p)=>sum+p.widthMm,0);
    let x=page.margins.leftMm+(style.align === "center" ? (widthMm-total)/2 : style.align === "right" ? widthMm-total : 0);
    for(const pic of sizes){found.push({src:pic.node.attributes.src,alt:pic.node.attributes.alt||"",xMm:x,yMm:cursor,widthMm:pic.widthMm,heightMm:pic.heightMm});x+=pic.widthMm;}
    const line=(style.fontSizePt||12)*1.15*(style.lineSpacing?.rule === "auto" ? style.lineSpacing.value : 1)*25.4/72;
    cursor+=Math.max(line,...sizes.map(p=>p.heightMm))+(style.spaceAfterPt||0)*25.4/72;
  }else paragraphs(n.children);}};
  paragraphs(ref?.nodes);
  const origin=kind === "header" ? page.header?.distanceMm ?? 12.7 : page.heightMm-(page.footer?.distanceMm ?? 12.7)-cursor;
  return found.map(image=>({...image,yMm:image.yMm+origin}));
}
