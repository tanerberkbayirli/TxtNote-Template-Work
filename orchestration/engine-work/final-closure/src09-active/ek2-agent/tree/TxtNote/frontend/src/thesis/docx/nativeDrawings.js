/** Editable source drawings and their relationship closure, kept separate from generated body XML. */
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { ImportedXmlComponent } from "docx";
import { strFromU8, strToU8 } from "fflate";
import { readDocxPackage } from "./importPackage.js";

const R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const RELS = "http://schemas.openxmlformats.org/package/2006/relationships";
const CT = "http://schemas.openxmlformats.org/package/2006/content-types";
const serializer = new XMLSerializer();
const parse = (xml) => {
  if (/<!|<\?/i.test(xml.replace(/^<\?xml[^>]*\?>/, ""))) throw new Error("Geçersiz Word çizim XML'i");
  const errors = [];
  const doc = new DOMParser({ errorHandler: { warning: (e) => errors.push(e), error: (e) => errors.push(e), fatalError: (e) => errors.push(e) } }).parseFromString(xml, "application/xml");
  if (errors.length) throw new Error("Geçersiz Word çizim XML'i");
  return doc;
};
const elements = (node) => Array.from(node?.childNodes || []).filter((n) => n.nodeType === 1);

export function nativeDrawingRun(item, context) {
  if (!context.nativeDocument?.source?.packageBase64) throw new Error("Word çiziminin kaynak paketi bulunamadı; özgün belge modeliyle dışa aktarın");
  const doc = parse(item.xml), root = doc.documentElement;
  if (root.namespaceURI !== W || !["drawing", "pict"].includes(root.localName)) throw new Error("Desteklenmeyen Word çizimi");
  const id = (context.nextNativeDrawing = (context.nextNativeDrawing || 0) + 1), links = [];
  const vml = "urn:schemas-microsoft-com:vml", office = "urn:schemas-microsoft-com:office:office";
  const shapeIds = new Map(), typeIds = context.nativeVMLTypes ||= new Map();
  const owner = item.part || context.nativeDocument.source.mainPart;
  const typeId = (old) => { const key = owner + "#" + old; if (!typeIds.has(key)) typeIds.set(key, { id: `txnVMLType${typeIds.size + 1}`, emitted: false }); return typeIds.get(key); };
  const collectIds = (node) => {
    if (node.namespaceURI === vml && node.hasAttribute("id")) {
      const old = node.getAttribute("id");
      if (node.localName === "shapetype") shapeIds.set(old, typeId(old).id);
      else if (!shapeIds.has(old)) shapeIds.set(old, `txnVML${id}_${shapeIds.size + 1}`);
    }
    elements(node).forEach(collectIds);
  };
  collectIds(root);
  const walk = (node) => {
    if (node.namespaceURI === vml && node.localName === "shapetype") {
      const record = typeId(node.getAttribute("id"));
      if (record.emitted) { node.parentNode.removeChild(node); return; }
      record.emitted = true;
    }
    // VML names are scoped to the destination story, not to each imported run.
    // Copies and drawings from distinct source stories can reuse a shape name.
    if (node.namespaceURI === vml && shapeIds.has(node.getAttribute("id"))) node.setAttribute("id", shapeIds.get(node.getAttribute("id")));
    for (const attribute of Array.from(node.attributes || [])) {
      const key = attribute.value.replace(/^#/, "");
      if (node.namespaceURI === vml && attribute.localName === "type" && attribute.value.startsWith("#")) attribute.value = "#" + typeId(key).id;
      else if (["shapeid", "idref"].includes(attribute.localName) && shapeIds.has(key)) attribute.value = (attribute.value.startsWith("#") ? "#" : "") + shapeIds.get(key);
    }
    // gfxdata is an obsolete binary drawing cache, not the editable VML shape.
    // It is not an Office2016 attribute. Keep it in the untouched source package
    // stored by the document model; emit the actual shape/text/relationships.
    node.removeAttributeNS(office, "gfxdata");
    for (const attribute of Array.from(node.attributes || [])) if (attribute.namespaceURI === R) {
      const newId = `txnDrawing${id}_${links.length + 1}`;
      links.push({ oldId: attribute.value, newId });
      node.setAttributeNS(R, attribute.name, newId);
    }
    elements(node).forEach(walk);
  };
  walk(root);
  (context.nativeDrawings ||= []).push({ part: item.part || context.nativeDocument.source.mainPart, links });
  const run = new ImportedXmlComponent("w:r");
  run.push(ImportedXmlComponent.fromXmlString(serializer.serializeToString(chartExRequiresAlternate(doc, root))).root[0]);
  return run;
}

const MC = "http://schemas.openxmlformats.org/markup-compatibility/2006";
const CHARTEX_GRAPHIC = "http://schemas.microsoft.com/office/drawing/2014/chartex";
const CX1 = "http://schemas.microsoft.com/office/drawing/2015/9/8/chartex";

/**
 * Word (2016+) writes a ChartEx inline/anchor only inside
 * mc:AlternateContent/mc:Choice Requires="cx1". A bare w:drawing carrying the
 * chartex graphicData opens, but Word then fails SaveAs with RPC 0x800706BE.
 * Importing keeps only the Choice drawing, so the wrapper is restored here
 * (namespaces declared locally; the main-document root is not rewritten).
 * A Fallback picture is not invented: Word 2016+ does not need one.
 */
function chartExRequiresAlternate(doc, drawing) {
  if (drawing.localName !== "drawing" || drawing.namespaceURI !== W) return drawing;
  const chartEx = Array.from(drawing.getElementsByTagName("*")).some((n) => n.localName === "graphicData" && n.getAttribute("uri") === CHARTEX_GRAPHIC);
  if (!chartEx) return drawing;
  const alternate = doc.createElementNS(MC, "mc:AlternateContent");
  alternate.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:mc", MC);
  alternate.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:cx1", CX1);
  const choice = doc.createElementNS(MC, "mc:Choice");
  choice.setAttribute("Requires", "cx1");
  alternate.appendChild(choice);
  if (doc.documentElement === drawing) doc.removeChild(drawing);
  choice.appendChild(drawing);
  return alternate;
}

/** Copy only referenced parts/dependencies under an isolated prefix; never copy the source main document over edits. */
export async function preserveNativeDrawingParts(files, { nativeDocument, nativeDrawings = [] } = {}) {
  if (!nativeDrawings.length) return;
  const binary = atob(nativeDocument?.source?.packageBase64 || "");
  if (!binary) throw new Error("Word çiziminin kaynak paketi bulunamadı");
  const pkg = await readDocxPackage(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
  const prefix = "word/txnNative/source/", copied = new Set();
  const types = parse(strFromU8(files["[Content_Types].xml"]));
  const mainRelsPath = "word/_rels/document.xml.rels";
  const mainRels = parse(strFromU8(files[mainRelsPath]));
  const relPath = (part) => { const slash = part.lastIndexOf("/"); return `${part.slice(0, slash + 1)}_rels/${part.slice(slash + 1)}.rels`; };
  const relative = (from, to) => {
    const a = from.split("/").slice(0, -1), b = to.split("/");
    while (a.length && b.length && a[0] === b[0]) { a.shift(); b.shift(); }
    return "../".repeat(a.length) + b.join("/");
  };
  let sourceOwner = pkg.mainPart;
  let nextCacheId = 0;
  const sourceRelationships = new Map();
  const copy = (part) => {
    const dest = prefix + part;
    if (copied.has(part)) return dest;
    if (!pkg.files[part]) throw new Error(`Word çizim parçası bulunamadı: ${part}`);
    if (files[dest]) throw new Error(`Word çizim parçası çakışması: ${dest}`);
    copied.add(part);
    files[dest] = pkg.files[part];
    if (/\.xml$/i.test(part)) {
      const sourceXml = parse(strFromU8(files[dest]));
      let changed = false;
      for (const node of Array.from(sourceXml.getElementsByTagName("*"))) if (node.localName === "dataModelExt" && node.hasAttribute("relId")) {
        const oldId = node.getAttribute("relId"), key = sourceOwner + "#" + oldId;
        const relation = pkg.relationships(sourceOwner)[oldId];
        if (relation && /\/diagramDrawing$/.test(relation.type) && !relation.external) {
          let newId = sourceRelationships.get(key);
          if (!newId) {
            do { newId = `txnDiagramCache${++nextCacheId}`; } while (ids.has(newId));
            ids.add(newId); sourceRelationships.set(key, newId);
            const entry = mainRels.createElementNS(RELS, "Relationship");
            entry.setAttribute("Id", newId); entry.setAttribute("Type", relation.type); entry.setAttribute("Target", relative("word/document.xml", copy(relation.part)));
            mainRels.documentElement.appendChild(entry);
          }
          node.setAttribute("relId", newId); changed = true;
        }
      }
      if (sourceXml.documentElement.namespaceURI === "http://schemas.openxmlformats.org/drawingml/2006/chart") {
        const root = sourceXml.documentElement;
        for (const chart of Array.from(root.getElementsByTagNameNS(root.namespaceURI, "chart"))) {
          const show = elements(chart).find((n) => n.localName === "showDLblsOverMax"), ext = elements(chart).find((n) => n.localName === "extLst");
          if (show && ext && elements(chart).indexOf(show) > elements(chart).indexOf(ext)) { chart.insertBefore(show, ext); changed = true; }
        }
        // CT_ChartExtension permits one payload. Some Word sources put sibling
        // extension payloads in the same slot; split the slots, retaining every
        // payload and its URI instead of hiding or deleting unknown chart data.
        for (const ext of Array.from(root.getElementsByTagNameNS(root.namespaceURI, "ext"))) {
          const payloads = elements(ext);
          if (payloads.length > 1) {
            let previous = ext;
            for (const payload of payloads.slice(1)) {
              const slot = ext.cloneNode(false); slot.appendChild(payload);
              ext.parentNode.insertBefore(slot, previous.nextSibling); previous = slot;
            }
            changed = true;
          }
        }
      }
      if (changed) files[dest] = strToU8(serializer.serializeToString(sourceXml));
    }
    const override = types.createElementNS(CT, "Override");
    override.setAttribute("PartName", "/" + dest); override.setAttribute("ContentType", pkg.type(part));
    types.documentElement.appendChild(override);
    const relationships = pkg.relationships(part), sourceRels = pkg.files[relPath(part)];
    if (sourceRels) {
      const relDoc = parse(strFromU8(sourceRels));
      for (const rel of elements(relDoc.documentElement)) {
        const entry = relationships[rel.getAttribute("Id")];
        if (entry?.external && /\/(?:package|oleObject)$/.test(entry.type) && /(?:drawingml\.chart|ms-office\.chartex)\+xml$/i.test(pkg.type(part))) {
          const cached = parse(strFromU8(files[dest]));
          const external = Array.from(cached.getElementsByTagName("*"))
            .filter((n) => n.localName === "externalData" && /\/(?:chart|chartex)$/.test(n.namespaceURI || "") && n.getAttributeNS(R, "id") === entry.id);
          if (external.length) {
            // The cached series stay editable in Word; a source computer's workbook path must not become a live network/file link.
            external.forEach((n) => n.parentNode.removeChild(n));
            files[dest] = strToU8(serializer.serializeToString(cached));
            relDoc.documentElement.removeChild(rel);
            continue;
          }
        }
        if (!entry || entry.external) throw new Error(`Word çiziminde dış ilişki desteklenmiyor: ${entry?.target || part}`);
        rel.setAttribute("Target", relative(dest, copy(entry.part)));
      }
      files[relPath(dest)] = strToU8(serializer.serializeToString(relDoc));
    }
    return dest;
  };
  const ids = new Set(elements(mainRels.documentElement).map((n) => n.getAttribute("Id")));
  for (const drawing of nativeDrawings) {
    sourceOwner = drawing.part;
    const sourceRels = pkg.relationships(drawing.part);
    for (const link of drawing.links) {
      const entry = sourceRels[link.oldId];
      if (!entry || entry.external) throw new Error(`Word çizim ilişkisi aktarılamadı: ${link.oldId}`);
      if (ids.has(link.newId)) throw new Error(`Word çizim ilişki kimliği çakışması: ${link.newId}`);
      ids.add(link.newId);
      const relation = mainRels.createElementNS(RELS, "Relationship");
      relation.setAttribute("Id", link.newId); relation.setAttribute("Type", entry.type);
      relation.setAttribute("Target", relative("word/document.xml", copy(entry.part)));
      mainRels.documentElement.appendChild(relation);
    }
  }
  files[mainRelsPath] = strToU8(serializer.serializeToString(mainRels));
  files["[Content_Types].xml"] = strToU8(serializer.serializeToString(types));
}
