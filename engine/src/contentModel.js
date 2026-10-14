/** Persistent semantic content, independent of pagination and the selected template.
 * HTML remains a compatibility projection for the existing contentEditable editor.
 * Native adapters attach JSON properties/parts to this model, never to rendered pages.
 */
import { thesisSourceHtml } from "./sourceHtml.js";

export const CONTENT_MODEL_VERSION = 1;
export const CONTENT_NODE_ID = "data-txt-node-id";
export const DOCUMENT_FORMAT_MODES = Object.freeze(["template", "source"]);
const VOID = new Set("area base br col embed hr img input link meta param source track wbr".split(" "));
const TAG = /<!--[\s\S]*?-->|<![^>]*>|<\/?[a-zA-Z][\w:-]*(?:[^<>"']|"[^"]*"|'[^']*')*>|[^<]+|</g;
const ATTRIBUTE = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
const cache = new WeakMap();
const escape = (value) => String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const decode = (value) => value.replace(/&(?:amp|quot|lt|gt|apos|nbsp|#\d+|#x[\da-f]+);/gi, (entity) => {
  const key = entity.slice(1, -1).toLowerCase();
  if (key[0] !== "#") return ({ amp: "&", quot: '"', lt: "<", gt: ">", apos: "'", nbsp: "\u00a0" })[key];
  const code = key[1] === "x" ? parseInt(key.slice(2), 16) : Number(key.slice(1));
  return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "\ufffd";
});

function nodeType(tag, attributes) {
  const classes = attributes.class || "";
  if (/\bmath-formula\b/.test(classes)) return "equation";
  if (/\bacademic-footnote\b/.test(classes)) return "footnoteReference";
  if (/\bacademic-endnote\b/.test(classes)) return "endnoteReference";
  if (/\bacademic-xref\b/.test(classes)) return "reference";
  if (attributes["data-native-object"]) return attributes["data-native-object"];
  if (/^h[1-6]$/.test(tag)) return "heading";
  return ({ p: "paragraph", div: "container", section: "section", span: "run", ol: "list", ul: "list", li: "listItem",
    table: "table", tr: "row", td: "cell", th: "cell", img: "image", figure: "figure", a: "link", br: "break" })[tag] || "element";
}

function walk(nodes, visit) {
  for (const node of nodes || []) { visit(node); walk(node.children, visit); }
}

/** Parse the editor's balanced HTML without a DOM round trip or entity/text rewriting.
 * Text leaves hold encoded HTML text verbatim, including tabs, NBSP and whitespace.
 * Existing IDs bind native properties through edits; copied IDs get fresh identities.
 */
export function contentNodesFromHtml(html, { previous = [], allocateId, usedIds = new Set(), previousById = new Map() } = {}) {
  const root = { children: [] }, stack = [root];
  walk(previous, (node) => { if (node.id) previousById.set(node.id, node); });
  let localId = 0;
  const fresh = allocateId || (() => `node-${++localId}`);
  const reserved = new Set(previousById.keys());
  for (const token of String(html || "").match(TAG) || []) {
    if (token.startsWith("<!")) continue;
    if (/^<\//.test(token)) {
      const tag = token.match(/^<\/([\w:-]+)/)[1].toLowerCase();
      for (let i = stack.length - 1; i > 0; i--) if (stack[i].tag === tag) { stack.length = i; break; }
      continue;
    }
    if (!/^<[a-zA-Z]/.test(token)) { stack.at(-1).children.push({ type: "text", text: token }); continue; }
    const [, rawTag, rawAttrs] = token.match(/^<([\w:-]+)([\s\S]*?)\/?\s*>$/);
    const tag = rawTag.toLowerCase(), attributes = {}, encodedAttributes = {};
    for (const match of rawAttrs.matchAll(ATTRIBUTE)) {
      const name = match[1].toLowerCase();
      if (!["__proto__", "constructor", "prototype"].includes(name)) {
        const raw = match[2] ?? match[3] ?? match[4] ?? "";
        attributes[name] = decode(raw);
        // Keep unfamiliar named entities lexically instead of double-escaping
        // them and changing alt/title/link semantics on the next render.
        if (/&(?!(?:amp|quot|lt|gt|apos|nbsp);)[a-z][a-z\d]+;/i.test(raw)) encodedAttributes[name] = raw;
      }
    }
    // Display-only class that keys the imported-content CSS by hash lookup instead of a linear attribute scan.
    if (attributes.class !== undefined) { const kept = attributes.class.replace(/(^|\s)txn-\S+/g, " ").trim(); if (kept) attributes.class = kept; else delete attributes.class; }
    const suppliedId = attributes[CONTENT_NODE_ID];
    let id = suppliedId;
    if (!id || usedIds.has(id)) do { id = fresh(); } while (usedIds.has(id) || reserved.has(id));
    usedIds.add(id);
    delete attributes[CONTENT_NODE_ID];
    const old = previousById.get(suppliedId);
    if (old && id !== suppliedId) for (const key of ["data-academic-id", "id"]) if (attributes[key] && attributes[key] === old.attributes[key]) attributes[key] = id;
    const node = { ...(old || {}), id, type: old?.tag === tag ? old.type : nodeType(tag, attributes), tag, attributes, children: [] };
    if (Object.keys(encodedAttributes).length) node.encodedAttributes = encodedAttributes;
    else delete node.encodedAttributes;
    stack.at(-1).children.push(node);
    if (!VOID.has(tag) && !/\/\s*>$/.test(token)) stack.push(node);
  }
  // Legacy HTML has no model stamps. Match unchanged siblings before falling back
  // to position, so inserting a paragraph does not renumber the following objects.
  const reconcile = (nodes, oldNodes) => {
    const available = new Set(oldNodes.filter((node) => node.id && !usedIds.has(node.id)));
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (!node.tag) continue;
      if (!previousById.has(node.id)) {
        const signature = (value) => JSON.stringify([value.tag, value.attributes, value.children?.filter((n) => n.type === "text")]);
        const exact = [...available].find((old) => signature(old) === signature(node));
        const old = exact || (available.has(oldNodes[i]) && oldNodes[i].tag === node.tag ? oldNodes[i] : null);
        if (old) { usedIds.delete(node.id); usedIds.add(old.id); available.delete(old); Object.assign(node, { ...old, ...node, id: old.id }); }
      }
      reconcile(node.children, previousById.get(node.id)?.children || []);
    }
  };
  reconcile(root.children, previous);
  return root.children;
}

/** A compatibility view only. All native data stays on the model, including
 * properties that the current HTML renderer cannot display or edit yet. */
export function contentNodesToHtml(nodes, { stampIds = true } = {}) {
  return (nodes || []).map((node) => {
    if (node.type === "text") return node.text;
    const attrs = { ...node.attributes, ...(stampIds ? { class: `txn-${node.id}${node.attributes?.class ? ` ${node.attributes.class}` : ""}`, [CONTENT_NODE_ID]: node.id } : {}) };
    const attributes = Object.entries(attrs).map(([name, value]) => {
      const raw = node.encodedAttributes?.[name];
      const encoded = raw !== undefined && decode(raw) === value ? raw.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : escape(value);
      return ` ${name}="${encoded}"`;
    }).join("");
    const opening = `<${node.tag}${attributes}>`;
    return VOID.has(node.tag) ? opening : `${opening}${contentNodesToHtml(node.children, { stampIds })}</${node.tag}>`;
  }).join("");
}

export function createContentDocument(options = {}) {
  const result = {
    version: CONTENT_MODEL_VERSION, nextId: 1, formatMode: "template",
    sections: [], styles: {}, numbering: {}, notes: {}, resources: {}, references: {}, source: {},
    ...structuredClone(options),
  };
  assertContentDocument(result);
  return result;
}

/** Importer boundary for Mission 03: install an already structured document.
 * This is deliberately not a DOCX/HTML conversion adapter. */
export function installContentDocument(note, input) {
  const document = structuredClone(assertContentDocument(input));
  const mainId = document.mainSectionId || "main";
  const contentKeys = new Map(Object.entries(document.sectionKeys || {}).map(([key, id]) => [id, key]));
  const sectionContent = {};
  let content = "";
  for (const section of document.sections) {
    const html = thesisSourceHtml(contentNodesToHtml(section.nodes));
    cache.set(section, html);
    if (section.id === mainId) content = html; else sectionContent[contentKeys.get(section.id) || section.id] = html;
  }
  return { ...note, content, researchData: { ...note?.researchData, thesis: { ...note?.researchData?.thesis, sectionContent, document } } };
}

/** Immutable native edit; callers can update text/runs, properties or object data
 * without passing them through the HTML renderer. The HTML view is regenerated. */
export function editContentNode(note, id, patch) {
  const document = structuredClone(assertContentDocument(note.researchData.thesis.document));
  let found = false;
  for (const section of document.sections) walk(section.nodes, (node) => {
    if (node.id === id) { Object.assign(node, structuredClone(patch), { id }); found = true; }
  });
  if (!found) throw new Error(`Belge öğesi bulunamadı: ${id}`);
  return installContentDocument(note, document);
}

/** Reject incompatible versions and ambiguous IDs instead of flattening/rebaselining. */
export function assertContentDocument(document) {
  if (document?.version !== CONTENT_MODEL_VERSION) throw new Error("Desteklenmeyen tez belge modeli sürümü");
  if (!DOCUMENT_FORMAT_MODES.includes(document.formatMode)) throw new Error("Geçersiz belge biçimi tercihi");
  if (!Number.isSafeInteger(document.nextId) || document.nextId < 1 || !Array.isArray(document.sections)) throw new Error("Geçersiz tez belge modeli");
  const ids = new Set(), sections = new Set();
  for (const section of document.sections) {
    if (!section.id || sections.has(section.id) || !Array.isArray(section.nodes)) throw new Error("Geçersiz veya yinelenen bölüm kimliği");
    sections.add(section.id);
    walk(section.nodes, (node) => {
      if (node.type === "text") { if (typeof node.text !== "string") throw new Error("Geçersiz metin"); return; }
      if (!node.id || ids.has(node.id) || !/^[a-z][\w:-]*$/i.test(node.tag) || !Array.isArray(node.children)) throw new Error("Geçersiz veya yinelenen öğe kimliği");
      ids.add(node.id);
      if (!node.attributes || typeof node.attributes !== "object" || Object.keys(node.attributes).some((name) => !/^[\w:-]+$/.test(name))) throw new Error("Geçersiz öğe özniteliği");
    });
  }
  for (const key of ["styles", "numbering", "notes", "resources", "references", "source"]) {
    if (!document[key] || typeof document[key] !== "object" || Array.isArray(document[key])) throw new Error(`Geçersiz belge alanı: ${key}`);
  }
  const ancestors = new Set();
  const json = (value) => {
    if (value === null || typeof value === "string" || typeof value === "boolean" || (typeof value === "number" && Number.isFinite(value))) return;
    if (!value || typeof value !== "object" || ancestors.has(value) || ![Object.prototype, Array.prototype, null].includes(Object.getPrototypeOf(value))) throw new Error("Belge modeli yalnızca döngüsüz JSON verisi içerebilir");
    ancestors.add(value); Object.values(value).forEach(json); ancestors.delete(value);
  };
  json(document);
  return document;
}

/** Reconcile only authored section HTML; preserve source properties, styles,
 * note bodies, relationship targets and opaque package parts verbatim.
 * Undefined compatibility content means model-only input; empty string means deletion.
 */
export function prepareThesisNote(note) {
  const thesis = note?.researchData?.thesis;
  if (!thesis || typeof thesis !== "object") return note;
  const old = thesis.document ? assertContentDocument(thesis.document) : createContentDocument();
  // JSON hydration loses the process-local projection cache. Rebuild it from
  // the authoritative model before reconciling compatibility HTML, so an
  // unchanged save does not reparse SVG attribute casing or empty text leaves.
  for (const section of old.sections) if (!cache.has(section)) {
    cache.set(section, thesisSourceHtml(contentNodesToHtml(section.nodes)));
  }
  const byId = new Map(old.sections.map((section) => [section.id, section]));
  const mainId = old.mainSectionId || "main";
  const sectionKeys = { ...old.sectionKeys };
  const occupied = new Set([...byId.keys(), mainId, ...Object.values(sectionKeys)]);
  for (const key of Object.keys(thesis.sectionContent || {})) if (!Object.hasOwn(sectionKeys, key)) {
    let id = key;
    if (id === mainId) {
      id = `section:${key}`;
      let suffix = 1; while (occupied.has(id)) id = `section:${key}:${suffix++}`;
    }
    occupied.add(id); sectionKeys[key] = id;
  }
  const contentKeys = new Map(Object.entries(sectionKeys).map(([key, id]) => [id, key]));
  const inputs = new Map(old.sections.map((section) => [section.id, section.id === mainId ? note.content : thesis.sectionContent?.[contentKeys.get(section.id) || section.id]]));
  if (!inputs.has(mainId)) inputs.set(mainId, note.content);
  for (const [key, html] of Object.entries(thesis.sectionContent || {})) inputs.set(sectionKeys[key], html);
  let nextId = old.nextId;
  const previousById = new Map();
  for (const node of Object.values(old.retainedNodes || {})) previousById.set(node.id, node);
  for (const section of old.sections) walk(section.nodes, (node) => { if (node.id) previousById.set(node.id, node); });
  // Reserve IDs in untouched sections, while permitting existing stamps in edited ones.
  const usedIds = new Set();
  for (const [id, html] of inputs) if (html === undefined || cache.get(byId.get(id)) === thesisSourceHtml(html)) walk(byId.get(id)?.nodes, (node) => { if (node.id) usedIds.add(node.id); });
  let changed = !thesis.document || JSON.stringify(sectionKeys) !== JSON.stringify(old.sectionKeys || {});
  const sectionContent = { ...thesis.sectionContent };
  let content = note.content;
  const sections = [];
  for (const [id, input] of inputs) {
    const previous = byId.get(id);
    if (input === undefined && previous) {
      const html = thesisSourceHtml(contentNodesToHtml(previous.nodes));
      if (id === mainId) content = html; else sectionContent[contentKeys.get(id) || id] = html;
      cache.set(previous, html); sections.push(previous); changed = true; continue;
    }
    const html = thesisSourceHtml(input ?? "");
    if (id === mainId) content = html; else sectionContent[contentKeys.get(id) || id] = html;
    if (previous && cache.get(previous) === html) { sections.push(previous); continue; }
    const section = { ...previous, id, type: previous?.type || (id === mainId ? "mainContent" : "custom"),
      nodes: contentNodesFromHtml(html, { previous: previous?.nodes, allocateId: () => `tn-${nextId++}`, usedIds, previousById }) };
    cache.set(section, html); sections.push(section);
    if (!previous || JSON.stringify(previous) !== JSON.stringify(section)) changed = true;
  }
  const cleanChanged = content !== note.content || JSON.stringify(sectionContent) !== JSON.stringify(thesis.sectionContent || {});
  if (!changed && !cleanChanged) return note;
  // HTML undo restores a deleted object by ID. Keep its native payload detached
  // from active content until it is restored; it never participates in rendering.
  const activeIds = new Set();
  for (const section of sections) walk(section.nodes, (node) => { if (node.id) activeIds.add(node.id); });
  const retainedNodes = { ...old.retainedNodes };
  for (const node of previousById.values()) if (node.properties && !activeIds.has(node.id)) retainedNodes[node.id] = { id: node.id, type: node.type, tag: node.tag, attributes: node.attributes, properties: node.properties, children: [] };
  for (const id of activeIds) delete retainedNodes[id];
  const document = { ...old, nextId, mainSectionId: mainId, sectionKeys, sections, retainedNodes };
  assertContentDocument(document);
  return { ...note, content, researchData: { ...note.researchData, thesis: { ...thesis, sectionContent, document } } };
}

export function setDocumentFormatMode(thesis, formatMode) {
  if (!DOCUMENT_FORMAT_MODES.includes(formatMode)) throw new Error("Geçersiz belge biçimi tercihi");
  const document = thesis.document ? assertContentDocument(thesis.document) : createContentDocument();
  return { ...thesis, document: { ...document, formatMode } };
}

/** Source inheritance is separate from direct author edits and template adaptation.
 * Explicit false/zero values survive; a cycle is a diagnosed source error. */
export function resolveContentStyle(document, node, templateStyle = {}) {
  const result = document.formatMode === "source" ? { ...document.styles.default?.properties } : { ...templateStyle };
  const seen = new Set();
  const apply = (id) => {
    if (!id) return;
    if (seen.has(id)) throw new Error(`Döngüsel kaynak stili: ${id}`);
    seen.add(id);
    const style = document.styles[id];
    if (style) { apply(style.basedOn); Object.assign(result, style.properties); }
  };
  if (document.formatMode === "source") apply(node.properties?.styleId);
  return { ...result, ...node.properties?.direct };
}

export function sourceContentSection(thesis, sectionId) {
  return thesis?.document?.sections?.find((section) => section.id === sectionId);
}

/** Template IDs never decide where the ordinary note body is stored. A template
 * may call its mainContent "introduction" and retain shadow section HTML too. */
export function templateContentSection(thesis, section) {
  const mainId = thesis.document?.mainSectionId || "main";
  if (section.type === "mainContent") return sourceContentSection(thesis, mainId);
  const id = thesis.document?.sectionKeys?.[section.id] || section.id;
  return id === mainId ? undefined : sourceContentSection(thesis, id);
}

/** Source page/paragraph rules are opt-in, then user layout overrides still win. */
export function applySourceSectionRules(rules, thesis, sectionId) {
  if (thesis.document?.formatMode !== "source") return rules;
  const source = sourceContentSection(thesis, sectionId)?.properties?.rules;
  if (!source) return rules;
  const result = { ...rules };
  for (const [key, value] of Object.entries(source)) {
    result[key] = value && typeof value === "object" && !Array.isArray(value) ? { ...rules[key], ...value } : value;
  }
  if (source.page) for (const key of ["margins", "numbering", "header", "footer"]) if (source.page[key]) result.page[key] = { ...rules.page[key], ...source.page[key] };
  // University-only positioned frames must not override the source's section geometry.
  if (source.page) {
    if (!source.page.docxMargins) delete result.page.docxMargins;
    if (!source.page.docxContentFrame) delete result.page.docxContentFrame;
    for (const kind of ["header", "footer"]) if (source.page[kind]) {
      result.page[kind] = { heightMm: 0, distanceMm: rules.page[kind]?.distanceMm ?? 12.7, ...source.page[kind] };
    }
  }
  return result;
}
